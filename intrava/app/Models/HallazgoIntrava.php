<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HallazgoIntrava extends Model
{
    use HasFactory;

    protected $table = 'hallazgos_intrava';
    protected $primaryKey = 'id_intrava';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id_intrava', 'id_proyecto', 'id_proyecto_intrava',
        'id_subproceso_intrava', 'id_responsable_intrava',
        'id_segundo_responsable_intrava', 'id_creador_intrava',
        'id_administrador_intrava', 'correlativo', 'correlativo_corporativo',
        'tipo', 'origen', 'requisito_incumplido', 'fecha_creacion',
        'fecha_deteccion', 'fecha_cierre', 'estado', 'estado_inmediata',
        'estado_analisis', 'estado_correctiva', 'estado_recursos',
        'estado_evidencia', 'estado_resultado', 'estado_riesgos',
        'tratamiento_completo', 'razon_no_tratamiento', 'prioridad', 'url',
        'proyecto', 'datos', 'causa_raiz', 'payload', 'sincronizado_en',
    ];

    protected $casts = [
        'fecha_creacion' => 'date', 'fecha_deteccion' => 'date',
        'fecha_cierre' => 'date', 'prioridad' => 'decimal:3',
        'proyecto' => 'array', 'datos' => 'array', 'causa_raiz' => 'array',
        'payload' => 'array', 'sincronizado_en' => 'immutable_datetime',
        'estado_inmediata' => 'integer', 'estado_analisis' => 'integer',
        'estado_correctiva' => 'integer', 'estado_recursos' => 'integer',
        'estado_evidencia' => 'integer', 'estado_resultado' => 'integer',
        'estado_riesgos' => 'integer', 'tratamiento_completo' => 'integer',
    ];

    public function proyectoLocal(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }
}
