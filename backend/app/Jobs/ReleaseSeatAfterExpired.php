<?php

namespace App\Jobs;

use App\Events\SeatUnlocked;
use App\Models\DraftCheckout;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class ReleaseSeatAfterExpired implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Nếu muốn tránh retry nhiều lần khi debug:
    // public $tries = 1;

    public function __construct(public string $key) {}

    public function handle(): void
    {
        Log::info('[ReleaseSeatAfterExpired] HANDLE START', [
            'key' => $this->key,
        ]);

        // Key mong đợi: session:{sessionToken}:ttl
        $parts = explode(':', $this->key);

        if (count($parts) !== 3 || $parts[0] !== 'session' || $parts[2] !== 'ttl') {
            Log::info('[ReleaseSeatAfterExpired] Skip key (not session TTL)', [
                'key'   => $this->key,
                'parts' => $parts,
            ]);
            return;
        }

        $sessionToken = $parts[1] ?? '';
        if ($sessionToken === '') {
            Log::warning('[ReleaseSeatAfterExpired] Empty session token after parse', [
                'key' => $this->key,
            ]);
            return;
        }

        $redis    = Redis::connection('default');
        $tripsKey = "sess:{$sessionToken}:trips";

        // Lấy tất cả trip mà session này có ghế
        $tripIds = $redis->smembers($tripsKey);

        Log::info('[ReleaseSeatAfterExpired] Trips for session', [
            'session'  => $sessionToken,
            'trip_key' => $tripsKey,
            'trip_ids' => $tripIds,
        ]);

        $unlocks = [];

        if (!empty($tripIds)) {
            foreach ($tripIds as $tripId) {
                $tripId = (int) $tripId;
                if (!$tripId) {
                    continue;
                }

                // Set chứa các seat mà session này lock trên trip này
                $sessSeatsKey = "trip:{$tripId}:sess:{$sessionToken}:s";
                $seatIds      = $redis->smembers($sessSeatsKey);

                if (empty($seatIds)) {
                    // Không còn ghế cho trip này -> xoá set và tiếp
                    $redis->del($sessSeatsKey);
                    continue;
                }

                // 1) Xoá ghế khỏi set locked chung của trip
                $lockedKey = "trip:{$tripId}:locked";
                $redis->srem($lockedKey, ...$seatIds);

                // 2) Xoá set ghế theo session
                $redis->del($sessSeatsKey);

                // 3) Xoá từng key lock ghế
                foreach ($seatIds as $seatId) {
                    $lockKey = "trip:{$tripId}:seat:{$seatId}:lock";
                    $redis->del($lockKey);
                }

                // Gom vào payload để bắn event realtime
                $unlocks[] = [
                    'trip_id' => $tripId,
                    'seat_id' => array_map('intval', $seatIds),
                ];
            }
        }

        // Xoá danh sách trip của session này (vì session TTL đã hết)
        $redis->del($tripsKey);

        // 🔥 Luôn expire draft cho session này (dù có trip hay không)
        $this->expireDraftsBySession($sessionToken);

        // Nếu có ghế thực sự được giải phóng -> bắn event realtime
        if (!empty($unlocks)) {
            Log::info('[ReleaseSeatAfterExpired] Dispatch SeatUnlocked event', [
                'session' => $sessionToken,
                'unlocks' => $unlocks,
            ]);

            event(new SeatUnlocked(
                sessionToken: $sessionToken,
                unlocks:      $unlocks
            ));
        }

        Log::info('[ReleaseSeatAfterExpired] HANDLE DONE', [
            'session'       => $sessionToken,
            'unlock_count'  => count($unlocks),
        ]);
    }

    protected function expireDraftsBySession(string $sessionToken): void
    {
        Log::info('[ReleaseSeatAfterExpired] expire drafts for session', [
            'session' => $sessionToken,
        ]);

        DraftCheckout::query()
            ->where('session_token', $sessionToken)
            ->whereIn('status', ['pending', 'paying']) // chỉnh theo enum status của bạn
            ->chunkById(50, function ($drafts) use ($sessionToken) {
                Log::info('[ReleaseSeatAfterExpired] drafts found', [
                    'session' => $sessionToken,
                    'count'   => $drafts->count(),
                ]);

                foreach ($drafts as $draft) {
                    DB::transaction(function () use ($draft) {
                        $draft->refresh();

                        if (!in_array($draft->status, ['pending', 'paying'], true)) {
                            Log::info('[ReleaseSeatAfterExpired] skip draft, status now', [
                                'draft_id' => $draft->id,
                                'status'   => $draft->status,
                            ]);
                            return;
                        }

                        $draft->update([
                            'status' => 'expired',
                            // 'expired_at' => now(), // nếu có
                        ]);

                        Log::info('[ReleaseSeatAfterExpired] draft expired', [
                            'draft_id' => $draft->id,
                            'status'   => $draft->status,
                        ]);
                    });
                }
            });
    }
}
