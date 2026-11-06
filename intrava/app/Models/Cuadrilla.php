<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Cuadrilla extends Model
{
    use HasFactory;

    protected $table = 'cuadrillas';
    protected $primaryKey = 'id_cuadrilla';
    public $timestamps = false;

    protected $fillable = ['id_supervisor', 'id_jefe_zona', 'numero_cuadrilla'];

    public function jefeZona()
    {
        return $this->belongsTo(JefeZona::class, 'id_jefe_zona', 'id_trabajador');
    }

    /** Integrantes actuales; el historial está en trabajadores_cuadrillas. */
    public function integrantes()
    {
        return $this->hasMany(Obrero::class, 'id_cuadrilla', 'id_cuadrilla');
    }

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
