<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cuadrilla extends Model
{
    protected $table = 'cuadrillas';
    protected $primaryKey = 'id_cuadrilla';

    public function supervisor()
    {
        return $this->belongsTo(Supervisor::class, 'id_supervisor', 'id_trabajador');
    }

    public function obreros()
    {
        return $this->hasMany(Obrero::class, 'id_cuadrilla', 'id_cuadrilla');
    }
}
