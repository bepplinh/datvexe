<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TripPerformance\TripPerformanceRequest;
use App\Services\Admin\TripPerformanceService;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class TripPerformanceController extends Controller
{
    public function __construct(
        private TripPerformanceService $tripPerformanceService
    ) {}

    /**
     * Tỷ lệ lấp đầy theo chuyến/tuyến
     * GET /api/admin/trip-performance/occupancy?from_date=2024-01-01&to_date=2024-01-31&route_id=1
     */
    public function occupancy(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $routeId = $request->input('route_id');

            $data = $this->tripPerformanceService->getOccupancyRate($fromDate, $toDate, $routeId);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'route_id' => $routeId,
                    'occupancy' => $data,
                ],
                'message' => 'Lấy tỷ lệ lấp đầy thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Chuyến có tỷ lệ lấp đầy thấp
     * GET /api/admin/trip-performance/low-occupancy?from_date=2024-01-01&to_date=2024-01-31&threshold=50&limit=20
     */
    public function lowOccupancy(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $threshold = (float) $request->input('threshold', 50.0);
            $limit = $request->input('limit', 20);

            $data = $this->tripPerformanceService->getLowOccupancyTrips($fromDate, $toDate, $threshold, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'threshold' => $threshold,
                    'limit' => $limit,
                    'low_occupancy_trips' => $data,
                ],
                'message' => 'Lấy danh sách chuyến có tỷ lệ lấp đầy thấp thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Doanh thu trung bình mỗi chuyến
     * GET /api/admin/trip-performance/average-revenue?from_date=2024-01-01&to_date=2024-01-31
     */
    public function averageRevenue(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->tripPerformanceService->getAverageRevenuePerTrip($fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'average_revenue_per_trip' => $data,
                ],
                'message' => 'Lấy doanh thu trung bình mỗi chuyến thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Chuyến phổ biến nhất
     * GET /api/admin/trip-performance/popular-trips?from_date=2024-01-01&to_date=2024-01-31&limit=10
     */
    public function popularTrips(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $limit = $request->input('limit', 10);

            $data = $this->tripPerformanceService->getMostPopularTrips($fromDate, $toDate, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'limit' => $limit,
                    'popular_trips' => $data,
                ],
                'message' => 'Lấy danh sách chuyến phổ biến thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Thời gian khởi hành phổ biến nhất
     * GET /api/admin/trip-performance/popular-departure-times?from_date=2024-01-01&to_date=2024-01-31
     */
    public function popularDepartureTimes(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->tripPerformanceService->getPopularDepartureTimes($fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'popular_departure_times' => $data,
                ],
                'message' => 'Lấy thời gian khởi hành phổ biến thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ghế được đặt nhiều nhất
     * GET /api/admin/trip-performance/most-booked-seats?from_date=2024-01-01&to_date=2024-01-31&limit=20
     */
    public function mostBookedSeats(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $limit = $request->input('limit', 20);

            $data = $this->tripPerformanceService->getMostBookedSeats($fromDate, $toDate, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'limit' => $limit,
                    'most_booked_seats' => $data,
                ],
                'message' => 'Lấy danh sách ghế được đặt nhiều nhất thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ghế ít được đặt
     * GET /api/admin/trip-performance/least-booked-seats?from_date=2024-01-01&to_date=2024-01-31&limit=20
     */
    public function leastBookedSeats(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $limit = $request->input('limit', 20);

            $data = $this->tripPerformanceService->getLeastBookedSeats($fromDate, $toDate, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'limit' => $limit,
                    'least_booked_seats' => $data,
                ],
                'message' => 'Lấy danh sách ghế ít được đặt thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tỷ lệ sử dụng ghế theo loại
     * GET /api/admin/trip-performance/seat-usage-by-type?from_date=2024-01-01&to_date=2024-01-31
     */
    public function seatUsageByType(TripPerformanceRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->tripPerformanceService->getSeatUsageByType($fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'seat_usage_by_type' => $data,
                ],
                'message' => 'Lấy tỷ lệ sử dụng ghế theo loại thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}

