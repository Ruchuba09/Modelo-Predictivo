<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class trabajador extends Model
{
    protected $table = "trabajadors";
    public $timestamps = false;

    protected $fillable = [
        "rut",
        "nombre_1",
        "nombre_2",
        "apellido_1",
        "apellido_2",
        "fecha_creacion",
        "ultima_act",
        "estado",
        "cargo",
    ];

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, "usuarios_tienen_roles", "id_rol", "id_usuario");
    }

    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(Permiso::class, "roles_tienen_permisos", "id_rol", "id_permiso");
    }
}