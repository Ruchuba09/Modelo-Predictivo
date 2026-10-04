<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supervisor extends Model
{
    use HasFactory;

    protected $table = 'public.supervisores';
    protected $primaryKey = 'id_trabajador';
    public $incrementing = false;

    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_trabajador',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function cuadrillas()
    {
        return $this->hasMany(Cuadrilla::class, 'id_supervisor', 'id_trabajador');
    }
}