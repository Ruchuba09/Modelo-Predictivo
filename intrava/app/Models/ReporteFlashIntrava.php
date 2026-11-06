<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReporteFlashIntrava extends Model
{
    use HasFactory;

    protected $table = 'reportes_flash_intrava';
    protected $primaryKey = 'id_local';
    public $timestamps = false;

    protected $fillable = [
        'id_intrava', 'id_proyecto', 'id_proyecto_intrava', 'proyecto_alias',
        'area', 'fecha', 'hora', 'turno', 'clasificacion', 'casuistica',
        'descripcion', 'reportado_por', 'cargo', 'hora_reporte', 'payload',
        'sincronizado_en',
    ];

    protected $casts = [
        'fecha' => 'date', 'payload' => 'array',
        'sincronizado_en' => 'immutable_datetime',
    ];

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }
}
