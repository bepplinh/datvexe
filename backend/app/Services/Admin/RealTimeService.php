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

        return [
            'timestamp' => $now->format('Y-m-d H:i:s'),
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
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->where('trips.status', 'active')
            ->select(
                'trips.id as trip_id',
                'trips.departure_time',
                'trips.bus_id',
                'routes.name as route_name',
                DB::raw('(SELECT COUNT(*) FROM seats WHERE seats.bus_id = trips.bus_id AND seats.active = 1) as total_seats')
            )
            ->get()
            ->map(function ($trip) {
                // Đếm số ghế đã đặt (chỉ tính các booking đã thanh toán)
                $bookedSeats = (int) DB::selectOne(
                    "SELECT COUNT(DISTINCT booking_items.seat_id) as count
                     FROM booking_items
                     INNER JOIN booking_legs ON booking_items.booking_leg_id = booking_legs.id
                     INNER JOIN bookings ON booking_legs.booking_id = bookings.id
                     INNER JOIN payments ON bookings.id = payments.booking_id
                     WHERE booking_legs.trip_id = ?
                     AND booking_items.seat_id IS NOT NULL
                     AND payments.status = 'succeeded'
                     AND payments.paid_at IS NOT NULL",
                    [$trip->trip_id]
                )->count ?? 0;

                $totalSeats = (int) $trip->total_seats;
                $occupancyRate = $totalSeats > 0 ? ($bookedSeats / $totalSeats) * 100 : 0;

                // Chỉ trả về chuyến có tỷ lệ lấp đầy > 80%
                if ($occupancyRate <= 80) {
                    return null;
                }

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
            ->filter() // Loại bỏ các giá trị null
            ->values() // Reset keys
            ->toArray();

        return $trips;
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
            ->whereBetween('trips.departure_time', [$now, $endOfDay])
            ->where('trips.status', 'active')
            ->select(
                'trips.id as trip_id',
                'trips.departure_time',
                'routes.name as route_name',
                'buses.id as bus_id',
                DB::raw('(SELECT COUNT(*) FROM seats WHERE seats.bus_id = buses.id AND seats.active = 1) as total_seats')
            )
            ->orderBy('trips.departure_time')
            ->limit($limit)
            ->get()
            ->map(function ($trip) {
                // Đếm số ghế đã đặt (chỉ tính các booking đã thanh toán)
                $bookedSeats = (int) DB::selectOne(
                    "SELECT COUNT(DISTINCT booking_items.seat_id) as count
                     FROM booking_items
                     INNER JOIN booking_legs ON booking_items.booking_leg_id = booking_legs.id
                     INNER JOIN bookings ON booking_legs.booking_id = bookings.id
                     INNER JOIN payments ON bookings.id = payments.booking_id
                     WHERE booking_legs.trip_id = ?
                     AND booking_items.seat_id IS NOT NULL
                     AND payments.status = 'succeeded'
                     AND payments.paid_at IS NOT NULL",
                    [$trip->trip_id]
                )->count ?? 0;

                $totalSeats = (int) $trip->total_seats;
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
