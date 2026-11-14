<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Exige alguno de los permisos indicados: "permission:a,b" deja pasar a quien
 * tenga a o b (CA-1). En la web redirige al portal con un aviso; en la
 * API responde 403.
 */
class PermissionMiddleware
{
    public const MENSAJE = 'No tienes permiso para acceder a esta sección.';

    public function handle(Request $request, Closure $next, string ...$permisos): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        if (! $user->tienePermiso(...$permisos)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                abort(403, self::MENSAJE);
            }

            return redirect()->route('portal')->with('error', self::MENSAJE);
        }

        return $next($request);
    }
}
