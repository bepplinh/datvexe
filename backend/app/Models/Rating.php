<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    protected $fillable = ['trip_id', 'booking_leg_id', 'user_id', 'score', 'comment'];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }

    public function bookingLeg()
    {
        return $this->belongsTo(BookingLeg::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
