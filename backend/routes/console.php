<?php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\RedisListenExpired;

Artisan::command('redis:start-listener', function () {
    $this->call(RedisListenExpired::class);
});

// Schedule trip reminder notifications every 5 minutes
Schedule::command('trips:send-reminders')->everyFiveMinutes();