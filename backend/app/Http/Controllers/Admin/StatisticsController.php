<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Statistics\BookingStatisticsRequest;
use App\Http\Requests\Admin\Statistics\CustomerAnalysisRequest;
use App\Services\Admin\StatisticsService;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function __construct(
        private StatisticsService $statisticsService
    ) {}

    /**
     * Thống kê booking
     * GET /api/admin/statistics/bookings?from_date=2024-01-01&to_date=2024-01-31&status=all
     */
    public function bookings(BookingStatisticsRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $status = $request->input('status', 'all');

            $data = $this->statisticsService->getBookingStatistics($fromDate, $toDate, $status);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'status' => $status,
                    'statistics' => $data,
                ],
                'message' => 'Lấy thống kê booking thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Top khách hàng
     * GET /api/admin/statistics/top-customers?from_date=2024-01-01&to_date=2024-01-31&limit=10&sort_by=booking_count
     */
    public function topCustomers(CustomerAnalysisRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $limit = $request->input('limit', 10);
            $sortBy = $request->input('sort_by', 'booking_count');

            $data = $this->statisticsService->getTopCustomers($fromDate, $toDate, $limit, $sortBy);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'limit' => $limit,
                    'sort_by' => $sortBy,
                    'top_customers' => $data,
                ],
                'message' => 'Lấy danh sách top khách hàng thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Phân tích khách hàng mới vs quay lại
     * GET /api/admin/statistics/customer-segmentation?from_date=2024-01-01&to_date=2024-01-31
     */
    public function customerSegmentation(CustomerAnalysisRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->statisticsService->getCustomerSegmentation($fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'segmentation' => $data,
                ],
                'message' => 'Lấy phân tích khách hàng thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Phân bố khách hàng theo địa điểm
     * GET /api/admin/statistics/customer-distribution?from_date=2024-01-01&to_date=2024-01-31
     */
    public function customerDistribution(CustomerAnalysisRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->statisticsService->getCustomerDistributionByLocation($fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'distribution' => $data,
                ],
                'message' => 'Lấy phân bố khách hàng thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lịch sử đặt vé của khách hàng
     * GET /api/admin/statistics/customer-history/{userId}?from_date=2024-01-01&to_date=2024-01-31
     */
    public function customerHistory(int $userId, CustomerAnalysisRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : null;
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : null;

            $data = $this->statisticsService->getCustomerBookingHistory($userId, $fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $userId,
                    'from_date' => $fromDate ? $fromDate->format('Y-m-d') : null,
                    'to_date' => $toDate ? $toDate->format('Y-m-d') : null,
                    'history' => $data,
                ],
                'message' => 'Lấy lịch sử đặt vé thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}

