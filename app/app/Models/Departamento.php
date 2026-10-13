<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Departamento extends Model
{
    protected $table = 'departamentos';
    protected $primaryKey = 'id_departamento';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
    ];

    public function trabajadores(): BelongsToMany
    {
        return $this->belongsToMany(Trabajador::class, 'trabajador_departamento', 'id_departamento', 'id_trabajador');
    }
}