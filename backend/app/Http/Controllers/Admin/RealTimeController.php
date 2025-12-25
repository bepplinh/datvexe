<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\RealTimeService;
use Illuminate\Http\JsonResponse;

class RealTimeController extends Controller
{
    public function __construct(
        private RealTimeService $realTimeService
    ) {}

    /**
     * Metrics real-time
     * GET /api/admin/realtime/metrics
     */
    public function metrics(): JsonResponse
    {
        try {
            $data = $this->realTimeService->getRealTimeMetrics();

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Lấy metrics real-time thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Doanh thu theo giờ hôm nay
     * GET /api/admin/realtime/today-revenue-by-hour
     */
    public function todayRevenueByHour(): JsonResponse
    {
        try {
            $data = $this->realTimeService->getTodayRevenueByHour();

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Lấy doanh thu theo giờ hôm nay thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Chuyến sắp khởi hành hôm nay
     * GET /api/admin/realtime/upcoming-trips?limit=10
     */
    public function upcomingTrips(): JsonResponse
    {
        try {
            $limit = request()->input('limit', 10);
            $data = $this->realTimeService->getUpcomingTripsToday($limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'limit' => $limit,
                    'upcoming_trips' => $data,
                ],
                'message' => 'Lấy danh sách chuyến sắp khởi hành thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}

