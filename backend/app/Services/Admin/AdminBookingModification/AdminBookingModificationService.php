<?php

namespace App\Services\Admin\AdminBookingModification;

use App\Models\Booking;
use App\Services\Admin\AdminBookingModification\Validators\BookingModificationValidator;
use App\Services\Admin\AdminBookingModification\Managers\SeatManager;
use App\Services\Admin\AdminBookingModification\Managers\BookingLegManager;
use App\Services\Admin\AdminBookingModification\Managers\PaymentManager;
use App\Services\Admin\AdminBookingModification\Calculators\PriceCalculator;
use Illuminate\Support\Facades\DB;

class AdminBookingModificationService
{
    public function __construct(
        private BookingModificationValidator $validator,
        private SeatManager $seatManager,
        private BookingLegManager $legManager,
        private PaymentManager $paymentManager,
        private PriceCalculator $priceCalculator
    ) {}

    public function changeSeat(Booking $booking, int $bookingItemId, int $newSeatId, int $adminId): Booking
    {
        return DB::transaction(function () use ($booking, $bookingItemId, $newSeatId, $adminId) {
            // Validate
            $this->validator->validateBooking($booking);
            $bookingItem = $this->validator->validateBookingItem($booking, $bookingItemId);
            $newSeat = $this->validator->validateSeat($bookingItem, $newSeatId);

            $tripId = $bookingItem->bookingLeg->trip_id;
            $this->validator->validateSeatAvailability($tripId, $newSeatId, $newSeat->seat_number);

            // Execute change
            $oldSeatId = $bookingItem->seat_id;
            $this->seatManager->releaseSeat($tripId, $oldSeatId, $booking->id);
            $this->seatManager->bookSeat($tripId, $newSeatId, $booking);

            // Update booking item
            $bookingItem->update([
                'seat_id' => $newSeatId,
                'seat_label' => (string) $newSeat->seat_number,
            ]);

            // Broadcast
            $this->seatManager->broadcastSeatChange($tripId, [$oldSeatId], [$newSeatId], $adminId, $booking->id);

            return $booking->fresh(['legs.items']);
        });
    }

    public function changeTrip(
        Booking $booking,
        int $bookingItemId,
        int $newTripId,
        ?int $newSeatId = null,
        array $options = [],
        int $adminId
    ): array {
        return DB::transaction(function () use ($booking, $bookingItemId, $newTripId, $newSeatId, $options, $adminId) {
            // Validate
            $this->validator->validateBooking($booking);
            $bookingItem = $this->validator->validateBookingItem($booking, $bookingItemId);
            $oldBookingLeg = $bookingItem->bookingLeg;
            $newTrip = $this->validator->validateTrip($newTripId);
            $newSeat = $this->validator->validateAndSelectSeat($newTrip, $newSeatId, $bookingItem);

            $tripId = $newTrip->id;
            $this->validator->validateSeatAvailability($tripId, $newSeat->id, $newSeat->seat_number);

            // Calculate price
            $priceInfo = $this->priceCalculator->calculateDifference(
                $oldBookingLeg,
                $newTrip,
                $newSeat->id,
                $options
            );

            // Release old seat
            $oldTripId = $oldBookingLeg->trip_id;
            $oldSeatId = $bookingItem->seat_id;
            $this->seatManager->releaseSeat($oldTripId, $oldSeatId, $booking->id);

            // Create/update leg
            $newBookingLeg = $this->legManager->createOrUpdateLeg(
                $booking,
                $oldBookingLeg,
                $newTrip,
                $options
            );

            // Book new seat
            $this->seatManager->bookSeat($tripId, $newSeat->id, $booking);

            // Update booking item
            $bookingItem->update([
                'booking_leg_id' => $newBookingLeg->id,
                'seat_id' => $newSeat->id,
                'seat_label' => (string) $newSeat->seat_number,
                'price' => $priceInfo['new_price'],
            ]);

            // Update price if needed
            if ($priceInfo['difference'] != 0) {
                $this->paymentManager->updateBookingPrice($booking, $priceInfo, $adminId);
            }

            // Cleanup
            $this->legManager->cleanupEmptyLeg($oldBookingLeg);

            // Broadcast
            $this->seatManager->broadcastSeatChange($oldTripId, [$oldSeatId], [], $adminId, $booking->id);
            $this->seatManager->broadcastSeatChange($tripId, [], [$newSeat->id], $adminId, $booking->id);

            return [
                'booking' => $booking->fresh(['legs.items']),
                'price_difference' => $priceInfo['difference'],
                'requires_payment' => $priceInfo['difference'] > 0,
                'requires_refund' => $priceInfo['difference'] < 0,
            ];
        });
    }
}
