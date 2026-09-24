<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permiso extends Model
{
    protected $connection = "usuarios";
    protected $table = "permisos";
    protected $primaryKey = "id_permiso";
    protected $fillable = ["nombre", "nivel"];
    public $timestamps = false;   // <-- esta línea

    public function roles()
    {
        return $this->belongsToMany(Rol::class, "rol_permiso", "id_permiso", "id_rol");
    }
}