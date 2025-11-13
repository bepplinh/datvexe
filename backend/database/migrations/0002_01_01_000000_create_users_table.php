<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->string('name')->nullable();        
            $t->string('username')->unique();          
            $t->string('email')->nullable()->unique(); 
            $t->string('phone', 20)->nullable()->unique();
            $t->date('birthday')->nullable();
            $t->enum('role', ['customer','staff','admin'])->default('customer');
            $t->enum('gender', ['male','female','other']);
            $t->string('password')->nullable();
            $t->timestamp('phone_verified_at')->nullable();
            $t->timestamp('email_verified_at')->nullable();
            
            $t->rememberToken();
            $t->timestamps();
        });
        
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};