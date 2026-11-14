<?php

namespace App\Http\Controllers;

use App\Http\Requests\SituacionCritica\ActualizarSituacionCriticaRequest;
use App\Http\Requests\SituacionCritica\CrearSituacionCriticaRequest;
use App\Http\Requests\SituacionCritica\FiltroSituacionCriticaRequest;
use App\Models\SituacionCritica;
use App\Models\Supervisor;
use App\Models\Trabajador;
use App\Services\SituacionCriticaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Situaciones Críticas (RF-14 a RF-16). No se eliminan manualmente (RF-15.6):
 * solo desaparecen junto con su Tarjeta PARE.
 */
class SituacionCriticaController extends Controller
{
    public const MENSAJE_ERROR_REGISTRO = 'No se pudo completar el registro, intente nuevamente.';
    public const MENSAJE_ERROR_ACTUALIZACION = 'No se pudo completar la actualización, intente nuevamente.';

    public function __construct(private readonly SituacionCriticaService $servicio) {}

    /** RF-16.1 a 16.3: listado según el rol, con filtros. */
    public function index(FiltroSituacionCriticaRequest $request): Response
    {
        Gate::authorize('viewAny', SituacionCritica::class);

        $usuario = $request->user();
        $filtros = $request->filtros();

        return Inertia::render('SituacionCriticas/Index', [
            'situacionCriticas' => $this->servicio->consulta($usuario, $filtros)->get()
                ->map(fn (SituacionCritica $s) => $this->presentar($s)),
            'filtros' => (object) $filtros,
            'trabajadores' => $this->trabajadores(),
            'supervisores' => $this->supervisores(),
            'eventos' => $this->servicio->consulta($usuario, [])->reorder()
                ->orderByDesc('id_evento')->pluck('id_evento'),
            'puedeGestionar' => $usuario->can('create', SituacionCritica::class),
        ]);
    }

    /** RF-14.2: el Administrador elige una Tarjeta PARE sin Situación Crítica. */
    public function create(): Response
    {
        Gate::authorize('create', SituacionCritica::class);

        return Inertia::render('SituacionCriticas/Create', [
            'tarjetas' => $this->servicio->tarjetasSinSituacion()->map(fn ($evento) => [
                'id_evento' => $evento->id_evento,
                'descripcion' => $evento->descripcion,
                'referencia' => $evento->referencia,
                'condicion' => $evento->condicion,
                'id_supervisor' => $evento->id_supervisor,
                'trabajador' => $this->trabajadorPlano($evento->trabajador),
            ]),
            'supervisores' => $this->supervisores(),
        ]);
    }

    public function store(CrearSituacionCriticaRequest $request): RedirectResponse
    {
        Gate::authorize('create', SituacionCritica::class);

        try {
            $this->servicio->registrarManual($request->idEvento(), $request->user());
        } catch (ValidationException $e) {
            // La tarjeta dejó de cumplir RF-14.2 entre la validación y el registro.
            throw $e;
        } catch (Throwable $e) {
            report($e);

            return back()->withInput()->withErrors(['general' => self::MENSAJE_ERROR_REGISTRO]);
        }

        // RF-14.3.2: vuelve al listado.
        return redirect()->route('situacion-criticas.index')
            ->with('success', 'Situación crítica registrada.');
    }

    /** RF-16.4: detalle con historial de cambios. */
    public function show(SituacionCritica $situacionCritica): Response
    {
        Gate::authorize('view', $situacionCritica);

        return Inertia::render('SituacionCriticas/Show', [
            'situacionCritica' => $this->presentar($situacionCritica->load(SituacionCriticaService::RELACIONES)),
            'historial' => $this->servicio->historialDe($situacionCritica),
            'puedeGestionar' => request()->user()->can('update', $situacionCritica),
        ]);
    }

    /** RF-15.2: edición manual; el evento asociado no se puede cambiar. */
    public function edit(SituacionCritica $situacionCritica): Response
    {
        Gate::authorize('update', $situacionCritica);

        return Inertia::render('SituacionCriticas/Edit', [
            'situacionCritica' => $this->presentar($situacionCritica->load(SituacionCriticaService::RELACIONES)),
            'trabajadores' => $this->trabajadores(),
            'supervisores' => $this->supervisores(),
        ]);
    }

    public function update(ActualizarSituacionCriticaRequest $request, SituacionCritica $situacionCritica): RedirectResponse
    {
        Gate::authorize('update', $situacionCritica);

        try {
            $this->servicio->editarManual($situacionCritica, $request->validated(), $request->user());
        } catch (Throwable $e) {
            report($e);

            return back()->withInput()->withErrors(['general' => self::MENSAJE_ERROR_ACTUALIZACION]);
        }

        // RF-15.5: vuelve al listado.
        return redirect()->route('situacion-criticas.index')
            ->with('success', 'Situación crítica actualizada.');
    }

    private function trabajadores()
    {
        return Trabajador::with('persona')->where('estado', 'activo')->get()
            ->map(fn ($trabajador) => $this->trabajadorPlano($trabajador));
    }

    private function supervisores()
    {
        return Supervisor::with('trabajador.persona')->get()->map(fn ($supervisor) => [
            'id_trabajador' => $supervisor->id_trabajador,
            'trabajador' => $this->trabajadorPlano($supervisor->trabajador),
        ]);
    }

    private function presentar(SituacionCritica $situacion): array
    {
        return array_merge($situacion->toArray(), [
            'trabajador' => $this->trabajadorPlano($situacion->trabajador),
            'supervisor' => $situacion->supervisor ? [
                'id_trabajador' => $situacion->supervisor->id_trabajador,
                'trabajador' => $this->trabajadorPlano($situacion->supervisor->trabajador),
            ] : null,
        ]);
    }

    private function trabajadorPlano(?Trabajador $trabajador): ?array
    {
        if (! $trabajador) {
            return null;
        }

        return array_merge($trabajador->toArray(), $trabajador->persona?->only([
            'rut', 'nombre_1', 'nombre_2', 'apellido_1', 'apellido_2',
        ]) ?? []);
    }
}
