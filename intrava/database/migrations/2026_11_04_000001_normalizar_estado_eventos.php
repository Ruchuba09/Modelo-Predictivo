<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Unifica los estados de eventos en los tres valores de App\Enums\EstadoEvento
 * (abierto, en_revision, cerrado). Antes convivían 'abierta', 'proceso' y 'cerrada'.
 */
return new class extends Migration
{
    private const EQUIVALENCIAS = [
        'abierto' => ['abierta', 'Abierto', 'Abierta', 'ABIERTO'],
        'en_revision' => ['proceso', 'en_proceso', 'En revisión', 'en revision'],
        'cerrado' => ['cerrada', 'Cerrado', 'Cerrada', 'CERRADO'],
    ];

    public function up(): void
    {
        if (! Schema::hasTable('eventos')) {
            return;
        }

        foreach (self::EQUIVALENCIAS as $canonico => $variantes) {
            DB::table('eventos')->whereIn('estado', $variantes)->update(['estado' => $canonico]);
        }

        // Cualquier otro valor rompería el cast a EstadoEvento: se avisa en vez de adivinar.
        $desconocidos = DB::table('eventos')
            ->whereNotIn('estado', array_keys(self::EQUIVALENCIAS))
            ->orWhereNull('estado')
            ->distinct()
            ->pluck('estado');

        if ($desconocidos->isNotEmpty()) {
            throw new RuntimeException(
                'Hay eventos con estados no reconocidos: '.$desconocidos->map(fn ($v) => var_export($v, true))->implode(', ')
                .'. Corrígelos a abierto, en_revision o cerrado y vuelve a ejecutar la migración.'
            );
        }
    }

    public function down(): void
    {
        // No reversible: los valores antiguos eran sinónimos de los actuales.
    }
};
