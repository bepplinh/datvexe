<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CouponSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Xóa dữ liệu cũ (Tùy chọn, để tránh trùng lặp mã 'code')
        // Coupon::truncate(); 

        // 1. Mã giảm giá cố định: GIAM50K (Giảm 50.000 VNĐ)
        Coupon::create([
            'code' => 'GIAM50K',
            'discount_type' => 'fixed_amount',
            'discount_value' => 50000,
            'max_discount_amount' => null, // Không giới hạn
            'min_order_value' => 0,
            'start_date' => Carbon::now()->subDays(1),
            'end_date' => Carbon::now()->addMonths(1),
            'usage_limit_global' => null,
            'usage_limit_per_user' => null,
            'is_active' => true,
        ]);

        // 2. Mã giảm giá phần trăm: SALE20 (Giảm 20% tối đa 100k)
        Coupon::create([
            'code' => 'SALE20',
            'discount_type' => 'percentage',
            'discount_value' => 20.00,
            'max_discount_amount' => 100000, // Giảm tối đa 100.000 VNĐ
            'min_order_value' => 0,
            'start_date' => Carbon::now()->subDays(7),
            'end_date' => Carbon::now()->addWeeks(2),
            'usage_limit_global' => null,
            'usage_limit_per_user' => null,
            'is_active' => true,
        ]);

        // 3. Mã giới hạn sử dụng: NEWUSER (Chỉ dùng được 1 lần/người)
        Coupon::create([
            'code' => 'NEWUSER',
            'discount_type' => 'fixed_amount',
            'discount_value' => 30000,
            'max_discount_amount' => null,
            'min_order_value' => 0,
            'start_date' => Carbon::now()->subMonths(1),
            'end_date' => Carbon::now()->addYears(1),
            'usage_limit_global' => 100, // Tổng cộng 100 lần
            'usage_limit_per_user' => 1, // Mỗi người chỉ 1 lần
            'is_active' => true,
        ]);

        // 4. Mã áp dụng có điều kiện: VIP500 (Đơn hàng từ 500.000 VNĐ trở lên)
        Coupon::create([
            'code' => 'VIP500',
            'discount_type' => 'percentage',
            'discount_value' => 15.00,
            'max_discount_amount' => 150000,
            'min_order_value' => 500000, // Điều kiện: tối thiểu 500k
            'start_date' => Carbon::now()->subDays(1),
            'end_date' => Carbon::now()->addMonths(3),
            'usage_limit_global' => null,
            'usage_limit_per_user' => null,
            'is_active' => true,
        ]);
        
        // 5. Mã đã hết hạn (Dùng để kiểm tra logic thời hạn)
        Coupon::create([
            'code' => 'EXPIRED',
            'discount_type' => 'fixed_amount',
            'discount_value' => 100000,
            'end_date' => Carbon::now()->subDays(1), // Hết hạn ngày hôm qua
            'min_order_value' => 0,
            'is_active' => true,
        ]);
    }
}