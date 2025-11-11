<?php

namespace App\Services\SeatFlow;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use App\Events\SeatUnlocked;

class LockExpireCleaner
{
    /**
     * Dọn 1 ghế khi key ...:lock expired.
     * - Dựa vào lockidx:{tripId}:{seatId} để lấy token (TTL đệm +5s).
     * - Xoá khỏi trip locked set, session set, zset (nếu bạn có), xoá lockidx.
     * - Broadcast SeatUnlocked.
     */
    public function cleanupSeatExpired(int $tripId, int $seatId): void
    {
        $lua = <<<LUA
local tripId  = ARGV[1]
local seatId  = ARGV[2]
local idxKey  = "lockidx:"..tripId..":"..seatId
local token   = redis.call("GET", idxKey)

-- Xoá khỏi trip locked set
redis.call("SREM", "trip:"..tripId..":locked", seatId)

-- Nếu có token, xoá khỏi session:{token}:seats và ZSET due nếu dùng
if token then
  local sessionSet = "session:"..token..":seats"
  redis.call("SREM", sessionSet, tripId .. ":" .. seatId)
  redis.call("ZREM", "locks:due", tripId .. ":" .. seatId .. ":" .. token)
end

-- Xoá idxKey để sạch rác (nếu còn)
redis.call("DEL", idxKey)

-- Trả token (có thể nil)
return token or ""
LUA;

        $token = (string) Redis::eval($lua, 0, (string)$tripId, (string)$seatId);

        // Phát realtime (ngoài Lua)
        try {
            broadcast(new SeatUnlocked($tripId, $seatId, 'expired'))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('broadcast SeatUnlocked failed: '.$e->getMessage(), compact('tripId','seatId'));
        }
    }
}
