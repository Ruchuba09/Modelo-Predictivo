<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asignacion extends Model
{
    protected $table = 'asignaciones';

    protected $primaryKey = 'id_asignacion';

    public $timestamps = false;

    protected $fillable = [
        'id_administrador',
        'id_proyecto',
        'id_cuadrilla',
        'fecha_creacion',
        'fecha_inicio',
        'fecha_termino',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
        'fecha_inicio' => 'date',
        'fecha_termino' => 'date',
    ];

    // Relaciones

    public function administrador()
    {
        return $this->belongsTo(Administrador::class, 'id_administrador');
    }

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto');
    }

    public function cuadrilla()
    {
        return $this->belongsTo(Cuadrilla::class, 'id_cuadrilla');
    }
}