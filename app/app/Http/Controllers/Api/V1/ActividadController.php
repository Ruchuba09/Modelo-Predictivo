<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActividadRequest;
use App\Http\Resources\ActividadResource;
use App\Models\Actividad;
use App\Services\ActividadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ActividadController extends Controller
{
    public function __construct(private readonly ActividadService $servicio) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $idAsignacion = $request->integer('id_asignacion') ?: null;

        return ActividadResource::collection($this->servicio->listar($idAsignacion));
    }

    public function store(ActividadRequest $request): ActividadResource
    {
        return new ActividadResource($this->servicio->crear($request->toData()));
    }

    public function show(Actividad $actividad): ActividadResource
    {
        return new ActividadResource($this->servicio->obtener($actividad));
    }

    public function update(ActividadRequest $request, Actividad $actividad): ActividadResource
    {
        return new ActividadResource($this->servicio->actualizar($actividad, $request->toData()));
    }

    public function destroy(Actividad $actividad): Response
    {
        $this->servicio->eliminar($actividad);

        return response()->noContent();
    }
}
