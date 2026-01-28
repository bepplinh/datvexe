-- LUA: RELEASE by token-set per trip
-- KEYS = [ trip:{tid}:locked_by:{token}, ... ]
-- ARGV = [ token ]
-- Return: { releasedCount }

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
