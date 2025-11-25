<?php

namespace App\Services\GeminiAI;

use App\Services\GeminiAI\RouteOptimization\LocationCollector;
use App\Services\GeminiAI\RouteOptimization\PromptBuilder;
use App\Services\GeminiAI\RouteOptimization\ResponseParser;
use App\Services\GeminiAI\RouteOptimization\TripDataFetcher;
use App\Services\GeminiAI\RouteOptimization\DTOs\OptimizedRouteDTO;
use Illuminate\Support\Facades\Log;

class RouteOptimizationService
{
    public function __construct(
        private GeminiClient $gemini,
        private TripDataFetcher $tripFetcher,
        private LocationCollector $locationCollector,
        private PromptBuilder $promptBuilder,
        private ResponseParser $responseParser,
    ) {}

    /**
     * Tối ưu hóa route cho một trip
     */
    public function optimizeTripRoute(int $tripId): OptimizedRouteDTO
    {
        // 1. Validate và lấy dữ liệu
        $bookingLegs = $this->tripFetcher->getBookingLegs($tripId);

        if ($bookingLegs->isEmpty()) {
            return new OptimizedRouteDTO(
                optimizedOrder: [],
                totalDistanceEstimate: '0 km',
                reasoning: 'Không có booking nào cho trip này'
            );
        }

        $trip = $this->tripFetcher->getTrip($tripId);
        if (!$trip) {
            return new OptimizedRouteDTO(
                optimizedOrder: [],
                totalDistanceEstimate: '0 km',
                reasoning: 'Không tìm thấy trip'
            );
        }

        // 2. Tập hợp địa điểm
        $locations = $this->locationCollector->collectFromBookingLegs($bookingLegs);
        $locationsArray = array_map(fn($loc) => $loc->toArray(), $locations);

        // 3. Build prompt và gọi Gemini
        $payload = $this->promptBuilder->buildPayload($trip, $locations);

        try {
            $response = $this->gemini->firstTurn($payload);
            return $this->responseParser->parse($response, $locationsArray);
        } catch (\Throwable $e) {
            Log::error('Route optimization failed', [
                'trip_id' => $tripId,
                'error' => $e->getMessage()
            ]);

            return new OptimizedRouteDTO(
                optimizedOrder: $locationsArray,
                totalDistanceEstimate: 'Lỗi khi tối ưu hóa',
                reasoning: 'Lỗi hệ thống: ' . $e->getMessage()
            );
        }
    }

    /**
     * Tối ưu hóa route cho nhiều trips
     */
    public function optimizeMultipleTrips(array $tripIds): array
    {
        $results = [];

        foreach ($tripIds as $tripId) {
            $results[$tripId] = $this->optimizeTripRoute($tripId)->toArray();
        }

        return $results;
    }
}
