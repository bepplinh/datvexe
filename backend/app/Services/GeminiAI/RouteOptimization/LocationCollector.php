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

    /**
     * Lấy danh sách địa điểm theo loại (pickup hoặc dropoff)
     */
    public function collectByType(Collection $bookingLegs, string $type): array
    {
        $type = strtolower($type);
        $locations = [];

        foreach ($bookingLegs as $leg) {
            if ($type === 'pickup') {
                $locations[] = $this->createPickupLocation($leg);
            } elseif ($type === 'dropoff') {
                $locations[] = $this->createDropoffLocation($leg);
            }
        }

        return $locations;
    }

    /**
     * Tách riêng pickup locations và dropoff locations
     * @return array{pickup: array, dropoff: array}
     */
    public function separatePickupAndDropoff(Collection $bookingLegs): array
    {
        $pickupLocations = [];
        $dropoffLocations = [];

        foreach ($bookingLegs as $leg) {
            $pickupLocations[] = $this->createPickupLocation($leg);
            $dropoffLocations[] = $this->createDropoffLocation($leg);
        }

        return [
            'pickup' => $pickupLocations,
            'dropoff' => $dropoffLocations,
        ];
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
