<?php

namespace App\Services\Admin;

use App\Models\Seat;
use App\Models\Trip;
use App\Models\User;
use App\Models\Booking;
use App\Models\BookingLeg;
use App\Models\BookingItem;
use App\Models\TripSeatStatus;
use App\Models\Payment;
use App\Models\CouponUsage;
use App\Events\SeatBooked;
use App\Services\Coupon\CalcCoupon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
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

                // Map seat_id => seat_number để hiển thị lỗi & broadcast
                $seatNumberById = Seat::query()
                    ->whereIn('id', $seatIds)
                    ->pluck('seat_number', 'id')
                    ->map(fn($label) => (string) $label)
                    ->toArray();

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

                // Kiểm tra ghế thuộc đúng bus của trip
                $validSeatCount = Seat::query()
                    ->whereIn('id', $seatIds)
                    ->where('bus_id', $trip->bus_id)
                    ->count();

                if ($validSeatCount !== count($seatIds)) {
                    throw new RuntimeException('Một hoặc nhiều ghế không thuộc xe của chuyến.');
                }

                // 🔒 Check ghế chưa bị BOOKED trong trip_seat_statuses
                $this->assertSeatsNotBooked($tripId, $seatIds);
                // 🔒 Check ghế không bị lock bởi session khác (Redis)
                $this->assertSeatsNotLocked($tripId, $seatIds, $seatNumberById);

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
                    'seat_numbers'  => $seatNumberById,
                ];
            }

            // ===== 2) TẠO BOOKING =====
            $discount = 0;
            $total    = $subtotal - $discount;

            /** @var Booking $booking */
            $booking = Booking::create([
                'user_id'        => $user->id,
                'code'           => $this->generateBookingCode(),

                'coupon_id'      => null,
                'subtotal_price' => $subtotal,
                'discount_amount' => $discount,
                'total_price'    => $total,

                // Admin tạo booking hộ: luôn ở trạng thái pending,
                // sau khi kiểm tra chuyển khoản mới đánh dấu đã thanh toán.
                'status'            => 'pending',
                'payment_provider'  => 'cash', // mặc định: thanh toán tiền mặt/chuyển khoản tay
                'payment_intent_id' => null,

                'passenger_name'  => $data['customer_name']  ?? $user->name,
                'passenger_phone' => $data['customer_phone'] ?? $user->phone,
                'passenger_email' => $data['customer_email'] ?? $user->email,

                'source' => 'admin',
                'booked_by_admin_id' => $adminId,
                'paid_at'      => null,
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
                    'pickup_location_id' => $leg['from_id'],
                    'dropoff_location_id'   => $leg['to_id'],
                    'pickup_address'   => $data['pickup_address'] ?? null,
                    'dropoff_address'  => $data['dropoff_address'] ?? null,
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

                // Xóa lock (nếu còn) và đưa vào set booked trên Redis để UI realtime không lệch
                $this->cleanupLocksAfterBooked($trip->id, $seatIds);
            }

            $booking->load(['user', 'legs.items']);

            // ===== 4) Broadcast SeatBooked để client/admin khác cập nhật sơ đồ ghế realtime =====
            $bookedBlocks = [];
            foreach ($preparedLegs as $leg) {
                $seatLabels = [];
                foreach ($leg['seat_ids'] as $sid) {
                    $seatLabels[] = $leg['seat_numbers'][$sid] ?? (string) $sid;
                }

                $bookedBlocks[] = [
                    'trip_id'     => $leg['trip_id'],
                    'seat_ids'    => $leg['seat_ids'],
                    'seat_labels' => $seatLabels,
                    'leg_type'    => $leg['leg_type'],
                ];
            }

            event(new SeatBooked(
                sessionToken: 'admin_' . $adminId,
                bookingId: $booking->id,
                booked: $bookedBlocks,
                userId: $booking->user_id,
            ));

            return $booking;
        });
    }

    public function markBookingAsPaidManually(int $bookingId, int $adminId): Booking
    {
        $booking = DB::transaction(function () use ($bookingId, $adminId) {
            /** @var Booking $booking */
            $booking = Booking::lockForUpdate()->findOrFail($bookingId);

            if ($booking->status === 'paid') {
                throw new RuntimeException('Đơn này đã được đánh dấu thanh toán trước đó.');
            }

            if ($booking->status === 'cancelled') {
                throw new RuntimeException('Đơn đã bị hủy, không thể xác nhận thanh toán.');
            }

            Payment::create([
                'booking_id'      => $booking->id,
                'amount'          => $booking->total_price,
                'fee'             => 0,
                'refund_amount'   => 0,
                'currency'        => 'VND',
                'provider'        => 'cash',
                'provider_txn_id' => null,
                'status'          => 'succeeded',
                'paid_at'         => now(),
                'meta'            => [
                    'marked_by_admin_id' => $adminId,
                    'source' => 'manual',
                ],
            ]);

            $booking->update([
                'status'  => 'paid',
                'paid_at' => now(),
            ]);

            // Record coupon usage nếu booking có sử dụng coupon
            if ($booking->coupon_id && $booking->discount_amount > 0) {
                $this->recordCouponUsage($booking);
            }

            return $booking->fresh(['user', 'legs.items', 'payments']);
        });

        // Send notification + email after transaction commits
        $this->sendBookingSuccessNotification($booking);

        return $booking;
    }

    /**
     * Send booking success email + web notification
     */
    protected function sendBookingSuccessNotification(Booking $booking): void
    {
        $email = $booking->passenger_email ?? $booking->user?->email;
        
        // Send email
        if ($email) {
            try {
                \Illuminate\Support\Facades\Mail::to($email)
                    ->send(new \App\Mail\BookingSuccessMail($booking));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send booking success email (admin)', [
                    'booking_id' => $booking->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Send web notification
        if ($booking->user) {
            try {
                app(\App\Services\UserNotificationService::class)
                    ->notifyBookingSuccess($booking);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send booking success notification (admin)', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
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

    /**
     * Không cho phép book đè lên ghế đang bị lock (giữ chỗ) của người khác.
     */
    protected function assertSeatsNotLocked(int $tripId, array $seatIds, array $seatNumberById): void
    {
        $conflicts = [];

        foreach ($seatIds as $seatId) {
            $lockKey = "trip:{$tripId}:seat:{$seatId}:lock";
            $owner = Redis::get($lockKey);

            if (!$owner) {
                continue;
            }

            // TTL <= 0 coi như hết hạn → cleanup nhẹ
            $ttl = Redis::ttl($lockKey);
            if ($ttl !== false && $ttl <= 0) {
                Redis::del($lockKey);
                Redis::srem("trip:{$tripId}:locked", $seatId);
                continue;
            }

            $conflicts[] = $seatNumberById[$seatId] ?? (string) $seatId;
        }

        if (!empty($conflicts)) {
            throw new RuntimeException(
                'Ghế đang được giữ bởi khách khác: ' . implode(', ', $conflicts)
            );
        }
    }

    /**
     * Xóa lock trên Redis (nếu còn) và đánh dấu đã book để front hiển thị đúng.
     */
    protected function cleanupLocksAfterBooked(int $tripId, array $seatIds): void
    {
        foreach ($seatIds as $seatId) {
            $lockKey = "trip:{$tripId}:seat:{$seatId}:lock";
            $token   = Redis::get($lockKey);

            Redis::del($lockKey);
            Redis::srem("trip:{$tripId}:locked", $seatId);
            Redis::sadd("trip:{$tripId}:booked", $seatId);

            if ($token) {
                Redis::srem("session:{$token}:seats", "{$tripId}:{$seatId}");
            }
        }
    }

    protected function generateBookingCode(): string
    {
        return 'AD' . random_int(1, 9999);
    }

    /**
     * Record coupon usage khi booking được đánh dấu là paid
     */
    protected function recordCouponUsage(Booking $booking): ?CouponUsage
    {
        if (!$booking->coupon_id || $booking->discount_amount <= 0) {
            return null;
        }

        // Kiểm tra xem đã có record chưa để tránh duplicate
        $existingUsage = CouponUsage::where('booking_id', $booking->id)
            ->where('coupon_id', $booking->coupon_id)
            ->first();

        if ($existingUsage) {
            return $existingUsage;
        }

        $usageCoupon = CouponUsage::create([
            'coupon_id' => $booking->coupon_id,
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'discount_amount' => $booking->discount_amount
        ]);

        return $usageCoupon;
    }
}
