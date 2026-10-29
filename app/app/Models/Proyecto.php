<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Proyecto extends Model
{
    use HasFactory;

    protected $table = 'proyectos';
    protected $primaryKey = 'id_proyecto';
    public $timestamps = false;

    protected $fillable = [
        'id_faena',
        'id_cliente',
        'nombre',
        'descripcion',
        'ubicacion',
        'id_proyecto_intrava',
        'centro_costo',
        'alias',
        'num_contrato',
        'fecha_inicio',
        'fecha_termino',
        'estado',
    ];

    protected $casts = [
        'id_proyecto_intrava' => 'integer',
        'fecha_inicio' => 'date',
        'fecha_termino' => 'date',
    ];

    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(Asignacion::class, 'id_proyecto', 'id_proyecto');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'id_proyecto', 'id_proyecto');
    }

    public function actividades(): HasManyThrough
    {
        return $this->hasManyThrough(
            Actividad::class,
            Asignacion::class,
            'id_proyecto',
            'id_asignacion',
            'id_proyecto',
            'id_asignacion'
        );
    }

    public function reportesPrevieneIntrava(): HasMany
    {
        return $this->hasMany(ReportePrevieneIntrava::class, 'id_proyecto', 'id_proyecto');
    }

    public function reportesFlashIntrava(): HasMany
    {
        return $this->hasMany(ReporteFlashIntrava::class, 'id_proyecto', 'id_proyecto');
    }

    public function informesInvestigacionIntrava(): HasMany
    {
        return $this->hasMany(InformeInvestigacionIntrava::class, 'id_proyecto', 'id_proyecto');
    }

    public function hallazgosIntrava(): HasMany
    {
        return $this->hasMany(HallazgoIntrava::class, 'id_proyecto', 'id_proyecto');
    }
}
