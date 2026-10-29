<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportePrevieneIntrava extends Model
{
    use HasFactory;

    protected $table = 'reportes_previene_intrava';
    protected $primaryKey = 'id_local';
    public $timestamps = false;

    protected $fillable = [
        'id_intrava', 'id_proyecto', 'id_proyecto_intrava', 'identificador',
        'proyecto_alias', 'fecha', 'hora', 'area', 'descripcion',
        'acciones_inmediatas', 'urgencia', 'aviso_jefatura', 'estado',
        'evidencias_creacion', 'cierre_comentario', 'cierre_fecha',
        'cierre_hora', 'cerrado_por', 'evidencias_cierre', 'payload',
        'sincronizado_en',
    ];

    protected $casts = [
        'fecha' => 'date', 'cierre_fecha' => 'date',
        'urgencia' => 'integer', 'evidencias_creacion' => 'integer',
        'evidencias_cierre' => 'integer', 'payload' => 'array',
        'sincronizado_en' => 'immutable_datetime',
    ];

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }
}
