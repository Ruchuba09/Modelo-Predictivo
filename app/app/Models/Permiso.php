<?php

namespace App\Models;

use App\Support\Permisos;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permiso extends Model
{
    protected $table = 'permisos';
    protected $primaryKey = 'id_permiso';
    public $timestamps = false;

    protected $fillable = ['nombre', 'descripcion', 'nivel'];

    protected $casts = [
        'nivel' => 'integer',
    ];

    protected $appends = ['es_sistema'];

    /** RF-24.3.3 y RF-26.3.1: el código depende de su nombre. */
    protected function esSistema(): Attribute
    {
        return Attribute::get(fn () => $this->nombre !== null && Permisos::esDelSistema($this->nombre));
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'rol_permiso', 'id_permiso', 'id_rol');
    }
}
