<?php


namespace App\Services;

use App\DataTransferObjects\TrabajadorData;
use App\Models\Administrativo;
use App\Models\JefeZona;
use App\Models\Obrero;
use App\Models\Persona;
use App\Models\Supervisor;
use App\Models\Trabajador;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Catálogo de trabajadores. La cuenta de acceso de un trabajador no se crea,
 * modifica ni elimina aquí: es parte de la administración de Usuarios
 * (RF-27 a RF-30, permiso usuarios.gestionar).
 */
class TrabajadorService
{
    public const MENSAJE_CON_CUENTA = 'No se puede eliminar: el trabajador tiene una cuenta de usuario. Elimine primero la cuenta desde Usuarios.';

    private const RELACIONES = ['persona', 'usuario', 'obrero', 'supervisor', 'administrativo', 'jefeZona'];

    public function listarFormateados(): Collection
    {
        return Trabajador::with(self::RELACIONES)
            ->latest('fecha_creacion')
            ->get()
            ->map(fn (Trabajador $t) => $this->formatear($t));
    }

    /**
     * Aplana trabajador + persona + usuario + tipo para el front.
     */
    public function formatear(Trabajador $trabajador): array
    {
        $trabajador->loadMissing(self::RELACIONES);

        return array_merge(
            $trabajador->persona?->only(['rut', 'nombre_1', 'nombre_2', 'apellido_1', 'apellido_2']) ?? [],
            $trabajador->only(['id_trabajador', 'id_persona', 'cargo', 'estado', 'fecha_creacion', 'ultima_actualizacion']),
            [
                'email' => $trabajador->usuario?->email,
                'id_tipo_trabajador' => $this->tipoActual($trabajador),
                'id_tipo_obrero' => $trabajador->obrero?->id_tipo_obrero,
            ]
        );
    }

    public function crear(TrabajadorData $datos): Trabajador
    {
        return DB::transaction(function () use ($datos) {
            $persona = Persona::create($this->datosPersona($datos));

            $trabajador = Trabajador::create(
                $this->datosTrabajador($datos) + ['id_persona' => $persona->id_persona]
            );

            $this->crearSubtipo($trabajador, $datos->idTipoTrabajador, $datos->idTipoObrero);

            return $trabajador;
        });
    }

    public function actualizar(Trabajador $trabajador, TrabajadorData $datos): Trabajador
    {
        return DB::transaction(function () use ($trabajador, $datos) {
            $tipoAnterior = $this->tipoActual($trabajador);
            $tipoNuevo = $datos->idTipoTrabajador;

            $trabajador->persona->update($this->datosPersona($datos));
            $trabajador->update($this->datosTrabajador($datos));

            if ($tipoAnterior !== $tipoNuevo) {
                $this->eliminarSubtipo($trabajador, $tipoAnterior);
                $this->crearSubtipo($trabajador, $tipoNuevo, $datos->idTipoObrero);
            } elseif ($tipoNuevo === 'obrero' && $datos->idTipoObrero) {
                Obrero::where('id_trabajador', $trabajador->id_trabajador)
                    ->update(['id_tipo_obrero' => $datos->idTipoObrero]);
            }

            return $trabajador->refresh();
        });
    }

    /**
     * Las FKs eliminan en cascada el subtipo y los pivotes. Un trabajador con
     * cuenta no se elimina: borrarla saltaría las reglas de RF-30 (propia
     * cuenta, último administrador, cierre de sesiones).
     *
     * @throws \DomainException con MENSAJE_CON_CUENTA
     */
    public function eliminar(Trabajador $trabajador): void
    {
        DB::transaction(function () use ($trabajador) {
            $conCuenta = User::where('id_trabajador', $trabajador->id_trabajador)->lockForUpdate()->exists();
            if ($conCuenta) {
                throw new \DomainException(self::MENSAJE_CON_CUENTA);
            }

            $persona = $trabajador->persona;
            $trabajador->delete();
            $persona?->delete();
        });
    }

    private function tipoActual(Trabajador $trabajador): ?string
    {
        return match (true) {
            (bool) $trabajador->obrero => 'obrero',
            (bool) $trabajador->supervisor => 'supervisor',
            (bool) $trabajador->administrativo => 'administrativo',
            (bool) $trabajador->jefeZona => 'jefe_zona',
            default => null,
        };
    }

    private function crearSubtipo(Trabajador $trabajador, string $tipo, ?int $idTipoObrero = null): void
    {
        match ($tipo) {
            'obrero' => Obrero::firstOrCreate(
                ['id_trabajador' => $trabajador->id_trabajador],
                ['id_tipo_obrero' => $idTipoObrero]
            ),
            'jefe_zona' => JefeZona::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
            'supervisor' => Supervisor::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
            'administrativo' => Administrativo::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
        };
    }

    private function eliminarSubtipo(Trabajador $trabajador, ?string $tipo): void
    {
        match ($tipo) {
            'obrero' => Obrero::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            'jefe_zona' => JefeZona::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            'supervisor' => Supervisor::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            'administrativo' => Administrativo::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            default => null,
        };
    }

    private function datosPersona(TrabajadorData $datos): array
    {
        return [
            'rut' => $datos->rut,
            'nombre_1' => $datos->nombre1,
            'nombre_2' => $datos->nombre2,
            'apellido_1' => $datos->apellido1,
            'apellido_2' => $datos->apellido2,
        ];
    }

    private function datosTrabajador(TrabajadorData $datos): array
    {
        return array_filter([
            'cargo' => $datos->cargo,
            'estado' => $datos->estado,
        ], fn ($valor) => $valor !== null);
    }
}