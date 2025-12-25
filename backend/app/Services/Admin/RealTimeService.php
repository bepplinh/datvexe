<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RealTimeService
{
    /**
     * Lấy metrics real-time
     */
    public function getRealTimeMetrics(): array
    {
        $today = Carbon::today();
        $now = Carbon::now();

        // Doanh thu hôm nay (real-time)
        $todayRevenue = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereDate('paid_at', $today)
            ->sum(DB::raw('amount - COALESCE(refund_amount, 0)'));

        // Số vé đang chờ thanh toán
        $pendingBookings = Booking::where('status', 'pending')
            ->where('created_at', '>=', $today)
            ->count();

        // Chuyến sắp khởi hành hôm nay (trong 24h tới)
        $upcomingTrips = Trip::whereBetween('departure_time', [$now, $now->copy()->addDay()])
            ->where('status', 'active')
            ->count();

        // Chuyến sắp hết chỗ (occupancy > 80%)
        $nearFullTrips = $this->getNearFullTrips($now, $now->copy()->addDay());

        // Thanh toán thất bại nhiều (trong 1 giờ qua)
        $recentFailedPayments = Payment::where('status', 'failed')
            ->where('created_at', '>=', $now->copy()->subHour())
            ->count();

        // Cảnh báo: thanh toán thất bại nhiều
        $paymentFailureWarning = $recentFailedPayments > 10;

        // Số vé đã bán hôm nay
        $todayBookings = Booking::where('status', 'paid')
            ->whereDate('paid_at', $today)
            ->count();

        // Doanh thu so với hôm qua cùng giờ
        $yesterdaySameTime = $now->copy()->subDay();
        $yesterdayRevenue = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [
                $yesterdaySameTime->copy()->startOfDay(),
                $yesterdaySameTime->copy()->setTime($now->hour, $now->minute, $now->second)
            ])
            ->sum(DB::raw('amount - COALESCE(refund_amount, 0)'));

        $revenueChange = $yesterdayRevenue > 0 
            ? (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100 
            : ($todayRevenue > 0 ? 100 : 0);

        return [
            'timestamp' => $now->format('Y-m-d H:i:s'),
            'today_revenue' => (float) $todayRevenue,
            'yesterday_same_time_revenue' => (float) $yesterdayRevenue,
            'revenue_change_percent' => round($revenueChange, 2),
            'today_bookings' => $todayBookings,
            'pending_bookings' => $pendingBookings,
            'upcoming_trips' => $upcomingTrips,
            'near_full_trips' => $nearFullTrips,
            'recent_failed_payments' => $recentFailedPayments,
            'warnings' => [
                'payment_failure' => $paymentFailureWarning,
                'near_full_trips' => count($nearFullTrips) > 0,
            ],
        ];
    }

    /**
     * Chuyến sắp hết chỗ (occupancy > 80%)
     */
    private function getNearFullTrips(Carbon $fromDate, Carbon $toDate): array
    {
        $trips = Trip::query()
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('buses', 'trips.bus_id', '=', 'buses.id')
            ->leftJoin('booking_legs', 'trips.id', '=', 'booking_legs.trip_id')
            ->leftJoin('booking_items', 'booking_legs.id', '=', 'booking_items.booking_leg_id')
            ->leftJoin('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->leftJoin('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->where('trips.status', 'active')
            ->whereNotNull('payments.paid_at')
            ->select(
                'trips.id as trip_id',
                'trips.departure_time',
                'routes.name as route_name',
                DB::raw('COUNT(DISTINCT booking_items.seat_id) as booked_seats'),
                DB::raw('(SELECT COUNT(*) FROM seats WHERE seats.bus_id = buses.id AND seats.active = 1) as total_seats')
            )
            ->groupBy('trips.id', 'trips.departure_time', 'routes.name', 'buses.id')
            ->havingRaw('(COUNT(DISTINCT booking_items.seat_id) / (SELECT COUNT(*) FROM seats WHERE seats.bus_id = buses.id AND seats.active = 1)) * 100 > 80')
            ->get()
            ->map(function ($trip) {
                $totalSeats = (int) $trip->total_seats;
                $bookedSeats = (int) $trip->booked_seats;
                $occupancyRate = $totalSeats > 0 ? ($bookedSeats / $totalSeats) * 100 : 0;

                return [
                    'trip_id' => $trip->trip_id,
                    'route_name' => $trip->route_name,
                    'departure_time' => $trip->departure_time ? Carbon::parse($trip->departure_time)->format('Y-m-d H:i:s') : null,
                    'booked_seats' => $bookedSeats,
                    'total_seats' => $totalSeats,
                    'available_seats' => $totalSeats - $bookedSeats,
                    'occupancy_rate' => round($occupancyRate, 2),
                ];
            })
            ->toArray();

        return $trips;
    }

    /**
     * Lấy doanh thu theo giờ hôm nay
     */
    public function getTodayRevenueByHour(): array
    {
        $today = Carbon::today();
        $data = [];

        $hourlyData = Payment::where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereDate('paid_at', $today)
            ->select(
                DB::raw('HOUR(paid_at) as hour'),
                DB::raw('SUM(amount - COALESCE(refund_amount, 0)) as revenue'),
                DB::raw('COUNT(DISTINCT booking_id) as booking_count')
            )
            ->groupBy(DB::raw('HOUR(paid_at)'))
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        for ($hour = 0; $hour < 24; $hour++) {
            $hourData = $hourlyData->get($hour);
            $data[] = [
                'hour' => $hour,
                'hour_label' => sprintf('%02d:00', $hour),
                'revenue' => $hourData ? (float) $hourData->revenue : 0,
                'booking_count' => $hourData ? (int) $hourData->booking_count : 0,
            ];
        }

        return $data;
    }

    /**
     * Lấy chuyến sắp khởi hành hôm nay
     */
    public function getUpcomingTripsToday(int $limit = 10): array
    {
        $now = Carbon::now();
        $endOfDay = Carbon::today()->endOfDay();

        $trips = Trip::query()
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('buses', 'trips.bus_id', '=', 'buses.id')
            ->leftJoin('booking_legs', 'trips.id', '=', 'booking_legs.trip_id')
            ->leftJoin('booking_items', 'booking_legs.id', '=', 'booking_items.booking_leg_id')
            ->leftJoin('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->leftJoin('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$now, $endOfDay])
            ->where('trips.status', 'active')
            ->whereNotNull('payments.paid_at')
            ->select(
                'trips.id as trip_id',
                'trips.departure_time',
                'routes.name as route_name',
                DB::raw('COUNT(DISTINCT booking_items.seat_id) as booked_seats'),
                DB::raw('(SELECT COUNT(*) FROM seats WHERE seats.bus_id = buses.id AND seats.active = 1) as total_seats')
            )
            ->groupBy('trips.id', 'trips.departure_time', 'routes.name', 'buses.id')
            ->orderBy('trips.departure_time')
            ->limit($limit)
            ->get()
            ->map(function ($trip) {
                $totalSeats = (int) $trip->total_seats;
                $bookedSeats = (int) $trip->booked_seats;
                $occupancyRate = $totalSeats > 0 ? ($bookedSeats / $totalSeats) * 100 : 0;

                return [
                    'trip_id' => $trip->trip_id,
                    'route_name' => $trip->route_name,
                    'departure_time' => $trip->departure_time ? Carbon::parse($trip->departure_time)->format('Y-m-d H:i:s') : null,
                    'booked_seats' => $bookedSeats,
                    'total_seats' => $totalSeats,
                    'available_seats' => $totalSeats - $bookedSeats,
                    'occupancy_rate' => round($occupancyRate, 2),
                ];
            })
            ->toArray();

        return $trips;
    }
}

