<?php
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\RedisListenExpired;

Artisan::command('redis:start-listener', function () {
    $this->call(RedisListenExpired::class);
});