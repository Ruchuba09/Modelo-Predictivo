<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class faena extends Model
{
    protected $table = 'faenas';

    protected $fillable = [
        'id_cliente',
        'id_dpto',
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
