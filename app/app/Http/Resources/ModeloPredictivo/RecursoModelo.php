<?php

namespace App\Http\Resources\ModeloPredictivo;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

/**
 * Base de los recursos del modelo predictivo. El servicio Python responde arreglos; cada recurso
 * declara qué campos publica. Los campos ausentes se omiten (no se envían como null), igual que
 * en la respuesta del servicio, porque el frontend distingue "sin dato" de "cero".
 */
abstract class RecursoModelo extends JsonResource
{
    /** @param  array<int, string>  $campos */
    protected function campos(array $campos): array
    {
        return array_filter(Arr::only((array) $this->resource, $campos), fn ($valor) => $valor !== null);
    }

    /**
     * Aplica el recurso a cada elemento de una lista, conservando las claves.
     *
     * @return array<array-key, static>
     */
    public static function lista(mixed $elementos): array
    {
        return is_array($elementos) ? array_map(fn ($elemento) => new static($elemento), $elementos) : [];
    }
}
