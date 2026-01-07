<?php

namespace App\Services\Dashboard;

use App\Services\Dashboard\Revenue\RevenueService;
use App\Services\Dashboard\Booking\StatisticsService;
use Carbon\Carbon;

class PeriodComparisonService
{
    public function __construct(
        private RevenueService $revenueService,
        private StatisticsService $bookingStatsService
    ) {}

    /**
     * So sánh metrics giữa 2 kỳ
     */
    public function comparePeriods(
        string $period,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): array {
        // Tính toán kỳ hiện tại
        $currentPeriod = $this->calculateCurrentPeriod($period, $fromDate, $toDate);
        $currentFrom = $currentPeriod['from'];
        $currentTo = $currentPeriod['to'];

        // Tính toán kỳ trước
        $previousPeriod = $this->calculatePreviousPeriod($period, $currentFrom, $currentTo, $fromDate, $toDate);
        $previousFrom = $previousPeriod['from'];
        $previousTo = $previousPeriod['to'];

        // Lấy metrics cho kỳ hiện tại
        $currentMetrics = $this->getMetricsForPeriod($currentFrom, $currentTo);

        // Lấy metrics cho kỳ trước
        $previousMetrics = $this->getMetricsForPeriod($previousFrom, $previousTo);

        // Tính toán % tăng trưởng
        return [
            'current_period' => [
                'from' => $currentFrom->format('Y-m-d'),
                'to' => $currentTo->format('Y-m-d'),
                'metrics' => $currentMetrics,
            ],
            'previous_period' => [
                'from' => $previousFrom->format('Y-m-d'),
                'to' => $previousTo->format('Y-m-d'),
                'metrics' => $previousMetrics,
            ],
            'growth' => $this->calculateGrowth($currentMetrics, $previousMetrics),
        ];
    }

    /**
     * Tính toán khoảng thời gian cho kỳ hiện tại
     */
    protected function calculateCurrentPeriod(
        string $period,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): array {
        if ($fromDate && $toDate) {
            return ['from' => $fromDate->copy(), 'to' => $toDate->copy()];
        }

        $now = Carbon::now();

        return match ($period) {
            'day' => [
                'from' => $now->copy()->startOfDay(),
                'to' => $now->copy()->endOfDay(),
            ],
            'week' => [
                'from' => $now->copy()->startOfWeek(),
                'to' => $now->copy()->endOfWeek(),
            ],
            'month' => [
                'from' => $now->copy()->startOfMonth(),
                'to' => $now->copy()->endOfMonth(),
            ],
            'quarter' => [
                'from' => $now->copy()->startOfQuarter(),
                'to' => $now->copy()->endOfQuarter(),
            ],
            'year' => [
                'from' => $now->copy()->startOfYear(),
                'to' => $now->copy()->endOfYear(),
            ],
            default => [
                'from' => $now->copy()->startOfDay(),
                'to' => $now->copy()->endOfDay(),
            ],
        };
    }

    /**
     * Tính toán khoảng thời gian cho kỳ trước
     * Nếu có date range tùy chỉnh, sẽ lùi lại số ngày tương ứng
     * Nếu không có date range, sẽ dùng period type để tính
     */
    protected function calculatePreviousPeriod(
        string $period,
        Carbon $currentFrom,
        Carbon $currentTo,
        ?Carbon $customFromDate = null,
        ?Carbon $customToDate = null
    ): array {
        // Nếu có date range tùy chỉnh, lùi lại số ngày tương ứng
        if ($customFromDate && $customToDate) {
            $daysDiff = $currentFrom->diffInDays($currentTo) + 1;
            return [
                'from' => $currentFrom->copy()->subDays($daysDiff),
                'to' => $currentFrom->copy()->subDay(),
            ];
        }

        // Nếu không có date range, dùng period type để tính kỳ trước
        return match ($period) {
            'day' => [
                'from' => $currentFrom->copy()->subDay()->startOfDay(),
                'to' => $currentFrom->copy()->subDay()->endOfDay(),
            ],
            'week' => [
                'from' => $currentFrom->copy()->subWeek()->startOfWeek(),
                'to' => $currentFrom->copy()->subWeek()->endOfWeek(),
            ],
            'month' => [
                'from' => $currentFrom->copy()->subMonth()->startOfMonth(),
                'to' => $currentFrom->copy()->subMonth()->endOfMonth(),
            ],
            'quarter' => [
                'from' => $currentFrom->copy()->subQuarter()->startOfQuarter(),
                'to' => $currentFrom->copy()->subQuarter()->endOfQuarter(),
            ],
            'year' => [
                'from' => $currentFrom->copy()->subYear()->startOfYear(),
                'to' => $currentFrom->copy()->subYear()->endOfYear(),
            ],
            default => [
                'from' => $currentFrom->copy()->subDay()->startOfDay(),
                'to' => $currentFrom->copy()->subDay()->endOfDay(),
            ],
        };
    }

    /**
     * Lấy tất cả metrics cho một khoảng thời gian
     */
    protected function getMetricsForPeriod(Carbon $from, Carbon $to): array
    {
        return [
            'net_revenue' => $this->revenueService->calculateNetRevenue($from, $to),
            'gross_revenue' => $this->revenueService->calculateGrossRevenue($from, $to),
            'total_refunds' => $this->revenueService->calculateTotalRefunds($from, $to),
            'paid_bookings' => $this->bookingStatsService->countPaidBookings($from, $to),
            'cancelled_bookings' => $this->bookingStatsService->countCancelledBookings($from, $to),
            'total_bookings' => $this->bookingStatsService->countTotalBookings($from, $to),
            'cancellation_rate' => $this->bookingStatsService->calculateCancellationRate($from, $to),
        ];
    }

    /**
     * Tính toán % tăng trưởng
     */
    protected function calculateGrowth(array $current, array $previous): array
    {
        $growth = [];

        foreach ($current as $key => $currentValue) {
            $previousValue = $previous[$key] ?? 0;

            if ($previousValue == 0) {
                $growth[$key] = $currentValue > 0 ? 100 : 0;
            } else {
                $growth[$key] = round((($currentValue - $previousValue) / $previousValue) * 100, 2);
            }
        }

        return $growth;
    }
}

