<?php

namespace App\Services\SeatFlow\Redis;

/**
 * Centralized Redis key generation for seat locking operations.
 * All Redis keys related to seat locking should be generated here
 * to ensure consistency and maintainability.
 */
class SeatRedisKeys
{
    /**
     * Key for individual seat lock
     * Format: trip:{tripId}:seat:{seatId}:lock
     */
    public static function seatLock(int $tripId, int $seatId): string
    {
        return "trip:{$tripId}:seat:{$seatId}:lock";
    }

    /**
     * Key for set of locked seats per trip
     * Format: trip:{tripId}:locked
     */
    public static function tripLockedSet(int $tripId): string
    {
        return "trip:{$tripId}:locked";
    }

    /**
     * Key for set of booked seats per trip
     * Format: trip:{tripId}:booked
     */
    public static function tripBookedSet(int $tripId): string
    {
        return "trip:{$tripId}:booked";
    }

    /**
     * Key for session TTL marker
     * Format: session:{token}:ttl
     */
    public static function sessionTtl(string $token): string
    {
        return "session:{$token}:ttl";
    }

    /**
     * Key for seats locked by session token
     * Format: session:{token}:seats
     */
    public static function sessionSeats(string $token): string
    {
        return "session:{$token}:seats";
    }

    /**
     * Key for trips associated with session
     * Format: sess:{token}:trips
     */
    public static function sessionTrips(string $token): string
    {
        return "sess:{$token}:trips";
    }

    /**
     * Key for seats locked by token per trip
     * Format: trip:{tripId}:locked_by:{token}
     */
    public static function tripLockedByToken(int $tripId, string $token): string
    {
        return "trip:{$tripId}:locked_by:{$token}";
    }

    /**
     * Key for session seats per trip
     * Format: trip:{tripId}:sess:{token}:s
     */
    public static function tripSessionSeats(int $tripId, string $token): string
    {
        return "trip:{$tripId}:sess:{$token}:s";
    }

    /**
     * Key for trip locks set
     * Format: trip:{tripId}:locks:s
     */
    public static function tripLocksSet(int $tripId): string
    {
        return "trip:{$tripId}:locks:s";
    }
}
