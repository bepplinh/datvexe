-- LUA: LOCK MULTI-TRIP (atomic)
-- KEYS = [ trip:{tid}:seat:{sid}:lock, ... ]
-- ARGV = [ token, ttlSeconds, maxPerTrip ]
-- Return:
--  {1, lockedCount}
--  {0, failedKey}
--  {-1, tripId, limit, current, add}
--  {-2, "BAD_KEY", key}

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
