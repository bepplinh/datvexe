<?php

namespace App\Services\GeminiAI\RouteOptimization\DTOs;

class LocationDTO
{
    public function __construct(
        public readonly string $id,
        public readonly string $address,
        public readonly string $type, // 'pickup' | 'dropoff'
        public readonly int $bookingLegId,
        public readonly ?string $bookingCode = null,
        public readonly ?string $passengerName = null,
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'address' => $this->address,
            'type' => $this->type,
            'booking_leg_id' => $this->bookingLegId,
            'booking_code' => $this->bookingCode,
            'passenger_name' => $this->passengerName,
        ];
    }
}
