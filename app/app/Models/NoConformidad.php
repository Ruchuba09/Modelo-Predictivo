<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NoConformidad extends Model
{
   protected $table = 'no_conformidades';

    protected $fillable = [
        'id_tipo_trabajador',
        'descripcion',
    ];

    public function tipoTrabajador()
    {
        return $this->belongsTo(tipo_trabajador::class, 'id_tipo_trabajador');
    }
}
