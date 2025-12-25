<?php

namespace App\Http\Controllers\Admin;

use App\Models\Trip;
use App\Models\TripSeatStatus;
use App\Http\Controllers\Controller;
use App\Services\BusSeatLayoutService;
use App\Services\SeatFlowService;
use Illuminate\Support\Facades\DB;

class AdminTripSeatController extends Controller
{
    public function __construct(
        private SeatFlowService $seatFlow,
        private BusSeatLayoutService $layoutService,
    ) {}

    public function show(int $tripId)
    {
        $trip = Trip::with(['bus.seats' => function ($q) {
            $q->select('id', 'bus_id', 'seat_number', 'deck', 'column_group', 'index_in_column', 'seat_type', 'layout_x', 'layout_y', 'layout_w', 'layout_h', 'active');
        }])->findOrFail($tripId);

        $seats = $trip->bus?->seats ?? collect();
        if ($seats->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Xe chưa có sơ đồ ghế'
            ], 404);
        }

        $seatIds = $seats->pluck('id')->all();

        // Lấy thông tin booking cho từng ghế đã đặt
        $bookedSeats = TripSeatStatus::query()
            ->where('trip_id', $tripId)
            ->where('is_booked', true)
            ->whereIn('seat_id', $seatIds)
            ->with([
                'booking' => function ($q) {
                    $q->select('id', 'code', 'passenger_name', 'passenger_phone', 'passenger_email', 'status', 'paid_at', 'created_at');
                }
            ])
            ->get()
            ->keyBy('seat_id');

        // Lấy booking legs riêng để tránh N+1
        $bookingIds = $bookedSeats->pluck('booking_id')->filter()->unique()->values()->all();
        $bookingLegs = collect();
        $bookingItems = collect();
        if (!empty($bookingIds)) {
            $bookingLegs = \App\Models\BookingLeg::query()
                ->where('trip_id', $tripId)
                ->whereIn('booking_id', $bookingIds)
                ->select('id', 'booking_id', 'trip_id', 'pickup_address', 'dropoff_address', 'pickup_location_id', 'dropoff_location_id', 'created_at')
                ->with([
                    'pickupLocation' => function ($q) {
                        $q->select('id', 'name');
                    },
                    'dropoffLocation' => function ($q) {
                        $q->select('id', 'name');
                    }
                ])
                ->get()
                ->groupBy('booking_id');

            // Lấy booking items để có booking_item_id
            $legIds = $bookingLegs->flatten()->pluck('id')->all();
            if (!empty($legIds)) {
                $bookingItems = \App\Models\BookingItem::query()
                    ->whereIn('booking_leg_id', $legIds)
                    ->whereIn('seat_id', $seatIds)
                    ->select('id', 'booking_leg_id', 'seat_id')
                    ->get()
                    ->keyBy(function ($item) {
                        return $item->booking_leg_id . '_' . $item->seat_id;
                    });
            }
        }

        $lockStatus = $this->seatFlow->loadStatus($tripId, $seatIds);
        $locked = collect($lockStatus['locked'] ?? [])
            ->pluck('seat_id')
            ->map(fn($id) => (int) $id)
            ->flip();

        $layout = $this->layoutService->layoutFromSeats($seats, $trip->bus);

        $payload = $seats->map(function ($seat) use ($bookedSeats, $locked, $bookingLegs, $bookingItems) {
            $status = 'available';
            $bookingInfo = null;

            if ($bookedSeats->has($seat->id)) {
                $status = 'booked';
                $tripSeatStatus = $bookedSeats->get($seat->id);
                $booking = $tripSeatStatus->booking;

                if ($booking) {
                    $leg = $bookingLegs->get($booking->id)?->first();
                    
                    // Tìm booking_item_id
                    $bookingItemId = null;
                    if ($leg) {
                        $itemKey = $leg->id . '_' . $seat->id;
                        $bookingItem = $bookingItems->get($itemKey);
                        if ($bookingItem) {
                            $bookingItemId = $bookingItem->id;
                        }
                    }

                    // Lấy paid_at và created_at từ booking
                    $paidAt = null;
                    $createdAt = null;

                    if ($booking->paid_at) {
                        $paidAt = $booking->paid_at instanceof \Carbon\Carbon
                            ? $booking->paid_at->toIso8601String()
                            : (string) $booking->paid_at;
                    }

                    if ($booking->created_at) {
                        $createdAt = $booking->created_at instanceof \Carbon\Carbon
                            ? $booking->created_at->toIso8601String()
                            : (string) $booking->created_at;
                    } elseif ($leg && $leg->created_at) {
                        $createdAt = $leg->created_at instanceof \Carbon\Carbon
                            ? $leg->created_at->toIso8601String()
                            : (string) $leg->created_at;
                    }

                    $bookingInfo = [
                        'booking_id' => $booking->id,
                        'booking_item_id' => $bookingItemId,
                        'booking_code' => $booking->code,
                        'passenger_name' => $booking->passenger_name,
                        'passenger_phone' => $booking->passenger_phone,
                        'passenger_email' => $booking->passenger_email,
                        'pickup_address' => $leg?->pickup_address,
                        'dropoff_address' => $leg?->dropoff_address,
                        'pickup_location_name' => $leg?->pickupLocation?->name,
                        'dropoff_location_name' => $leg?->dropoffLocation?->name,
                        'status' => $booking->status,
                        'paid_at' => $paidAt,
                        'created_at' => $createdAt,
                    ];
                }
            } elseif ($locked->has($seat->id)) {
                $status = 'locked';
            }

            return [
                'seat_id'       => $seat->id,
                'label'         => $seat->seat_number,
                'deck'          => $seat->deck,
                'column_group'  => $seat->column_group,
                'index'         => $seat->index_in_column,
                'status'        => $status,
                'seat_type'     => $seat->seat_type,
                'booking_info'  => $bookingInfo,
                'position'      => [
                    'x' => $seat->layout_x,
                    'y' => $seat->layout_y,
                    'w' => $seat->layout_w,
                    'h' => $seat->layout_h,
                ],
            ];
        })->groupBy('deck')->map->values();

        return response()->json([
            'success' => true,
            'data' => [
                'trip_id' => $tripId,
                'bus_id'  => $trip->bus_id,
                'layout'  => $layout,
                'seats'   => $payload,
            ],
        ]);
    }
}
