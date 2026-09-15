<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class rolPermiso extends Pivot
{
    protected $connection = "usuarios";

    protected $table = "rol_permisos";

    public $incrementing = false;

    protected $fillable = [
        "id_rol",
        "id_permiso",
    ];
}