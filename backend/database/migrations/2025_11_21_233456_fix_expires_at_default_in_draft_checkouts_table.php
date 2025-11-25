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
        // Sửa cột expires_at để đảm bảo không có default value
        // và có thể nhận giá trị từ application
        Schema::table('draft_checkouts', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('draft_checkouts', function (Blueprint $table) {
            // Không cần rollback vì chỉ sửa để đảm bảo không có default
        });
    }
};
