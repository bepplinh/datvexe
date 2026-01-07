<?php

namespace App\Services\Dashboard;

use App\Services\Dashboard\Revenue\RevenueService;
use App\Services\Dashboard\Booking\StatisticsService;
use App\Services\Dashboard\Metrics\TopMetricsService;
use Carbon\Carbon;

class DashboardService
{
    public function __construct(
        private RevenueService $revenueService,
        private StatisticsService $bookingStatsService,
        private PeriodComparisonService $periodComparisonService,
        private TopMetricsService $topMetricsService
    ) {}

    /**
     * Lấy tổng quan dashboard
     */
    public function getOverview(?Carbon $fromDate = null, ?Carbon $toDate = null): array
    {
        return [
            'revenue' => [
                'net_revenue' => $this->revenueService->calculateNetRevenue($fromDate, $toDate),
                'gross_revenue' => $this->revenueService->calculateGrossRevenue($fromDate, $toDate),
                'total_refunds' => $this->revenueService->calculateTotalRefunds($fromDate, $toDate),
            ],
            'bookings' => [
                'paid_count' => $this->bookingStatsService->countPaidBookings($fromDate, $toDate),
                'cancelled_count' => $this->bookingStatsService->countCancelledBookings($fromDate, $toDate),
                'total_count' => $this->bookingStatsService->countTotalBookings($fromDate, $toDate),
                'cancellation_rate' => $this->bookingStatsService->calculateCancellationRate($fromDate, $toDate),
            ],
            'payment_methods' => $this->revenueService->getRevenueByPaymentMethod($fromDate, $toDate),
        ];
    }

    /**
     * So sánh theo kỳ
     */
    public function getPeriodComparison(
        string $period,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): array {
        return $this->periodComparisonService->comparePeriods($period, $fromDate, $toDate);
    }

    /**
     * Lấy top metrics
     */
    public function getTopMetrics(
        ?string $period = null,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null,
        int $limit = 10
    ): array {
        $metrics = [
            'highest_value_booking' => $this->topMetricsService->getHighestValueBooking($fromDate, $toDate),
            'most_popular_payment_method' => $this->topMetricsService->getMostPopularPaymentMethod($fromDate, $toDate),
        ];

        if ($period) {
            $metrics['highest_revenue_period'] = $this->topMetricsService->getHighestRevenuePeriod(
                $period,
                $fromDate,
                $toDate
            );
        }

        $metrics['top_value_bookings'] = $this->topMetricsService->getTopValueBookings($limit, $fromDate, $toDate);

        return $metrics;
    }
}

