<?php

namespace App\Models;

use App\Models\Trip;
use App\Models\User;
use App\Models\BookingItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booking extends Model
{
    use HasFactory;
    protected $table = 'bookings';

    protected $fillable = [
        'code',
        'user_id',
        'coupon_id',
        'subtotal_price',
        'total_price',
        'discount_amount',
        'status',
        'payment_provider',
        'payment_intent_id',
        'passenger_name',
        'passenger_phone',
        'passenger_email',
        'origin_location_id',
        'destination_location_id',
        'pickup_address',
        'dropoff_address',
        'source',
        'booked_by_admin_id',
        'paid_at',
        'created_at',
        'cancelled_at',
    ];

    protected $casts = [
        'subtotal_price' => 'decimal:0',
        'total_price' => 'decimal:0',
        'discount_amount' => 'decimal:0',
        'paid_at' => 'datetime',
        'cancelled_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function legs()
    {
        return $this->hasMany(BookingLeg::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Scope a query to only include upcoming bookings.
     * At least one leg has a departure time in the future.
     */
    public function scopeUpcoming($query)
    {
        return $query->whereHas('legs.trip', function ($q) {
            $q->where('departure_time', '>', now());
        });
    }

    /**
     * Scope a query to only include completed bookings.
     * All legs have departure times in the past.
     * We use whereDoesntHave with the inverse condition (future trips)
     * to say "does not have any future trips" => all trips are past (or empty).
     */
    public function scopeCompleted($query)
    {
        return $query->whereDoesntHave('legs.trip', function ($q) {
            $q->where('departure_time', '>', now());
        });
    }
}
