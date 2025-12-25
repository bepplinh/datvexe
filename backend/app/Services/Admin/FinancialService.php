<?php

namespace App\Services\Admin;

use App\Models\Payment;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FinancialService
{
    /**
     * Báo cáo thanh toán tổng quan
     */
    public function getPaymentReport(Carbon $fromDate, Carbon $toDate): array
    {
        // Tổng doanh thu (từ payments succeeded)
        $totalRevenue = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->sum('amount');

        // Tổng phí giao dịch
        $totalFee = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->sum('fee');

        // Tổng hoàn tiền
        $totalRefund = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->sum('refund_amount');

        // Doanh thu thực tế = doanh thu - phí - hoàn tiền
        $actualRevenue = $totalRevenue - $totalRefund;

        // Tỷ lệ thanh toán thành công vs thất bại
        $succeededCount = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->count();

        $failedCount = Payment::where('status', 'failed')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->count();

        $totalAttempts = $succeededCount + $failedCount;
        $successRate = $totalAttempts > 0 ? ($succeededCount / $totalAttempts) * 100 : 0;
        $failureRate = $totalAttempts > 0 ? ($failedCount / $totalAttempts) * 100 : 0;

        return [
            'total_revenue' => (float) $totalRevenue,
            'total_fee' => (float) $totalFee,
            'total_refund' => (float) $totalRefund,
            'actual_revenue' => (float) $actualRevenue,
            'succeeded_count' => $succeededCount,
            'failed_count' => $failedCount,
            'total_attempts' => $totalAttempts,
            'success_rate' => round($successRate, 2),
            'failure_rate' => round($failureRate, 2),
        ];
    }

    /**
     * Phân tích coupon/khuyến mãi
     */
    public function getCouponAnalysis(Carbon $fromDate, Carbon $toDate): array
    {
        // Tổng số coupon đã sử dụng
        $totalCouponsUsed = CouponUsage::whereBetween('used_at', [$fromDate, $toDate])
            ->count();

        // Tổng giá trị giảm giá
        $totalDiscount = Booking::whereNotNull('coupon_id')
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->sum('discount_amount');

        // Tỷ lệ sử dụng coupon
        $totalPaidBookings = Booking::where('status', 'paid')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->count();

        $couponUsageRate = $totalPaidBookings > 0 
            ? ($totalCouponsUsed / $totalPaidBookings) * 100 
            : 0;

        return [
            'total_coupons_used' => $totalCouponsUsed,
            'total_discount_amount' => (float) $totalDiscount,
            'total_paid_bookings' => $totalPaidBookings,
            'coupon_usage_rate' => round($couponUsageRate, 2),
        ];
    }

    /**
     * Top coupon hiệu quả nhất
     */
    public function getTopCoupons(Carbon $fromDate, Carbon $toDate, int $limit = 10): Collection
    {
        return Coupon::query()
            ->join('coupon_usages', 'coupons.id', '=', 'coupon_usages.coupon_id')
            ->join('bookings', function ($join) {
                $join->on('coupon_usages.booking_id', '=', 'bookings.id')
                    ->where('bookings.status', '=', 'paid');
            })
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('coupon_usages.used_at', [$fromDate, $toDate])
            ->whereNotNull('payments.paid_at')
            ->select(
                'coupons.id',
                'coupons.code',
                'coupons.discount_type',
                'coupons.discount_value',
                'coupons.description',
                DB::raw('COUNT(DISTINCT coupon_usages.id) as usage_count'),
                DB::raw('SUM(bookings.discount_amount) as total_discount'),
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as total_revenue')
            )
            ->groupBy(
                'coupons.id',
                'coupons.code',
                'coupons.discount_type',
                'coupons.discount_value',
                'coupons.description'
            )
            ->orderByDesc('usage_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'coupon_id' => $item->id,
                    'coupon_code' => $item->code,
                    'discount_type' => $item->discount_type,
                    'discount_value' => (float) $item->discount_value,
                    'description' => $item->description,
                    'usage_count' => (int) $item->usage_count,
                    'total_discount' => (float) $item->total_discount,
                    'total_revenue' => (float) $item->total_revenue,
                ];
            });
    }

    /**
     * Báo cáo tài chính chi tiết theo period
     */
    public function getFinancialReportByPeriod(Carbon $fromDate, Carbon $toDate, string $period): Collection
    {
        $data = collect();
        $current = $fromDate->copy();

        while ($current <= $toDate) {
            $range = $this->getPeriodRange($current, $period);
            $report = $this->getPaymentReport($range['start'], $range['end']);
            $couponAnalysis = $this->getCouponAnalysis($range['start'], $range['end']);

            $label = $this->getPeriodLabel($current, $period);

            $data->push([
                'label' => $label,
                'date' => $range['start']->format('Y-m-d'),
                'period_start' => $range['start']->format('Y-m-d H:i:s'),
                'period_end' => $range['end']->format('Y-m-d H:i:s'),
                'total_revenue' => $report['total_revenue'],
                'total_fee' => $report['total_fee'],
                'total_refund' => $report['total_refund'],
                'actual_revenue' => $report['actual_revenue'],
                'success_rate' => $report['success_rate'],
                'total_coupons_used' => $couponAnalysis['total_coupons_used'],
                'total_discount_amount' => $couponAnalysis['total_discount_amount'],
                'coupon_usage_rate' => $couponAnalysis['coupon_usage_rate'],
            ]);

            $current = $this->incrementDateByPeriod($current, $period);
        }

        return $data;
    }

    /**
     * Lấy khoảng thời gian theo period
     */
    private function getPeriodRange(Carbon $date, string $period): array
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
     * Lấy label cho period
     */
    private function getPeriodLabel(Carbon $date, string $period): string
    {
        return match ($period) {
            'day' => $date->format('Y-m-d'),
            'week' => 'Tuần ' . $date->format('W/Y'),
            'month' => $date->format('Y-m'),
            'quarter' => 'Q' . $date->quarter . '/' . $date->year,
            'year' => $date->format('Y'),
            default => $date->format('Y-m-d'),
        };
    }

    /**
     * Tăng date theo period
     */
    private function incrementDateByPeriod(Carbon $date, string $period): Carbon
    {
        return match ($period) {
            'day' => $date->addDay(),
            'week' => $date->addWeek(),
            'month' => $date->addMonth(),
            'quarter' => $date->addQuarter(),
            'year' => $date->addYear(),
            default => $date->addDay(),
        };
    }
}

