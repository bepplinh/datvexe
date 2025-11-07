<?php

namespace App\Services\Admin;

use App\Models\Trip;
use App\Models\User;
use App\Models\Booking;
use App\Models\TripSeatStatus;
use Illuminate\Support\Str;
use App\Services\SeatFlowService;
use Illuminate\Support\Facades\DB;

class AdminBookingService
{
    public function __construct(
        private SeatFlowService $seatFlow
    ) {}

    private function generateBookingCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (Booking::where('code', $code)->exists()); // Lặp lại nếu mã đã tồn tại

        return $code;
    }

    public function createBookingFromAdmin(array $data)
    {
        $user = User::firstOrCreate(
            ['phone' => $data['customer_phone']],
            [
                'name' => $data['customer_name'],
                'email' => $data['customer_email'] ?? null,
                'password' => bcrypt(Str::random(16)),
            ]
        );

        $fromLocationId = (int) $data['from_location_id'];
        $toLocationId = (int) $data['to_location_id'];

        $tripsPayload = $data['trips'];

        return DB::transaction(function () use ($user, $fromLocationId, $toLocationId, $tripsPayload, $data) {
            $preparedLegs = [];
            $totalAmount = 0;

            foreach ($tripsPayload as $tripRow) {
                $tripId = (int) $tripRow['trip_id'];
                $seatIds = array_map('intval', $tripRow['seat_ids'] ?? []);
                $legType = strtoupper($tripRow['leg'] ?? 'OUT') ;

                if ($legType === 'RETURN') {
                    $legFromId = $toLocationId;
                    $legToId = $fromLocationId;
                } else {
                    $legFromId = $fromLocationId;
                    $legToId = $toLocationId;
                }

                // 3) Load trip + route + tripStations và khóa (hạn chế race)
                $trip = Trip::with('route.tripStations')
                    ->whereKey($tripId)
                    ->lockForUpdate()
                    ->firstOrFail();

                 // 4) Reserve ghế trong trip_seat_status (status = BOOKED)
                 $this
            }
        });
    }

    protected function reserveSeatsInTripStatus(int $tripId, array $seatIds)
    {
        $existing = TripSeatStatus::query()
            ->where('trip_id', $tripId)
            ->whereIn('seat_id', $seatIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('seat_id');

        $conflicts = [];

        foreach ($seatIds as $seatId) {
            $row = $existing->get($seatId);

            if ($row && $row->is_booked === true) {
                $conflicts[] = $seatId;
            }
        } 

        if (!empty($conflicts)) {
            return response()->json([
                'message' => 'Ghế đã được đặt trước đó (trip ' . $tripId . '): ' . implode(',', $conflicts)
            ]);
        }

        f
    }
}
