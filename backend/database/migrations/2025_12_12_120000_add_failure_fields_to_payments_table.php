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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('failure_code', 100)->nullable()->after('status');
            $table->text('failure_message')->nullable()->after('failure_code');
            $table->json('error_data')->nullable()->after('failure_message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['failure_code', 'failure_message', 'error_data']);
        });
    }
};
