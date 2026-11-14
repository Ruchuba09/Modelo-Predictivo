<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoEvento extends Model
{
    use HasFactory;

    protected $table = 'tipo_eventos';
    protected $primaryKey = 'id_tipo_evento';
    public $timestamps = false;
    protected $fillable = ['nombre'];

    public const NOMBRE_PARE = 'Tarjeta PARE';

    /**
     * El id de la Tarjeta PARE cambia según cómo se cargó la base, por lo que
     * se resuelve siempre por nombre.
     */
    public static function idPare(): ?int
    {
        return static::where('nombre', self::NOMBRE_PARE)->value('id_tipo_evento');
    }
}
