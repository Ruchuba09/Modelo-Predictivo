<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La red neuronal se reemplazó por tres modelos de tasa: el permiso de entrenar ahora reentrena esos
 * modelos. Solo se cambia la descripción si nadie la editó.
 */
return new class extends Migration
{
    private const ANTERIOR = 'Entrenar la red neuronal del modelo predictivo.';
    private const NUEVA = 'Reentrenar los modelos predictivos.';

    public function up(): void
    {
        DB::table('permisos')->where('nombre', 'modelo-predictivo.entrenar')
            ->where('descripcion', self::ANTERIOR)->update(['descripcion' => self::NUEVA]);
    }

    public function down(): void
    {
        DB::table('permisos')->where('nombre', 'modelo-predictivo.entrenar')
            ->where('descripcion', self::NUEVA)->update(['descripcion' => self::ANTERIOR]);
    }
};
