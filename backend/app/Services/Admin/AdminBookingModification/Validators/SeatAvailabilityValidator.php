<?php

namespace App\Services\Admin\AdminBookingModification\Validators;

use App\Models\TripSeatStatus;
use Illuminate\Support\Facades\Redis;
use RuntimeException;

class SeatAvailabilityValidator
{
    public function validate(int $tripId, int $seatId, string $seatNumber): void
    {
        $this->checkNotBooked($tripId, $seatId, $seatNumber);
        $this->checkNotLocked($tripId, $seatId, $seatNumber);
    }

    private function checkNotBooked(int $tripId, int $seatId, string $seatNumber): void
    {
        $existing = TripSeatStatus::where('trip_id', $tripId)
            ->where('seat_id', $seatId)
            ->where('is_booked', true)
            ->first();

        if ($existing) {
            throw new RuntimeException("Ghế {$seatNumber} đã được đặt trước đó");
        }
    }

    private function checkNotLocked(int $tripId, int $seatId, string $seatNumber): void
    {
        $lockKey = "trip:{$tripId}:seat:{$seatId}:lock";
        $ttl = Redis::ttl($lockKey);
        
        if ($ttl !== false && $ttl > 0) {
            throw new RuntimeException("Ghế {$seatNumber} đang được giữ bởi khách khác");
        }
    }
}

