<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles
    ): Response {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        if (! $user->tieneRol(...$roles)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                abort(403, 'No tienes permiso para acceder a esta sección.');
            }

            return redirect()->route('portal')->with('error', 'No tienes permiso para acceder a esta sección.');
        }

        return $next($request);
    }
}
