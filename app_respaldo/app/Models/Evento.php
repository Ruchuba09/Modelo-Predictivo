<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evento extends Model
{
    use HasFactory;

    protected $table = 'eventos';
    protected $primaryKey = 'id_evento';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'id_tipo_evento',
        'id_administrador',
        'id_trabajador',
        'id_supervisor',
        'id_area',
        'id_proyecto',
        'descripcion',
        'condicion',
        'referencia',
        'estado',
        'severidad',
        'evidencia',
        'evidencia_cierre',
        'justificacion',
        'fecha_cierre',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
        'fecha_actualizacion' => 'datetime',
        'fecha_cierre' => 'datetime',
        'condicion' => 'decimal:2',
        'evidencia' => 'array',
        'evidencia_cierre' => 'array',
    ];

    public function tipoEvento(): BelongsTo
    {
        return $this->belongsTo(TipoEvento::class, 'id_tipo_evento', 'id_tipo_evento');
    }

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Supervisor::class, 'id_supervisor', 'id_trabajador');
    }

    public function administrador(): BelongsTo
    {
        return $this->belongsTo(Administrativo::class, 'id_administrador', 'id_trabajador');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'id_area', 'id_area');
    }

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }

    public function trabajadores(): BelongsToMany
    {
        return $this->belongsToMany(Trabajador::class, 'evento_trabajador', 'id_evento', 'id_trabajador');
    }

    public function evidencias(): HasMany
    {
        return $this->hasMany(Evidencia::class, 'id_evento', 'id_evento');
    }
}