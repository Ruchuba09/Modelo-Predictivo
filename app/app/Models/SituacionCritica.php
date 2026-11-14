<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SituacionCritica extends Model
{
    use HasFactory;

    protected $table = 'situacion_criticas';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'id_trabajador',
        'id_supervisor',
        'id_evento',
        'referencia',
        'condicion',
    ];

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Supervisor::class, 'id_supervisor', 'id_trabajador');
    }

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class, 'id_evento', 'id_evento');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(SituacionCriticaHistorial::class, 'id_situacion_critica', 'id');
    }
}
