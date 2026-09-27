<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class tipo_obrero extends Model
{
 
    protected $table = "tipo_obreros";


    protected $fillable = [

        "nombre",
        "descripcion",
        "estado",
    ];
}
