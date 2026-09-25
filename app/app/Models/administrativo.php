<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Administrativo extends Model
{
    protected $table = 'administrativos';
    protected $primaryKey = 'id_trabajador';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_trabajador',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }
}