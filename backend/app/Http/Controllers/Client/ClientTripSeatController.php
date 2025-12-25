<?php

namespace App\Http\Controllers\Client;

use App\Models\Trip;
use App\Models\TripSeatStatus;
use App\Http\Controllers\Controller;
use App\Services\BusSeatLayoutService;
use App\Services\SeatFlowService;

class ClientTripSeatController extends Controller
{
    public function __construct(
        private SeatFlowService $seatFlow,
        private BusSeatLayoutService $layoutService,
    ) {}
    public function show(int $tripId)
    {
        $trip = Trip::with(['bus.seats' => function ($q) {
            $q->select('id', 'bus_id', 'seat_number', 'deck', 'column_group', 'index_in_column', 'seat_type', 'layout_x', 'layout_y', 'layout_w', 'layout_h', 'active');
        }])->findOrFail($tripId);

        $seats = $trip->bus?->seats ?? collect();
        if ($seats->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Xe chưa có sơ đồ ghế'
            ], 404);
        };

        $seatIds = $seats->pluck('id')->all();

        $booked = TripSeatStatus::query()
            ->where('trip_id', $tripId)
            ->where('is_booked', true)
            ->pluck('seat_id')
            ->flip();

        $lockStatus = $this->seatFlow->loadStatus($tripId, $seatIds);
        // $lockStatus['locked'] là mảng các bản ghi ['seat_id' => int, ...]
        // -> cần lấy ra danh sách seat_id rồi mới flip để dùng như set
        $locked = collect($lockStatus['locked'] ?? [])
            ->pluck('seat_id')
            ->map(fn($id) => (int) $id)
            ->flip();

        $layout = $this->layoutService->layoutFromSeats($seats, $trip->bus);

        $payload = $seats->map(function ($seat) use ($booked, $locked) {
            $status = 'available';
            if ($booked->has($seat->id)) {
                $status = 'booked';
            } elseif ($locked->has($seat->id)) {
                $status = 'locked';
            }

            return [
                'seat_id'       => $seat->id,
                'label'         => $seat->seat_number,
                'deck'          => $seat->deck,
                'column_group'  => $seat->column_group,
                'index'         => $seat->index_in_column,
                'status'        => $status,
                'seat_type'     => $seat->seat_type,
                'position'      => [
                    'x' => $seat->layout_x,
                    'y' => $seat->layout_y,
                    'w' => $seat->layout_w,
                    'h' => $seat->layout_h,
                ],
            ];
        })->groupBy('deck')->map->values();

        return response()->json([
            'success' => true,
            'data' => [
                'trip_id' => $tripId,
                'bus_id'  => $trip->bus_id,
                'layout'  => $layout,
                'seats'   => $payload,
            ],
        ]);
    }
}
