<?php

namespace App\Services\Coupon;

use App\Models\Coupon;
use App\Models\CouponUsage; // *** Thêm dòng này ***
use App\Models\DraftCheckout;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB; // *** Thêm dòng này (nếu cần xử lý phức tạp) ***

class CalcCoupon
{
    public function applyCoupon(int $couponId, DraftCheckout $draft, ?int $userId)
    {
        $coupon = Coupon::where('id', $couponId)->first();
        $totalPrice = $draft->total_price;

        if (!$coupon) {
            throw new \Exception('Mã giảm giá không tồn tại.');
        }

        // --- Kiểm tra Tồn tại, Kích hoạt, và Thời hạn (Cơ bản) ---
        // Lưu ý: Tôi đổi status check thành is_active theo schema đề xuất
        if (!$coupon->is_active) {
            throw new \Exception('Mã giảm giá không còn hiệu lực.');
        }

        $now = Carbon::now();
        if ($coupon->start_date && $now->lt($coupon->start_date)) {
            throw new \Exception('Mã giảm giá chưa đến ngày áp dụng.');
        }
        if ($coupon->end_date && $now->gt($coupon->end_date)) {
            throw new \Exception('Mã giảm giá đã hết hạn sử dụng.');
        }

        // --- Bổ sung: Kiểm tra Điều kiện Đơn hàng Tối thiểu ---
        if ($coupon->min_order_value && $totalPrice < $coupon->min_order_value) {
            throw new \Exception(
                'Đơn hàng chưa đạt giá trị tối thiểu ' . number_format($coupon->min_order_value) . ' VNĐ để áp dụng mã này.'
            );
        }

        // --- Bổ sung: Kiểm tra Giới hạn Sử dụng Toàn hệ thống ---
        if ($coupon->usage_limit_global) {
            $globalUsedCount = CouponUsage::where('coupon_id', $coupon->id)->count();
            if ($globalUsedCount >= $coupon->usage_limit_global) {
                throw new \Exception('Mã giảm giá đã hết số lượt sử dụng.');
            }
        }

        // --- Bổ sung: Kiểm tra Giới hạn Sử dụng Cá nhân ---
        if ($coupon->usage_limit_per_user && $userId) {
            $userUsedCount = CouponUsage::where('coupon_id', $coupon->id)
                ->where('user_id', $userId)
                ->count();
            if ($userUsedCount >= $coupon->usage_limit_per_user) {
                throw new \Exception('Bạn đã sử dụng mã giảm giá này hết số lần cho phép.');
            }
        }

        // --- Bổ sung: Kiểm tra Phạm vi Áp dụng (Tuyến xe, Hãng xe...) ---
        // Giả định: DraftCheckout có thông tin tuyến, hãng xe cần thiết.
        // Đây là phần logic phức tạp cần được triển khai riêng.
        if ($coupon->applies_to) {
            if (!$this->checkApplicability($coupon, $draft)) {
                throw new \Exception('Mã giảm giá không áp dụng cho tuyến xe/hãng xe này.');
            }
        }

        // --- Tính toán Giảm giá ---
        $discountAmount = 0;

        if ($coupon->discount_type === 'percentage') { // Sử dụng ENUM 'PERCENT'
            $discountAmount = ($coupon->discount_value / 100) * $totalPrice;
        } elseif ($coupon->discount_type === 'fixed_amount') { // Sử dụng ENUM 'FIXED'
            $discountAmount = $coupon->discount_value;
        }

        // Giảm giá không được vượt quá tổng giá gốc
        $discountAmount = min($discountAmount, $totalPrice);
        
        // --- Bổ sung: Áp dụng Giới hạn Giảm giá Tối đa ---
        if ($coupon->max_discount_amount && $discountAmount > $coupon->max_discount_amount) {
            $discountAmount = $coupon->max_discount_amount;
        }

        return [
            'coupon' => $coupon,
            'discount_amount' => (int) round($discountAmount) // Làm tròn số tiền giảm
        ];
    }
    
    /**
     * Logic kiểm tra phạm vi áp dụng (ví dụ: Tuyến xe, Hãng xe).
     * Cần tùy chỉnh chi tiết theo cấu trúc dữ liệu của DraftCheckout và applies_to.
     */
    protected function checkApplicability(Coupon $coupon, DraftCheckout $draft): bool
    {
        $appliesTo = $coupon->applies_to;
        
        // Ví dụ đơn giản: Kiểm tra tuyến xe (giả định $draft có route_id)
        if (isset($appliesTo['routes']) && !empty($appliesTo['routes'])) {
            // Giả sử $draft->route_id là ID của tuyến xe đang đặt
            if (!in_array($draft->route_id, $appliesTo['routes'])) {
                return false;
            }
        }

        return true;
    }
}