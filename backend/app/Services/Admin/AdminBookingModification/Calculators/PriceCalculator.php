<?php

namespace App\Services\Admin\AdminBookingModification\Calculators;

use App\Models\BookingLeg;
use App\Models\Trip;

class PriceCalculator
{
    public function calculateDifference(
        BookingLeg $oldLeg,
        Trip $newTrip,
        int $newSeatId,
        array $options
    ): array {
        $oldPrice = $oldLeg->total_price ?? 0;
        $newPrice = $this->calculateSegmentPrice(
            $newTrip,
            $options['pickup_location_id'] ?? $oldLeg->pickup_location_id,
            $options['dropoff_location_id'] ?? $oldLeg->dropoff_location_id
        );

        return [
            'old_price' => $oldPrice,
            'new_price' => $newPrice,
            'difference' => $newPrice - $oldPrice,
        ];
    }

    private function calculateSegmentPrice(Trip $trip, int $pickupLocationId, int $dropoffLocationId): float
    {
        if (!$trip->relationLoaded('route.tripStations')) {
            $trip->load('route.tripStations');
        }

        $segment = optional($trip->route)->tripStations
            ?->first(function ($ts) use ($pickupLocationId, $dropoffLocationId) {
                return $ts->from_location_id == $pickupLocationId
                    && $ts->to_location_id == $dropoffLocationId;
            });

        return $segment->price ?? (
            optional(optional($trip->route)->tripStations)->first()->price ?? 0
        );
    }
}
