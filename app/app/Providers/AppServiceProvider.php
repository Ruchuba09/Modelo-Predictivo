<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        RateLimiter::for('api', function (Request $request) {
            $key = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(60)->by((string) $key);
        });

        // Login de la API: tope de peticiones por IP contra el abuso masivo. El
        // límite de RF-31.3 (5 intentos fallidos por cuenta e IP, compartido con
        // el portal web) lo aplica AutenticacionService.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(20)->by('login-ip:'.$request->ip()));
    }
}
