<?php

namespace App\Services\GeminiAI\RouteOptimization;

use App\Models\BookingLeg;
use App\Models\Trip;
use Illuminate\Support\Collection;

class TripDataFetcher
{
    /**
     * Lấy booking legs của một trip
     */
    public function getBookingLegs(int $tripId): Collection
    {
        return BookingLeg::where('trip_id', $tripId)
            ->with(['booking'])
            ->get();
    }

    /**
     * Lấy thông tin trip
     */
    public function getTrip(int $tripId): ?Trip
    {
        return Trip::with(['route.fromCity', 'route.toCity'])->find($tripId);
    }

    /**
     * Kiểm tra trip có booking legs không
     */
    public function hasBookingLegs(int $tripId): bool
    {
        return BookingLeg::where('trip_id', $tripId)->exists();
    }
}
