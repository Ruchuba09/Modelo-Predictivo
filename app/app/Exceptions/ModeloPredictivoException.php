<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * El servicio del modelo predictivo no respondió o rechazó la consulta. El mensaje es el que ve
 * el usuario y el estado HTTP se conserva: 422 si el filtro no es válido, 503 si no está disponible.
 */
class ModeloPredictivoException extends RuntimeException
{
    public const NO_DISPONIBLE = 'El servicio del modelo predictivo no está disponible.';

    public const RESPUESTA_INVALIDA = 'El servicio del modelo predictivo devolvió una respuesta inválida.';

    public function __construct(string $mensaje, public readonly int $estado = 503)
    {
        parent::__construct($mensaje);
    }

    public static function noDisponible(): self
    {
        return new self(self::NO_DISPONIBLE, 503);
    }

    public static function respuestaInvalida(): self
    {
        return new self(self::RESPUESTA_INVALIDA, 502);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], $this->estado);
    }
}
