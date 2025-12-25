<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    /**
     * Thống kê booking tổng quan
     */
    public function getBookingStatistics(Carbon $fromDate, Carbon $toDate, ?string $status = null): array
    {
        $query = Booking::query()
            ->whereBetween('created_at', [$fromDate, $toDate]);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $totalBookings = $query->count();
        $paidBookings = Booking::where('status', 'paid')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->count();
        $pendingBookings = Booking::where('status', 'pending')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->count();
        $cancelledBookings = Booking::where('status', 'cancelled')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->count();

        // Tỷ lệ hủy vé
        $cancellationRate = $totalBookings > 0 
            ? ($cancelledBookings / $totalBookings) * 100 
            : 0;

        // Tỷ lệ chuyển đổi: pending → paid
        $conversionRate = ($pendingBookings + $paidBookings) > 0
            ? ($paidBookings / ($pendingBookings + $paidBookings)) * 100
            : 0;

        // Số vé trung bình mỗi booking
        $avgTicketsPerBooking = Booking::query()
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->join('booking_legs', 'bookings.id', '=', 'booking_legs.booking_id')
            ->join('booking_items', 'booking_legs.id', '=', 'booking_items.booking_leg_id')
            ->whereBetween('bookings.created_at', [$fromDate, $toDate])
            ->select(DB::raw('AVG(booking_count) as avg_tickets'))
            ->first();

        $avgTickets = $avgTicketsPerBooking 
            ? (float) Booking::query()
                ->whereBetween('created_at', [$fromDate, $toDate])
                ->withCount('legs')
                ->get()
                ->avg('legs_count')
            : 0;

        // Thời gian trung bình từ đặt đến thanh toán
        $avgPaymentTime = Payment::query()
            ->where('status', 'succeeded')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$fromDate, $toDate])
            ->join('bookings', 'payments.booking_id', '=', 'bookings.id')
            ->select(
                DB::raw('AVG(TIMESTAMPDIFF(MINUTE, bookings.created_at, payments.paid_at)) as avg_minutes')
            )
            ->first();

        $avgMinutes = $avgPaymentTime ? (float) $avgPaymentTime->avg_minutes : 0;

        return [
            'total_bookings' => $totalBookings,
            'paid_bookings' => $paidBookings,
            'pending_bookings' => $pendingBookings,
            'cancelled_bookings' => $cancelledBookings,
            'cancellation_rate' => round($cancellationRate, 2),
            'conversion_rate' => round($conversionRate, 2),
            'avg_tickets_per_booking' => round($avgTickets, 2),
            'avg_payment_time_minutes' => round($avgMinutes, 2),
            'avg_payment_time_hours' => round($avgMinutes / 60, 2),
        ];
    }

    /**
     * Top khách hàng theo số lượng vé hoặc doanh thu
     */
    public function getTopCustomers(
        Carbon $fromDate, 
        Carbon $toDate, 
        int $limit = 10, 
        string $sortBy = 'booking_count'
    ): Collection {
        $query = User::query()
            ->join('bookings', 'users.id', '=', 'bookings.user_id')
            ->join('payments', function ($join) {
                $join->on('bookings.id', '=', 'payments.booking_id')
                    ->where('payments.status', '=', 'succeeded');
            })
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'users.id',
                'users.username',
                'users.email',
                'users.phone',
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count'),
                DB::raw('SUM(payments.amount - COALESCE(payments.refund_amount, 0)) as revenue'),
                DB::raw('MAX(bookings.created_at) as last_booking_at')
            )
            ->groupBy('users.id', 'users.username', 'users.email', 'users.phone')
            ->limit($limit);

        if ($sortBy === 'revenue') {
            $query->orderByDesc('revenue');
        } else {
            $query->orderByDesc('booking_count');
        }

        return $query->get()->map(function ($item) {
            return [
                'user_id' => $item->id,
                'username' => $item->username,
                'email' => $item->email,
                'phone' => $item->phone,
                'booking_count' => (int) $item->booking_count,
                'revenue' => (float) $item->revenue,
                'last_booking_at' => $item->last_booking_at ? Carbon::parse($item->last_booking_at)->format('Y-m-d H:i:s') : null,
            ];
        });
    }

    /**
     * Phân tích khách hàng mới vs khách hàng quay lại
     */
    public function getCustomerSegmentation(Carbon $fromDate, Carbon $toDate): array
    {
        // Khách hàng mới: lần đầu đặt vé trong khoảng thời gian
        $newCustomers = User::query()
            ->join('bookings', 'users.id', '=', 'bookings.user_id')
            ->whereBetween('bookings.created_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->whereNotExists(function ($query) use ($fromDate) {
                $query->select(DB::raw(1))
                    ->from('bookings as b2')
                    ->whereColumn('b2.user_id', 'users.id')
                    ->where('b2.status', 'paid')
                    ->where('b2.created_at', '<', $fromDate);
            })
            ->select('users.id')
            ->distinct()
            ->count();

        // Khách hàng quay lại: đã đặt vé trước đó và đặt lại trong khoảng thời gian
        $returningCustomers = User::query()
            ->join('bookings', 'users.id', '=', 'bookings.user_id')
            ->whereBetween('bookings.created_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->whereExists(function ($query) use ($fromDate) {
                $query->select(DB::raw(1))
                    ->from('bookings as b2')
                    ->whereColumn('b2.user_id', 'users.id')
                    ->where('b2.status', 'paid')
                    ->where('b2.created_at', '<', $fromDate);
            })
            ->select('users.id')
            ->distinct()
            ->count();

        $totalCustomers = $newCustomers + $returningCustomers;

        return [
            'new_customers' => $newCustomers,
            'returning_customers' => $returningCustomers,
            'total_customers' => $totalCustomers,
            'new_customer_rate' => $totalCustomers > 0 ? round(($newCustomers / $totalCustomers) * 100, 2) : 0,
            'returning_customer_rate' => $totalCustomers > 0 ? round(($returningCustomers / $totalCustomers) * 100, 2) : 0,
        ];
    }

    /**
     * Phân bố khách hàng theo địa điểm
     */
    public function getCustomerDistributionByLocation(Carbon $fromDate, Carbon $toDate): Collection
    {
        // Lấy địa điểm từ origin_location_id hoặc destination_location_id của booking
        $originDistribution = Booking::query()
            ->join('locations', 'bookings.origin_location_id', '=', 'locations.id')
            ->whereBetween('bookings.created_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'locations.id',
                'locations.name',
                DB::raw('COUNT(DISTINCT bookings.user_id) as customer_count'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count')
            )
            ->groupBy('locations.id', 'locations.name')
            ->get();

        $destinationDistribution = Booking::query()
            ->join('locations', 'bookings.destination_location_id', '=', 'locations.id')
            ->whereBetween('bookings.created_at', [$fromDate, $toDate])
            ->where('bookings.status', 'paid')
            ->select(
                'locations.id',
                'locations.name',
                DB::raw('COUNT(DISTINCT bookings.user_id) as customer_count'),
                DB::raw('COUNT(DISTINCT bookings.id) as booking_count')
            )
            ->groupBy('locations.id', 'locations.name')
            ->get();

        // Merge và tổng hợp
        $combined = collect();
        
        foreach ($originDistribution as $item) {
            $combined->push([
                'location_id' => $item->id,
                'location_name' => $item->name,
                'customer_count' => (int) $item->customer_count,
                'booking_count' => (int) $item->booking_count,
                'type' => 'origin',
            ]);
        }

        foreach ($destinationDistribution as $item) {
            $existing = $combined->firstWhere('location_id', $item->id);
            if ($existing) {
                $existing['customer_count'] += (int) $item->customer_count;
                $existing['booking_count'] += (int) $item->booking_count;
            } else {
                $combined->push([
                    'location_id' => $item->id,
                    'location_name' => $item->name,
                    'customer_count' => (int) $item->customer_count,
                    'booking_count' => (int) $item->booking_count,
                    'type' => 'destination',
                ]);
            }
        }

        return $combined->sortByDesc('customer_count')->values();
    }

    /**
     * Lịch sử đặt vé của từng khách hàng
     */
    public function getCustomerBookingHistory(int $userId, ?Carbon $fromDate = null, ?Carbon $toDate = null): Collection
    {
        $query = Booking::query()
            ->where('user_id', $userId)
            ->with(['legs.trip.route', 'payments'])
            ->orderByDesc('created_at');

        if ($fromDate) {
            $query->where('created_at', '>=', $fromDate);
        }

        if ($toDate) {
            $query->where('created_at', '<=', $toDate);
        }

        return $query->get()->map(function ($booking) {
            $payment = $booking->payments()->where('status', 'succeeded')->first();
            
            return [
                'booking_id' => $booking->id,
                'booking_code' => $booking->code,
                'status' => $booking->status,
                'total_price' => (float) $booking->total_price,
                'discount_amount' => (float) $booking->discount_amount,
                'payment_amount' => $payment ? (float) ($payment->amount - ($payment->refund_amount ?? 0)) : 0,
                'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
                'paid_at' => $booking->paid_at ? $booking->paid_at->format('Y-m-d H:i:s') : null,
                'legs_count' => $booking->legs->count(),
                'routes' => $booking->legs->map(function ($leg) {
                    return $leg->trip->route->name ?? 'N/A';
                })->unique()->values()->toArray(),
            ];
        });
    }
}

