<?php


namespace App\Http\Services;

use App\DataTransferObjects\TrabajadorData;
use App\Models\Administrativo;
use App\Models\Obrero;
use App\Models\Persona;
use App\Models\Supervisor;
use App\Models\Trabajador;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TrabajadorService
{
    /**
     * Contraseña por defecto asignada a los usuarios creados junto a un trabajador.
     * TODO: reemplazar por un flujo de "primer ingreso" / cambio obligatorio de clave.
     */
    private const PASSWORD_DEFAULT = '12345678';

    private const RELACIONES = ['persona', 'usuario', 'obrero', 'supervisor', 'administrativo'];

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
            $this->crearUsuario($trabajador, $datos->email);

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

            if ($trabajador->usuario) {
                $trabajador->usuario->update(['email' => $datos->email]);
            } else {
                $this->crearUsuario($trabajador, $datos->email);
            }

            return $trabajador->refresh();
        });
    }

    public function eliminar(Trabajador $trabajador): void
    {
        // Las FKs hacen cascade: subtipo, user, pivotes.
        DB::transaction(function () use ($trabajador) {
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
            'supervisor' => Supervisor::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
            'administrativo' => Administrativo::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
        };
    }

    private function eliminarSubtipo(Trabajador $trabajador, ?string $tipo): void
    {
        match ($tipo) {
            'obrero' => Obrero::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            'supervisor' => Supervisor::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            'administrativo' => Administrativo::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            default => null,
        };
    }

    private function crearUsuario(Trabajador $trabajador, string $email): User
    {
        return User::create([
            'id_trabajador' => $trabajador->id_trabajador,
            'email' => $email,
            'password' => self::PASSWORD_DEFAULT,
        ]);
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