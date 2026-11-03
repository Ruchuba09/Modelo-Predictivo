<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InformeInvestigacionIntrava extends Model
{
    use HasFactory;

    protected $table = 'informes_investigacion_intrava';
    protected $primaryKey = 'id_local';
    public $timestamps = false;

    protected $fillable = [
        'id_intrava', 'uuid_intrava', 'id_reporte_flash_intrava', 'id_proyecto',
        'id_proyecto_intrava', 'proyecto_alias', 'general', 'analisis_causal',
        'causa_raiz', 'accidentado', 'payload', 'sincronizado_en',
    ];

    protected $casts = [
        'general' => 'array', 'analisis_causal' => 'array',
        'accidentado' => 'array', 'payload' => 'array',
        'sincronizado_en' => 'immutable_datetime',
    ];

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }

    public function reporteFlash(): BelongsTo
    {
        return $this->belongsTo(ReporteFlashIntrava::class, 'id_reporte_flash_intrava', 'id_intrava');
    }
}
