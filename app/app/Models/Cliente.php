<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
     protected $table = 'clientes';

    protected $fillable = [
        'rut',
        'razon_social',
        'nombre',
        'email',
        'telefono',
        'direccion',
        'estado',
    ];

    public function asignaciones()
    {
        return $this->hasMany(Asignacion::class, 'id_cliente');
    }

    public function faenas()
    {
        return $this->hasMany(Faena::class, 'id_cliente');
    }
}
