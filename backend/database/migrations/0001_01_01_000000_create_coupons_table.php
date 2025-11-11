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
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('discount_type', ['percentage','fixed_amount']);
            $table->decimal('discount_value', 10, 2);
            $table->string('description')->nullable();
            
            // Giới hạn
            $table->decimal('max_discount_amount', 10, 2)->nullable(); // Số tiền giảm tối đa (cho PERCENT)
            $table->decimal('min_order_value', 10, 2)->default(0); // Giá trị đơn hàng tối thiểu
            $table->boolean('is_active')->default(true); // Trạng thái kích hoạt
            
            // Giới hạn sử dụng
            $table->integer('usage_limit_global')->nullable(); // Giới hạn toàn hệ thống
            $table->integer('usage_limit_per_user')->nullable(); // Giới hạn mỗi người dùng

            // Thời gian hiệu lực
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
