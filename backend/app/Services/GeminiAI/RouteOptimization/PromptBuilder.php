<?php

namespace App\Services\GeminiAI\RouteOptimization;

use App\Models\Trip;
use App\Services\GeminiAI\RouteOptimization\DTOs\LocationDTO;

class PromptBuilder
{
    private const SYSTEM_PROMPT = <<<PROMPT
Bạn là chuyên gia tối ưu hóa tuyến đường cho xe trung chuyển (shuttle bus).
Nhiệm vụ của bạn là sắp xếp thứ tự các địa điểm đón/trả khách sao cho:
1. Đón khách (pickup) phải trước khi trả khách (dropoff) của cùng một booking
2. Tối ưu hóa quãng đường di chuyển (giảm thiểu tổng khoảng cách)
3. Xem xét vị trí địa lý thực tế tại Việt Nam
4. Trả về kết quả dưới dạng JSON với thứ tự tối ưu

Lưu ý: Bạn cần hiểu địa chỉ tiếng Việt và ước tính khoảng cách dựa trên kiến thức về địa lý Việt Nam.
PROMPT;

    /**
     * Build payload để gửi cho Gemini
     */
    public function buildPayload(Trip $trip, array $locations): array
    {
        return [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => self::SYSTEM_PROMPT]]],
                ['role' => 'user', 'parts' => [['text' => $this->buildUserPrompt($trip, $locations)]]],
            ],
            'generationConfig' => [
                'temperature' => 0.3,
                'responseMimeType' => 'application/json',
            ]
        ];
    }

    private function buildUserPrompt(Trip $trip, array $locations): string
    {
        $locationsJson = $this->formatLocationsAsJson($locations);

        return <<<PROMPT
Tôi có một chuyến xe với thông tin sau:

**Thông tin chuyến:**
- Trip ID: {$trip->id}
- Thời gian khởi hành: {$trip->departure_time->format('d/m/Y H:i')}

**Danh sách địa điểm cần tối ưu:**

{$locationsJson}

Hãy sắp xếp lại thứ tự các địa điểm này để:
1. Đảm bảo pickup luôn trước dropoff của cùng booking
2. Tối ưu hóa quãng đường (xe di chuyển ít nhất có thể)
3. Trả về JSON với format:
{
  "optimized_order": [
    {"id": "pickup_1", "address": "...", "type": "pickup", "booking_leg_id": 1, "order": 1},
    {"id": "pickup_2", "address": "...", "type": "pickup", "booking_leg_id": 2, "order": 2},
    ...
  ],
  "total_distance_estimate": "ước tính tổng khoảng cách (ví dụ: '25 km')",
  "reasoning": "Giải thích ngắn gọn lý do sắp xếp này"
}

Chỉ trả về JSON, không có text thêm.
PROMPT;
    }

    private function formatLocationsAsJson(array $locations): string
    {
        $locationsArray = array_map(function ($location) {
            if ($location instanceof LocationDTO) {
                return $location->toArray();
            }
            return $location;
        }, $locations);

        return json_encode($locationsArray, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
}
