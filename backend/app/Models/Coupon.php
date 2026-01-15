<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

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

    /**
     * Kiểm tra trạng thái hiệu lực theo cờ active và khoảng thời gian.
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = Carbon::now();

        if ($this->start_date && $now->lt($this->start_date)) {
            return false;
        }

        if ($this->end_date && $now->gt($this->end_date)) {
            return false;
        }

        return true;
    }

    /**
     * Tính giá trị giảm theo loại discount và giới hạn trần.
     */
    public function calculateDiscount(float $orderAmount): float
    {
        $discount = 0;

        if ($this->discount_type === 'percentage') {
            $discount = ($this->discount_value / 100) * $orderAmount;
        } elseif ($this->discount_type === 'fixed_amount') {
            $discount = $this->discount_value;
        }

        // Giảm không vượt quá tổng đơn
        $discount = min($discount, $orderAmount);

        // Giới hạn trần giảm giá nếu có
        if ($this->max_discount_amount) {
            $discount = min($discount, (float) $this->max_discount_amount);
        }

        return (float) $discount;
    }
}