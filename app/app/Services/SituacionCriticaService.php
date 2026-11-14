<?php

namespace App\Services;

use App\Models\Evento;
use App\Models\SituacionCritica;
use App\Models\SituacionCriticaHistorial;
use App\Models\TipoEvento;
use App\Models\Trabajador;
use App\Models\User;
use App\Support\Permisos;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Situaciones Críticas (RF-14 a RF-16).
 *
 * Cada Tarjeta PARE tiene una Situación Crítica con una copia de sus campos
 * comunes (trabajador, supervisor, referencia y condición). Ambos registros
 * se mantienen sincronizados y cada cambio queda en el historial.
 */
class SituacionCriticaService
{
    /** Campos que la Situación Crítica comparte con su Tarjeta PARE. */
    public const CAMPOS = ['id_trabajador', 'id_supervisor', 'referencia', 'condicion'];

    public const RELACIONES = ['trabajador.persona', 'supervisor.trabajador.persona', 'evento'];

    public const MENSAJE_REGISTRO_INVALIDO = 'El registro seleccionado no es válido.';

    public const MENSAJE_NO_ES_PARE = 'El evento seleccionado no es una Tarjeta PARE.';

    public const MENSAJE_YA_REGISTRADA = 'La Tarjeta PARE ya tiene una Situación Crítica asociada.';

    private ?int $idTipoPare = null;

    public function idTipoPare(): ?int
    {
        return $this->idTipoPare ??= TipoEvento::idPare();
    }

    /* ------------------------------ RF-14 ------------------------------ */

    /**
     * RF-14.1: registro automático al crear la Tarjeta PARE. Se llama dentro
     * de la transacción de RF-9; si falla, la excepción revierte la tarjeta.
     */
    public function registrarAutomatica(Evento $evento): SituacionCritica
    {
        return $this->crear($evento, $evento->id_autor);
    }

    /**
     * RF-14.2: registro manual por un Administrador, para una tarjeta que no la tenga.
     *
     * La tarjeta se bloquea y se vuelve a comprobar dentro de la transacción:
     * dos registros simultáneos de la misma tarjeta no pueden crear dos
     * Situaciones Críticas (el índice único de id_evento es el último resguardo).
     *
     * @throws ValidationException si la tarjeta ya no cumple RF-14.2.1 a RF-14.2.3
     */
    public function registrarManual(int $idEvento, User $usuario): SituacionCritica
    {
        return DB::transaction(function () use ($idEvento, $usuario) {
            $evento = Evento::whereKey($idEvento)->lockForUpdate()->first();

            if ($mensaje = $this->motivoNoRegistrable($evento)) {
                throw ValidationException::withMessages(['id_evento' => $mensaje]);
            }

            return $this->crear($evento, $usuario->id_user);
        });
    }

    /** Por qué el evento no admite una Situación Crítica nueva (RF-14.2.1 a RF-14.2.3), o null si la admite. */
    public function motivoNoRegistrable(?Evento $evento): ?string
    {
        return match (true) {
            $evento === null => self::MENSAJE_REGISTRO_INVALIDO,
            (int) $evento->id_tipo_evento !== (int) $this->idTipoPare() => self::MENSAJE_NO_ES_PARE,
            SituacionCritica::where('id_evento', $evento->id_evento)->exists() => self::MENSAJE_YA_REGISTRADA,
            default => null,
        };
    }

    /** Tarjetas PARE sin Situación Crítica, para el registro manual. */
    public function tarjetasSinSituacion(): Collection
    {
        return Evento::with('trabajador.persona')
            ->where('id_tipo_evento', $this->idTipoPare())
            ->whereNotExists(fn ($q) => $q->from('situacion_criticas')
                ->whereColumn('situacion_criticas.id_evento', 'eventos.id_evento'))
            ->orderByDesc('id_evento')
            ->get(['id_evento', 'id_trabajador', 'id_supervisor', 'referencia', 'condicion', 'descripcion']);
    }

    private function crear(Evento $evento, ?int $idUsuario): SituacionCritica
    {
        $situacion = SituacionCritica::create(['id_evento' => $evento->id_evento, ...$this->camposDe($evento)]);

        SituacionCriticaHistorial::create([
            'id_situacion_critica' => $situacion->id,
            'id_evento' => $evento->id_evento,
            'origen' => SituacionCriticaHistorial::ORIGEN_CREACION,
            'id_usuario' => $idUsuario,
            'fecha' => now(),
        ]);

        return $situacion;
    }

    /* ------------------------------ RF-15 ------------------------------ */

    /**
     * RF-15.1: aplica a la Situación Crítica los campos actuales de su Tarjeta
     * PARE. Debe llamarse dentro de la transacción que modificó el evento, para
     * que un fallo aquí revierta también ese cambio (RF-15.4.1).
     */
    public function sincronizarDesdeEvento(Evento $evento, ?User $usuario): void
    {
        // Se bloquea para no pisar una edición manual simultánea (RF-15.2).
        $situacion = SituacionCritica::where('id_evento', $evento->id_evento)->lockForUpdate()->first();
        if (! $situacion) {
            return;
        }

        $this->aplicar($situacion, $this->camposDe($evento), SituacionCriticaHistorial::ORIGEN_SINCRONIZACION, $usuario?->id_user);
    }

    /**
     * RF-15.2: edición manual por un Administrador. Los mismos valores se
     * aplican a la Tarjeta PARE; todo en una transacción (RF-15.4).
     */
    public function editarManual(SituacionCritica $situacion, array $datos, User $usuario): SituacionCritica
    {
        DB::transaction(function () use ($situacion, $datos, $usuario) {
            // Se bloquean ambas filas, primero la tarjeta (el mismo orden que
            // la edición del evento), y se compara contra los valores vigentes:
            // así dos ediciones simultáneas no se pisan ni falsean el historial.
            $evento = Evento::whereKey($situacion->id_evento)->lockForUpdate()->first();
            $vigente = SituacionCritica::whereKey($situacion->getKey())->lockForUpdate()->firstOrFail();

            $cambios = $this->aplicar(
                $vigente,
                array_intersect_key($datos, array_flip(self::CAMPOS)),
                SituacionCriticaHistorial::ORIGEN_EDICION_MANUAL,
                $usuario->id_user
            );

            if ($cambios === [] || ! $evento) {
                return;
            }

            $evento->update(array_map(fn (array $cambio) => $cambio[1], $cambios));
            if (array_key_exists('id_trabajador', $cambios)) {
                $evento->trabajadores()->sync(array_filter([$evento->id_trabajador]));
            }
        });

        return $situacion->refresh();
    }

    /**
     * Actualiza los campos que cambiaron y registra cada uno en el historial.
     *
     * @return array<string, array{0: mixed, 1: mixed}> campo => [anterior, nuevo]
     */
    private function aplicar(SituacionCritica $situacion, array $valores, string $origen, ?int $idUsuario): array
    {
        $cambios = [];
        foreach (self::CAMPOS as $campo) {
            if (! array_key_exists($campo, $valores)) {
                continue;
            }
            $anterior = $situacion->{$campo};
            $nuevo = $valores[$campo] === '' ? null : $valores[$campo];
            if ((string) $anterior !== (string) $nuevo) {
                $cambios[$campo] = [$anterior, $nuevo];
            }
        }

        if ($cambios === []) {
            return [];
        }

        $situacion->update(array_map(fn (array $cambio) => $cambio[1], $cambios));

        foreach ($cambios as $campo => [$anterior, $nuevo]) {
            SituacionCriticaHistorial::create([
                'id_situacion_critica' => $situacion->id,
                'id_evento' => $situacion->id_evento,
                'origen' => $origen,
                'campo' => $campo,
                'valor_anterior' => $anterior,
                'valor_nuevo' => $nuevo,
                'id_usuario' => $idUsuario,
                'fecha' => now(),
            ]);
        }

        return $cambios;
    }

    private function camposDe(Evento $evento): array
    {
        return [
            'id_trabajador' => $evento->id_trabajador,
            'id_supervisor' => $evento->id_supervisor,
            'referencia' => $evento->referencia,
            'condicion' => $evento->condicion,
        ];
    }

    /* ------------------------------ RF-16 ------------------------------ */

    /** RF-16.1 a 16.3: Situaciones Críticas visibles para el usuario, con los filtros aplicados. */
    public function consulta(User $usuario, array $filtros): Builder
    {
        $query = SituacionCritica::query()->with(self::RELACIONES)->orderByDesc('id');

        if (! $usuario->tienePermiso(Permisos::SITUACIONES_VER_TODAS)) {
            $query->where('id_supervisor', $usuario->trabajador?->id_trabajador ?? 0);
        }

        foreach (['id_trabajador', 'id_supervisor', 'id_evento'] as $filtro) {
            if (! empty($filtros[$filtro])) {
                $query->where($filtro, (int) $filtros[$filtro]);
            }
        }

        return $query;
    }

    /** RF-16.4: historial de la Situación Crítica, del más reciente al más antiguo. */
    public function historialDe(SituacionCritica $situacion): array
    {
        $entradas = $situacion->historial()->with('usuario.trabajador.persona')
            ->orderByDesc('fecha')->orderByDesc('id_historial')->get();

        // Los valores de trabajador y supervisor se guardan como ID; se muestran por nombre.
        $ids = $entradas->whereIn('campo', ['id_trabajador', 'id_supervisor'])
            ->flatMap(fn ($e) => [$e->valor_anterior, $e->valor_nuevo])
            ->filter()->unique();
        $nombres = Trabajador::with('persona')->whereIn('id_trabajador', $ids)->get()
            ->mapWithKeys(fn (Trabajador $t) => [$t->id_trabajador => $this->nombre($t)]);

        $mostrar = fn (?string $campo, $valor) => in_array($campo, ['id_trabajador', 'id_supervisor'], true) && $valor !== null
            ? ($nombres[(int) $valor] ?? "#{$valor}")
            : $valor;

        return $entradas->map(fn (SituacionCriticaHistorial $e) => [
            'id_historial' => $e->id_historial,
            'origen' => $e->origen,
            'campo' => $e->campo,
            'valor_anterior' => $mostrar($e->campo, $e->valor_anterior),
            'valor_nuevo' => $mostrar($e->campo, $e->valor_nuevo),
            'usuario' => $e->usuario
                ? ($this->nombre($e->usuario->trabajador) ?: $e->usuario->email)
                : 'Sistema',
            'fecha' => $e->fecha?->toIso8601String(),
        ])->all();
    }

    private function nombre(?Trabajador $trabajador): string
    {
        return trim(($trabajador?->persona?->nombre_1 ?? '').' '.($trabajador?->persona?->apellido_1 ?? ''));
    }
}
