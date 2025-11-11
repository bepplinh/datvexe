<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id(); // usage_id
            
            // Liên kết với coupon (sử dụng constraint để đảm bảo dữ liệu toàn vẹn)
            $table->foreignId('coupon_id')->constrained('coupons')->onDelete('cascade'); 
            
            // Liên kết với người dùng (giả định có bảng 'users')
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); 
            
            // Liên kết với đơn đặt vé (giả định có bảng 'orders' hoặc 'bookings')
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade'); 
            
            $table->decimal('discount_amount', 10, 2); // Số tiền thực tế đã giảm trong giao dịch này
            
            $table->timestamps(); // created_at (là thời điểm sử dụng) và updated_at
            
            // Tạo index để truy vấn nhanh hơn khi kiểm tra giới hạn sử dụng
            $table->index(['coupon_id', 'user_id']); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_usages');
    }
};
