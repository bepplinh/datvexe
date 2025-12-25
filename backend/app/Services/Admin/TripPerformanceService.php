<?php

namespace App\Services\Admin;

use App\Models\Trip;
use App\Models\BookingLeg;
use App\Models\BookingItem;
use App\Models\Payment;
use App\Models\Seat;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TripPerformanceService
{
    /**
     * Tỷ lệ lấp đầy (occupancy rate) theo chuyến/tuyến
     */
    public function getOccupancyRate(
        Carbon $fromDate, 
        Carbon $toDate, 
        ?int $routeId = null
    ): Collection {
        $query = Trip::query()
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
            ->whereNotNull('payments.paid_at')
            ->select(
                'trips.id as trip_id',
                'trips.route_id',
                'trips.departure_time',
                'routes.name as route_name',
                'buses.id as bus_id',
                DB::raw('COUNT(DISTINCT booking_items.seat_id) as booked_seats'),
                DB::raw('(SELECT COUNT(*) FROM seats WHERE seats.bus_id = buses.id AND seats.active = 1) as total_seats'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue')
            )
            ->groupBy(
                'trips.id',
                'trips.route_id',
                'trips.departure_time',
                'routes.name',
                'buses.id'
            );

        if ($routeId) {
            $query->where('trips.route_id', $routeId);
        }

        return $query->get()->map(function ($item) {
            $totalSeats = (int) $item->total_seats;
            $bookedSeats = (int) $item->booked_seats;
            $occupancyRate = $totalSeats > 0 ? ($bookedSeats / $totalSeats) * 100 : 0;

            return [
                'trip_id' => $item->trip_id,
                'route_id' => $item->route_id,
                'route_name' => $item->route_name,
                'departure_time' => $item->departure_time ? Carbon::parse($item->departure_time)->format('Y-m-d H:i:s') : null,
                'total_seats' => $totalSeats,
                'booked_seats' => $bookedSeats,
                'available_seats' => $totalSeats - $bookedSeats,
                'occupancy_rate' => round($occupancyRate, 2),
                'booking_count' => (int) $item->booking_count,
                'revenue' => (float) $item->revenue,
            ];
        })->sortByDesc('occupancy_rate')->values();
    }

    /**
     * Chuyến có tỷ lệ lấp đầy thấp (cần tối ưu)
     */
    public function getLowOccupancyTrips(
        Carbon $fromDate, 
        Carbon $toDate, 
        float $threshold = 50.0,
        int $limit = 20
    ): Collection {
        return $this->getOccupancyRate($fromDate, $toDate)
            ->filter(function ($trip) use ($threshold) {
                return $trip['occupancy_rate'] < $threshold;
            })
            ->take($limit)
            ->values();
    }

    /**
     * Doanh thu trung bình mỗi chuyến
     */
    public function getAverageRevenuePerTrip(Carbon $fromDate, Carbon $toDate): float
    {
        $result = Trip::query()
            ->join('booking_legs', 'trips.id', '=', 'booking_legs.trip_id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->whereNotNull('payments.paid_at')
            ->select(
                DB::raw('AVG(trip_revenue.revenue) as avg_revenue')
            )
            ->fromSub(function ($query) use ($fromDate, $toDate) {
                $query->select(
                    'trips.id',
                    DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue')
                )
                ->from('trips')
                ->join('booking_legs', 'trips.id', '=', 'booking_legs.trip_id')
                ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
                ->join('payments', function ($join) {
                    $join->on('bookings.id', '=', 'payments.booking_id')
                        ->where('payments.status', '=', 'succeeded');
                })
                ->whereBetween('trips.departure_time', [$fromDate, $toDate])
                ->whereNotNull('payments.paid_at')
                ->groupBy('trips.id')
                ->as('trip_revenue');
            }, 'trip_revenue')
            ->first();

        return $result && $result->avg_revenue ? (float) $result->avg_revenue : 0;
    }

    /**
     * Chuyến phổ biến nhất (theo số lượng vé)
     */
    public function getMostPopularTrips(
        Carbon $fromDate, 
        Carbon $toDate, 
        int $limit = 10
    ): Collection {
        return Trip::query()
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('booking_legs', 'trips.id', '=', 'booking_legs.trip_id')
            ->join('booking_items', 'booking_legs.id', '=', 'booking_items.booking_leg_id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->whereNotNull('payments.paid_at')
            ->select(
                'trips.id as trip_id',
                'trips.route_id',
                'trips.departure_time',
                'routes.name as route_name',
                DB::raw('COUNT(booking_items.id) as ticket_count'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue')
            )
            ->groupBy('trips.id', 'trips.route_id', 'trips.departure_time', 'routes.name')
            ->orderByDesc('ticket_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'trip_id' => $item->trip_id,
                    'route_id' => $item->route_id,
                    'route_name' => $item->route_name,
                    'departure_time' => $item->departure_time ? Carbon::parse($item->departure_time)->format('Y-m-d H:i:s') : null,
                    'ticket_count' => (int) $item->ticket_count,
                    'booking_count' => (int) $item->booking_count,
                    'revenue' => (float) $item->revenue,
                ];
            });
    }

    /**
     * Thời gian khởi hành phổ biến nhất
     */
    public function getPopularDepartureTimes(Carbon $fromDate, Carbon $toDate): Collection
    {
        $data = collect();
        
        // Lấy theo giờ
        $hourlyData = Trip::query()
            ->join('booking_legs', 'trips.id', '=', 'booking_legs.trip_id')
            ->join('booking_items', 'booking_legs.id', '=', 'booking_items.booking_leg_id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->whereNotNull('payments.paid_at')
            ->select(
                DB::raw('HOUR(trips.departure_time) as hour'),
                DB::raw('COUNT(booking_items.id) as ticket_count'),
                DB::raw('COUNT(DISTINCT trips.id) as trip_count'),
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue')
            )
            ->groupBy(DB::raw('HOUR(trips.departure_time)'))
            ->orderBy('hour')
            ->get();

        // Tạo đầy đủ 24 giờ
        for ($hour = 0; $hour < 24; $hour++) {
            $hourData = $hourlyData->firstWhere('hour', $hour);
            $data->push([
                'hour' => $hour,
                'hour_label' => sprintf('%02d:00', $hour),
                'ticket_count' => $hourData ? (int) $hourData->ticket_count : 0,
                'trip_count' => $hourData ? (int) $hourData->trip_count : 0,
                'revenue' => $hourData ? (float) $hourData->revenue : 0,
            ]);
        }

        return $data->sortByDesc('ticket_count')->values();
    }

    /**
     * Ghế được đặt nhiều nhất
     */
    public function getMostBookedSeats(Carbon $fromDate, Carbon $toDate, int $limit = 20): Collection
    {
        return BookingItem::query()
            ->join('booking_legs', 'booking_items.booking_leg_id', '=', 'booking_legs.id')
            ->join('trips', 'booking_legs.trip_id', '=', 'trips.id')
            ->join('seats', 'booking_items.seat_id', '=', 'seats.id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->whereNotNull('payments.paid_at')
            ->select(
                'seats.id as seat_id',
                'seats.seat_number',
                'seats.seat_type',
                'seats.deck',
                DB::raw('COUNT(booking_items.id) as booking_count'),
                DB::raw('SUM(booking_items.price) as total_revenue')
            )
            ->groupBy('seats.id', 'seats.seat_number', 'seats.seat_type', 'seats.deck')
            ->orderByDesc('booking_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'seat_id' => $item->seat_id,
                    'seat_number' => $item->seat_number,
                    'seat_type' => $item->seat_type,
                    'deck' => $item->deck,
                    'booking_count' => (int) $item->booking_count,
                    'total_revenue' => (float) $item->total_revenue,
                ];
            });
    }

    /**
     * Ghế ít được đặt (có thể điều chỉnh giá)
     */
    public function getLeastBookedSeats(Carbon $fromDate, Carbon $toDate, int $limit = 20): Collection
    {
        return BookingItem::query()
            ->join('booking_legs', 'booking_items.booking_leg_id', '=', 'booking_legs.id')
            ->join('trips', 'booking_legs.trip_id', '=', 'trips.id')
            ->join('seats', 'booking_items.seat_id', '=', 'seats.id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->whereNotNull('payments.paid_at')
            ->select(
                'seats.id as seat_id',
                'seats.seat_number',
                'seats.seat_type',
                'seats.deck',
                DB::raw('COUNT(booking_items.id) as booking_count'),
                DB::raw('SUM(booking_items.price) as total_revenue')
            )
            ->groupBy('seats.id', 'seats.seat_number', 'seats.seat_type', 'seats.deck')
            ->orderBy('booking_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'seat_id' => $item->seat_id,
                    'seat_number' => $item->seat_number,
                    'seat_type' => $item->seat_type,
                    'deck' => $item->deck,
                    'booking_count' => (int) $item->booking_count,
                    'total_revenue' => (float) $item->total_revenue,
                ];
            });
    }

    /**
     * Tỷ lệ sử dụng ghế theo loại
     */
    public function getSeatUsageByType(Carbon $fromDate, Carbon $toDate): Collection
    {
        // Tổng số ghế theo loại
        $totalSeatsByType = Seat::query()
            ->where('active', true)
            ->select(
                'seat_type',
                DB::raw('COUNT(*) as total_seats')
            )
            ->groupBy('seat_type')
            ->get()
            ->keyBy('seat_type');

        // Số ghế đã được đặt theo loại
        $bookedSeatsByType = BookingItem::query()
            ->join('booking_legs', 'booking_items.booking_leg_id', '=', 'booking_legs.id')
            ->join('trips', 'booking_legs.trip_id', '=', 'trips.id')
            ->join('seats', 'booking_items.seat_id', '=', 'seats.id')
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereBetween('trips.departure_time', [$fromDate, $toDate])
            ->whereNotNull('payments.paid_at')
            ->select(
                'seats.seat_type',
                DB::raw('COUNT(DISTINCT booking_items.seat_id) as booked_seats'),
                DB::raw('COUNT(booking_items.id) as booking_count'),
                DB::raw('SUM(booking_items.price) as total_revenue')
            )
            ->groupBy('seats.seat_type')
            ->get()
            ->keyBy('seat_type');

        $result = collect();
        
        foreach ($totalSeatsByType as $type => $totalData) {
            $bookedData = $bookedSeatsByType->get($type);
            $totalSeats = (int) $totalData->total_seats;
            $bookedSeats = $bookedData ? (int) $bookedData->booked_seats : 0;
            $usageRate = $totalSeats > 0 ? ($bookedSeats / $totalSeats) * 100 : 0;

            $result->push([
                'seat_type' => $type ?? 'unknown',
                'total_seats' => $totalSeats,
                'booked_seats' => $bookedSeats,
                'usage_rate' => round($usageRate, 2),
                'booking_count' => $bookedData ? (int) $bookedData->booking_count : 0,
                'total_revenue' => $bookedData ? (float) $bookedData->total_revenue : 0,
            ]);
        }

        return $result->sortByDesc('usage_rate')->values();
    }
}

