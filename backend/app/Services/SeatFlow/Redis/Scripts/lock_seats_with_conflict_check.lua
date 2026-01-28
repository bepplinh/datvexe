-- Lock seats across multiple trips atomically
-- ARGV[1] = JSON payload: {"trip_id": [seat_id1, seat_id2, ...], ...}
-- ARGV[2] = token (session token)
-- ARGV[3] = ttl (seconds)
-- Returns: "OK" or "CONFLICTS:{json_array}"

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
