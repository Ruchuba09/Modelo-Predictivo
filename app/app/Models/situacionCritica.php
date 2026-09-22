<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SituacionCritica extends Model
{
    protected $table = 'situacion_criticas';

    protected $fillable = [
        'id_trabajador',
        'id_supervisor',
        'id_evento',
        'referencia',
        'condicion',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function supervisor()
    {
        return $this->belongsTo(Supervisor::class, 'id_supervisor', 'id_trabajador');
    }

    public function evento()
    {
        return $this->belongsTo(Evento::class, 'id_evento', 'id_evento');
    }
}{
    //
}
