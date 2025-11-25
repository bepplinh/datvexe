<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Loại bỏ ON UPDATE CURRENT_TIMESTAMP từ cột expires_at
        // Sử dụng raw SQL vì Laravel Schema Builder không hỗ trợ trực tiếp
        DB::statement('ALTER TABLE draft_checkouts MODIFY COLUMN expires_at TIMESTAMP NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Không cần rollback vì chỉ sửa để đảm bảo không có ON UPDATE
    }
};

