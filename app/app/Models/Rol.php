<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    //protected $connection = "usuarios";
    protected $table = "roles";
    protected $primaryKey = "id_rol";
    protected $fillable = ["nombre"];
    public $timestamps = false;

    public function usuarios()
    {
        return $this->belongsToMany(User::class, "usuario_rols", "id_rol", "id_user");
    }

    public function permisos()
    {
        return $this->belongsToMany(Permiso::class, "rol_permisos", "id_rol", "id_permiso");
    }
}