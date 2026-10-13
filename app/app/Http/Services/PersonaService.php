<?php

namespace App\Http\Services;

use App\DataTransferObjects\PersonaData;
use App\Models\Persona;
use Illuminate\Database\Eloquent\Collection;

class PersonaService
{
    public function listarConTrabajador(): Collection
    {
        return Persona::with('trabajador')
            ->orderBy('apellido_1')
            ->orderBy('nombre_1')
            ->get();
    }

    public function obtenerConTrabajador(Persona $persona): Persona
    {
        return $persona->load('trabajador');
    }

    public function crear(PersonaData $datos): Persona
    {
        return Persona::create($datos->toArray());
    }

    public function actualizar(Persona $persona, PersonaData $datos): Persona
    {
        $persona->update($datos->toArray());

        return $persona;
    }

    public function eliminar(Persona $persona): void
    {
        // trabajadores.id_persona hace cascade (y desde ahí subtipo, user y pivotes)
        $persona->delete();
    }
}