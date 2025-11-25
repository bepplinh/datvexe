<?php

namespace App\Services\SeatFlow;

use App\Events\SeatUnlocked;
use App\Models\Seat;
use Illuminate\Support\Facades\Redis;

class SeatReleaseService
{
    /**
     * Public API: Huỷ toàn bộ khoá ghế theo sessionToken.
     * Trả về mảng các cặp ghế đã release để FE/Realtime cập nhật.
     */
    public function cancelAllBySession(string $sessionToken): array
    {
        $result = $this->releaseAllBySession($sessionToken);

        // Gom nhóm theo trip để bắn realtime SeatUnlocked (nếu bạn dùng)
        $releasedPairs = $result['released'] ?? [];
        if (!empty($releasedPairs)) {
            // releasedPairs: ["{tripId}:{seatId}", ...]
            $byTrip = [];
            $allSeatIds = [];
            foreach ($releasedPairs as $pair) {
                [$tripId, $seatId] = array_map('intval', explode(':', $pair, 2));
                $byTrip[$tripId][] = $seatId;
                $allSeatIds[] = $seatId;
            }

            // Query seat_labels từ database
            $seatLabelsById = [];
            if (!empty($allSeatIds)) {
                $seatLabelsById = Seat::whereIn('id', array_unique($allSeatIds))
                    ->pluck('seat_number', 'id')
                    ->toArray();
            }

            $payload = [];
            foreach ($byTrip as $tripId => $seatIds) {
                $seatIds = array_values(array_unique($seatIds));
                $seatLabels = array_map(
                    fn($seatId) => $seatLabelsById[$seatId] ?? (string) $seatId,
                    $seatIds
                );

                $payload[] = [
                    'trip_id'     => (int)$tripId,
                    'seat_ids'    => $seatIds,
                    'seat_labels' => $seatLabels,
                ];
            }

            // phát realtime để FE un-highlight ghế
            if (class_exists(SeatUnlocked::class)) {
                SeatUnlocked::dispatch($sessionToken, $payload);
            }
        }

        return [
            'success'     => true,
            'released'    => $result['released']   ?? [],
            'dangling'    => $result['dangling']   ?? [],
            'mismatched'  => $result['mismatched'] ?? [],
        ];
    }

    /**
     * Core: Huỷ **toàn bộ** lock theo session token (atomic).
     * - Xoá key lock đúng token
     * - SREM khỏi set trip:{id}:locked
     * - SREM & DEL session:{token}:seats
     * - Tự dọn rác nếu TTL đã hết (dangling)
     */
    private function releaseAllBySession(string $token): array
    {
        $lua = <<<'LUA'
local token = ARGV[1]
local sessionSet = "session:" .. token .. ":seats"
local tripsSet = "sess:" .. token .. ":trips"

local pairs = redis.call("SMEMBERS", sessionSet)
local released = {}
local dangling = {}   -- còn trong session set, nhưng key lock đã hết TTL
local mismatched = {} -- key lock tồn tại nhưng value != token
local tripsToCheck = {} -- tập hợp trip_ids để kiểm tra xóa sau

for _, pair in ipairs(pairs) do
    -- pair dạng "tripId:seatId"
    local delim = string.find(pair, ":")
    if delim then
        local trip_id = string.sub(pair, 1, delim - 1)
        local seat_id = string.sub(pair, delim + 1)
        local seatKey = "trip:" .. trip_id .. ":seat:" .. seat_id .. ":lock"
        local lockedSet = "trip:" .. trip_id .. ":locked"
        local tripSessionSet = "trip:" .. trip_id .. ":sess:" .. token .. ":s"

        tripsToCheck[trip_id] = true

        local cur = redis.call("GET", seatKey)
        if not cur then
            -- TTL đã hết -> dọn set cho sạch
            redis.call("SREM", sessionSet, pair)
            redis.call("SREM", lockedSet, seat_id)
            redis.call("SREM", tripSessionSet, seat_id)
            table.insert(dangling, pair)
        elseif cur ~= token then
            -- khoá bởi token khác -> không đụng key lock, chỉ dọn session set
            redis.call("SREM", sessionSet, pair)
            redis.call("SREM", tripSessionSet, seat_id)
            table.insert(mismatched, pair)
        else
            -- đúng token -> xoá lock + dọn set
            redis.call("DEL", seatKey)
            redis.call("SREM", lockedSet, seat_id)
            redis.call("SREM", sessionSet, pair)
            redis.call("SREM", tripSessionSet, seat_id)
            table.insert(released, pair)
        end
        
        -- Xóa tripSessionSet nếu rỗng
        if redis.call("SCARD", tripSessionSet) == 0 then
            redis.call("DEL", tripSessionSet)
        end
    end
end

-- Nếu set session đã rỗng, DEL luôn
if redis.call("SCARD", sessionSet) == 0 then
    redis.call("DEL", sessionSet)
    -- Xóa trips set nếu session set đã rỗng
    redis.call("DEL", tripsSet)
else
    -- Cập nhật trips set: chỉ giữ lại các trip còn có seats
    local remainingTrips = {}
    for trip_id, _ in pairs(tripsToCheck) do
        local tripSessionSet = "trip:" .. trip_id .. ":sess:" .. token .. ":s"
        if redis.call("EXISTS", tripSessionSet) == 1 and redis.call("SCARD", tripSessionSet) > 0 then
            table.insert(remainingTrips, trip_id)
        end
    end
    
    -- Xóa trips set và tạo lại với các trip còn lại
    redis.call("DEL", tripsSet)
    if #remainingTrips > 0 then
        for _, trip_id in ipairs(remainingTrips) do
            redis.call("SADD", tripsSet, trip_id)
        end
    end
end

return cjson.encode({
    released   = released,
    dangling   = dangling,
    mismatched = mismatched
})
LUA;

        $json = Redis::eval($lua, 0, $token);
        return json_decode((string)$json, true) ?: [];
    }
}
