<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incidente extends Model
{
    protected $table = 'incidentes';
    protected $primaryKey = 'id_evento';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = ['id_evento', 'gravedad', 'requiere_investigacion'];

    public function evento()
    {
        return $this->belongsTo(Evento::class, 'id_evento', 'id_evento');
    }
}