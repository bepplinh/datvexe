<?php

namespace App\Services\GeminiAI\Parser;

use App\Services\GeminiAI\LocationResolverService;
use App\Support\Time\ViDatetimeParser;

/**
 * Parse thông tin từ user message và AI function args
 */
class UserMessageParser
{
    public function __construct(
        private ?LocationResolverService $resolver = null
    ) {}

    /**
     * Parse location từ args, context và message
     * @return array{fromId: int, toId: int, fromText: string, toText: string, error: ?string}
     */
    public function parseLocations(array $args, array $context, string $userMessage): array
    {
        // Pre-parse từ message nếu có pattern "từ X đi/đến Y"
        $preFrom = $preTo = '';
        if (preg_match('/^\s*(?:từ\s+)?(.+?)\s+(?:đi|đến|->)\s+(.+?)\s*$/iu', $userMessage, $m)) {
            $preFrom = trim($m[1]);
            $preTo   = trim($m[2]);
        }

        // 1) Resolve from/to (ưu tiên args, fallback context)
        $fromId = (int) ($args['from_location_id'] ?? $context['from_id'] ?? 0);
        $toId   = (int) ($args['to_location_id']   ?? $context['to_id']   ?? 0);

        $fromText = trim((string) ($args['from_text'] ?? $args['from'] ?? $args['origin'] ?? $preFrom ?? $context['from_text'] ?? ''));
        $toText   = trim((string) ($args['to_text']   ?? $args['to']   ?? $args['destination'] ?? $preTo ?? $context['to_text'] ?? ''));

        // Resolve text to ID if needed
        if ($this->resolver) {
            if ($fromId <= 0 && $fromText !== '') {
                $fromId = (int) ($this->resolver->resolveIdFromText($fromText) ?? 0);
            }
            if ($toId <= 0 && $toText !== '') {
                $toId = (int) ($this->resolver->resolveIdFromText($toText) ?? 0);
            }
        }

        // Check for missing locations
        $error = null;
        if ($fromId <= 0 || $toId <= 0) {
            $error = $this->buildLocationErrorMessage($fromId, $toId, $fromText, $toText);
        }

        return [
            'fromId' => $fromId,
            'toId' => $toId,
            'fromText' => $fromText,
            'toText' => $toText,
            'error' => $error,
        ];
    }

    /**
     * Parse date từ args, context và message
     */
    public function parseDate(array $args, array $context, string $userMessage): ?string
    {
        $dateText = (string)($args['date_text']
            ?? $args['date']
            ?? $args['day']
            ?? $args['when']
            ?? $args['travel_date']
            ?? $context['date_text'] ?? ''
        );

        // Fallback: thử parse từ message nếu model không map
        if ($dateText === '' && !empty($userMessage)) {
            $dateText = $userMessage;
        }

        if (trim($dateText) === '') {
            return null;
        }

        return ViDatetimeParser::resolveDate($dateText, 'Asia/Bangkok')->format('Y-m-d');
    }

    /**
     * Parse time window từ args và message
     */
    public function parseTimeWindow(array $args, string $userMessage): ?array
    {
        $timeRaw = (string)($args['time_window'] ?? $args['time'] ?? $args['period'] ?? '');
        $time = mb_strtolower(trim($timeRaw));

        // Normalize variants
        $map = [
            'buổi sáng' => 'sáng',
            'sang' => 'sáng',
            'sáng sớm' => 'sáng',
            'sớm' => 'sáng',
            'buổi chiều' => 'chiều',
            'chieu' => 'chiều',
            'chiều muộn' => 'chiều',
            'buổi tối'  => 'tối',
            'toi' => 'tối',
            'tối muộn' => 'tối',
            'khuya' => 'tối',
            'đêm' => 'tối',
        ];
        if (isset($map[$time])) {
            $time = $map[$time];
        }

        // Try extract from message if not in args
        if ($time === '' && !empty($userMessage)) {
            $timePatterns = [
                '/sáng|sớm/i' => 'sáng',
                '/chiều|trưa/i' => 'chiều',
                '/tối|đêm|khuya/i' => 'tối',
            ];
            foreach ($timePatterns as $pattern => $mapped) {
                if (preg_match($pattern, $userMessage)) {
                    $time = $mapped;
                    break;
                }
            }
        }

        if ($time === '') {
            return null;
        }

        return ViDatetimeParser::resolveTimeWindow($time);
    }

    /**
     * Parse số lượng passengers từ args và message
     */
    public function parsePassengers(array $args, string $userMessage): int
    {
        if (isset($args['passengers'])) {
            return (int)$args['passengers'];
        }

        // Try extract from message
        if (preg_match('/(\d+)\s*(?:vé|người|ghế|chỗ)/i', $userMessage, $matches)) {
            return (int)$matches[1];
        }

        return 0;
    }

    /**
     * Build error message khi không tìm thấy location
     */
    private function buildLocationErrorMessage(int $fromId, int $toId, string $fromText, string $toText): string
    {
        $missing = [];
        $suggestions = [];

        if ($fromId <= 0 && $fromText !== '') {
            $missing[] = 'điểm đi';
            if ($this->resolver) {
                $suggestions['from'] = $this->resolver->suggest($fromText, 3);
            }
        }

        if ($toId <= 0 && $toText !== '') {
            $missing[] = 'điểm đến';
            if ($this->resolver) {
                $suggestions['to'] = $this->resolver->suggest($toText, 3);
            }
        }

        $m = implode(' và ', $missing);
        $message = "Mình không tìm thấy $m bạn nhắc đến.";

        if (!empty($suggestions)) {
            $message .= " Bạn có thể thử:";
            foreach ($suggestions as $type => $items) {
                if (!empty($items)) {
                    $names = array_column($items, 'name');
                    $message .= " " . implode(', ', array_slice($names, 0, 3));
                }
            }
        } else {
            $message .= " Bạn vui lòng cho mình biết $m cụ thể nhé.";
        }

        return $message;
    }
}
