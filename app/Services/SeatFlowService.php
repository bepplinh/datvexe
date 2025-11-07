<?php

namespace App\Services;

use RuntimeException;
use App\Models\DraftCheckout;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use App\Services\DraftCheckoutService\DraftCheckoutService;

class SeatFlowService
{
  public const DEFAULT_TTL               = 180; // giây
  public const MAX_PER_SESSION_PER_TRIP  = 6;   // giới hạn ghế/phiên/trip

  private ?string $luaTryLockSha = null;
  private ?string $luaReleaseSha = null;

  public function __construct(
    private DraftCheckoutService $drafts,
  ) {}

  /* ============================================================
     |  PUBLIC API
     * ============================================================
     */

  /**
   * Multi-trip checkout (atomic): lock tất cả ghế của nhiều trip trong 1 lần.
   *
   * @param array       $trips   [['trip_id'=>101,'seat_ids'=>[12,13],'leg'=>'OUT'], ...]
   * @param string      $token   Session token duy nhất (ổn định cho phiên)
   * @param int         $ttlSeconds
   * @param int         $maxPerSessionPerTrip
   * @param int|null    $userId  Nếu có đăng nhập
   * @return array      Kết quả JSON-friendly
   */


  /**
   * Dùng trước khi finalize 1 trip: khẳng định tất cả seat vẫn đang lock bởi token.
   */
  public function assertSeatsLockedByToken(int $tripId, array $seatIds, string $token): void
  {
    $seatIds = $this->normalizeSeatIds($seatIds);
    foreach ($seatIds as $sid) {
      $k = $this->kSeatLock($tripId, $sid);
      $owner = Redis::get($k);
      if ($owner !== $token) {
        throw new RuntimeException("Seat {$sid} (trip {$tripId}) không còn lock bởi token.");
      }
    }
  }

  /**
   * Dùng trước khi finalize multi-trip: assert theo map [tripId => [seatIds..]].
   */
  public function assertMultiLockedByToken(array $tripSeatMap, string $token): void
  {
    foreach ($tripSeatMap as $tid => $sids) {
      $this->assertSeatsLockedByToken((int)$tid, (array)$sids, $token);
    }
  }

  /**
   * Nhả ghế theo token cho danh sách trip (dùng khi hủy/timeout).
   * @return int Số ghế đã DEL
   */
  public function releaseLocksAfterBooked(array $tripIds, string $token): int
  {
    $this->ensureLuaLoaded();
    $tripIds = array_values(array_unique(array_map('intval', $tripIds)));

    // KEYS = [ trip:{tid}:locked_by:{token}, ... ]
    $setKeys = array_map(fn($tid) => $this->kTripLockedByToken($tid, $token), $tripIds);

    $res = $this->evalshaOrEval(
      Redis::connection(),
      $this->luaReleaseSha,
      $this->luaReleaseScript(),
      count($setKeys),
      array_merge($setKeys, [$token])
    );

    return (int)($res[0] ?? 0);
  }

  /* ============================================================
     |  KEY BUILDERS
     * ============================================================
     */

  private function kSeatLock(int $tripId, int $seatId): string
  {
    // Giữ format này vì Lua parse theo pattern này
    return "trip:{$tripId}:seat:{$seatId}:lock";
  }

  private function kTripLockedByToken(int $tripId, string $token): string
  {
    return "trip:{$tripId}:locked_by:{$token}";
  }

  private function kSessionSet(int $tripId, string $token): string
  {
    return "trip:{$tripId}:sess:{$token}:s";
  }

  private function kTripSet(int $tripId): string
  {
    return "trip:{$tripId}:locks:s";
  }

  /* ============================================================
     |  HELPERS
     * ============================================================
     */

  private function normalizeSeatIds(array $seatIds): array
  {
    $seatIds = array_values(array_unique(array_map('intval', $seatIds)));
    return array_values(array_filter($seatIds, fn($v) => $v > 0));
  }

  /**
   * @return array{0: array<int,array{trip_id:int,seat_id:int,leg?:string|null}>, 1: array<int,array<int>>}
   */
  private function normalizeTrips(array $trips): array
  {
    $pairs = [];       // [['trip_id'=>101,'seat_id'=>12,'leg'=>'OUT'], ...]
    $byTrip = [];      // [101 => [12,13], 202 => [5], ...]

    foreach ($trips as $t) {
      $tid  = (int)($t['trip_id'] ?? 0);
      $sids = $this->normalizeSeatIds($t['seat_ids'] ?? []);
      $leg  = isset($t['leg']) ? (string)$t['leg'] : null;
      if ($tid <= 0 || empty($sids)) continue;

      foreach ($sids as $sid) {
        $pairs[] = ['trip_id' => $tid, 'seat_id' => $sid, 'leg' => $leg];
      }
      $byTrip[$tid] = $sids;
    }

    // (option) sắp xếp theo trip_id để giảm deadlock giữa nhiều client
    usort($pairs, fn($a, $b) => $a['trip_id'] <=> $b['trip_id']);

    return [$pairs, $byTrip];
  }

  private function seatLabelFromKey(string $key): string
  {
    // Nếu có map seat_id→label trong DB thì thay thế logic này
    if (preg_match('/seat:(\d+):lock$/', $key, $m)) {
      return 'ID ' . $m[1];
    }
    return 'N/A';
  }

  private function ensureLuaLoaded(): void
  {
    if (!$this->luaTryLockSha) {
      $this->luaTryLockSha = (string) Redis::script('load', $this->luaTryLockScript());
    }
    if (!$this->luaReleaseSha) {
      $this->luaReleaseSha = (string) Redis::script('load', $this->luaReleaseScript());
    }
  }

  private function evalshaOrEval($redis, ?string $sha, string $script, int $numKeys, array $keysAndArgs)
  {
    try {
      // Predis: evalsha($sha, $numKeys, ...$params)
      return $redis->evalsha($sha, $numKeys, ...$keysAndArgs);
    } catch (\Throwable $e) {
      // Fallback: eval($script, $numKeys, ...$params)
      return $redis->eval($script, $numKeys, ...$keysAndArgs);
    }
  }

  /**
   * LUA: LOCK MULTI-TRIP (atomic)
   * KEYS = [ trip:{tid}:seat:{sid}:lock, ... ]
   * ARGV = [ token, ttlSeconds, maxPerTrip ]
   * Return:
   *  {1, lockedCount}
   *  {0, failedKey}
   *  {-1, tripId, limit, current, add}
   *  {-2, "BAD_KEY", key}
   */
  private function luaTryLockScript(): string
  {
    return <<< 'LUA'
local token  = ARGV[1]
local ttlSec = tonumber(ARGV[2]) or 180
local maxPer = tonumber(ARGV[3]) or 6
local ttlMs  = ttlSec * 1000

local function parseTripId(key)
  local tid = string.match(key, "^trip:(%d+):seat:")
  return tonumber(tid or "0")
end
local function parseSeatId(key)
  local sid = string.match(key, "^trip:%d+:seat:(%d+):lock$")
  return tonumber(sid or "0")
end
local function sessSetKey(tid)
  return "trip:"..tid..":sess:"..token..":s"
end
local function tripSetKey(tid)
  return "trip:"..tid..":locks:s"
end
local addCount = {}  -- tid -> count
local trips = {}

-- 0) gom ghế dự định lock theo từng trip & check key format
for i=1, #KEYS do
  local key = KEYS[i]
  local tid = parseTripId(key)
  if not (tid and tid>0) then
    return {-2, "BAD_KEY", key}
  end
  if not addCount[tid] then
    addCount[tid] = 0
    table.insert(trips, tid)
  end
  addCount[tid] = addCount[tid] + 1
end

-- 1) quota per trip (trước khi lock)
for _, tid in ipairs(trips) do
  local sess = sessSetKey(tid)
  local cur  = tonumber(redis.call("SCARD", sess)) or 0
  local need = addCount[tid]
  if (cur + need) > maxPer then
    return {-1, tid, maxPer, cur, need}
  end
end

-- 2) detect conflict trước (đỡ rollback)
for i=1, #KEYS do
  local key   = KEYS[i]
  local owner = redis.call("GET", key)
  if owner and owner ~= token then
    return {0, key}
  end
end

-- 3) acquire + index
for i=1, #KEYS do
  local key = KEYS[i]
  local ok  = redis.call("SET", key, token, "NX", "PX", ttlMs)
  if not ok then
    return {0, key}
  end

  local tid = parseTripId(key)
  local sid = parseSeatId(key)
  if tid and tid>0 and sid and sid>0 then
    local tset = tripSetKey(tid)
    local sset = sessSetKey(tid)
    redis.call("SADD", tset, sid)
    redis.call("SADD", sset, sid)
    redis.call("PEXPIRE", sset, ttlMs)
  end
end

return {1, #KEYS}
LUA;
  }

  /**
   * LUA: RELEASE by token-set per trip
   * KEYS = [ trip:{tid}:locked_by:{token}, ... ]  // hoặc dùng sess:{token}:s nếu bạn muốn
   * ARGV = [ token ]
   * Return: { releasedCount }
   */
  private function luaReleaseScript(): string
  {
    return <<< 'LUA'
local token = ARGV[1]
local released = 0

for i=1, #KEYS do
  local setKey = KEYS[i]
  local members = redis.call("SMEMBERS", setKey)
  for j=1, #members do
    local sid = tonumber(members[j]) or 0
    if sid>0 then
      local seatKey = string.gsub(setKey, ":locked_by:"..token.."$", ":seat:"..sid..":lock")
      seatKey = string.gsub(seatKey, ":locks:s$", ":seat:"..sid..":lock") -- phòng trường hợp build từ tripSet
      local owner = redis.call("GET", seatKey)
      if owner == token then
        redis.call("DEL", seatKey)
        released = released + 1
      end
    end
  end
  redis.call("DEL", setKey)
end

return {released}
LUA;
  }

  public function isSessionHoldAlive(string $token): bool
  {
    $key = "session:{$token}:ttl";

    // Nếu không tồn tại key => hết TTL
    if (!Redis::exists($key)) {
      return false;
    }

    // TTL: -2 = không tồn tại, -1 = không có expire, >0 = còn lại
    $ttl = Redis::ttl($key);

    return $ttl > 0;
  }

  /**
   * Khi chuyển sang PayOS, có thể dùng hàm này để nâng TTL lên TTL payos.
   * Ví dụ ttlPayos = 900 (15 phút).
   */
  public function promoteSessionTtlForPayos(string $sessionToken, int $ttlSeconds): void
  {
      $redis = Redis::connection('default');

      /*
       * 1) Kéo TTL cho session tổng
       *    session:{token}:ttl
       */
      $sessionKey = "session:{$sessionToken}:ttl";

      if ($redis->exists($sessionKey)) {
          $ttlBefore = $redis->ttl($sessionKey);
          $redis->expire($sessionKey, $ttlSeconds);
          $ttlAfter  = $redis->ttl($sessionKey);

          Log::info('[promoteSessionTtlForPayos] session ttl updated', [
              'key'        => $sessionKey,
              'ttl_before' => $ttlBefore,
              'ttl_after'  => $ttlAfter,
          ]);
      } else {
          Log::warning('[promoteSessionTtlForPayos] session key not found', [
              'key' => $sessionKey,
          ]);
      }

      /*
       * 2) Từ sessionToken → tìm draft hiện tại
       *    (pending / paying) để tránh dính draft cũ
       */
      $draft = DraftCheckout::query()
          ->where('session_token', $sessionToken)
          ->whereIn('status', ['pending', 'paying'])
          ->latest('id')
          ->with(['items' => function ($q) {
              $q->select('id', 'draft_checkout_id', 'trip_id', 'seat_id');
          }])
          ->first();

      if (!$draft) {
          Log::warning('[promoteSessionTtlForPayos] no draft found for session', [
              'session' => $sessionToken,
          ]);
          return;
      }

      /*
       * 3) Lấy unique (trip_id, seat_id) từ draft items
       */
      $pairs = $draft->items
          ->map(fn ($it) => $it->trip_id . ':' . $it->seat_id)
          ->unique()
          ->values()
          ->all();

      $updatedLocks = 0;

      foreach ($pairs as $pair) {
          [$tripId, $seatId] = explode(':', $pair);

          $lockKey = "trip:{$tripId}:seat:{$seatId}:lock";

          if ($redis->exists($lockKey)) {
              $lockTtlBefore = $redis->ttl($lockKey);
              $redis->expire($lockKey, $ttlSeconds);
              $lockTtlAfter  = $redis->ttl($lockKey);

              $updatedLocks++;

              Log::info('[promoteSessionTtlForPayos] seat lock ttl updated', [
                  'key'        => $lockKey,
                  'ttl_before' => $lockTtlBefore,
                  'ttl_after'  => $lockTtlAfter,
              ]);
          } else {
              Log::warning('[promoteSessionTtlForPayos] lock key not found', [
                  'key'    => $lockKey,
                  'tripId' => $tripId,
                  'seatId' => $seatId,
              ]);
          }
      }

      Log::info('[promoteSessionTtlForPayos] DONE', [
          'session'      => $sessionToken,
          'ttl'          => $ttlSeconds,
          'locks_updated'=> $updatedLocks,
      ]);
  }
}
