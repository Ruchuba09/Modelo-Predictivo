<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Obrero extends Model
{
    use HasFactory;

    protected $table = 'obreros';
    protected $primaryKey = 'id_trabajador';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_trabajador',
        'id_tipo_obrero',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function tipoObrero()
    {
        return $this->belongsTo(tipo_obrero::class, 'id_tipo_obrero', 'id_tipo_obrero');
    }
}
