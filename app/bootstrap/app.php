<?php

use App\Http\Middleware\CerrarSesionesTrasCambioDeClave;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PermissionMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Console\Commands\PrivatizarEvidencias;
use App\Console\Commands\SeedPredictiveData;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([SeedPredictiveData::class, PrivatizarEvidencias::class])
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();

        $middleware->web(append: [
            // Cierra las sesiones de un usuario cuando cambia su contraseña (RF-28.4).
            CerrarSesionesTrasCambioDeClave::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->redirectUsersTo('/portal');

        $middleware->alias([
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Errores siempre en JSON para /api/*
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, Throwable $e) => $request->is('api/*') || $request->expectsJson()
        );

        // Borrar un registro referenciado por otro (violación de FK en PostgreSQL).
        // Proyectos y trabajadores con historial de seguridad no se pueden borrar.
        $exceptions->render(function (QueryException $e, Request $request) {
            if ($e->getCode() !== '23503') {
                return null;
            }

            $mensaje = 'No se puede eliminar: el registro está en uso por otros datos.';

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $mensaje], 409);
            }

            return back()->with('error', $mensaje.' Si ya no está vigente, cambie su estado a inactivo.');
        });
    })->create();
