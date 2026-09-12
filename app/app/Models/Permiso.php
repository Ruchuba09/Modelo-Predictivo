<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permiso extends Model
{
    protected $table = "permisos";

    protected $fillable = [
        "nombre",
    ];

    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            "roles_tienen_permisos",
            "id_permiso",
            "id_rol"
        );
    }
}