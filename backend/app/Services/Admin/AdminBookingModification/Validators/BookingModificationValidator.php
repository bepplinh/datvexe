<?php

namespace App\Services\Admin\AdminBookingModification\Validators;

use App\Models\Seat;
use App\Models\Trip;
use RuntimeException;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Services\Admin\AdminBookingModification\Validators\SeatAvailabilityValidator;

class BookingModificationValidator
{
    public function __construct(
        private SeatAvailabilityValidator $seatAvailabilityValidator
    ) {}

    public function validateBooking(Booking $booking): void
    {
        if ($booking->status === 'cancelled') {
            throw new RuntimeException('Không thể thay đổi booking đã bị hủy');
        }
    }

    public function validateBookingItem(Booking $booking, int $bookingItemId): BookingItem
    {
        $bookingItem = BookingItem::with(['bookingLeg.trip', 'seat'])
            ->findOrFail($bookingItemId);

        if ($bookingItem->bookingLeg->booking_id !== $booking->id) {
            throw new RuntimeException('Booking item không thuộc booking này');
        }

        return $bookingItem;
    }

    public function validateSeat(BookingItem $bookingItem, int $seatId): Seat
    {
        $trip = $bookingItem->bookingLeg->trip;

        $seat = Seat::where('id', $seatId)
            ->where('bus_id', $trip->bus_id)
            ->where('active', true)
            ->first();

        if (!$seat) {
            throw new RuntimeException('Ghế không hợp lệ hoặc không thuộc xe của chuyến');
        }

        return $seat;
    }

    public function validateTrip(int $tripId): Trip
    {
        return Trip::with('route.tripStations')->findOrFail($tripId);
    }

    public function validateAndSelectSeat(Trip $trip, ?int $seatId, BookingItem $oldItem): Seat
    {
        if ($seatId) {
            $seat = Seat::where('id', $seatId)
                ->where('bus_id', $trip->bus_id)
                ->where('active', true)
                ->first();

            if (!$seat) {
                throw new RuntimeException('Ghế không hợp lệ hoặc không thuộc xe của chuyến mới');
            }

            return $seat;
        }

        // Try to find same seat number
        $oldSeat = $oldItem->seat;
        $seat = Seat::where('seat_number', $oldSeat->seat_number)
            ->where('bus_id', $trip->bus_id)
            ->where('active', true)
            ->first();

        if (!$seat) {
            throw new RuntimeException('Không tìm thấy ghế tương ứng. Vui lòng chọn ghế cụ thể.');
        }

        return $seat;
    }

    public function validateSeatAvailability(int $tripId, int $seatId, string $seatNumber): void
    {
        $this->seatAvailabilityValidator->validate($tripId, $seatId, $seatNumber);
    }
}
