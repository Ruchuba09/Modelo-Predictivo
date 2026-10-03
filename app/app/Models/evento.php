<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'evidencia',
        'evidencia_cierre',
        'justificacion',
        'fecha_cierre',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
        'fecha_actualizacion' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function tipoEvento()
    {
        return $this->belongsTo(TipoEvento::class, 'id_tipo_evento', 'id_tipo_evento');
    }

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function supervisor()
    {
        return $this->belongsTo(Supervisor::class, 'id_supervisor', 'id_trabajador');
    }

    public function administrador()
    {
        return $this->belongsTo(Administrativo::class, 'id_administrador', 'id_trabajador');
    }

    // public function area()
    // {
    //     return $this->belongsTo(Area::class, 'id_area', 'id_area');
    // }

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class, 'id_proyecto', 'id_proyecto');
    }
}