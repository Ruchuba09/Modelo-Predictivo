<?php

namespace App\Support;

use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Support\Facades\DB;

/**
 * Catálogo de Permisos del sistema (RF-23 a RF-26).
 *
 * Cada función protegida exige uno de estos permisos (middleware
 * "permission:" y políticas). El código depende de sus nombres, por eso no
 * se pueden renombrar ni eliminar; su descripción y su nivel sí se editan.
 * El rol Administrador tiene todos los permisos sin necesidad de asignarlos.
 */
final class Permisos
{
    public const DASHBOARD_VER = 'dashboard.ver';
    public const EVENTOS_VER = 'eventos.ver';
    public const EVENTOS_VER_TODOS = 'eventos.ver-todos';
    public const EVENTOS_TOMAR = 'eventos.tomar';
    public const EVENTOS_EDITAR = 'eventos.editar';
    public const EVENTOS_CERRAR = 'eventos.cerrar';
    public const EVENTOS_ELIMINAR = 'eventos.eliminar';
    public const ESTADISTICAS_VER = 'estadisticas.ver';
    public const SITUACIONES_VER = 'situaciones.ver';
    public const SITUACIONES_VER_TODAS = 'situaciones.ver-todas';
    public const SITUACIONES_GESTIONAR = 'situaciones.gestionar';
    public const INTRAVA_VER = 'intrava.ver';
    public const OPERACIONES_VER = 'operaciones.ver';
    public const OPERACIONES_GESTIONAR = 'operaciones.gestionar';
    public const MODELO_VER = 'modelo-predictivo.ver';
    public const MODELO_ENTRENAR = 'modelo-predictivo.entrenar';
    public const CATALOGOS_VER = 'catalogos.ver';
    public const CATALOGOS_GESTIONAR = 'catalogos.gestionar';
    public const USUARIOS_GESTIONAR = 'usuarios.gestionar';
    public const ROLES_GESTIONAR = 'roles.gestionar';
    public const PERMISOS_GESTIONAR = 'permisos.gestionar';
    public const DATOS_PRUEBA = 'sistema.datos-prueba';

    /** Valores de Nivel (RF-23 E-3): sensibilidad de lo que otorga el permiso. */
    public const NIVELES = [
        1 => 'Básico',
        2 => 'Intermedio',
        3 => 'Crítico',
    ];

    /**
     * nombre => [descripción, nivel, roles que lo reciben al instalar].
     * Los roles por defecto reproducen el acceso que antes daban los roles.
     */
    public const CATALOGO = [
        self::DASHBOARD_VER => ['Ver el panel estadístico de Tarjetas PARE.', 1, ['Supervisor']],
        self::EVENTOS_VER => ['Ver el listado general de eventos de su alcance y el RUT de las personas.', 1, ['Supervisor']],
        self::EVENTOS_VER_TODOS => ['Ver todos los eventos, no solo los de las cuadrillas que supervisa.', 2, []],
        self::EVENTOS_TOMAR => ['Tomar un evento abierto de su cuadrilla para revisarlo.', 2, ['Supervisor']],
        self::EVENTOS_EDITAR => ['Editar cualquier evento, en cualquier estado.', 2, []],
        self::EVENTOS_CERRAR => ['Cerrar eventos abiertos o en revisión.', 2, []],
        self::EVENTOS_ELIMINAR => ['Eliminar eventos y sus evidencias.', 3, []],
        self::ESTADISTICAS_VER => ['Ver las estadísticas de eventos.', 1, ['Supervisor']],
        self::SITUACIONES_VER => ['Ver las Situaciones Críticas en que figura como supervisor.', 1, ['Supervisor']],
        self::SITUACIONES_VER_TODAS => ['Ver todas las Situaciones Críticas.', 2, []],
        self::SITUACIONES_GESTIONAR => ['Registrar y modificar Situaciones Críticas.', 2, []],
        self::INTRAVA_VER => ['Ver las fuentes de Intrava.', 1, ['Supervisor']],
        self::OPERACIONES_VER => ['Ver proyectos, cuadrillas, actividades, horas y asistencia.', 1, ['Supervisor']],
        self::OPERACIONES_GESTIONAR => ['Registrar y modificar proyectos, cuadrillas, actividades, asignaciones, horas y asistencia.', 2, ['Supervisor']],
        self::MODELO_VER => ['Ver las predicciones del modelo predictivo.', 1, ['Supervisor']],
        self::MODELO_ENTRENAR => ['Entrenar la red neuronal del modelo predictivo.', 2, ['Supervisor']],
        self::CATALOGOS_VER => ['Consultar catálogos: personas, clientes, faenas, áreas, departamentos, trabajadores y tipos.', 1, ['Supervisor']],
        self::CATALOGOS_GESTIONAR => ['Registrar, modificar y eliminar catálogos: personas, clientes, faenas, áreas, departamentos, trabajadores y tipos.', 3, []],
        self::USUARIOS_GESTIONAR => ['Administrar usuarios y sus roles.', 3, []],
        self::ROLES_GESTIONAR => ['Administrar roles y los permisos que otorgan.', 3, []],
        self::PERMISOS_GESTIONAR => ['Administrar el catálogo de permisos.', 3, []],
        self::DATOS_PRUEBA => ['Poblar y limpiar datos de prueba.', 3, []],
    ];

    /** @return list<string> */
    public static function nombres(): array
    {
        return array_keys(self::CATALOGO);
    }

    public static function esDelSistema(string $nombre): bool
    {
        return array_key_exists(mb_strtolower(trim($nombre)), self::CATALOGO);
    }

    /**
     * Crea los permisos del catálogo que falten (completando descripción y
     * nivel vacíos) y asigna los de cada rol por defecto. No quita permisos
     * ni pisa lo que un Administrador ya editó, así que se puede repetir.
     */
    public static function sincronizar(): void
    {
        DB::transaction(function () {
            $ids = [];
            foreach (self::CATALOGO as $nombre => [$descripcion, $nivel]) {
                $permiso = Permiso::firstOrCreate(['nombre' => $nombre], ['descripcion' => $descripcion, 'nivel' => $nivel]);
                $permiso->fill([
                    'descripcion' => $permiso->descripcion ?: $descripcion,
                    'nivel' => $permiso->nivel ?? $nivel,
                ])->save();
                $ids[$nombre] = $permiso->id_permiso;
            }

            $roles = Rol::all()->groupBy(fn (Rol $rol) => Rol::nombreCanonico($rol->nombre));
            foreach (self::CATALOGO as $nombre => [, , $porDefecto]) {
                foreach ($porDefecto as $canonico) {
                    foreach ($roles->get($canonico, []) as $rol) {
                        $rol->permisos()->syncWithoutDetaching([$ids[$nombre]]);
                    }
                }
            }
        });
    }
}
