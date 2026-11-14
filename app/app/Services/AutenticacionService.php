<?php

namespace App\Services;

use App\Models\User;
use App\Support\Rut;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * Inicio de sesión (RF-31), común al portal web y a la API: identifica la
 * cuenta por correo o RUT, verifica la contraseña y limita los intentos
 * fallidos con un mismo contador para ambos canales.
 */
class AutenticacionService
{
    public const MENSAJE_CREDENCIALES = 'Las credenciales ingresadas no son correctas.';

    public const MENSAJE_BLOQUEO = 'Demasiados intentos fallidos. Intente nuevamente en :segundos segundos.';

    /** RF-31.3: intentos fallidos permitidos por cuenta e IP antes del bloqueo. */
    public const MAX_INTENTOS = 5;

    /** RF-31.3: segundos que dura el bloqueo, contados desde el primer fallo. */
    public const SEGUNDOS_BLOQUEO = 60;

    private static ?string $hashFicticio = null;

    /**
     * RF-31.2: un correo válido se compara en minúsculas; cualquier otro valor
     * se trata como RUT, sin puntos, con guion y con K mayúscula.
     *
     * @return array{tipo: 'email'|'rut', valor: string}
     */
    public function identificar(string $login): array
    {
        $login = trim($login);

        return filter_var($login, FILTER_VALIDATE_EMAIL)
            ? ['tipo' => 'email', 'valor' => mb_strtolower($login)]
            : ['tipo' => 'rut', 'valor' => Rut::clean($login)];
    }

    /**
     * RF-31.4 y RF-31.5: devuelve el Usuario si las credenciales son válidas.
     *
     * @throws ValidationException con el mensaje de RF-31.3.1 o RF-31.4.1, en el campo "rut".
     */
    public function autenticar(string $login, string $password, string $ip): User
    {
        $cuenta = $this->identificar($login);
        $clave = $this->claveIntentos($cuenta, $ip);

        $this->verificarBloqueo($clave);

        $usuario = $this->buscar($cuenta);

        // Sin cuenta se verifica igual contra un hash ficticio: el tiempo de
        // respuesta no revela qué cuentas existen.
        $valida = Hash::check($password, $usuario?->password ?? self::hashFicticio());

        if (! $usuario || ! $valida) {
            RateLimiter::hit($clave, self::SEGUNDOS_BLOQUEO);

            throw ValidationException::withMessages(['rut' => self::MENSAJE_CREDENCIALES]);
        }

        RateLimiter::clear($clave);

        return $usuario;
    }

    /** Clave del contador: la cuenta normalizada y la IP, igual en web y API. */
    public function claveIntentos(array $cuenta, string $ip): string
    {
        return 'login:'.$cuenta['tipo'].':'.$cuenta['valor'].'|'.$ip;
    }

    private function verificarBloqueo(string $clave): void
    {
        if (! RateLimiter::tooManyAttempts($clave, self::MAX_INTENTOS)) {
            return;
        }

        event(new Lockout(request()));

        throw ValidationException::withMessages([
            'rut' => str_replace(':segundos', (string) max(1, RateLimiter::availableIn($clave)), self::MENSAJE_BLOQUEO),
        ])->status(429);
    }

    private function buscar(array $cuenta): ?User
    {
        if ($cuenta['valor'] === '' || $cuenta['valor'] === '-') {
            return null;
        }

        return $cuenta['tipo'] === 'email'
            ? User::whereRaw('LOWER(email) = ?', [$cuenta['valor']])->first()
            : User::whereHas('trabajador.persona', fn ($q) => $q->where('rut', $cuenta['valor']))->first();
    }

    private static function hashFicticio(): string
    {
        return self::$hashFicticio ??= Hash::make('cuenta-inexistente');
    }
}
