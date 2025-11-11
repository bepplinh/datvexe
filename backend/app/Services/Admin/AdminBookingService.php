<?php

namespace App\Services\Admin;

use App\Models\Seat;
use App\Models\Trip;
use App\Models\User;
use App\Models\Booking;
use App\Models\BookingLeg;
use App\Models\BookingItem;
use App\Models\TripSeatStatus;
use App\Services\Coupon\CalcCoupon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class AdminBookingService
{
    public function __construct(
        private CalcCoupon $calcCoupon
    ) {}
    public function createBookingFromAdmin(array $data, int $adminId): Booking
    {
        // 1) Tìm hoặc tạo user theo số điện thoại
        $user = User::firstOrCreate(
            ['phone' => $data['customer_phone']],
            [
                'username'     => $data['customer_name'],
                'email'    => $data['customer_email'] ?? null,
                'password' => bcrypt(Str::random(8)), // tài khoản guest
            ]
        );

        $fromLocationId = (int) $data['from_location_id'];
        $toLocationId   = (int) $data['to_location_id'];
        $tripsPayload   = $data['trips'];

        return DB::transaction(function () use ($user, $adminId, $fromLocationId, $toLocationId, $tripsPayload, $data) {

            $preparedLegs = [];
            $subtotal     = 0;   

            // ===== 1) CHECK & LOCK GHẾ (chưa ghi booking_id ở đây) =====
            foreach ($tripsPayload as $tripRow) {
                $tripId  = (int) $tripRow['trip_id'];
                // loại bỏ seat trùng cho chắc
                $seatIds = array_values(array_unique(array_map('intval', $tripRow['seat_ids'] ?? [])));
                $legType = strtoupper($tripRow['leg'] ?? 'OUT');

                // Xác định from/to cho leg
                if ($legType === 'RETURN') {
                    $legFromId = $toLocationId;
                    $legToId   = $fromLocationId;
                } else {
                    $legFromId = $fromLocationId;
                    $legToId   = $toLocationId;
                }

                // Load trip + route + tripStations và khóa (hạn chế race)
                $trip = Trip::with('route.tripStations')
                    ->whereKey($tripId)
                    ->lockForUpdate()
                    ->firstOrFail();

                // 🔒 Check ghế chưa bị BOOKED trong trip_seat_statuses
                $this->assertSeatsNotBooked($tripId, $seatIds);

                // Tính giá: cố gắng lấy đúng segment from/to, fallback về first()
                $segment = optional($trip->route)->tripStations
                    ?->first(function ($ts) use ($legFromId, $legToId) {
                        return $ts->from_location_id == $legFromId
                            && $ts->to_location_id == $legToId;
                    });

                $segmentPrice = $segment->price ?? (
                    optional(optional($trip->route)->tripStations)->first()->price ?? 0
                );

                $subtotal += $segmentPrice * count($seatIds);

                $preparedLegs[] = [
                    'trip'          => $trip,
                    'trip_id'       => $tripId,
                    'seat_ids'      => $seatIds,
                    'leg_type'      => $legType,
                    'from_id'       => $legFromId,
                    'to_id'         => $legToId,
                    'segment_price' => $segmentPrice,
                ];
            }

            // ===== 2) TẠO BOOKING =====
            $discount = 0;
            $total    = $subtotal - $discount;

            $bookingStatus = $data['payment_status'] ?? 'paid'; // 'pending' | 'paid' | 'cancelled'

            /** @var Booking $booking */
            $booking = Booking::create([
                'user_id'        => $user->id,
                'code'           => $this->generateBookingCode(),

                'coupon_id'      => null,
                'subtotal_price' => $subtotal,
                'discount_amount'=> $discount,
                'total_price'    => $total,

                'status'            => $bookingStatus,
                'payment_provider'  => 'cash', // admin: cash
                'payment_intent_id' => null,

                'passenger_name'  => $data['customer_name']  ?? $user->name,
                'passenger_phone' => $data['customer_phone'] ?? $user->phone,
                'passenger_email' => $data['customer_email'] ?? $user->email,
                
                'source' => 'admin',
                'booked_by_admin_id' => $adminId,
                'paid_at'      => $bookingStatus === 'paid' ? now() : null,
                'cancelled_at' => null,
            ]);

            // ===== 3) TẠO BOOKING_LEGS + BOOKING_ITEMS + GHI TRIP_SEAT_STATUS =====
            foreach ($preparedLegs as $leg) {
                /** @var Trip $trip */
                $trip         = $leg['trip'];
                $seatIds      = $leg['seat_ids'];
                $segmentPrice = $leg['segment_price'];

                /** @var BookingLeg $bookingLeg */
                $bookingLeg = BookingLeg::create([
                    'booking_id'       => $booking->id,
                    'trip_id'          => $trip->id,
                    'route_id'         => $trip->route_id,
                    'day'              => $trip->departure_time?->toDateString(),
                    'leg_type'         => $leg['leg_type'],      // OUT / RETURN
                    'from_location_id' => $leg['from_id'],
                    'to_location_id'   => $leg['to_id'],
                    'price'            => $segmentPrice,
                ]);

                // ❌ Ở đây KHÔNG filter theo trip_id nữa vì bảng seats không có cột đó
                $seats = Seat::query()
                    ->whereIn('id', $seatIds)
                    ->get();

                foreach ($seats as $seat) {
                    BookingItem::create([
                        'booking_leg_id' => $bookingLeg->id,
                        'seat_id'        => $seat->id,
                        'seat_number'    => $seat->seat_number,
                        'price'          => $segmentPrice,
                    ]);
                }

                // Ghi / cập nhật trip_seat_statuses với booking_id
                foreach ($seatIds as $seatId) {
                    TripSeatStatus::updateOrCreate(
                        [
                            'trip_id' => $trip->id,
                            'seat_id' => $seatId,
                        ],
                        [
                            'user_id'    => $user->id,
                            'booking_id' => $booking->id,
                            'is_booked'  => true,
                            'booked_by_user_id' => $user->id,
                            'booked_at' => now()
                        ]
                    );
                }
            }

            return $booking->load(['user', 'legs.items']);
        });
    }

    /**
     * Chỉ check xem ghế đã BOOKED chưa (không create row mới ở đây).
     * Nếu đã BOOKED thì throw RuntimeException.
     */
    protected function assertSeatsNotBooked(int $tripId, array $seatIds): void
    {
        $existing = TripSeatStatus::query()
            ->where('trip_id', $tripId)
            ->whereIn('seat_id', $seatIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('seat_id');

        $conflicts = [];

        foreach ($seatIds as $seatId) {
            /** @var TripSeatStatus|null $row */
            $row = $existing->get($seatId);

            if ($row && $row->is_booked) {
                $conflicts[] = $seatId;
            }
        }

        if (!empty($conflicts)) {
            throw new RuntimeException(
                'Ghế đã được đặt trước đó (trip ' . $tripId . '): ' . implode(',', $conflicts)
            );
        }
    }

    protected function generateBookingCode(): string
    {
        return 'AD' . random_int(1, 9999);
    }
}
