<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Cuadrilla extends Model
{
    use HasFactory;

    protected $table = 'cuadrillas';
    protected $primaryKey = 'id_cuadrilla';
    public $timestamps = false;

    public function supervisor()
    {
        return $this->belongsTo(Supervisor::class, 'id_supervisor', 'id_trabajador');
    }

    public function trabajadores(): HasManyThrough
    {
        return $this->hasManyThrough(
            Trabajador::class,
            Obrero::class,
            'id_cuadrilla',
            'id_trabajador',
            'id_cuadrilla',
            'id_trabajador'
        );
    }

    public function obreros(): HasMany
    {
        return $this->hasMany(Obrero::class, 'id_cuadrilla', 'id_cuadrilla');
    }
}
