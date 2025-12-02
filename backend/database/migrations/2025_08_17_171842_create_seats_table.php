<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_id')->constrained()->cascadeOnDelete();
            $table->string('seat_number');
            $table->unsignedTinyInteger('deck')->default(2);
            $table->string('column_group', 10);
            $table->unsignedTinyInteger('index_in_column'); // số thứ tự trong cột
            $table->integer('layout_x')->nullable();
            $table->integer('layout_y')->nullable();
            $table->unsignedSmallInteger('layout_w')->default(48);
            $table->unsignedSmallInteger('layout_h')->default(48);
            $table->string('seat_type', 32)->nullable();
            $table->json('layout_meta')->nullable();

            $table->boolean('active')->default(true);
            $table->timestamps();
            
            $table->unique(['bus_id','seat_number', 'deck']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('seats');
    }
};
