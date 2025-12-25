<?php

namespace App\Services\Admin\AdminBookingModification\Managers;

use App\Models\Booking;
use App\Models\BookingLeg;
use App\Models\Trip;

class BookingLegManager
{
    public function createOrUpdateLeg(
        Booking $booking,
        BookingLeg $oldLeg,
        Trip $newTrip,
        array $options
    ): BookingLeg {
        $existingLeg = BookingLeg::where('booking_id', $booking->id)
            ->where('trip_id', $newTrip->id)
            ->where('leg_type', $oldLeg->leg_type)
            ->first();

        if ($existingLeg) {
            return $this->updateLeg($existingLeg, $oldLeg, $options);
        }

        return $this->createLeg($booking, $oldLeg, $newTrip, $options);
    }

    public function cleanupEmptyLeg(BookingLeg $leg): void
    {
        if ($leg->items()->count() === 0) {
            $leg->delete();
        }
    }

    private function updateLeg(BookingLeg $leg, BookingLeg $oldLeg, array $options): BookingLeg
    {
        $leg->update([
            'pickup_location_id' => $options['pickup_location_id'] ?? $oldLeg->pickup_location_id,
            'dropoff_location_id' => $options['dropoff_location_id'] ?? $oldLeg->dropoff_location_id,
            'pickup_address' => $options['pickup_address'] ?? $oldLeg->pickup_address,
            'dropoff_address' => $options['dropoff_address'] ?? $oldLeg->dropoff_address,
        ]);

        return $leg;
    }

    private function createLeg(Booking $booking, BookingLeg $oldLeg, Trip $newTrip, array $options): BookingLeg
    {
        return BookingLeg::create([
            'booking_id' => $booking->id,
            'trip_id' => $newTrip->id,
            'leg_type' => $oldLeg->leg_type,
            'pickup_location_id' => $options['pickup_location_id'] ?? $oldLeg->pickup_location_id,
            'dropoff_location_id' => $options['dropoff_location_id'] ?? $oldLeg->dropoff_location_id,
            'pickup_address' => $options['pickup_address'] ?? $oldLeg->pickup_address,
            'dropoff_address' => $options['dropoff_address'] ?? $oldLeg->dropoff_address,
            'total_price' => 0,
        ]);
    }
}

