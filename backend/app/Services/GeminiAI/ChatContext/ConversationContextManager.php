<?php

namespace App\Services\GeminiAI\ChatContext;

use Illuminate\Support\Facades\Cache;

/**
 * Quản lý conversation context cho chat
 */
class ConversationContextManager
{
    private const CACHE_TTL_MINUTES = 25;

    /**
     * Load context từ cache
     */
    public function load(?string $key): array
    {
        if (!$key) return [];
        return Cache::get($key, []);
    }

    /**
     * Store context vào cache
     */
    public function store(?string $key, array $data): void
    {
        if (!$key) return;
        Cache::put($key, $data, now()->addMinutes(self::CACHE_TTL_MINUTES));
    }

    /**
     * Xử lý khi user chọn chuyến theo thứ tự (ví dụ: "chuyến 1", "chuyến thứ 2")
     * @return array|null Returns trip selection response or null if not a trip selection
     */
    public function handleTripSelection(array $context, string $userMessage): ?array
    {
        if (empty($context['trips'])) {
            return null;
        }

        // Match "chuyến 1", "chuyến thứ 2", etc.
        if (preg_match('/chuy[eê]́n\s*(?:th[úư])?\s*(\d+)/iu', $userMessage, $m)) {
            $idx = max(1, (int)$m[1]) - 1;
            $trip = $context['trips'][$idx] ?? null;
            
            if ($trip) {
                return [
                    'message' => $this->buildTripFollowupMessage($trip),
                    'trips' => [$trip],
                ];
            }
        }

        // Handle "còn ghế không" without specifying trip
        if (preg_match('/c[oò]n\s+gh[eế]|gh[eế]\s*c[òo]n/i', $userMessage)) {
            $trip = $context['trips'][0];
            $available = $trip['available_seats'] ?? null;
            $msg = $available !== null
                ? "Chuyến gần nhất còn khoảng {$available} ghế. Bạn muốn giữ chỗ không?"
                : "Mình có danh sách chuyến trước đó, bạn muốn xem lại và chọn số thứ tự chuyến chứ?";
            return ['message' => $msg, 'trips' => $context['trips']];
        }

        return null;
    }

    /**
     * Build context data để lưu
     */
    public function buildContextData(
        int $fromId,
        int $toId,
        string $fromText,
        string $toText,
        string $dateText,
        array $filters,
        array $trips,
        string $userMessage,
        ?string $traceId
    ): array {
        return [
            'from_id' => $fromId,
            'to_id' => $toId,
            'from_text' => $fromText,
            'to_text' => $toText,
            'date_text' => $dateText,
            'filters' => $filters,
            'trips' => array_values(array_slice($trips, 0, 10)),
            'last_user_message' => $userMessage,
            'updated_at' => now()->toIsoString(),
            'trace_id' => $traceId,
        ];
    }

    /**
     * Build message cho trip follow-up
     */
    private function buildTripFollowupMessage(array $trip): string
    {
        $price = isset($trip['price']) ? number_format($trip['price'], 0, ',', '.') . 'đ' : 'không rõ giá';
        $time = $trip['departure_time'] ?? 'không rõ giờ';
        $route = trim(($trip['from_location'] ?? '') . ' → ' . ($trip['to_location'] ?? ''));
        $seats = $trip['available_seats'] ?? null;
        $seatText = $seats !== null ? "{$seats} ghế trống" : 'chưa rõ số ghế';

        return "Bạn chọn chuyến lúc {$time} ({$route}), giá {$price}, còn {$seatText}. Mình có thể mở đặt chỗ cho chuyến này nhé?";
    }
}
