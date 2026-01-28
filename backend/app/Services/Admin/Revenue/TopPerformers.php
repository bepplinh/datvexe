<?php

namespace App\Services\Admin\Revenue;

use App\Models\BookingLeg;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service lấy top performers (routes, trips, customers)
 */
class TopPerformers
{
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
     * Lấy top khách hàng chi tiêu nhiều nhất
     */
    public function getTopCustomers(Carbon $fromDate, Carbon $toDate, int $limit = 10): Collection
    {
        return DB::table('bookings')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->join('users', 'bookings.user_id', '=', 'users.id')
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as total_spent'),
                DB::raw('COUNT(DISTINCT bookings.id) as total_bookings')
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
                    'phone' => $item->phone,
                    'total_spent' => (float) $item->total_spent,
                    'total_bookings' => (int) $item->total_bookings,
                ];
            });
    }
}
