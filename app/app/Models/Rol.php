<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $connection = "usuarios";

    protected $table = "roles";
    protected $primaryKey = "id_rol";
    protected $fillable = [
        "nombre",
    ];

    // Rol.php
    public function usuarios()
    {
        return $this->belongsToMany(
            User::class,
            "usuario_rols",
            "id_rol",   // FK de este modelo en la pivote
            "id_user"   // FK del modelo relacionado en la pivote
        );
    }

    public function permisos()
    {
        return $this->belongsToMany(
            Permiso::class,
            "rol_permisos",
            "id_rol",
            "id_permiso"
        );
    }
}