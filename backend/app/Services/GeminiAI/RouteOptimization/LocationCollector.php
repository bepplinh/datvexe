<?php

namespace App\Services\GeminiAI\RouteOptimization;

use App\Models\BookingLeg;
use App\Services\GeminiAI\RouteOptimization\DTOs\LocationDTO;
use Illuminate\Support\Collection;

class LocationCollector
{
    /**
     * Tập hợp tất cả địa điểm từ booking legs
     */
    public function collectFromBookingLegs(Collection $bookingLegs): array
    {
        $locations = [];

        foreach ($bookingLegs as $leg) {
            $locations[] = $this->createPickupLocation($leg);
            $locations[] = $this->createDropoffLocation($leg);
        }

        return $locations;
    }

    private function createPickupLocation(BookingLeg $leg): LocationDTO
    {
        return new LocationDTO(
            id: 'pickup_' . $leg->id,
            address: $leg->pickup_address,
            type: 'pickup',
            bookingLegId: $leg->id,
            bookingCode: $leg->booking->code ?? null,
            passengerName: $leg->booking->passenger_name ?? null,
        );
    }

    private function createDropoffLocation(BookingLeg $leg): LocationDTO
    {
        return new LocationDTO(
            id: 'dropoff_' . $leg->id,
            address: $leg->dropoff_address,
            type: 'dropoff',
            bookingLegId: $leg->id,
            bookingCode: $leg->booking->code ?? null,
            passengerName: $leg->booking->passenger_name ?? null,
        );
    }
}
