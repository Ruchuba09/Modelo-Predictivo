<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Obrero extends Model
{
    use HasFactory;

    protected $table = 'obreros';
    protected $primaryKey = 'id_trabajador';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    /** Mantiene el historial con fechas cada vez que el obrero cambia de cuadrilla. */
    protected static function booted(): void
    {
        static::saved(function (Obrero $obrero) {
            if (! $obrero->wasRecentlyCreated && ! $obrero->wasChanged('id_cuadrilla')) {
                return;
            }
            $hoy = now()->toDateString();
            DB::table('trabajadores_cuadrillas')
                ->where('id_trabajador', $obrero->id_trabajador)
                ->whereNull('fecha_fin')
                ->update(['fecha_fin' => $hoy]);
            if ($obrero->id_cuadrilla) {
                DB::table('trabajadores_cuadrillas')->updateOrInsert(
                    ['id_trabajador' => $obrero->id_trabajador, 'id_cuadrilla' => $obrero->id_cuadrilla, 'fecha_inicio' => $hoy],
                    ['fecha_fin' => null],
                );
            }
        });
    }

    protected $fillable = [
        'id_trabajador',
        'id_tipo_obrero',
        'id_cuadrilla',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function cuadrilla()
    {
        return $this->belongsTo(Cuadrilla::class, 'id_cuadrilla', 'id_cuadrilla');
    }

    public function tipoObrero()
    {
        return $this->belongsTo(TipoObrero::class, 'id_tipo_obrero', 'id_tipo_obrero');
    }
}
