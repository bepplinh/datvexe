<?php

namespace App\Services\Dashboard\Revenue;

use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RevenueService
{
    /**
     * Tính doanh thu thuần (net revenue)
     * Tổng payment.amount (status='succeeded') - payment.refund_amount
     */
    public function calculateNetRevenue(?Carbon $fromDate = null, ?Carbon $toDate = null): float
    {
        $query = Payment::where('status', 'succeeded');

        $this->applyDateRange($query, $fromDate, $toDate);

        return (float) $query->selectRaw('COALESCE(SUM(amount - COALESCE(refund_amount, 0)), 0) as net_revenue')
            ->value('net_revenue') ?? 0;
    }

    /**
     * Tính doanh thu gộp (gross revenue)
     * Tổng payment.amount (status='succeeded')
     */
    public function calculateGrossRevenue(?Carbon $fromDate = null, ?Carbon $toDate = null): float
    {
        $query = Payment::where('status', 'succeeded');

        $this->applyDateRange($query, $fromDate, $toDate);

        return (float) $query->sum('amount') ?? 0;
    }

    /**
     * Tính tổng hoàn tiền
     * Tổng payment.refund_amount
     */
    public function calculateTotalRefunds(?Carbon $fromDate = null, ?Carbon $toDate = null): float
    {
        $query = Payment::where('status', 'succeeded')
            ->whereNotNull('refund_amount')
            ->where('refund_amount', '>', 0);

        $this->applyDateRange($query, $fromDate, $toDate);

        return (float) $query->sum('refund_amount') ?? 0;
    }

    /**
     * Lấy doanh thu theo phương thức thanh toán
     */
    public function getRevenueByPaymentMethod(?Carbon $fromDate = null, ?Carbon $toDate = null): array
    {
        $query = Payment::where('status', 'succeeded');

        $this->applyDateRange($query, $fromDate, $toDate);

        return $query->select('provider', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as count'))
            ->groupBy('provider')
            ->get()
            ->map(function ($item) {
                return [
                    'provider' => $item->provider,
                    'total_amount' => (float) $item->total_amount,
                    'count' => (int) $item->count,
                ];
            })
            ->toArray();
    }

    /**
     * Lấy doanh thu theo khoảng thời gian (group by period)
     */
    public function getRevenueByPeriod(
        string $period,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): array {
        $query = Payment::where('status', 'succeeded');

        $this->applyDateRange($query, $fromDate, $toDate);

        if ($period === 'quarter') {
            return $query->select(
                DB::raw("CONCAT(YEAR(paid_at), '-Q', QUARTER(paid_at)) as period"),
                DB::raw('SUM(amount) as gross_revenue'),
                DB::raw('SUM(amount - COALESCE(refund_amount, 0)) as net_revenue'),
                DB::raw('SUM(COALESCE(refund_amount, 0)) as total_refunds'),
                DB::raw('COUNT(*) as payment_count')
            )
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->map(function ($item) {
                    return [
                        'period' => $item->period,
                        'gross_revenue' => (float) $item->gross_revenue,
                        'net_revenue' => (float) $item->net_revenue,
                        'total_refunds' => (float) $item->total_refunds,
                        'payment_count' => (int) $item->payment_count,
                    ];
                })
                ->toArray();
        }

        $dateFormat = $this->getDateFormatForPeriod($period);

        return $query->select(
            DB::raw("DATE_FORMAT(paid_at, '{$dateFormat}') as period"),
            DB::raw('SUM(amount) as gross_revenue'),
            DB::raw('SUM(amount - COALESCE(refund_amount, 0)) as net_revenue'),
            DB::raw('SUM(COALESCE(refund_amount, 0)) as total_refunds'),
            DB::raw('COUNT(*) as payment_count')
        )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) {
                return [
                    'period' => $item->period,
                    'gross_revenue' => (float) $item->gross_revenue,
                    'net_revenue' => (float) $item->net_revenue,
                    'total_refunds' => (float) $item->total_refunds,
                    'payment_count' => (int) $item->payment_count,
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
            $query->whereDate('paid_at', '>=', $fromDate);
        }

        if ($toDate) {
            $query->whereDate('paid_at', '<=', $toDate);
        }
    }

    /**
     * Lấy date format SQL theo period
     */
    protected function getDateFormatForPeriod(string $period): string
    {
        return match ($period) {
            'day' => '%Y-%m-%d',
            'week' => '%Y-%u', // Week number
            'month' => '%Y-%m',
            'year' => '%Y',
            default => '%Y-%m-%d',
        };
    }
}
