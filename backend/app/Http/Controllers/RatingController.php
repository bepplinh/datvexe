<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Trip;
use App\Models\Rating;
use App\Models\BookingLeg;
use App\Models\TripStation;
use Illuminate\Http\Request;
use App\Http\Requests\Rating\StoreRatingRequest;

class RatingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $legs = BookingLeg::with(['trip.route.tripStations'])
            ->whereHas('booking', fn($q) => $q->where('user_id', $user->id))
            ->get();

        $now = now();
        $payload = [];

        foreach ($legs as $leg) {
            $trip = $leg->trip;
            if (!$trip || !$trip->departure_time) continue;

            // Lấy duration + thông tin điểm đi/đến từ trip_stations qua route
            $tripStations = $trip->route?->tripStations ?? collect();
            // Lấy max duration (thời gian đến điểm cuối cùng)
            $totalDuration = $tripStations->max('duration_minutes') ?? 0;
            if ($totalDuration <= 0) continue;

            // Tính giờ đến: departure_time + duration_minutes
            $arrivalAt = Carbon::parse($trip->departure_time)
                ->addMinutes($totalDuration);

            // CHỈ LẤY TRIP ĐÃ HOÀN THÀNH: now > (departure_time + duration_minutes)
            if ($now->lte($arrivalAt)) {
                continue; // Bỏ qua chuyến chưa hoàn thành
            }

            // CHỈ LẤY TRIP CHƯA ĐÁNH GIÁ
            $rated = Rating::where('trip_id', $trip->id)
                ->where('user_id', $user->id)
                ->exists();
            if ($rated) {
                continue; // Bỏ qua chuyến đã đánh giá
            }

            $firstStation = $tripStations->first();
            $lastStation = $tripStations->last();
            $payload[] = [
                'trip_id' => $trip->id,
                'booking_leg_id' => $leg->id,
                'departure_time' => $trip->departure_time->toIso8601String(),
                'arrival_estimate' => $arrivalAt->toIso8601String(),
                'duration_minutes' => $totalDuration,
                'route_name' => $trip->route->name ?? null,
                'from_location' => optional($firstStation?->fromLocation)->name,
                'to_location' => optional($lastStation?->toLocation)->name,
                // Có thể thêm thông tin khác: route, locations, etc.
            ];
        }

        return response()->json(['data' => $payload]);
    }

    public function store(StoreRatingRequest $request, Trip $trip)
    {
        $user = $request->user();

        // Dùng JOIN thay vì whereHas để tối ưu hiệu suất
        $bookingLeg = BookingLeg::where('booking_legs.trip_id', $trip->id)
            ->join('bookings', 'booking_legs.booking_id', '=', 'bookings.id')
            ->where('bookings.user_id', $user->id)
            ->select('booking_legs.*')
            ->latest('booking_legs.id')
            ->first();

        if (!$bookingLeg) {
            return response()->json([
                'message' => 'Bạn chưa đặt ghế cho chuyến này.'
            ], 403);
        }

        if (!$trip->departure_time) {
            return response()->json(['message' => 'Không tìm thấy giờ khởi hành của chuyến.'], 400);
        }

        // Lấy duration từ trip_stations qua route_id
        $totalDuration = TripStation::where('route_id', $trip->route_id)->max('duration_minutes') ?? 0;
        if ($totalDuration <= 0) {
            return response()->json(['message' => 'Không tìm thấy thông tin thời gian chuyến đi.'], 400);
        }

        // Tính giờ đến: departure_time + duration_minutes
        $arrivalAt = Carbon::parse($trip->departure_time)
            ->addMinutes($totalDuration);

        // Kiểm tra: chỉ cho phép đánh giá nếu now > (departure_time + duration_minutes)
        if (now()->lte($arrivalAt)) {
            return response()->json([
                'message' => 'Chuyến chưa kết thúc, chưa thể đánh giá.'
            ], 400);
        }

        $exists = Rating::where('trip_id', $trip->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Bạn đã đánh giá cho chuyến này.'
            ], 409);
        }

        $rating = Rating::create([
            'trip_id' => $trip->id,
            'booking_leg_id' => $bookingLeg->id,
            'user_id' => $user->id,
            'score' => $request->integer('score'),
            'comment' => $request->input('comment'),
        ]);

        $summary = Rating::where('trip_id', $trip->id)
            ->selectRaw('AVG(score) as average, COUNT(*) as count')
            ->first();

        return response()->json([
            'rating' => $rating,
            'summary' => [
                'average' => $summary ? round($summary->average, 2) : 0,
                'count'   => $summary ? (int) $summary->count : 0,
            ]
        ], 201);
    }
}
