<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EstadisticaEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_evento'        => 'nullable|string',
            'id'               => 'nullable|string',
            'desde'            => 'nullable|date',
            'hasta'            => 'nullable|date',
            'fecha_inicio'     => 'nullable|date',
            'fecha_fin'        => 'nullable|date',
            'id_area'          => 'nullable|integer',
            'id_proyecto'      => 'nullable|integer',
            'id_tipo_evento'   => 'nullable|integer',
            'id_supervisor'    => 'nullable|integer',
            'id_administrador' => 'nullable|integer',
            'id_trabajador'    => 'nullable|integer',
            'estado'           => 'nullable|string',
            'condicion'        => 'nullable|string',
            'severidad'        => 'nullable|string',
            'sla_dias'         => 'nullable|integer|min:1',
            'secciones'        => 'nullable|string',
        ];
    }

    /** Filtros para EventoEstadisticaService (sin la lista de secciones). */
    public function filtros(): array
    {
        return collect($this->validated())->except('secciones')->all();
    }

    /** Secciones pedidas con ?secciones=a,b; null significa todas. */
    public function secciones(): ?array
    {
        if (! $this->filled('secciones')) {
            return null;
        }

        return array_map('trim', explode(',', (string) $this->input('secciones')));
    }
}
