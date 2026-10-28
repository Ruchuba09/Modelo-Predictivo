<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TipoObreroRequest;
use App\Http\Resources\TipoObreroResource;
use App\Models\tipo_obrero;
use App\Services\TipoObreroService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TipoObreroController extends Controller
{
    public function __construct(private readonly TipoObreroService $servicio) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = tipo_obrero::query()
            ->when($request->string('buscar')->toString(), fn ($query, $buscar) => $query
                ->where('nombre', 'ilike', "%{$buscar}%"))
            ->orderBy('nombre');

        $tipos = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return TipoObreroResource::collection($tipos);
    }

    public function store(TipoObreroRequest $request): TipoObreroResource
    {
        return new TipoObreroResource($this->servicio->crear($request->toData()));
    }

    public function show(tipo_obrero $tipoObrero): TipoObreroResource
    {
        return new TipoObreroResource($tipoObrero);
    }

    public function update(TipoObreroRequest $request, tipo_obrero $tipoObrero): TipoObreroResource
    {
        return new TipoObreroResource($this->servicio->actualizar($tipoObrero, $request->toData()));
    }

    public function destroy(tipo_obrero $tipoObrero): Response
    {
        $this->servicio->eliminar($tipoObrero);

        return response()->noContent();
    }
}
