<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Trabajador extends Model
{
    protected $table = 'trabajadores';
    protected $primaryKey = 'id_trabajador';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'ultima_actualizacion';

    protected $fillable = [
        'id_persona',
        'cargo',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_creacion' => 'datetime',
            'ultima_actualizacion' => 'datetime',
        ];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'id_persona', 'id_persona');
    }

    public function usuario(): HasOne
    {
        return $this->hasOne(User::class, 'id_trabajador', 'id_trabajador');
    }

    public function obrero(): HasOne
    {
        return $this->hasOne(Obrero::class, 'id_trabajador', 'id_trabajador');
    }

    public function administrativo(): HasOne
    {
        return $this->hasOne(Administrativo::class, 'id_trabajador', 'id_trabajador');
    }

    public function supervisor(): HasOne
    {
        return $this->hasOne(Supervisor::class, 'id_trabajador', 'id_trabajador');
    }

    public function departamentos(): BelongsToMany
    {
        return $this->belongsToMany(Departamento::class, 'trabajador_departamento', 'id_trabajador', 'id_departamento');
    }

    public function eventos(): BelongsToMany
    {
        return $this->belongsToMany(Evento::class, 'evento_trabajador', 'id_trabajador', 'id_evento');
    }
}