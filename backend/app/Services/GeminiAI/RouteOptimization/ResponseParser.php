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

            // Loại bỏ markdown code block nếu có (```json ... ``` hoặc ``` ... ```)
            $cleanedText = $this->cleanJsonResponse($text);

            $data = json_decode($cleanedText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::warning('Failed to parse Gemini response as JSON', [
                    'error' => json_last_error_msg(),
                    'response' => $text,
                    'cleaned_response' => $cleanedText
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

    /**
     * Loại bỏ markdown code block và các ký tự không cần thiết từ JSON response
     */
    private function cleanJsonResponse(string $text): string
    {
        $cleaned = trim($text);

        // Loại bỏ markdown code block: ```json ... ``` hoặc ``` ... ```
        $cleaned = preg_replace('/^```(?:json)?\s*\n?/m', '', $cleaned);
        $cleaned = preg_replace('/\n?```\s*$/m', '', $cleaned);

        // Loại bỏ các ký tự markdown khác nếu có
        $cleaned = trim($cleaned);

        // Tìm JSON object đầu tiên trong text (nếu có text thêm trước/sau)
        if (preg_match('/\{[\s\S]*\}/', $cleaned, $matches)) {
            $cleaned = $matches[0];
        }

        return $cleaned;
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
