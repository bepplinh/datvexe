<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use App\Jobs\ReleaseSeatAfterExpired;

class RedisListenExpired extends Command
{
    protected $signature   = 'redis:listen-expired';
    protected $description = 'Listen Redis expired events and dispatch cleanup job';

    public function handle(): int
    {
        $sub = Redis::connection('subscriber');

        $this->info('Listening on __keyevent@0__:expired ...');
        $sub->psubscribe(['__keyevent@0__:expired'], function ($message, $channel) {
            $this->line("Expired key: {$message}");
            ReleaseSeatAfterExpired::dispatch($message);
        });

        return self::SUCCESS;
    }
}
