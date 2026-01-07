<?php

namespace App\Services\Dashboard\Booking;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    /**
     * Đếm số lượng bookings (status='paid')
     */
    public function countPaidBookings(?Carbon $fromDate = null, ?Carbon $toDate = null): int
    {
        $query = Booking::where('status', 'paid');

        $this->applyDateRange($query, $fromDate, $toDate);

        return $query->count();
    }

    /**
     * Đếm số lượng bookings đã hủy (status='cancelled')
     */
    public function countCancelledBookings(?Carbon $fromDate = null, ?Carbon $toDate = null): int
    {
        $query = Booking::where('status', 'cancelled');

        $this->applyDateRange($query, $fromDate, $toDate);

        return $query->count();
    }

    /**
     * Đếm tổng số bookings
     */
    public function countTotalBookings(?Carbon $fromDate = null, ?Carbon $toDate = null): int
    {
        $query = Booking::query();

        $this->applyDateRange($query, $fromDate, $toDate);

        return $query->count();
    }

    /**
     * Tính tỷ lệ hủy: (cancelled / total) * 100%
     */
    public function calculateCancellationRate(?Carbon $fromDate = null, ?Carbon $toDate = null): float
    {
        $total = $this->countTotalBookings($fromDate, $toDate);

        if ($total === 0) {
            return 0.0;
        }

        $cancelled = $this->countCancelledBookings($fromDate, $toDate);

        return round(($cancelled / $total) * 100, 2);
    }

    /**
     * Lấy thống kê bookings theo khoảng thời gian
     */
    public function getBookingStatsByPeriod(
        string $period,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): array {
        $query = Booking::query();

        $this->applyDateRange($query, $fromDate, $toDate);

        if ($period === 'quarter') {
            return $query->select(
                    DB::raw("CONCAT(YEAR(created_at), '-Q', QUARTER(created_at)) as period"),
                    DB::raw("SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count"),
                    DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count"),
                    DB::raw('COUNT(*) as total_count')
                )
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->map(function ($item) {
                    $total = (int) $item->total_count;
                    $cancelled = (int) $item->cancelled_count;
                    $cancellationRate = $total > 0 ? round(($cancelled / $total) * 100, 2) : 0;

                    return [
                        'period' => $item->period,
                        'paid_count' => (int) $item->paid_count,
                        'cancelled_count' => $cancelled,
                        'total_count' => $total,
                        'cancellation_rate' => $cancellationRate,
                    ];
                })
                ->toArray();
        }

        $dateFormat = $this->getDateFormatForPeriod($period);

        return $query->select(
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
                DB::raw("SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count"),
                DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count"),
                DB::raw('COUNT(*) as total_count')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) {
                $total = (int) $item->total_count;
                $cancelled = (int) $item->cancelled_count;
                $cancellationRate = $total > 0 ? round(($cancelled / $total) * 100, 2) : 0;

                return [
                    'period' => $item->period,
                    'paid_count' => (int) $item->paid_count,
                    'cancelled_count' => $cancelled,
                    'total_count' => $total,
                    'cancellation_rate' => $cancellationRate,
                ];
            })
            ->toArray();
    }

    /**
     * Áp dụng date range filter cho query
     */
    protected function applyDateRange($query, ?Carbon $fromDate = null, ?Carbon $toDate = null): void
    {
        if ($fromDate) {
            $query->whereDate('created_at', '>=', $fromDate);
        }

        if ($toDate) {
            $query->whereDate('created_at', '<=', $toDate);
        }
    }

    /**
     * Lấy date format SQL theo period
     */
    protected function getDateFormatForPeriod(string $period): string
    {
        return match ($period) {
            'day' => '%Y-%m-%d',
            'week' => '%Y-%u',
            'month' => '%Y-%m',
            'year' => '%Y',
            default => '%Y-%m-%d',
        };
    }
}

