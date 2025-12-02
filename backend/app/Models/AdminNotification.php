<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// app/Models/AdminNotification.php
class AdminNotification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'message',
        'booking_id',
        'user_id',
        'total_price',
        'is_read',
        'read_at',
    ];
    protected $casts = [
        'is_read' => 'boolean',
        'total_price' => 'decimal:0',
        'read_at' => 'datetime',
    ];
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
