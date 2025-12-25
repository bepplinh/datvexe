<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SeatLayout\UpsertSeatLayoutRequest;
use App\Models\Bus;
use App\Models\Seat;
use App\Services\BusSeatLayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class BusSeatLayoutController extends Controller
{
    public function __construct(private BusSeatLayoutService $layoutService) {}

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

    public function destroy(Bus $bus, Seat $seat): JsonResponse
    {
        try {
            $this->layoutService->deleteSeat($bus, $seat);

            return response()->json([
                'success' => true,
                'message' => 'Xóa ghế thành công',
            ], Response::HTTP_OK);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_CONFLICT);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa ghế: ' . $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
