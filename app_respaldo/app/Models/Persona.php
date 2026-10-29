<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Persona extends Model
{
    use HasFactory;

    protected $table = 'public.personas';
    protected $primaryKey = 'id_persona';
    public $incrementing = true;

    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'rut',
        'nombre_1',
        'nombre_2',
        'apellido_1',
        'apellido_2',
    ];

    public function trabajador()
    {
        return $this->hasOne(Trabajador::class, 'id_persona', 'id_persona');
    }
}
