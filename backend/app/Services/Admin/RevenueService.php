<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\BookingLeg;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RevenueService
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
        $data = collect();
        $current = $fromDate->copy();

        while ($current <= $toDate) {
            $range = $this->getPeriodRange($current, $period);
            $revenue = $this->calculateRevenue($range['start'], $range['end']);
            $bookingCount = $this->getBookingCount($range['start'], $range['end']);

            $label = $this->getPeriodLabel($current, $period);

            $data->push([
                'label' => $label,
                'date' => $range['start']->format('Y-m-d'),
                'revenue' => $revenue,
                'booking_count' => $bookingCount,
            ]);

            // Tăng current theo period
            $current = $this->incrementDateByPeriod($current, $period);
        }

        return $data;
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

    /**
     * Lấy top tuyến đường có doanh thu cao nhất
     * Tính từ payments để chính xác (có trừ refund)
     */
    public function getTopRoutes(Carbon $fromDate, Carbon $toDate, int $limit = 10): Collection
    {
        return BookingLeg::query()
            ->join('trips', 'booking_legs.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'routes.id',
                'routes.name',
                'routes.from_city',
                'routes.to_city',
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('COUNT(booking_legs.id) as leg_count')
            )
            ->groupBy('routes.id', 'routes.name', 'routes.from_city', 'routes.to_city')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'route_id' => $item->id,
                    'route_name' => $item->name,
                    'from_city' => $item->from_city,
                    'to_city' => $item->to_city,
                    'revenue' => (float) $item->revenue,
                    'booking_count' => (int) $item->booking_count,
                    'leg_count' => (int) $item->leg_count,
                ];
            });
    }

    /**
     * Lấy top chuyến xe có doanh thu cao nhất
     * Tính từ payments để chính xác (có trừ refund)
     */
    public function getTopTrips(Carbon $fromDate, Carbon $toDate, int $limit = 10): Collection
    {
        return BookingLeg::query()
            ->join('trips', 'booking_legs.trip_id', '=', 'trips.id')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'trips.id',
                'trips.route_id',
                'trips.departure_time',
                'routes.name as route_name',
                'routes.from_city',
                'routes.to_city',
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('COUNT(booking_legs.id) as leg_count')
            )
            ->groupBy(
                'trips.id',
                'trips.route_id',
                'trips.departure_time',
                'routes.name',
                'routes.from_city',
                'routes.to_city'
            )
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                // Parse departure_time nếu là string hoặc Carbon instance
                $departureTime = null;
                if ($item->departure_time) {
                    if (is_string($item->departure_time)) {
                        $departureTime = Carbon::parse($item->departure_time)->format('Y-m-d H:i:s');
                    } elseif ($item->departure_time instanceof Carbon) {
                        $departureTime = $item->departure_time->format('Y-m-d H:i:s');
                    }
                }

                return [
                    'trip_id' => $item->id,
                    'route_id' => $item->route_id,
                    'route_name' => $item->route_name,
                    'from_city' => $item->from_city,
                    'to_city' => $item->to_city,
                    'departure_time' => $departureTime,
                    'revenue' => (float) $item->revenue,
                    'booking_count' => (int) $item->booking_count,
                    'leg_count' => (int) $item->leg_count,
                ];
            });
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

