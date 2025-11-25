<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SeatUnlocked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $sessionToken,
        public array $unlocks
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];

        foreach ($this->unlocks as $unlock) {
            $tripId = (int) ($unlock['trip_id'] ?? 0);
            // Chỉ thêm channel nếu trip_id hợp lệ
            if ($tripId > 0) {
                $channels[] = new PrivateChannel("trip.{$tripId}");
            }
        }

        // Luôn thêm channel cho client session (giống SeatLocked và SeatBooked)
        if (!empty($this->sessionToken)) {
            $channels[] = new PrivateChannel("client.session.{$this->sessionToken}");
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'SeatUnlocked';
    }

    public function broadcastWith(): array
    {
        return [
            'session_token' => $this->sessionToken,
            'unlocks' => $this->unlocks,
        ];
    }
}
