<?php

namespace App\Services\GeminiAI\Parser;

/**
 * Xây dựng filters cho trip search
 */
class FilterBuilder
{
    /**
     * Build filters từ args, context và message
     */
    public function build(array $args, array $context, string $userMessage, ?array $timeWindow = null): array
    {
        $filters = [];

        // Time filters
        if ($timeWindow) {
            [$timeFrom, $timeTo] = $timeWindow;
            if ($timeFrom && $timeTo) {
                $filters['time_from'] = $timeFrom;
                $filters['time_to']   = $timeTo;
            }
        }

        // Bus type
        if (!empty($args['bus_type_ids']) && is_array($args['bus_type_ids'])) {
            $filters['bus_type'] = array_map('intval', $args['bus_type_ids']);
        }
        if (!empty($context['filters']['bus_type'] ?? null) && empty($filters['bus_type'])) {
            $filters['bus_type'] = $context['filters']['bus_type'];
        }

        // Price cap
        $filters['price_cap'] = $this->extractPriceCap($args, $userMessage);

        // Min seats & limit
        if (isset($args['min_seats'])) {
            $filters['min_seats'] = max(0, (int)$args['min_seats']);
        }
        if (isset($args['limit'])) {
            $filters['limit'] = (int)$args['limit'];
        }

        // Sort
        $sortOptions = $this->extractSort($args, $context, $userMessage);
        $filters['sort'] = $sortOptions['sort'];
        if ($sortOptions['sort_by']) {
            $filters['sort_by'] = $sortOptions['sort_by'];
        }

        // Clean null values
        $filters = array_filter($filters, fn($v) => $v !== null);

        return $filters;
    }

    /**
     * Apply passengers to filters
     */
    public function applyPassengers(array $filters, int $passengers): array
    {
        if ($passengers > 0) {
            $filters['min_seats'] = max((int)($filters['min_seats'] ?? 0), $passengers);
        }
        return $filters;
    }

    /**
     * Extract price cap từ args hoặc message
     */
    private function extractPriceCap(array $args, string $userMessage): ?int
    {
        if (isset($args['price_cap'])) {
            return (int)$args['price_cap'];
        }

        // Try extract từ message
        $pricePatterns = [
            '/dưới\s*(\d+)\s*k/i' => 1000,
            '/dưới\s*(\d+)\s*nghìn/i' => 1000,
            '/dưới\s*(\d+)\s*000/i' => 1,
            '/<=?\s*(\d+)\s*k/i' => 1000,
            '/khoảng\s*(\d+)\s*k/i' => 1000,
            '/từ\s*\d+\s*k?\s*đến\s*(\d+)\s*k/i' => 1000,
        ];

        foreach ($pricePatterns as $pattern => $multiplier) {
            if (preg_match($pattern, $userMessage, $matches)) {
                return (int)$matches[1] * $multiplier;
            }
        }

        return null;
    }

    /**
     * Extract sort options từ args, context và message
     * @return array{sort: string, sort_by: ?string}
     */
    private function extractSort(array $args, array $context, string $userMessage): array
    {
        $sort = strtolower((string)($args['sort'] ?? 'asc'));
        $sortBy = $context['filters']['sort_by'] ?? null;

        // "rẻ nhất", "giá tốt" -> sort by price
        if (preg_match('/r[ẻe]\s*nh[aấ]t|gi[aá]\s*t[oố]t|gi[aá]\s*th[áâ]p/i', $userMessage)) {
            $sortBy = 'price';
            $sort = 'asc';
        }

        // "sớm nhất" -> sort by departure_time
        if (preg_match('/s[ơơ]́m\s*nh[ấ]t|gi[á]o\s*sơm|kh[ơ]̉i\s*hành\s*s[ơ]́m/i', $userMessage)) {
            $sortBy = 'departure_time';
            $sort = 'asc';
        }

        // "ghế nhiều" -> sort by available_seats desc
        if (preg_match('/gh[eế]\s*nhi[ề]u/i', $userMessage)) {
            $sortBy = 'available_seats';
            $sort = 'desc';
        }

        return [
            'sort' => in_array($sort, ['asc', 'desc'], true) ? $sort : 'asc',
            'sort_by' => $sortBy,
        ];
    }
}
