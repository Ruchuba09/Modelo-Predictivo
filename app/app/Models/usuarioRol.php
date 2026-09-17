<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class usuarioRol extends Pivot
{
    protected $connection = "usuarios";

    protected $table = "usuario_rols";

    public $incrementing = false;

    protected $fillable = [
        "id_user",
        "id_rol",
    ];
}