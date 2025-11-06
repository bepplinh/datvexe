<?php

namespace App\Jobs;

use App\Events\SeatUnlocked;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Redis;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;   

class ReleaseSeatAfterExpired implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels; // ✅ thêm Dispatchable

    public function __construct(public string $key) {}

    public function handle(): void
    {
        $redis = Redis::connection('default');

        // Parse key: trip:<trip_id>:seat:<seat_id>:lock
        $parts = explode(':', $this->key);
        if (count($parts) >= 5 && $parts[0] === 'trip' && $parts[2] === 'seat' && $parts[4] === 'lock') {
            $tripId = $parts[1];
            $seatId = $parts[3];

            $redis->srem("trip:$tripId:locked", $seatId);

            $unlocks = [
                [
                    'trip_id' => (int) $tripId,
                    'seat_id' => [$seatId],
                ],
            ];

            event(new SeatUnlocked(
                sessionToken: '',
                unlocks:      $unlocks
            ));
        }
    }
}
