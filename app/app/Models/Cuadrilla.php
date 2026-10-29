<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Cuadrilla extends Model
{
    protected $table = 'cuadrillas';
    protected $primaryKey = 'id_cuadrilla';

    public function supervisor()
    {
        return $this->belongsTo(Supervisor::class, 'id_supervisor', 'id_trabajador');
    }

    public function trabajadores(): BelongsToMany
    {
        return $this->belongsToMany(
            Trabajador::class,
            'trabajadores_cuadrillas',
            'id_cuadrilla',
            'id_trabajador',
            'id_cuadrilla',
            'id_trabajador'
        )->withPivot(['fecha_inicio', 'fecha_fin', 'fecha_creacion']);
    }

    public function obreros(): BelongsToMany
    {
        return $this->belongsToMany(
            Obrero::class,
            'trabajadores_cuadrillas',
            'id_cuadrilla',
            'id_trabajador',
            'id_cuadrilla',
            'id_trabajador'
        )->withPivot(['fecha_inicio', 'fecha_fin', 'fecha_creacion']);
    }
}
