<?php

namespace App\Services\Dashboard\Metrics;

use App\Models\Booking;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TopMetricsService
{
    /**
     * Lấy booking có giá trị cao nhất
     */
    public function getHighestValueBooking(?Carbon $fromDate = null, ?Carbon $toDate = null): ?array
    {
        $query = Booking::where('status', 'paid')
            ->with(['user:id,name,email'])
            ->orderBy('total_price', 'desc');

        $this->applyDateRange($query, $fromDate, $toDate);

        $booking = $query->first();

        if (!$booking) {
            return null;
        }

        return [
            'id' => $booking->id,
            'code' => $booking->code,
            'total_price' => (float) $booking->total_price,
            'passenger_name' => $booking->passenger_name,
            'passenger_phone' => $booking->passenger_phone,
            'created_at' => $booking->created_at->toIso8601String(),
            'user' => $booking->user ? [
                'id' => $booking->user->id,
                'name' => $booking->user->name,
                'email' => $booking->user->email,
            ] : null,
        ];
    }

    /**
     * Lấy ngày/tuần/tháng có doanh thu cao nhất
     */
    public function getHighestRevenuePeriod(
        string $period,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): ?array {
        $query = Payment::where('status', 'succeeded');

        $this->applyDateRange($query, $fromDate, $toDate, 'paid_at');

        if ($period === 'quarter') {
            $result = $query->select(
                    DB::raw("CONCAT(YEAR(paid_at), '-Q', QUARTER(paid_at)) as period"),
                    DB::raw('SUM(amount - COALESCE(refund_amount, 0)) as net_revenue'),
                    DB::raw('SUM(amount) as gross_revenue'),
                    DB::raw('COUNT(*) as payment_count')
                )
                ->groupBy('period')
                ->orderBy('net_revenue', 'desc')
                ->first();
        } else {
            $dateFormat = $this->getDateFormatForPeriod($period);

            $result = $query->select(
                    DB::raw("DATE_FORMAT(paid_at, '{$dateFormat}') as period"),
                    DB::raw('SUM(amount - COALESCE(refund_amount, 0)) as net_revenue'),
                    DB::raw('SUM(amount) as gross_revenue'),
                    DB::raw('COUNT(*) as payment_count')
                )
                ->groupBy('period')
                ->orderBy('net_revenue', 'desc')
                ->first();
        }

        if (!$result) {
            return null;
        }

        return [
            'period' => $result->period,
            'net_revenue' => (float) $result->net_revenue,
            'gross_revenue' => (float) $result->gross_revenue,
            'payment_count' => (int) $result->payment_count,
        ];
    }

    /**
     * Lấy phương thức thanh toán phổ biến nhất
     */
    public function getMostPopularPaymentMethod(?Carbon $fromDate = null, ?Carbon $toDate = null): ?array
    {
        $query = Payment::where('status', 'succeeded');

        $this->applyDateRange($query, $fromDate, $toDate, 'paid_at');

        $result = $query->select(
                'provider',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('provider')
            ->orderBy('count', 'desc')
            ->first();

        if (!$result) {
            return null;
        }

        $totalCount = Payment::where('status', 'succeeded')
            ->when($fromDate, fn($q) => $q->whereDate('paid_at', '>=', $fromDate))
            ->when($toDate, fn($q) => $q->whereDate('paid_at', '<=', $toDate))
            ->count();

        $percentage = $totalCount > 0 ? round(($result->count / $totalCount) * 100, 2) : 0;

        return [
            'provider' => $result->provider,
            'count' => (int) $result->count,
            'total_amount' => (float) $result->total_amount,
            'percentage' => $percentage,
        ];
    }

    /**
     * Lấy top N bookings có giá trị cao nhất
     */
    public function getTopValueBookings(
        int $limit = 10,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ): array {
        $query = Booking::where('status', 'paid')
            ->with(['user:id,name,email'])
            ->orderBy('total_price', 'desc')
            ->limit($limit);

        $this->applyDateRange($query, $fromDate, $toDate);

        return $query->get()->map(function ($booking) {
            return [
                'id' => $booking->id,
                'code' => $booking->code,
                'total_price' => (float) $booking->total_price,
                'passenger_name' => $booking->passenger_name,
                'passenger_phone' => $booking->passenger_phone,
                'created_at' => $booking->created_at->toIso8601String(),
                'user' => $booking->user ? [
                    'id' => $booking->user->id,
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                ] : null,
            ];
        })->toArray();
    }

    /**
     * Áp dụng date range filter cho query
     * Note: This method is used for both Booking and Payment queries
     * For Payment queries, use paid_at; for Booking queries, use created_at
     */
    protected function applyDateRange($query, ?Carbon $fromDate = null, ?Carbon $toDate = null, string $dateColumn = 'created_at'): void
    {
        if ($fromDate) {
            $query->whereDate($dateColumn, '>=', $fromDate);
        }

        if ($toDate) {
            $query->whereDate($dateColumn, '<=', $toDate);
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

