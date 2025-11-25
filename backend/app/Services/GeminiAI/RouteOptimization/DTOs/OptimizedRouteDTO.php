<?php

namespace App\Services\GeminiAI\RouteOptimization\DTOs;

class OptimizedRouteDTO
{
    public function __construct(
        public readonly array $optimizedOrder,
        public readonly string $totalDistanceEstimate,
        public readonly string $reasoning,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            optimizedOrder: $data['optimized_order'] ?? [],
            totalDistanceEstimate: $data['total_distance_estimate'] ?? 'Không xác định',
            reasoning: $data['reasoning'] ?? '',
        );
    }

    public function toArray(): array
    {
        return [
            'optimized_order' => $this->optimizedOrder,
            'total_distance_estimate' => $this->totalDistanceEstimate,
            'reasoning' => $this->reasoning,
        ];
    }
}
