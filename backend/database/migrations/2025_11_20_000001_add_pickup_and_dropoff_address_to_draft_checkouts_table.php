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
        Schema::table('draft_checkouts', function (Blueprint $table) {
            $table->string('pickup_address', 500)->nullable()->after('passenger_email');
            $table->string('dropoff_address', 500)->nullable()->after('pickup_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('draft_checkouts', function (Blueprint $table) {
            $table->dropColumn(['pickup_address', 'dropoff_address']);
        });
    }
};


