<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrabajadorRequest;
use App\Http\Resources\TrabajadorResource;
use App\Models\Trabajador;
use App\Services\TrabajadorService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TrabajadorController extends Controller
{
    public function __construct(private readonly TrabajadorService $servicio) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Trabajador::query()->with(['persona', 'usuario', 'obrero', 'supervisor', 'administrativo'])
            ->when($request->string('buscar')->toString(), function ($query, $buscar) {
                $query->whereHas('persona', fn ($persona) => $persona
                    ->where('rut', 'ilike', "%{$buscar}%")
                    ->orWhere('nombre_1', 'ilike', "%{$buscar}%")
                    ->orWhere('apellido_1', 'ilike', "%{$buscar}%"));
            })
            ->orderByDesc('fecha_creacion');

        $trabajadores = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return TrabajadorResource::collection($trabajadores);
    }

    public function store(TrabajadorRequest $request): TrabajadorResource
    {
        $trabajador = $this->servicio->crear($request->toData());

        return new TrabajadorResource($trabajador->load(['persona', 'usuario', 'obrero', 'supervisor', 'administrativo']));
    }

    public function show(Trabajador $trabajador): TrabajadorResource
    {
        return new TrabajadorResource($trabajador->load(['persona', 'usuario', 'obrero', 'supervisor', 'administrativo']));
    }

    public function update(TrabajadorRequest $request, Trabajador $trabajador): TrabajadorResource
    {
        $trabajador = $this->servicio->actualizar($trabajador, $request->toData());

        return new TrabajadorResource($trabajador->load(['persona', 'usuario', 'obrero', 'supervisor', 'administrativo']));
    }

    public function destroy(Trabajador $trabajador): Response
    {
        $this->servicio->eliminar($trabajador);

        return response()->noContent();
    }
}
