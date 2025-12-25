<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rating;
use Illuminate\Http\Request;

class RatingAdminController extends Controller
{
    /**
     * Danh sách rating với bộ lọc cơ bản.
     */
    public function index(Request $request)
    {
        $query = Rating::query()
            ->with([
                'bookingLeg.pickupLocation:id,name',
                'bookingLeg.dropoffLocation:id,name',
                'user:id,name,email,phone',
            ]);

        // Lọc theo thời gian tạo
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        // Lọc theo điểm
        if ($request->filled('score_min')) {
            $query->where('score', '>=', (int) $request->input('score_min'));
        }
        if ($request->filled('score_max')) {
            $query->where('score', '<=', (int) $request->input('score_max'));
        }

        // Lọc theo route hoặc trip
        if ($request->filled('route_id')) {
            $query->whereHas('trip', fn($q) => $q->where('route_id', $request->input('route_id')));
        }
        if ($request->filled('trip_id')) {
            $query->where('trip_id', $request->input('trip_id'));
        }

        // Lọc có comment
        if ($request->boolean('has_comment')) {
            $query->whereNotNull('comment')->where('comment', '!=', '');
        }

        // Tìm kiếm
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                // Tìm trong comment
                $q->where('comment', 'like', "%{$search}%")
                    // Tìm theo tên user
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    // Tìm theo tên route
                    ->orWhereHas('trip.route', function ($routeQuery) use ($search) {
                        $routeQuery->where('name', 'like', "%{$search}%");
                    })
                    // Tìm theo tên location (pickup/dropoff)
                    ->orWhereHas('bookingLeg.pickupLocation', function ($locQuery) use ($search) {
                        $locQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('bookingLeg.dropoffLocation', function ($locQuery) use ($search) {
                        $locQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sort
        $sort = $request->input('sort', 'created_desc');
        if ($sort === 'score_asc') {
            $query->orderBy('score', 'asc');
        } elseif ($sort === 'score_desc') {
            $query->orderBy('score', 'desc');
        } else {
            // mặc định: mới nhất
            $query->orderBy('created_at', 'desc');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $ratings = $query->paginate($perPage);

        // Format response với thông tin location từ booking_leg
        $ratings->getCollection()->transform(function ($rating) {
            $bookingLeg = $rating->bookingLeg;
            $trip = $rating->trip;

            // Lấy từ_location_id và to_location_id từ trip_stations (route)
            $fromLocation = null;
            $toLocation = null;
            if ($trip && $trip->route && $trip->route->tripStations) {
                $firstStation = $trip->route->tripStations->first();
                if ($firstStation) {
                    $fromLocation = $firstStation->fromLocation;
                    $toLocation = $trip->route->tripStations->last()?->toLocation;
                }
            }

            return [
                'id' => $rating->id,
                'trip_id' => $rating->trip_id,
                'booking_leg_id' => $rating->booking_leg_id,
                'user_id' => $rating->user_id,
                'score' => $rating->score,
                'comment' => $rating->comment,
                'created_at' => $rating->created_at,
                'updated_at' => $rating->updated_at,

                // Thông tin từ booking_leg (điểm user thực sự đã đi)
                'pickup_location_id' => $bookingLeg?->pickup_location_id,
                'pickup_location' => $bookingLeg?->pickupLocation?->name,
                'dropoff_location_id' => $bookingLeg?->dropoff_location_id,
                'dropoff_location' => $bookingLeg?->dropoffLocation?->name,

                // Thông tin từ route (tuyến chính)
                'from_location_id' => $fromLocation?->id,
                'from_location' => $fromLocation?->name,
                'to_location_id' => $toLocation?->id,
                'to_location' => $toLocation?->name,

                // Thông tin trip
                'departure_time' => $trip?->departure_time,
                'route_name' => $trip?->route?->name,

                // Thông tin user
                'user' => $rating->user ? [
                    'id' => $rating->user->id,
                    'name' => $rating->user->name,
                    'email' => $rating->user->email,
                    'phone' => $rating->user->phone,
                ] : null,
            ];
        });

        return response()->json($ratings);
    }

    /**
     * Summary: điểm trung bình, số lượng, phân phối sao.
     */
    public function summary(Request $request)
    {
        $baseQuery = Rating::query();

        if ($request->filled('date_from')) {
            $baseQuery->whereDate('created_at', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $baseQuery->whereDate('created_at', '<=', $request->date('date_to'));
        }

        $avg = (float) $baseQuery->avg('score');
        $count = (int) $baseQuery->count();

        $distribution = Rating::selectRaw('score, COUNT(*) as total')
            ->groupBy('score')
            ->orderBy('score')
            ->pluck('total', 'score');

        // Chuẩn hóa đủ 1..5
        $dist = [];
        for ($i = 1; $i <= 5; $i++) {
            $dist[$i] = (int) ($distribution[$i] ?? 0);
        }

        return response()->json([
            'average' => round($avg, 2),
            'count' => $count,
            'distribution' => $dist,
        ]);
    }
}
