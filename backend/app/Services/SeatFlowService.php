<?php

namespace App\Services;

use RuntimeException;
use App\Models\Seat;
use App\Models\DraftCheckout;
use App\Models\TripSeatStatus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use App\Services\DraftCheckoutService\DraftCheckoutService;
use App\Services\SeatFlow\Redis\SeatRedisKeys;

class SeatFlowService
{
  public const DEFAULT_TTL               = 180; // giây
  public const MAX_PER_SESSION_PER_TRIP  = 6;   // giới hạn ghế/phiên/trip

  private ?string $luaTryLockSha = null;
  private ?string $luaReleaseSha = null;

  public function __construct(
    private DraftCheckoutService $drafts,
  ) {}
  /**
   * Load trạng thái sơ đồ ghế (booked từ DB + locked từ Redis)
   */
  public function loadStatus(int $tripId, array $seatIds): array
  {
    $seatIds = $this->normalizeSeatIds($seatIds);
    if (empty($seatIds)) {
      return [
        'locked' => [],
        'booked' => [],
      ];
    }

    // 1. Ghế đã book (DB)
    $bookedSeatIds = TripSeatStatus::query()
      ->where('trip_id', $tripId)
      ->whereIn('seat_id', $seatIds)
      ->where('is_booked', true)
      ->pluck('seat_id')
      ->map(fn ($id) => (int)$id)
      ->values()
      ->all();

    // 2. Ghế đang lock trên Redis
    $lockedKey = SeatRedisKeys::tripLockedSet($tripId);
    $lockedSeatIds = array_map('intval', Redis::smembers($lockedKey) ?: []);
    $lockedSeatIds = array_values(array_intersect($lockedSeatIds, $seatIds));

    $locked = [];
    if (!empty($lockedSeatIds)) {
      $seatNumberById = Seat::whereIn('id', $lockedSeatIds)
        ->pluck('seat_number', 'id')
        ->toArray();

      foreach ($lockedSeatIds as $seatId) {
        $ttl = (int) Redis::ttl(SeatRedisKeys::seatLock($tripId, $seatId));
        if ($ttl <= 0) {
          // TTL hết hạn -> gỡ khỏi set locked để tránh hiển thị sai
          Redis::srem($lockedKey, $seatId);
          continue;
        }

        $locked[] = [
          'seat_id'    => $seatId,
          'seat_label' => $seatNumberById[$seatId] ?? (string)$seatId,
          'ttl'        => $ttl,
        ];
      }
    }

    return [
      'locked' => $locked,
      'booked' => $bookedSeatIds,
    ];
  }



  public function assertSeatsLockedByToken(int $tripId, array $seatIds, string $token): void
  {
    $seatIds = $this->normalizeSeatIds($seatIds);
    foreach ($seatIds as $sid) {
      $k = SeatRedisKeys::seatLock($tripId, $sid);
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
    $setKeys = array_map(fn($tid) => SeatRedisKeys::tripLockedByToken($tid, $token), $tripIds);

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
   * Loads script from external file for better maintainability
   */
  private function luaTryLockScript(): string
  {
    $scriptPath = __DIR__ . '/SeatFlow/Redis/Scripts/lock_seats.lua';
    if (!file_exists($scriptPath)) {
      throw new RuntimeException("Lua script not found: {$scriptPath}");
    }
    return file_get_contents($scriptPath);
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
    $key = SeatRedisKeys::sessionTtl($token);

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
      $sessionKey = SeatRedisKeys::sessionTtl($sessionToken);

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

          $lockKey = SeatRedisKeys::seatLock((int)$tripId, (int)$seatId);

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