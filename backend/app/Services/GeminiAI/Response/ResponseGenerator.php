<?php

namespace App\Services\GeminiAI\Response;

/**
 * Tạo response thông minh từ kết quả search
 */
class ResponseGenerator
{
    /**
     * Build summary từ danh sách trips
     */
    public function buildTripSummary(array $trips): array
    {
        if (empty($trips)) {
            return [
                'count' => 0,
                'price_range' => null,
                'time_range' => null,
                'available_seats' => 0,
                'bus_types' => [],
            ];
        }

        $prices = array_filter(array_column($trips, 'price'));
        $times = array_filter(array_column($trips, 'departure_time'));
        $totalSeats = array_sum(array_column($trips, 'available_seats'));
        $busTypes = array_unique(array_filter(array_column(array_column($trips, 'bus'), 'type')));

        return [
            'count' => count($trips),
            'price_range' => !empty($prices) ? [
                'min' => min($prices),
                'max' => max($prices),
            ] : null,
            'time_range' => !empty($times) ? [
                'earliest' => min($times),
                'latest' => max($times),
            ] : null,
            'available_seats' => $totalSeats,
            'bus_types' => array_values($busTypes),
        ];
    }

    /**
     * Tạo smart response khi AI không trả về text
     */
    public function generateSmartResponse(array $trips, array $summary, string $userMessage): string
    {
        if (empty($trips)) {
            return $this->generateNoResultResponse($userMessage);
        }

        return $this->generateFoundResultResponse($trips, $summary, $userMessage);
    }

    /**
     * Handle câu hỏi chung không phải tìm chuyến
     */
    public function handleGeneralQuestion(string $userMessage): string
    {
        $msg = mb_strtolower(trim($userMessage));

        // Chào hỏi
        if (preg_match('/^(chào|xin chào|hello|hi|hey)/i', $msg)) {
            return "Xin chào! Mình có thể giúp bạn tìm chuyến xe. Bạn muốn đi đâu và đi khi nào?";
        }

        // Hỏi về cách sử dụng
        if (preg_match('/(cách|hướng dẫn|help|giúp|sử dụng)/i', $msg)) {
            return "Bạn chỉ cần cho mình biết:\n- Điểm đi và điểm đến (ví dụ: Hà Nội, Thanh Hóa)\n- Ngày đi (ví dụ: mai, hôm nay, thứ 6)\n- Thời gian (tùy chọn: sáng, chiều, tối)\n- Số lượng vé (tùy chọn)\n- Mức giá (tùy chọn: dưới 200k)\n\nVí dụ: 'Tìm 2 vé từ Hà Nội đi Thanh Hóa mai sáng, dưới 250k'";
        }

        // Câu hỏi về giá
        if (preg_match('/(giá|giá cả|phí|tiền)/i', $msg)) {
            return "Giá vé phụ thuộc vào tuyến đường, loại xe và thời gian. Bạn cho mình biết điểm đi, điểm đến và ngày đi, mình sẽ tìm chuyến phù hợp với mức giá tốt nhất cho bạn nhé!";
        }

        // Câu hỏi về thời gian
        if (preg_match('/(mất bao lâu|thời gian|bao lâu|duration)/i', $msg)) {
            return "Thời gian di chuyển phụ thuộc vào tuyến đường. Bạn cho mình biết điểm đi và điểm đến, mình sẽ tìm chuyến và cho biết thời gian di chuyển cụ thể nhé!";
        }

        // Mặc định
        return "Để mình tìm chuyến phù hợp, bạn vui lòng cho mình biết:\n- Điểm đi\n- Điểm đến\n- Ngày đi\n\nVí dụ: 'Tìm chuyến từ Hà Nội đi Thanh Hóa mai'";
    }

    /**
     * Generate response khi không có kết quả
     */
    private function generateNoResultResponse(string $userMessage): string
    {
        if (preg_match('/rẻ|giá\s*thấp|dưới\s*\d+/i', $userMessage)) {
            return "Không tìm thấy chuyến theo mức giá này. Thử nới giá hoặc chọn ngày khác nhé.";
        }
        if (preg_match('/sớm|sáng\s*sớm/i', $userMessage)) {
            return "Không có chuyến sớm trong ngày này. Bạn thử khung giờ khác hoặc ngày khác nhé.";
        }
        return "Không tìm thấy chuyến phù hợp. Bạn thử ngày khác hoặc điều chỉnh điều kiện tìm kiếm nhé.";
    }

    /**
     * Generate response khi có kết quả
     */
    private function generateFoundResultResponse(array $trips, array $summary, string $userMessage): string
    {
        $count = $summary['count'];
        $priceRange = $summary['price_range'];
        $timeRange = $summary['time_range'] ?? null;
        $totalSeats = $summary['available_seats'];

        $parts = [];
        $parts[] = "Có {$count} chuyến phù hợp";
        
        if ($timeRange && !empty($timeRange['earliest'])) {
            $parts[] = "sớm nhất {$timeRange['earliest']}";
        }
        
        if ($priceRange) {
            $minPrice = number_format($priceRange['min'], 0, ',', '.');
            $maxPrice = number_format($priceRange['max'], 0, ',', '.');
            $parts[] = $priceRange['min'] === $priceRange['max']
                ? "giá {$minPrice}đ"
                : "giá {$minPrice}–{$maxPrice}đ";
        }
        
        if ($totalSeats) {
            $parts[] = "còn {$totalSeats} ghế";
        }

        // Thêm highlight nếu user hỏi cụ thể
        if (preg_match('/rẻ\s*nhất|giá\s*tốt/i', $userMessage)) {
            $cheapest = min(array_column($trips, 'price'));
            $parts[] = "rẻ nhất " . number_format($cheapest, 0, ',', '.') . "đ";
        }
        if (preg_match('/sớm\s*nhất/i', $userMessage) && $timeRange && !empty($timeRange['earliest'])) {
            $parts[] = "sớm nhất {$timeRange['earliest']}";
        }

        return implode(', ', $parts) . ". Bạn chọn số thứ tự chuyến nhé?";
    }
}
