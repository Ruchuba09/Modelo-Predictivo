<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Departamento extends Model
{
    protected $table = 'departamentos';

    protected $fillable = [
        'id_trabajador',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function asignaciones()
    {
        return $this->hasMany(Asignacion::class, 'id_dpto');
    }

    public function faenas()
    {
        return $this->hasMany(Faena::class, 'id_dpto');
    }
    
}
