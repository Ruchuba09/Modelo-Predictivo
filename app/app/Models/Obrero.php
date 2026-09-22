<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Obrero extends Model
{
    protected $table = 'obreros';
    protected $primaryKey = 'id_trabajador';
    public $incrementing = false;
    protected $keyType = 'int';

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }
    public function cuadrilla()
    {
        return $this->belongsTo(Cuadrilla::class, 'id_cuadrilla', 'id_cuadrilla');
    }
}