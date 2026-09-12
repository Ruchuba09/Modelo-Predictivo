<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class tarjeta_pare extends Model
{
    protected $connection = "usuarios";
    protected $table = "tarjetas_pare";
    protected $fillable = [
        "id_trabajador",
        "id_modelo",
        "id_escala_riesgo",
        "id_proyecto",
        "ubicacion",
        "descripcion",
        "estado",
        "fecha_reporte",
    ];

    public function trabajador()
    {
        return $this->belongsTo(trabajador::class, "id_trabajador");
    }

    public function modelo()
    {
        return $this->belongsTo(modelo_tarjeta_pare::class, "id_modelo");
    }

    public function escalaRiesgo()
    {
        return $this->belongsTo(escala_riesgo::class, "id_escala_riesgo");
    }

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class, "id_proyecto");
    }
}