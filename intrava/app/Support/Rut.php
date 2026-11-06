<?php

namespace App\Support;

class Rut
{
    /**
     * Limpia el rut dejándolo sin puntos, con guión y con K mayúscula.
     */
    public static function clean(string $rut): string
    {
        $rut = strtoupper(trim($rut));
        $rut = preg_replace('/[^0-9K-]/', '', $rut);

        // Si no viene guión, lo insertamos antes del último dígito (dv)
        if (! str_contains($rut, '-') && strlen($rut) > 1) {
            $rut = substr($rut, 0, -1).'-'.substr($rut, -1);
        }

        return $rut;
    }
}