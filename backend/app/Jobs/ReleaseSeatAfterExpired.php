<?php

namespace App\Jobs;

use App\Events\SeatUnlocked;
use App\Models\DraftCheckout;
use App\Models\Seat;
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
        // Key mong đợi: session:{sessionToken}:ttl
        $parts = explode(':', $this->key);

        if (count($parts) !== 3 || $parts[0] !== 'session' || $parts[2] !== 'ttl') {
            return;
        }

        $sessionToken = $parts[1] ?? '';
        if ($sessionToken === '') {
            return;
        }

        $redis    = Redis::connection('default');
        $tripsKey = "sess:{$sessionToken}:trips";
        $sessionSeatsKey = "session:{$sessionToken}:seats";

        // ✅ ƯU TIÊN: Lấy thông tin từ DRAFT (database) trước vì Redis có thể đã expire
        $legsByTrip = [];
        $seatsByTripFromDraft = [];

        $draft = DraftCheckout::query()
            ->with(['legs.items', 'items'])
            ->where('session_token', $sessionToken)
            ->whereIn('status', ['pending', 'paying'])
            ->first();

        if ($draft && !$draft->relationLoaded('legs')) {
            $draft->load('legs.items');
        }

        if ($draft && $draft->legs) {
            foreach ($draft->legs as $leg) {
                $tripId = (int) $leg->trip_id;
                if ($tripId > 0) {
                    $legsByTrip[$tripId] = $leg->leg;

                    if ($leg->items && $leg->items->isNotEmpty()) {
                        $seatIds = $leg->items->pluck('seat_id')
                            ->filter(fn($id) => $id > 0)
                            ->unique()
                            ->values()
                            ->toArray();

                        if (!empty($seatIds)) {
                            $seatsByTripFromDraft[$tripId] = $seatIds;
                        }
                    }
                }
            }
        }

        // Lấy trips từ draft (ưu tiên) hoặc từ Redis (fallback)
        $tripIds = [];

        if (!empty($legsByTrip)) {
            $tripIds = array_keys($legsByTrip);
        } else {
            $tripIds = $redis->smembers($tripsKey);

            if (empty($tripIds)) {
                $sessionSeats = $redis->smembers($sessionSeatsKey);
                $tripIdsFromSeats = [];

                foreach ($sessionSeats as $pair) {
                    $parts = explode(':', $pair, 2);
                    if (count($parts) === 2) {
                        $tripId = (int) $parts[0];
                        if ($tripId > 0 && !in_array($tripId, $tripIdsFromSeats, true)) {
                            $tripIdsFromSeats[] = $tripId;
                        }
                    }
                }

                $tripIds = $tripIdsFromSeats;
            }
        }

        $unlocks = [];
        $allSeatIds = [];

        if (!empty($tripIds)) {
            foreach ($tripIds as $tripId) {
                $tripId = (int) $tripId;
                if (!$tripId) {
                    continue;
                }

                // ✅ ƯU TIÊN: Lấy seats từ draft (database) trước
                $seatIds = [];
                // Tạo key Redis - tạo lại ở mỗi chỗ để tránh vấn đề scope
                $sessSeatsKeyForTrip = "trip:{$tripId}:sess:{$sessionToken}:s";

                if (isset($seatsByTripFromDraft[$tripId]) && !empty($seatsByTripFromDraft[$tripId])) {
                    $seatIds = $seatsByTripFromDraft[$tripId];
                } else {
                    $seatIds = $redis->smembers($sessSeatsKeyForTrip);
                    $seatIds = array_map('intval', $seatIds);
                    $seatIds = array_values(array_filter($seatIds, fn($id) => $id > 0));

                    if (empty($seatIds)) {
                        $sessionSeats = $redis->smembers($sessionSeatsKey);

                        foreach ($sessionSeats as $pair) {
                            $parts = explode(':', $pair, 2);
                            if (count($parts) === 2 && (int)$parts[0] === $tripId) {
                                $seatId = (int) $parts[1];
                                if ($seatId > 0) {
                                    $seatIds[] = $seatId;
                                }
                            }
                        }

                        $seatIds = array_values(array_unique($seatIds));
                    }
                }

                if (empty($seatIds)) {
                    // Không còn ghế cho trip này -> xoá set và tiếp
                    $redis->del($sessSeatsKeyForTrip);
                    continue;
                }

                // Thu thập tất cả seat IDs để query một lần
                $allSeatIds = array_merge($allSeatIds, array_map('intval', $seatIds));

                // 1) Xoá ghế khỏi set locked chung của trip
                $lockedKey = "trip:{$tripId}:locked";
                $redis->srem($lockedKey, ...$seatIds);

                // 2) Xoá set ghế theo session
                $redis->del($sessSeatsKeyForTrip);

                // 3) Xoá từng key lock ghế
                foreach ($seatIds as $seatId) {
                    $lockKey = "trip:{$tripId}:seat:{$seatId}:lock";
                    $redis->del($lockKey);
                }

                // Gom vào payload để bắn event realtime (tạm thời chưa có seat_labels)
                $unlocks[] = [
                    'trip_id' => $tripId,
                    'seat_id' => array_map('intval', $seatIds),
                ];
            }
        }

        // Query seat_labels từ database nếu có seat IDs
        $seatLabelsById = [];
        if (!empty($allSeatIds)) {
            $seatLabelsById = Seat::whereIn('id', array_unique($allSeatIds))
                ->pluck('seat_number', 'id')
                ->toArray();
        }

        // Cập nhật unlocks với seat_labels và leg
        foreach ($unlocks as &$unlock) {
            $tripId = (int) ($unlock['trip_id'] ?? 0);
            $seatIds = $unlock['seat_id'] ?? [];

            $unlock['seat_labels'] = array_map(
                fn($seatId) => $seatLabelsById[$seatId] ?? (string) $seatId,
                $seatIds
            );

            // Thêm leg nếu có
            if (isset($legsByTrip[$tripId])) {
                $unlock['leg'] = $legsByTrip[$tripId];
            }
        }
        unset($unlock);

        // Xoá danh sách trip của session này (vì session TTL đã hết)
        $redis->del($tripsKey);

        // 🔥 Luôn expire draft cho session này (dù có trip hay không)
        $this->expireDraftsBySession($sessionToken);

        // Nếu có ghế thực sự được giải phóng -> bắn event realtime
        if (!empty($unlocks)) {
            try {
                $event = new SeatUnlocked(
                    sessionToken: $sessionToken,
                    unlocks: $unlocks
                );

                broadcast($event);
            } catch (\Throwable $e) {
                Log::error('[ReleaseSeatAfterExpired] Failed to broadcast SeatUnlocked event', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }
    }

    protected function expireDraftsBySession(string $sessionToken): void
    {
        DraftCheckout::query()
            ->where('session_token', $sessionToken)
            ->whereIn('status', ['pending', 'paying'])
            ->chunkById(50, function ($drafts) {
                foreach ($drafts as $draft) {
                    DB::transaction(function () use ($draft) {
                        $draft->refresh();

                        if (!in_array($draft->status, ['pending', 'paying'], true)) {
                            return;
                        }

                        $draft->update([
                            'status' => 'expired',
                        ]);
                    });
                }
            });
    }
}
