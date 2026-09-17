<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evento extends Model
{
    protected $table = 'eventos';
    protected $primaryKey = 'id_evento';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_ult_act';

    protected $fillable = [
        'id_trabajador',
        'id_supervisor',
        'id_administrativo',
        'tipo',
        'estado',
        'fecha_cierre',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
        'fecha_ult_act' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function trabajador()
    {
        return $this->belongsTo(User::class, 'id_trabajador', 'id_user');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'id_supervisor', 'id_user');
    }

    public function administrativo()
    {
        return $this->belongsTo(User::class, 'id_administrativo', 'id_user');
    }

    public function incidente()
    {
        return $this->hasOne(Incidente::class, 'id_evento', 'id_evento');
    }

    public function fatalidad()
    {
        return $this->hasOne(Fatalidad::class, 'id_evento', 'id_evento');
    }

    protected static function booted(): void
    {
        static::updating(function (Evento $evento) {
            if ($evento->isDirty('estado') && $evento->estado === 'cerrada' && ! $evento->fecha_cierre) {
                $evento->fecha_cierre = now();
            }
        });
    }
}