<?php

namespace App\Services\SeatFlow;

use App\Events\SeatLocked;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;
use App\Services\DraftCheckoutService\DraftCheckoutService;
use App\Models\Seat;

class SeatLockService
{
    const DEFAULT_TTL = 10;

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
        string $to_location
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
            toLocation: $to_location
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
        $lua = <<<'LUA'
    local payload = cjson.decode(ARGV[1])
    local token   = ARGV[2]
    local ttl     = tonumber(ARGV[3])
    
    -- Thu thập conflict trước
    local conflicts = {}  -- mỗi phần tử: {type="BOOKED"/"LOCKED", trip_id=..., seat_id=...}
    
    for trip_id_str, seat_list in pairs(payload) do
        local trip_id = tostring(trip_id_str)
        for _, seat_id in ipairs(seat_list) do
            local seatKey   = "trip:" .. trip_id .. ":seat:" .. seat_id .. ":lock"
            local bookedKey = "trip:" .. trip_id .. ":booked"
    
            -- Nếu ghế đã BOOKED
            if redis.call("SISMEMBER", bookedKey, seat_id) == 1 then
                table.insert(conflicts, { type = "BOOKED", trip_id = trip_id, seat_id = seat_id })
            else
                local current = redis.call("GET", seatKey)
                if current and current ~= token then
                    table.insert(conflicts, { type = "LOCKED", trip_id = trip_id, seat_id = seat_id })
                end
            end
        end
    end
    
    -- Nếu có bất kỳ conflict -> không lock gì cả
    if #conflicts > 0 then
        return "CONFLICTS:" .. cjson.encode(conflicts)
    end
    
    -- Không conflict -> lock tất cả
    local tripsSet = "sess:" .. token .. ":trips"
    
    for trip_id_str, seat_list in pairs(payload) do
        local trip_id = tostring(trip_id_str)
        
        -- Thêm trip_id vào set trips của session
        redis.call("SADD", tripsSet, trip_id)
        
        for _, seat_id in ipairs(seat_list) do
            local seatKey = "trip:" .. trip_id .. ":seat:" .. seat_id .. ":lock"
    
            -- key lock theo ghế
            redis.call("SET", seatKey, token, "EX", ttl)
    
            -- set ghế đang locked theo trip
            redis.call("SADD", "trip:" .. trip_id .. ":locked", seat_id)
    
            -- set ghế theo session token
            redis.call("SADD", "session:" .. token .. ":seats", trip_id .. ":" .. seat_id)
            
            -- set ghế theo session và trip (để dễ query sau)
            redis.call("SADD", "trip:" .. trip_id .. ":sess:" .. token .. ":s", seat_id)
        end
    end
    
    -- Set TTL cho trips set (cùng TTL với session)
    redis.call("EXPIRE", tripsSet, ttl)
    
    return "OK"
    LUA;

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
                        $msg = "Ghế {$seatNum} đã được đặt trong chuyến {$tripId}. Vui lòng chọn ghế khác.";
                    } else {
                        $msg = "Ghế {$seatNum} đang được người khác đặt trong chuyến {$tripId}. Vui lòng chọn ghế khác.";
                    }
                }
            }

            throw ValidationException::withMessages([
                'seats' => [$msg],
            ]);
        }

        Redis::setex("session:{$token}:ttl", $ttl, 1);
    }


    private function ttlLeftForSeats(array $seatsByTrip): array
    {
        $map = [];
        foreach ($seatsByTrip as $tripId => $seatIds) {
            foreach ($seatIds as $sid) {
                $key = "trip:{$tripId}:seat:{$sid}:lock";
                $ttl = (int) Redis::ttl($key);
                $map["{$tripId}:{$sid}"] = $ttl > 0 ? $ttl : null;
            }
        }
        return $map;
    }
}
