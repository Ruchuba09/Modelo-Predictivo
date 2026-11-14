<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Entrada del historial de una Situación Crítica (RF-14.3 / RF-15.3). */
class SituacionCriticaHistorial extends Model
{
    public const ORIGEN_CREACION = 'creacion';

    public const ORIGEN_SINCRONIZACION = 'sincronizacion';

    public const ORIGEN_EDICION_MANUAL = 'edicion_manual';

    protected $table = 'situacion_critica_historial';

    protected $primaryKey = 'id_historial';

    public $timestamps = false;

    protected $fillable = [
        'id_situacion_critica',
        'id_evento',
        'origen',
        'campo',
        'valor_anterior',
        'valor_nuevo',
        'id_usuario',
        'fecha',
    ];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_user');
    }
}
