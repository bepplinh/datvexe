<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;
    

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'description',
        'max_discount_amount',
        'min_order_value',
        'applies_to',
        'start_date',
        'end_date',
        'usage_limit_global',
        'usage_limit_per_user',
        'is_active',
    ];

    // Ép kiểu cho các trường
    protected $casts = [
        'is_active' => 'boolean',
        'discount_value' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'min_order_value' => 'decimal:2',
        'applies_to' => 'array', // Tự động serialize/deserialize JSON
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    // Quan hệ: Một Coupon có nhiều lần sử dụng
    public function usages()
    {
        return $this->hasMany(CouponUsage::class);
    }
}