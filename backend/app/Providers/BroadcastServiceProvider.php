<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Broadcast;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Broadcast::routes([
            'middleware' => ['api', 'auth:api'], // dùng guard api (JWT)
            'prefix'     => 'api',               // => /api/broadcasting/auth
        ]);

        require base_path('routes/channels.php');
    }
}
