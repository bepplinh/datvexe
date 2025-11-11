<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CouponUsage extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'coupon_id',
        'user_id',
        'booking_id',
        'discount_amount',
    ];

    // Quan hệ: Một lần sử dụng thuộc về một Coupon
    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    // Quan hệ: Một lần sử dụng thuộc về một User (giả định có Model User)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Quan hệ: Một lần sử dụng thuộc về một Order (giả định có Model Order)
    public function bookings()
    {
        return $this->belongsTo(Booking::class);
    }
}