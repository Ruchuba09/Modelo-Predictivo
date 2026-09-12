<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {

        $user = $request->user();

        if (!$user) {
            abort(401);
        }

        if (!$user->tienePermiso($permission)) {
            abort(403, "No tienes permiso para realizar esta acción.");
        }

        return $next($request);
    }
}