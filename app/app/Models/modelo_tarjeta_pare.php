<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class modelo_tarjeta_pare extends Model
{
    protected $connection = "usuarios";
    protected $table = "modelo_tarjeta_pare";
    protected $fillable = ["nombre", "descripcion"];
    public $timestamps = false;

    public function tarjetasPare()
    {
        return $this->hasMany(tarjeta_pare::class, "id_modelo");
    }
}