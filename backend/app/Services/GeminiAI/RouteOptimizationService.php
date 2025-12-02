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
     * 
     * @param int $tripId ID của trip
     * @param string|null $startPickupLocation Địa điểm bắt đầu đón khách (từ from_city)
     * @param string|null $startDropoffLocation Địa điểm bắt đầu trả khách (từ to_city)
     * @param string $optimizeType Loại địa điểm cần tối ưu: pickup | dropoff
     */
    public function optimizeTripRoute(
        int $tripId,
        ?string $startPickupLocation = null,
        ?string $startDropoffLocation = null,
        string $optimizeType = 'dropoff'
    ): OptimizedRouteDTO
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

        // Validate route có from_city và to_city
        if (!$trip->route || !$trip->route->fromCity || !$trip->route->toCity) {
            return new OptimizedRouteDTO(
                optimizedOrder: [],
                totalDistanceEstimate: '0 km',
                reasoning: 'Trip không có thông tin route hoặc thành phố'
            );
        }

        // 2. Tập hợp địa điểm theo loại yêu cầu
        $optimizeType = strtolower($optimizeType) === 'pickup' ? 'pickup' : 'dropoff';
        $locations = $this->locationCollector->collectByType($bookingLegs, $optimizeType);

        if (empty($locations)) {
            return new OptimizedRouteDTO(
                optimizedOrder: [],
                totalDistanceEstimate: '0 km',
                reasoning: 'Không có địa điểm phù hợp để tối ưu'
            );
        }

        $locationsArray = array_map(fn($loc) => $loc->toArray(), $locations);

        // 3. Build prompt và gọi Gemini với điểm bắt đầu tương ứng
        $startLocation = $optimizeType === 'pickup' ? $startPickupLocation : $startDropoffLocation;
        $payload = $this->promptBuilder->buildPayload($trip, $locations, $optimizeType, $startLocation);

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
     * 
     * @param array $tripIds Danh sách trip IDs
     * @param string|null $startPickupLocation Địa điểm bắt đầu đón khách (từ from_city)
     * @param string|null $startDropoffLocation Địa điểm bắt đầu trả khách (từ to_city)
     * @param string $optimizeType Loại địa điểm cần tối ưu: pickup | dropoff
     */
    public function optimizeMultipleTrips(
        array $tripIds,
        ?string $startPickupLocation = null,
        ?string $startDropoffLocation = null,
        string $optimizeType = 'dropoff'
    ): array
    {
        $results = [];

        foreach ($tripIds as $tripId) {
            $results[$tripId] = $this->optimizeTripRoute(
                $tripId,
                $startPickupLocation,
                $startDropoffLocation,
                $optimizeType
            )->toArray();
        }

        return $results;
    }
}
