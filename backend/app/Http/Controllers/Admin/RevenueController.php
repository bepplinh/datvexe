<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Revenue\RevenueDashboardRequest;
use App\Http\Requests\Admin\Revenue\RevenueTrendRequest;
use App\Http\Requests\Admin\Revenue\RevenueAnalysisRequest;
use App\Services\Admin\RevenueService;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class RevenueController extends Controller
{
    public function __construct(
        private RevenueService $revenueService
    ) {}

    /**
     * Dashboard doanh thu tổng quan
     * GET /api/admin/revenue/dashboard?period=day&date=2024-01-15
     */
    public function dashboard(RevenueDashboardRequest $request): JsonResponse
    {
        try {
            $period = $request->input('period', 'day');
            $date = $request->input('date')
                ? Carbon::parse($request->input('date'))
                : Carbon::now();

            $data = $this->revenueService->getDashboardData($date, $period);

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'current_period' => [
                        'start' => $data['current_period']['start']->format('Y-m-d H:i:s'),
                        'end' => $data['current_period']['end']->format('Y-m-d H:i:s'),
                        'revenue' => $data['current_period']['revenue'],
                        'booking_count' => $data['current_period']['booking_count'],
                    ],
                    'previous_period' => [
                        'start' => $data['previous_period']['start']->format('Y-m-d H:i:s'),
                        'end' => $data['previous_period']['end']->format('Y-m-d H:i:s'),
                        'revenue' => $data['previous_period']['revenue'],
                        'booking_count' => $data['previous_period']['booking_count'],
                    ],
                    'comparison' => $data['comparison'],
                ],
                'message' => 'Lấy dữ liệu dashboard doanh thu thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Biểu đồ xu hướng doanh thu theo thời gian
     * GET /api/admin/revenue/trend?period=day&from_date=2024-01-01&to_date=2024-01-31
     */
    public function trend(RevenueTrendRequest $request): JsonResponse
    {
        try {
            $period = $request->input('period', 'day');
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $trendData = $this->revenueService->getTrendData($fromDate, $toDate, $period);

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'trend' => $trendData,
                ],
                'message' => 'Lấy dữ liệu xu hướng doanh thu thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Top tuyến đường có doanh thu cao nhất
     * GET /api/admin/revenue/top-routes?limit=10&from_date=2024-01-01&to_date=2024-01-31
     */
    public function topRoutes(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'limit' => 'nullable|integer|min:1|max:100',
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date|after_or_equal:from_date',
            ]);

            $limit = $request->input('limit', 10);
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $topRoutes = $this->revenueService->getTopRoutes($fromDate, $toDate, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'top_routes' => $topRoutes,
                ],
                'message' => 'Lấy danh sách top tuyến đường thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Top chuyến xe có doanh thu cao nhất
     * GET /api/admin/revenue/top-trips?limit=10&from_date=2024-01-01&to_date=2024-01-31
     */
    public function topTrips(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'limit' => 'nullable|integer|min:1|max:100',
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date|after_or_equal:from_date',
            ]);

            $limit = $request->input('limit', 10);
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $topTrips = $this->revenueService->getTopTrips($fromDate, $toDate, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'top_trips' => $topTrips,
                ],
                'message' => 'Lấy danh sách top chuyến xe thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Phân tích doanh thu chi tiết
     * GET /api/admin/revenue/analysis?group_by=route&from_date=2024-01-01&to_date=2024-01-31
     */
    public function analysis(RevenueAnalysisRequest $request): JsonResponse
    {
        try {
            $groupBy = $request->input('group_by', 'route');
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->revenueService->getDetailedAnalysis($fromDate, $toDate, $groupBy);

            return response()->json([
                'success' => true,
                'data' => [
                    'group_by' => $groupBy,
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'analysis' => $data,
                ],
                'message' => 'Lấy dữ liệu phân tích doanh thu thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}
