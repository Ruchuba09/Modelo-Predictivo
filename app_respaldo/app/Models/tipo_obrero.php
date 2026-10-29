<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class tipo_obrero extends Model
{
 
    protected $table = "tipo_obreros";
    protected $primaryKey = 'id_tipo_obrero'; // confirma el nombre real
    public $timestamps = false;               // si la tabla no tiene created_at/updated_at

    protected $fillable = [

        "nombre",
        "descripcion",
        "estado",
    ];
}
