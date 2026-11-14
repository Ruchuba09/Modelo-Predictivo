<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * El cambio dejaría al sistema sin administrador o afecta la propia cuenta
 * (RF-28.3.4, RF-30.3); el mensaje es el que ve el usuario.
 */
class UsuarioNoModificableException extends RuntimeException
{
    public function __construct(string $mensaje, public readonly string $campo = 'general')
    {
        parent::__construct($mensaje);
    }
}
