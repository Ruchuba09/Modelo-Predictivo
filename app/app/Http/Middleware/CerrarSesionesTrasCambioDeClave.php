<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\SessionGuard;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\AuthenticateSession;
use Symfony\Component\HttpFoundation\Response;

/**
 * RF-28.4: cierra las sesiones web de un usuario cuando cambia su contraseña.
 * Solo aplica con un guard de sesión; las peticiones autenticadas por token
 * (Sanctum) se revocan borrando sus tokens.
 */
class CerrarSesionesTrasCambioDeClave extends AuthenticateSession
{
    public function handle($request, Closure $next): Response
    {
        if (! $this->guard() instanceof SessionGuard) {
            return $next($request);
        }

        return parent::handle($request, $next);
    }
}
