<?php

namespace App\Services\Admin\AdminBookingModification\Managers;

use App\Models\Booking;
use App\Models\TripSeatStatus;
use App\Models\Seat;
use App\Events\SeatBooked;
use Illuminate\Support\Facades\Redis;

class SeatManager
{
    public function releaseSeat(int $tripId, int $seatId, int $bookingId): void
    {
        // Delete the record instead of setting booking_id to null
        // because booking_id is not nullable in the database
        TripSeatStatus::where('trip_id', $tripId)
            ->where('seat_id', $seatId)
            ->where('booking_id', $bookingId)
            ->delete();

        $this->cleanupRedis($tripId, $seatId);
    }

    public function bookSeat(int $tripId, int $seatId, Booking $booking): void
    {
        TripSeatStatus::updateOrCreate(
            [
                'trip_id' => $tripId,
                'seat_id' => $seatId,
            ],
            [
                'booking_id' => $booking->id,
                'is_booked' => true,
                'booked_by_user_id' => $booking->user_id,
                'booked_at' => now(),
            ]
        );

        Redis::sadd("trip:{$tripId}:booked", $seatId);
        Redis::srem("trip:{$tripId}:locked", $seatId);
    }

    public function broadcastSeatChange(
        int $tripId,
        array $releasedSeatIds,
        array $bookedSeatIds,
        int $adminId,
        int $bookingId
    ): void {
        if (empty($releasedSeatIds) && empty($bookedSeatIds)) {
            return;
        }

        $seatLabels = [];
        if (!empty($bookedSeatIds)) {
            $seats = Seat::whereIn('id', $bookedSeatIds)
                ->pluck('seat_number', 'id')
                ->map(fn($label) => (string) $label)
                ->toArray();
            $seatLabels = array_values($seats);
        }

        event(new SeatBooked(
            sessionToken: 'admin_' . $adminId,
            bookingId: $bookingId,
            booked: [[
                'trip_id' => $tripId,
                'seat_ids' => $bookedSeatIds,
                'seat_labels' => $seatLabels,
            ]],
            userId: null,
        ));
    }

    private function cleanupRedis(int $tripId, int $seatId): void
    {
        $lockKey = "trip:{$tripId}:seat:{$seatId}:lock";
        Redis::del($lockKey);
        Redis::srem("trip:{$tripId}:locked", $seatId);
        Redis::srem("trip:{$tripId}:booked", $seatId);
    }
}

