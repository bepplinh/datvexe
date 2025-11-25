<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\GeminiAI\RouteOptimizationService;
use Illuminate\Http\Request;

class RouteOptimizationController extends Controller
{
    public function __construct(
        private RouteOptimizationService $routeOptimizer
    ) {}

    /**
     * Tối ưu route cho một trip
     */
    public function optimizeTrip(Request $request, int $tripId)
    {
        $result = $this->routeOptimizer->optimizeTripRoute($tripId);
        
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
            'trip_ids.*' => 'integer|exists:trips,id'
        ]);

        $results = $this->routeOptimizer->optimizeMultipleTrips($request->trip_ids);
        
        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }
}

