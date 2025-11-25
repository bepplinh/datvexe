<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\GeminiAI\RouteOptimization\LocationCollector;
use App\Services\GeminiAI\RouteOptimization\PromptBuilder;
use App\Services\GeminiAI\RouteOptimization\ResponseParser;
use App\Services\GeminiAI\RouteOptimization\TripDataFetcher;

class RouteOptimizationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TripDataFetcher::class);
        $this->app->singleton(LocationCollector::class);
        $this->app->singleton(PromptBuilder::class);
        $this->app->singleton(ResponseParser::class);
    }
}
