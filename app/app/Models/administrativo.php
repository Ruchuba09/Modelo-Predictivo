<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class administrativo extends Model
{
    protected $connection = "usuarios";
    protected $table = "permisos";
    protected $primaryKey = "id_permiso";
    protected $fillable = ["nombre", "nivel"];
}
