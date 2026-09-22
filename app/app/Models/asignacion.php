<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class asignacion extends Model
{
    protected $table = 'asignaciones';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = null;

    protected $fillable = [
        'id_cliente',
        'id_dpto',
        'fecha_inicio',
        'fecha_termino',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
        'fecha_inicio' => 'date',
        'fecha_termino' => 'date',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente');
    }

    public function departamento()
    {
        return $this->belongsTo(Departamento::class, 'id_dpto');
    }
}
