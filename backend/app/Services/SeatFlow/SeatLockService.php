<?php

namespace App\Services\SeatFlow;

use App\Events\SeatLocked;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;
use App\Services\DraftCheckoutService\DraftCheckoutService;
use App\Services\SeatFlow\Redis\SeatRedisKeys;
use App\Models\Seat;

class SeatLockService
{
    const DEFAULT_TTL = 360;

    public function __construct(
        private DraftCheckoutService $drafts,
    ) {}

    public function lock(
        array $trips,
        string $sessionToken,
        int $ttl,
        ?int $userId = null,
        int $from_location_id,
        int $to_location_id,
        string $from_location,
        string $to_location,
        bool $forceNew = true
    ): array {
        [$seatsByTrip, $legsByTrip] = $this->normalizeTripsWithLeg($trips);

        if (empty($seatsByTrip)) {
            throw ValidationException::withMessages([
                'trips' => ['Không có ghế hợp lệ để lock.'],
            ]);
        }

        $allSeatIds = collect($seatsByTrip)->flatten()->unique()->values();
        $seatNumberById = Seat::whereIn('id', $allSeatIds)
            ->pluck('seat_number', 'id')
            ->toArray();

        $this->lockSeatsAcrossTrips($seatsByTrip, $seatNumberById, $sessionToken, $ttl);

        $draft = $this->drafts->createFromLocks(
            seatsByTrip: $seatsByTrip,
            legsByTrip: $legsByTrip,
            token: $sessionToken,
            userId: $userId,
            ttlSeconds: $ttl,
            fromLocationId: $from_location_id,
            toLocationId: $to_location_id,
            fromLocation: $from_location,
            toLocation: $to_location,
            forceNew: $forceNew
        );

        $ttlLeft = $this->ttlLeftForSeats($seatsByTrip);
        $items = array_map(function ($it) use ($ttlLeft) {
            $k = $it['trip_id'] . ':' . $it['seat_id'];
            $it['ttl_left'] = $ttlLeft[$k] ?? null;
            return $it;
        }, $draft['items']);

        $locksPayload = [];
        foreach ($seatsByTrip as $tripId => $seatIds) {
            $locksPayload[] = [
                'trip_id'     => (int)$tripId,
                'seat_ids'    => array_values($seatIds),
                'seat_labels' => array_map(
                    fn($seatId) => $seatNumberById[$seatId] ?? (string) $seatId,
                    $seatIds
                ),
                'leg'         => $legsByTrip[$tripId] ?? null,
            ];
        }
        SeatLocked::dispatch($sessionToken, $locksPayload);

        return [
            'success'    => true,
            'draft_id'   => $draft['draft_id'],
            'status'     => $draft['status'],
            'expires_at' => $draft['expires_at'],
            'totals'     => $draft['totals'],
            'items'      => $items,
        ];
    }

    private function normalizeTripsWithLeg(array $trips): array
    {
        $seatsByTrip = [];
        $legsByTrip  = [];

        foreach ($trips as $t) {
            $tripId  = (int)($t['trip_id'] ?? 0);
            $seatIds = array_values(array_unique(array_map('intval', (array)($t['seat_ids'] ?? []))));
            $seatIds = array_values(array_filter($seatIds, fn($v) => $v > 0));

            if ($tripId <= 0 || empty($seatIds)) continue;

            $seatsByTrip[$tripId] = $seatIds;

            $leg = strtoupper(trim((string)($t['leg'] ?? '')));
            $legsByTrip[$tripId] = in_array($leg, ['OUT', 'RETURN'], true) ? $leg : null;
        }

        return [$seatsByTrip, $legsByTrip];
    }

    private function lockSeatsAcrossTrips(
        array $seatsByTrip,
        array $seatNumberById,
        string $token,
        int $ttl
    ): void {
        // Load Lua script from external file
        $scriptPath = __DIR__ . '/Redis/Scripts/lock_seats_with_conflict_check.lua';
        if (!file_exists($scriptPath)) {
            throw new \RuntimeException("Lua script not found: {$scriptPath}");
        }
        $lua = file_get_contents($scriptPath);

        $payload = $seatsByTrip;

        $res = Redis::eval(
            $lua,
            0,
            json_encode($payload, JSON_UNESCAPED_UNICODE),
            $token,
            $ttl
        );

        if ($res !== 'OK') {
            $msg = 'Lỗi khi lock ghế. Vui lòng thử lại.';

            if (is_string($res) && str_starts_with($res, 'CONFLICTS:')) {
                $conflicts = json_decode(substr($res, 10), true) ?: [];

                if (!empty($conflicts)) {
                    $c = $conflicts[0];
                    $tripId  = $c['trip_id'] ?? '?';
                    $seatId  = (int)($c['seat_id'] ?? 0);
                    $seatNum = $seatNumberById[$seatId] ?? (string)$seatId;

                    if (($c['type'] ?? '') === 'BOOKED') {
                        $msg = "Ghế {$seatNum} đã được đặt. Vui lòng chọn ghế khác.";
                    } else {
                        $msg = "Ghế {$seatNum} đang được người khác đặt. Vui lòng chọn ghế khác.";
                    }
                }
            }

            throw ValidationException::withMessages([
                'seats' => [$msg],
            ]);
        }

        Redis::setex(SeatRedisKeys::sessionTtl($token), $ttl, 1);
    }


    private function ttlLeftForSeats(array $seatsByTrip): array
    {
        $map = [];
        foreach ($seatsByTrip as $tripId => $seatIds) {
            foreach ($seatIds as $sid) {
                $key = SeatRedisKeys::seatLock($tripId, $sid);
                $ttl = (int) Redis::ttl($key);
                $map["{$tripId}:{$sid}"] = $ttl > 0 ? $ttl : null;
            }
        }
        return $map;
    }
}
