<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\Payment;
use App\Services\Admin\RevenueService;
use App\Services\Admin\StatisticsService;
use App\Services\Admin\FinancialService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ExportService
{
    public function __construct(
        private RevenueService $revenueService,
        private StatisticsService $statisticsService,
        private FinancialService $financialService
    ) {}

    /**
     * Export dữ liệu doanh thu
     */
    public function exportRevenue(Carbon $fromDate, Carbon $toDate, string $period = 'day'): array
    {
        $trendData = $this->revenueService->getTrendData($fromDate, $toDate, $period);
        $topRoutes = $this->revenueService->getTopRoutes($fromDate, $toDate, 100);
        $topTrips = $this->revenueService->getTopTrips($fromDate, $toDate, 100);

        return [
            'type' => 'revenue',
            'from_date' => $fromDate->format('Y-m-d'),
            'to_date' => $toDate->format('Y-m-d'),
            'period' => $period,
            'trend_data' => $trendData->toArray(),
            'top_routes' => $topRoutes->toArray(),
            'top_trips' => $topTrips->toArray(),
            'revenue_by_route' => $this->revenueService->getRevenueByRoute($fromDate, $toDate)->toArray(),
            'revenue_by_bus_type' => $this->revenueService->getRevenueByBusType($fromDate, $toDate)->toArray(),
            'revenue_by_payment_method' => $this->revenueService->getRevenueByPaymentMethod($fromDate, $toDate)->toArray(),
            'revenue_by_source' => $this->revenueService->getRevenueBySource($fromDate, $toDate)->toArray(),
            'revenue_by_hour' => $this->revenueService->getRevenueByHour($fromDate, $toDate)->toArray(),
        ];
    }

    /**
     * Export danh sách bookings
     */
    public function exportBookings(Carbon $fromDate, Carbon $toDate, ?string $status = null): array
    {
        $query = Booking::query()
            ->with(['user', 'legs.trip.route', 'payments'])
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->orderByDesc('created_at');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $bookings = $query->get()->map(function ($booking) {
            $payment = $booking->payments()->where('status', 'succeeded')->first();
            
            return [
                'booking_id' => $booking->id,
                'booking_code' => $booking->code,
                'user_name' => $booking->user->username ?? 'N/A',
                'user_email' => $booking->user->email ?? 'N/A',
                'user_phone' => $booking->user->phone ?? 'N/A',
                'passenger_name' => $booking->passenger_name,
                'passenger_phone' => $booking->passenger_phone,
                'passenger_email' => $booking->passenger_email,
                'status' => $booking->status,
                'subtotal_price' => (float) $booking->subtotal_price,
                'discount_amount' => (float) $booking->discount_amount,
                'total_price' => (float) $booking->total_price,
                'payment_provider' => $booking->payment_provider,
                'source' => $booking->source,
                'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
                'paid_at' => $booking->paid_at ? $booking->paid_at->format('Y-m-d H:i:s') : null,
                'cancelled_at' => $booking->cancelled_at ? $booking->cancelled_at->format('Y-m-d H:i:s') : null,
                'payment_amount' => $payment ? (float) ($payment->amount - ($payment->refund_amount ?? 0)) : 0,
                'payment_fee' => $payment ? (float) ($payment->fee ?? 0) : 0,
                'payment_refund' => $payment ? (float) ($payment->refund_amount ?? 0) : 0,
                'routes' => $booking->legs->map(function ($leg) {
                    return $leg->trip->route->name ?? 'N/A';
                })->unique()->values()->toArray(),
                'legs_count' => $booking->legs->count(),
            ];
        });

        return [
            'type' => 'bookings',
            'from_date' => $fromDate->format('Y-m-d'),
            'to_date' => $toDate->format('Y-m-d'),
            'status' => $status ?? 'all',
            'total_count' => $bookings->count(),
            'bookings' => $bookings->toArray(),
        ];
    }

    /**
     * Export danh sách payments
     */
    public function exportPayments(Carbon $fromDate, Carbon $toDate): array
    {
        $payments = Payment::query()
            ->with(['booking.user', 'booking.legs.trip.route'])
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($payment) {
                return [
                    'payment_id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                    'booking_code' => $payment->booking->code ?? 'N/A',
                    'user_name' => $payment->booking->user->username ?? 'N/A',
                    'user_email' => $payment->booking->user->email ?? 'N/A',
                    'amount' => (float) $payment->amount,
                    'fee' => (float) $payment->fee,
                    'refund_amount' => (float) $payment->refund_amount,
                    'currency' => $payment->currency,
                    'provider' => $payment->provider,
                    'provider_txn_id' => $payment->provider_txn_id,
                    'status' => $payment->status,
                    'failure_code' => $payment->failure_code,
                    'failure_message' => $payment->failure_message,
                    'created_at' => $payment->created_at->format('Y-m-d H:i:s'),
                    'paid_at' => $payment->paid_at ? $payment->paid_at->format('Y-m-d H:i:s') : null,
                    'refunded_at' => $payment->refunded_at ? $payment->refunded_at->format('Y-m-d H:i:s') : null,
                ];
            });

        return [
            'type' => 'payments',
            'from_date' => $fromDate->format('Y-m-d'),
            'to_date' => $toDate->format('Y-m-d'),
            'total_count' => $payments->count(),
            'payments' => $payments->toArray(),
        ];
    }

    /**
     * Export báo cáo tài chính
     */
    public function exportFinancial(Carbon $fromDate, Carbon $toDate, string $period = 'day'): array
    {
        $paymentReport = $this->financialService->getPaymentReport($fromDate, $toDate);
        $couponAnalysis = $this->financialService->getCouponAnalysis($fromDate, $toDate);
        $topCoupons = $this->financialService->getTopCoupons($fromDate, $toDate, 50);
        $financialByPeriod = $this->financialService->getFinancialReportByPeriod($fromDate, $toDate, $period);

        return [
            'type' => 'financial',
            'from_date' => $fromDate->format('Y-m-d'),
            'to_date' => $toDate->format('Y-m-d'),
            'period' => $period,
            'summary' => [
                'payment_report' => $paymentReport,
                'coupon_analysis' => $couponAnalysis,
            ],
            'top_coupons' => $topCoupons->toArray(),
            'financial_by_period' => $financialByPeriod->toArray(),
        ];
    }

    /**
     * Export tổng hợp (tất cả dữ liệu)
     */
    public function exportComprehensive(Carbon $fromDate, Carbon $toDate, string $period = 'day'): array
    {
        return [
            'type' => 'comprehensive',
            'from_date' => $fromDate->format('Y-m-d'),
            'to_date' => $toDate->format('Y-m-d'),
            'period' => $period,
            'exported_at' => Carbon::now()->format('Y-m-d H:i:s'),
            'revenue' => $this->exportRevenue($fromDate, $toDate, $period),
            'bookings' => $this->exportBookings($fromDate, $toDate),
            'payments' => $this->exportPayments($fromDate, $toDate),
            'financial' => $this->exportFinancial($fromDate, $toDate, $period),
            'statistics' => [
                'booking_statistics' => $this->statisticsService->getBookingStatistics($fromDate, $toDate),
                'customer_segmentation' => $this->statisticsService->getCustomerSegmentation($fromDate, $toDate),
            ],
        ];
    }
}

