<?php

namespace App\Services\GeminiAI\RouteOptimization;

use App\Services\GeminiAI\GeminiClient;
use App\Services\GeminiAI\RouteOptimization\DTOs\OptimizedRouteDTO;
use Illuminate\Support\Facades\Log;

class ResponseParser
{
    /**
     * Parse response từ Gemini và trả về DTO
     */
    public function parse(array $geminiResponse, array $fallbackLocations): OptimizedRouteDTO
    {
        try {
            $text = GeminiClient::extractText($geminiResponse);

            if (!$text) {
                return $this->createFallbackResponse($fallbackLocations, 'Không nhận được response từ AI');
            }

            $data = json_decode($text, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::warning('Failed to parse Gemini response as JSON', [
                    'error' => json_last_error_msg(),
                    'response' => $text
                ]);
                return $this->createFallbackResponse($fallbackLocations, 'Response không phải JSON hợp lệ');
            }

            return OptimizedRouteDTO::fromArray($data);
        } catch (\Throwable $e) {
            Log::error('Error parsing Gemini response', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->createFallbackResponse($fallbackLocations, 'Lỗi khi parse response: ' . $e->getMessage());
        }
    }

    private function createFallbackResponse(array $locations, string $reason): OptimizedRouteDTO
    {
        return new OptimizedRouteDTO(
            optimizedOrder: $locations,
            totalDistanceEstimate: 'Không xác định',
            reasoning: $reason
        );
    }
}
