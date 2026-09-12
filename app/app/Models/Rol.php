<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = "roles";

    protected $fillable = [
        "nombre",
    ];

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            "usuarios_tienen_roles",
            "id_rol",
            "id_usuario"
        );
    }

    public function permisos()
    {
        return $this->belongsToMany(
            Permiso::class,
            "roles_tienen_permisos",
            "id_rol",
            "id_permiso"
        );
    }
}