<?php

namespace App\Services\GeminiAI\Prompt;

/**
 * Xây dựng tools (function declarations) cho Gemini function calling
 */
class GeminiToolsBuilder
{
    /**
     * Build all tools for chat
     */
    public function build(): array
    {
        return [[
            'functionDeclarations' => [
                $this->buildSearchTripsDeclaration(),
            ]
        ]];
    }

    /**
     * Build search_trips function declaration
     */
    private function buildSearchTripsDeclaration(): array
    {
        return [
            'name' => 'search_trips',
            'description' => 'Tìm chuyến xe khách một chiều theo câu hỏi của người dùng',
            'parameters' => [
                'type' => 'object',
                'properties' => [
                    // Người dùng có thể đưa text:
                    'from_text' => ['type' => 'string', 'description' => 'Điểm đi dạng chữ: "Hà Nội", "Kim Mã"'],
                    'to_text'   => ['type' => 'string', 'description' => 'Điểm đến dạng chữ: "Thọ Xuân", "Thanh Hóa"'],
                    // Hoặc đưa sẵn location_id:
                    'from_location_id' => ['type' => 'integer'],
                    'to_location_id'   => ['type' => 'integer'],
                    // Thời gian tự nhiên:
                    'date_text'   => ['type' => 'string', 'description' => '"hôm nay", "mai", "thứ 6", hoặc "YYYY-MM-DD"'],
                    'time_window' => ['type' => 'string', 'description' => '"sáng"|"chiều"|"tối" hoặc "HH:mm-HH:mm"'],
                    // Tuỳ chọn lọc:
                    'passengers'   => ['type' => 'integer', 'minimum' => 1, 'default' => 1],
                    'bus_type_ids' => ['type' => 'array', 'items' => ['type' => 'integer']],
                    'price_cap'    => ['type' => 'integer'],
                    'min_seats'    => ['type' => 'integer'],
                    'sort'         => ['type' => 'string', 'enum' => ['asc', 'desc'], 'default' => 'asc'],
                    'limit'        => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100],
                ],
                'required' => ['date_text']
            ]
        ];
    }
}
