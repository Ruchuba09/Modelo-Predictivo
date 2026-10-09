<?php

namespace App\Http\Controllers;

use App\Models\Administrativo;
use App\Models\Obrero;
use App\Models\Persona;
use App\Models\Supervisor;
use App\Models\Trabajador;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TrabajadorController extends Controller
{
    /**
     * Contraseña por defecto asignada a los usuarios creados junto a un trabajador.
     * TODO: reemplazar por un flujo de "primer ingreso" / cambio obligatorio de clave.
     */
    private const PASSWORD_DEFAULT = '12345678';

    public function index()
    {
        $trabajadores = Trabajador::with(['persona', 'usuario', 'obrero', 'supervisor', 'administrativo'])
            ->latest('fecha_creacion')
            ->get()
            ->map(fn (Trabajador $t) => $this->formatear($t));

        return Inertia::render('Trabajadores/Trabajadores', [
            'trabajadores' => $trabajadores,
        ]);
    }

    public function create()
    {
        return Inertia::render('Trabajadores/Create');
    }

    public function store(Request $request)
    {
        $validated = $this->validarDatos($request);

        DB::transaction(function () use ($validated) {
            $persona = Persona::create($this->datosPersona($validated));

            $trabajador = Trabajador::create(
                $this->datosTrabajador($validated) + ['id_persona' => $persona->id_persona]
            );

            $this->crearSubtipo(
                $trabajador,
                $validated['id_tipo_trabajador'],
                $validated['id_tipo_obrero'] ?? null
            );

            User::create([
                'id_trabajador' => $trabajador->id_trabajador,
                'email' => $validated['email'],
                'password' => self::PASSWORD_DEFAULT,
            ]);
        });

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador creado correctamente.');
    }

    public function show(Trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Show', [
            'trabajador' => $this->formatear($trabajador),
        ]);
    }

    public function edit(Trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Edit', [
            'trabajador' => $this->formatear($trabajador),
        ]);
    }

    public function update(Request $request, Trabajador $trabajador)
    {
        $validated = $this->validarDatos($request, $trabajador);

        DB::transaction(function () use ($trabajador, $validated) {
            $tipoAnterior = $this->tipoActual($trabajador);
            $tipoNuevo = $validated['id_tipo_trabajador'];
            $idTipoObrero = $validated['id_tipo_obrero'] ?? null;

            $trabajador->persona->update($this->datosPersona($validated));
            $trabajador->update($this->datosTrabajador($validated));

            if ($tipoAnterior !== $tipoNuevo) {
                $this->eliminarSubtipo($trabajador, $tipoAnterior);
                $this->crearSubtipo($trabajador, $tipoNuevo, $idTipoObrero);
            } elseif ($tipoNuevo === 'obrero' && $idTipoObrero) {
                Obrero::where('id_trabajador', $trabajador->id_trabajador)
                    ->update(['id_tipo_obrero' => $idTipoObrero]);
            }

            $usuario = $trabajador->usuario;

            if ($usuario) {
                $usuario->update(['email' => $validated['email']]);
            } else {
                User::create([
                    'id_trabajador' => $trabajador->id_trabajador,
                    'email' => $validated['email'],
                    'password' => self::PASSWORD_DEFAULT,
                ]);
            }
        });

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador actualizado correctamente.');
    }

    public function destroy(Trabajador $trabajador)
    {
        // Las FKs hacen cascade: subtipo, user, pivotes.
        DB::transaction(function () use ($trabajador) {
            $persona = $trabajador->persona;
            $trabajador->delete();
            $persona?->delete();
        });

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador eliminado correctamente.');
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

    private function datosPersona(array $validated): array
    {
        return collect($validated)
            ->only(['rut', 'nombre_1', 'nombre_2', 'apellido_1', 'apellido_2'])
            ->all();
    }

    private function datosTrabajador(array $validated): array
    {
        return collect($validated)->only(['cargo', 'estado'])->all();
    }

    /**
     * Aplana trabajador + persona + usuario + tipo para el front.
     */
    private function formatear(Trabajador $trabajador): array
    {
        $trabajador->loadMissing(['persona', 'usuario', 'obrero', 'supervisor', 'administrativo']);

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

    private function validarDatos(Request $request, ?Trabajador $trabajador = null): array
    {
        return $request->validate([
            'nombre_1' => 'required|string|max:100',
            'nombre_2' => 'nullable|string|max:100',
            'apellido_1' => 'required|string|max:100',
            'apellido_2' => 'nullable|string|max:100',
            'cargo' => 'required|string|max:100',
            'estado' => 'nullable|string|max:30',
            'id_tipo_trabajador' => 'required|string|in:obrero,supervisor,administrativo',
            'id_tipo_obrero' => [
                'nullable',
                'required_if:id_tipo_trabajador,obrero',
                'integer',
                'exists:tipo_obreros,id_tipo_obrero',
            ],
            'rut' => [
                'required',
                'string',
                'max:20',
                Rule::unique('personas', 'rut')->ignore($trabajador?->id_persona, 'id_persona'),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($trabajador?->usuario?->id_user, 'id_user'),
            ],
        ]);
    }
}