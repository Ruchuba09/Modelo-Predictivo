<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class escala_riesgo extends Model
{
    protected $connection = "usuarios";
    protected $table = "escala_riesgo";
    protected $fillable = ["nivel", "valor", "color_hex", "descripcion"];
    public $timestamps = false;

    public function tarjetasPare()
    {
        return $this->hasMany(tarjeta_pare::class, "id_escala_riesgo");
    }
}