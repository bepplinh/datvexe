<?php

namespace App\Services\Admin\Revenue;

use App\Models\Payment;
use Carbon\Carbon;

/**
 * Service xử lý các tính toán doanh thu cơ bản
 */
class RevenueCalculator
{
    /**
     * Tính doanh thu từ payments (chính xác - có tính refund)
     * Doanh thu thực = Tổng payments thành công - Tổng refund_amount
     */
    public function calculateRevenue(Carbon $startDate, Carbon $endDate): float
    {
        // Tổng payments thành công
        $totalPaid = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->sum('amount');

        // Tổng refund_amount từ các payments thành công (refund có thể là partial)
        $totalRefunded = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->sum('refund_amount');

        return $totalPaid - $totalRefunded;
    }

    /**
     * Đếm số lượng booking đã thanh toán thành công
     * Đếm từ payments để nhất quán với cách tính revenue
     */
    public function getBookingCount(Carbon $startDate, Carbon $endDate): int
    {
        return Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->select('booking_id')
            ->distinct()
            ->count('booking_id');
    }

    /**
     * Tính % thay đổi giữa 2 giá trị
     */
    public function calculatePercentageChange(float $current, float $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return (($current - $previous) / $previous) * 100;
    }

    /**
     * Lấy khoảng thời gian theo period
     */
    public function getPeriodRange(Carbon $date, string $period): array
    {
        return match ($period) {
            'day' => [
                'start' => $date->copy()->startOfDay(),
                'end' => $date->copy()->endOfDay(),
            ],
            'week' => [
                'start' => $date->copy()->startOfWeek(),
                'end' => $date->copy()->endOfWeek(),
            ],
            'month' => [
                'start' => $date->copy()->startOfMonth(),
                'end' => $date->copy()->endOfMonth(),
            ],
            'quarter' => [
                'start' => $date->copy()->startOfQuarter(),
                'end' => $date->copy()->endOfQuarter(),
            ],
            'year' => [
                'start' => $date->copy()->startOfYear(),
                'end' => $date->copy()->endOfYear(),
            ],
            default => [
                'start' => $date->copy()->startOfDay(),
                'end' => $date->copy()->endOfDay(),
            ],
        };
    }

    /**
     * Lấy khoảng thời gian kỳ trước
     */
    public function getPreviousPeriodRange(Carbon $date, string $period): array
    {
        $previousDate = match ($period) {
            'day' => $date->copy()->subDay(),
            'week' => $date->copy()->subWeek(),
            'month' => $date->copy()->subMonth(),
            'quarter' => $date->copy()->subQuarter(),
            'year' => $date->copy()->subYear(),
            default => $date->copy()->subDay(),
        };

        return $this->getPeriodRange($previousDate, $period);
    }
}
