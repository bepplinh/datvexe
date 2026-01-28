<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\BookingLeg;
use App\Services\Admin\Revenue\RevenueCalculator;
use App\Services\Admin\Revenue\TrendAnalyzer;
use App\Services\Admin\Revenue\TopPerformers;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RevenueService
{
    public function __construct(
        private RevenueCalculator $calculator,
        private TrendAnalyzer $trendAnalyzer,
        private TopPerformers $topPerformers
    ) {}
    /**
     * Tính doanh thu từ payments (chính xác - có tính refund)
     * Doanh thu thực = Tổng payments thành công - Tổng refund_amount
     */
    public function calculateRevenue(Carbon $startDate, Carbon $endDate): float
    {
        return $this->calculator->calculateRevenue($startDate, $endDate);
    }

    /**
     * Đếm số lượng booking đã thanh toán thành công
     * Đếm từ payments để nhất quán với cách tính revenue
     */
    public function getBookingCount(Carbon $startDate, Carbon $endDate): int
    {
        return $this->calculator->getBookingCount($startDate, $endDate);
    }

    /**
     * Lấy khoảng thời gian theo period
     */
    public function getPeriodRange(Carbon $date, string $period): array
    {
        return $this->calculator->getPeriodRange($date, $period);
    }

    /**
     * Lấy khoảng thời gian kỳ trước
     */
    public function getPreviousPeriodRange(Carbon $date, string $period): array
    {
        return $this->calculator->getPreviousPeriodRange($date, $period);
    }

    /**
     * Tính % thay đổi giữa 2 giá trị
     */
    public function calculatePercentageChange(float $current, float $previous): float
    {
        return $this->calculator->calculatePercentageChange($current, $previous);
    }

    /**
     * Lấy dữ liệu dashboard doanh thu
     */
    public function getDashboardData(Carbon $date, string $period): array
    {
        // Tính khoảng thời gian hiện tại
        $currentPeriod = $this->getPeriodRange($date, $period);
        $currentStart = $currentPeriod['start'];
        $currentEnd = $currentPeriod['end'];

        // Tính khoảng thời gian kỳ trước
        $previousPeriod = $this->getPreviousPeriodRange($date, $period);
        $previousStart = $previousPeriod['start'];
        $previousEnd = $previousPeriod['end'];

        // Doanh thu kỳ hiện tại
        $currentRevenue = $this->calculateRevenue($currentStart, $currentEnd);
        $currentBookingCount = $this->getBookingCount($currentStart, $currentEnd);

        // Doanh thu kỳ trước
        $previousRevenue = $this->calculateRevenue($previousStart, $previousEnd);
        $previousBookingCount = $this->getBookingCount($previousStart, $previousEnd);

        // Tính % thay đổi
        $revenueChange = $this->calculatePercentageChange($currentRevenue, $previousRevenue);
        $bookingChange = $this->calculatePercentageChange($currentBookingCount, $previousBookingCount);

        return [
            'current_period' => [
                'start' => $currentStart,
                'end' => $currentEnd,
                'revenue' => $currentRevenue,
                'booking_count' => $currentBookingCount,
            ],
            'previous_period' => [
                'start' => $previousStart,
                'end' => $previousEnd,
                'revenue' => $previousRevenue,
                'booking_count' => $previousBookingCount,
            ],
            'comparison' => [
                'revenue_change' => round($revenueChange, 2),
                'revenue_change_amount' => $currentRevenue - $previousRevenue,
                'booking_change' => round($bookingChange, 2),
                'booking_change_amount' => $currentBookingCount - $previousBookingCount,
            ],
        ];
    }

    /**
     * Lấy dữ liệu xu hướng doanh thu theo thời gian
     */
    public function getTrendData(Carbon $fromDate, Carbon $toDate, string $period): Collection
    {
        return $this->trendAnalyzer->getTrendData($fromDate, $toDate, $period);
    }

    /**
     * Lấy top tuyến đường có doanh thu cao nhất
     */
    public function getTopRoutes(Carbon $fromDate, Carbon $toDate, int $limit = 10): Collection
    {
        return $this->topPerformers->getTopRoutes($fromDate, $toDate, $limit);
    }

    /**
     * Lấy top chuyến xe có doanh thu cao nhất
     */
    public function getTopTrips(Carbon $fromDate, Carbon $toDate, int $limit = 10): Collection
    {
        return $this->topPerformers->getTopTrips($fromDate, $toDate, $limit);
    }

    /**
     * Phân tích doanh thu theo tuyến đường (from_city → to_city)
     */
    public function getRevenueByRoute(Carbon $fromDate, Carbon $toDate): Collection
    {
        return BookingLeg::query()
            ->join('trips', 'booking_legs.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->join('locations as from_location', 'routes.from_city', '=', 'from_location.id')
            ->join('locations as to_location', 'routes.to_city', '=', 'to_location.id')
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'routes.id as route_id',
                'routes.name as route_name',
                'from_location.name as from_city_name',
                'to_location.name as to_city_name',
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('COUNT(booking_legs.id) as leg_count')
            )
            ->groupBy('routes.id', 'routes.name', 'from_location.name', 'to_location.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(function ($item) {
                return [
                    'route_id' => $item->route_id,
                    'route_name' => $item->route_name,
                    'from_city_name' => $item->from_city_name,
                    'to_city_name' => $item->to_city_name,
                    'revenue' => (float) $item->revenue,
                    'booking_count' => (int) $item->booking_count,
                    'leg_count' => (int) $item->leg_count,
                ];
            });
    }

    /**
     * Phân tích doanh thu theo loại xe (bus_type)
     */
    public function getRevenueByBusType(Carbon $fromDate, Carbon $toDate): Collection
    {
        return BookingLeg::query()
            ->join('trips', 'booking_legs.trip_id', '=', 'trips.id')
            ->join('buses', 'trips.bus_id', '=', 'buses.id')
            ->join('type_buses', 'buses.type_bus_id', '=', 'type_buses.id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'type_buses.id as bus_type_id',
                'type_buses.name as bus_type_name',
                'type_buses.seat_count',
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('COUNT(DISTINCT trips.id) as trip_count')
            )
            ->groupBy('type_buses.id', 'type_buses.name', 'type_buses.seat_count')
            ->orderByDesc('revenue')
            ->get()
            ->map(function ($item) {
                return [
                    'bus_type_id' => $item->bus_type_id,
                    'bus_type_name' => $item->bus_type_name,
                    'seat_count' => (int) $item->seat_count,
                    'revenue' => (float) $item->revenue,
                    'booking_count' => (int) $item->booking_count,
                    'trip_count' => (int) $item->trip_count,
                ];
            });
    }

    /**
     * Phân tích doanh thu theo phương thức thanh toán (cash vs payos)
     */
    public function getRevenueByPaymentMethod(Carbon $fromDate, Carbon $toDate): Collection
    {
        return Payment::query()
            ->where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->select(
                'provider',
                DB::raw('SUM(amount - COALESCE(refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT booking_id) as booking_count'),
                DB::raw('SUM(fee) as total_fee'),
                DB::raw('SUM(COALESCE(refund_amount, 0)) as total_refund')
            )
            ->groupBy('provider')
            ->orderByDesc('revenue')
            ->get()
            ->map(function ($item) {
                return [
                    'payment_method' => $item->provider ?? 'unknown',
                    'revenue' => (float) $item->revenue,
                    'booking_count' => (int) $item->booking_count,
                    'total_fee' => (float) $item->total_fee,
                    'total_refund' => (float) $item->total_refund,
                ];
            });
    }

    /**
     * Phân tích doanh thu theo nguồn đặt (client vs admin)
     */
    public function getRevenueBySource(Carbon $fromDate, Carbon $toDate): Collection
    {
        return Booking::query()
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'bookings.source',
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count')
            )
            ->groupBy('bookings.source')
            ->orderByDesc('revenue')
            ->get()
            ->map(function ($item) {
                return [
                    'source' => $item->source ?? 'unknown',
                    'source_label' => $item->source === 'admin' ? 'Admin' : 'Client',
                    'revenue' => (float) $item->revenue,
                    'booking_count' => (int) $item->booking_count,
                ];
            });
    }

    /**
     * Phân tích doanh thu theo giờ trong ngày (peak hours)
     */
    public function getRevenueByHour(Carbon $fromDate, Carbon $toDate): Collection
    {
        $data = collect();
        
        // Lấy doanh thu theo giờ
        $hourlyData = Payment::query()
            ->where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->select(
                DB::raw('HOUR(paid_at) as hour'),
                DB::raw('SUM(amount - COALESCE(refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT booking_id) as booking_count')
            )
            ->groupBy(DB::raw('HOUR(paid_at)'))
            ->orderBy('hour')
            ->get();

        // Tạo đầy đủ 24 giờ
        for ($hour = 0; $hour < 24; $hour++) {
            $hourData = $hourlyData->firstWhere('hour', $hour);
            $data->push([
                'hour' => $hour,
                'hour_label' => sprintf('%02d:00', $hour),
                'revenue' => $hourData ? (float) $hourData->revenue : 0,
                'booking_count' => $hourData ? (int) $hourData->booking_count : 0,
            ]);
        }

        return $data;
    }

    /**
     * Lấy top khách hàng đặt vé nhiều nhất
     * Tính từ payments để chính xác (có trừ refund)
     */
    public function getTopCustomers(Carbon $fromDate, Carbon $toDate, int $limit = 10): Collection
    {
        return Booking::query()
            ->join('users', 'bookings.user_id', '=', 'users.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as total_spent'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('COUNT(DISTINCT payments.id) as payment_count')
            )
            ->groupBy('users.id', 'users.name', 'users.email', 'users.phone')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'user_id' => $item->id,
                    'name' => $item->name,
                    'email' => $item->email,
                    'phone_number' => $item->phone_number,
                    'total_spent' => (float) $item->total_spent,
                    'booking_count' => (int) $item->booking_count,
                    'payment_count' => (int) $item->payment_count,
                ];
            });
    }

    /**
     * Phân tích doanh thu chi tiết theo group_by
     */
    public function getDetailedAnalysis(Carbon $fromDate, Carbon $toDate, string $groupBy): Collection
    {
        return match ($groupBy) {
            'route' => $this->getRevenueByRoute($fromDate, $toDate),
            'bus_type' => $this->getRevenueByBusType($fromDate, $toDate),
            'payment_method' => $this->getRevenueByPaymentMethod($fromDate, $toDate),
            'source' => $this->getRevenueBySource($fromDate, $toDate),
            'hour' => $this->getRevenueByHour($fromDate, $toDate),
            default => collect(),
        };
    }
}

