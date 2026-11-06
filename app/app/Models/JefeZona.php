<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JefeZona extends Model
{
    protected $table = 'jefes_zona';
    protected $primaryKey = 'id_trabajador';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['id_trabajador'];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function cuadrillas()
    {
        return $this->hasMany(Cuadrilla::class, 'id_jefe_zona', 'id_trabajador');
    }
}
