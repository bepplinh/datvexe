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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')
                ->constrained('bookings')
                ->cascadeOnDelete();

            $table->decimal('amount', 10, 0)->default(0);
            $table->decimal('fee', 10, 0)->default(0);
            $table->decimal('refund_amount', 10, 0)->default(0);

            $table->string('currency', 10)->default('VND');
            $table->enum('provider', ['cash', 'payos'])->nullable();
            $table->string('provider_txn_id', 150)->nullable();

            $table->enum('status', ['pending', 'succeeded', 'failed', 'refunded', 'canceled'])
                ->default('pending');
            
            // Failure tracking fields
            $table->string('failure_code', 100)->nullable();
            $table->text('failure_message')->nullable();
            $table->json('error_data')->nullable();
            
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            $table->json('meta')->nullable();
            $table->text('raw_request')->nullable();
            $table->text('raw_response')->nullable();

            $table->timestamps();

            $table->unique(['provider', 'provider_txn_id']);
            $table->index(['booking_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
