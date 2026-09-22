<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class hallazgo extends Model
{
    protected $table = 'hallazgos';

    protected $fillable = [
        'id_tipo_trabajador',
    ];

    public function tipoTrabajador()
    {
        return $this->belongsTo(tipo_trabajador::class, 'id_tipo_trabajador');
    }
}
