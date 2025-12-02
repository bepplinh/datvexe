<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RouteOptimization\OptimizeTripRequest;
use App\Models\BookingLeg;
use App\Models\Trip;
use App\Services\GeminiAI\RouteOptimizationService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class RouteOptimizationController extends Controller
{
    public function __construct(
        private RouteOptimizationService $routeOptimizer
    ) {}

    /**
     * Tối ưu route cho một trip
     * 
     * Query params hoặc body:
     * - start_pickup_location (optional): Địa điểm bắt đầu đón khách (từ from_city)
     * - start_dropoff_location (optional): Địa điểm bắt đầu trả khách (từ to_city)
     */
    public function optimizeTrip(OptimizeTripRequest $request, int $tripId)
    {
        $startPickupLocation = $request->input('start_pickup_location');
        $startDropoffLocation = $request->input('start_dropoff_location');
        $optimizeType = $request->input('optimize_type', 'dropoff');
        
        $result = $this->routeOptimizer->optimizeTripRoute(
            $tripId,
            $startPickupLocation,
            $startDropoffLocation,
            $optimizeType
        );
        
        return response()->json([
            'success' => true,
            'data' => $result->toArray()
        ]);
    }

    /**
     * Tối ưu route cho nhiều trips
     */
    public function optimizeMultipleTrips(Request $request)
    {
        $request->validate([
            'trip_ids' => 'required|array',
            'trip_ids.*' => 'integer|exists:trips,id',
            'start_pickup_location' => 'nullable|string|max:500',
            'start_dropoff_location' => 'nullable|string|max:500',
            'optimize_type' => 'nullable|string|in:pickup,dropoff',
        ]);

        $startPickupLocation = $request->input('start_pickup_location');
        $startDropoffLocation = $request->input('start_dropoff_location');
        $optimizeType = $request->input('optimize_type', 'dropoff');

        $results = $this->routeOptimizer->optimizeMultipleTrips(
            $request->trip_ids,
            $startPickupLocation,
            $startDropoffLocation,
            $optimizeType
        );
        
        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }

    /**
     * Lấy danh sách các địa điểm pickup và dropoff của một trip để admin có thể chọn điểm bắt đầu
     */
    public function getTripLocations(int $tripId)
    {
        $trip = \App\Models\Trip::with(['route.fromCity', 'route.toCity'])->find($tripId);
        
        if (!$trip) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy trip'
            ], 404);
        }

        $bookingLegs = \App\Models\BookingLeg::where('trip_id', $tripId)
            ->with('booking')
            ->get();

        $pickupLocationsMap = [];
        $dropoffLocationsMap = [];

        foreach ($bookingLegs as $leg) {
            if ($leg->pickup_address) {
                $address = trim($leg->pickup_address);
                if (!isset($pickupLocationsMap[$address])) {
                    $pickupLocationsMap[$address] = [
                        'address' => $address,
                        'booking_leg_ids' => [],
                        'booking_codes' => [],
                    ];
                }
                $pickupLocationsMap[$address]['booking_leg_ids'][] = $leg->id;
                if ($leg->booking->code) {
                    $pickupLocationsMap[$address]['booking_codes'][] = $leg->booking->code;
                }
            }
            
            if ($leg->dropoff_address) {
                $address = trim($leg->dropoff_address);
                if (!isset($dropoffLocationsMap[$address])) {
                    $dropoffLocationsMap[$address] = [
                        'address' => $address,
                        'booking_leg_ids' => [],
                        'booking_codes' => [],
                    ];
                }
                $dropoffLocationsMap[$address]['booking_leg_ids'][] = $leg->id;
                if ($leg->booking->code) {
                    $dropoffLocationsMap[$address]['booking_codes'][] = $leg->booking->code;
                }
            }
        }

        // Loại bỏ trùng lặp booking codes
        foreach ($pickupLocationsMap as &$location) {
            $location['booking_codes'] = array_unique($location['booking_codes']);
        }
        foreach ($dropoffLocationsMap as &$location) {
            $location['booking_codes'] = array_unique($location['booking_codes']);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'trip_id' => $tripId,
                'route' => [
                    'from_city' => $trip->route->fromCity->name ?? null,
                    'to_city' => $trip->route->toCity->name ?? null,
                ],
                'pickup_locations' => array_values($pickupLocationsMap),
                'dropoff_locations' => array_values($dropoffLocationsMap),
            ]
        ]);
    }

    /**
     * Danh sách trips trong ngày để admin dễ chọn
     */
    public function listTripsForDate(Request $request)
    {
        $request->validate([
            'date' => 'nullable|date',
            'route_id' => 'nullable|integer|exists:routes,id',
        ]);

        $selectedDate = $request->input('date')
            ? Carbon::parse($request->input('date'))->toDateString()
            : now()->toDateString();

        $query = Trip::with(['route.fromCity', 'route.toCity'])
            ->whereDate('departure_time', $selectedDate)
            ->orderBy('departure_time');

        if ($request->filled('route_id')) {
            $query->where('route_id', $request->input('route_id'));
        }

        $trips = $query->get();

        if ($trips->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'date' => $selectedDate,
                    'trips' => [],
                ],
            ]);
        }

        $bookingLegGroups = BookingLeg::whereIn('trip_id', $trips->pluck('id'))
            ->get()
            ->groupBy('trip_id');

        $formatted = $trips->map(function (Trip $trip) use ($bookingLegGroups) {
            $legs = $bookingLegGroups->get($trip->id, collect());

            $pickupCount = $legs->pluck('pickup_address')
                ->filter()
                ->unique()
                ->count();

            $dropoffCount = $legs->pluck('dropoff_address')
                ->filter()
                ->unique()
                ->count();

            return [
                'id' => $trip->id,
                'departure_time' => $trip->departure_time?->format('H:i d/m'),
                'route' => [
                    'name' => $trip->route?->name,
                    'from_city' => $trip->route?->fromCity?->name,
                    'to_city' => $trip->route?->toCity?->name,
                ],
                'pickup_count' => $pickupCount,
                'dropoff_count' => $dropoffCount,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $selectedDate,
                'trips' => $formatted,
            ],
        ]);
    }
}

