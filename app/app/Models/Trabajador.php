<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trabajador extends Model
{
    protected $table = 'trabajadores';
    protected $primaryKey = 'id_trabajador';

    protected $fillable = [
        "rut",
        "nombre_1",
        "nombre_2",
        "apellido_1",
        "apellido_2",
        "cargo",
        "id_tipo_trabajador",
        "fecha_creacion",
        "ultima_act",
        "estado",

    ];

    public function usuario()
    {
        return $this->hasOne(User::class, 'id_trabajador', 'id_trabajador');
    }

    public function cuadrilla()
    {
        return $this->belongsTo(Cuadrilla::class, 'id_cuadrilla', 'id_cuadrilla');
    }
    public function obrero()
    {
        return $this->hasOne(Obrero::class, 'id_trabajador', 'id_trabajador');
    }

    public function administrativo()
    {
        return $this->hasOne(Administrativo::class, 'id_trabajador', 'id_trabajador');
    }

    public function supervisor()
    {
        return $this->hasOne(Supervisor::class, 'id_trabajador', 'id_trabajador');
    }
}