<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class trabajador extends Model
{
    protected $connection = "usuarios";
    protected $table = "trabajadors";
    public $timestamps = false;

    protected $fillable = [
        "nombre_1",
        "nombre_2",
        "apellido_1",
        "apellido_2",
        "cargo",
        "rut",
        "email",
    ];

    public function usuarios(): BelongsToMany {
        return $this->belongsToMany(User::class, "usuarios_tienen_roles", "id_rol", "id_usuario");
    }

    public function permisos(): BelongsToMany {
        return $this->belongsToMany(Permiso::class, "roles_tienen_permisos", "id_rol", "id_permiso");
    }
}
