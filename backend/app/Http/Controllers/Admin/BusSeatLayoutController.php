<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SeatLayout\UpsertSeatLayoutRequest;
use App\Models\Bus;
use App\Services\BusSeatLayoutService;
use Illuminate\Http\JsonResponse;

class BusSeatLayoutController extends Controller
{
    public function __construct(private BusSeatLayoutService $layoutService)
    {
    }

    public function show(Bus $bus): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->layoutService->format($bus),
        ]);
    }

    public function update(UpsertSeatLayoutRequest $request, Bus $bus): JsonResponse
    {
        $payload = $request->validated();

        $result = $this->layoutService->sync(
            $bus,
            $payload['layout'],
            $payload['seats']
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật sơ đồ ghế thành công',
            'data' => $result,
        ]);
    }
}

