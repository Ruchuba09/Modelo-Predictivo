<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supervisor extends Model
{
    protected $table = 'supervisors';
    protected $primaryKey = 'id_trabajador';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_trabajador',
        // agrega aquí cualquier otra columna propia de "supervisors"
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }
}