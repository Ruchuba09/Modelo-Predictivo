<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Services\AsignacionTrabajadorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActividadTrabajadorController extends Controller
{
    public function __construct(private readonly AsignacionTrabajadorService $servicio) {}

    public function index(Actividad $actividad): JsonResponse
    {
        return response()->json($this->servicio->listar($actividad->load('asignacion')));
    }

    public function store(Request $request, Actividad $actividad): JsonResponse
    {
        $datos = $request->validate(['id_trabajador' => ['required', 'integer', 'exists:trabajadores,id_trabajador']]);
        $this->servicio->asignar($actividad->load('asignacion'), $datos['id_trabajador'], $request->user()?->id_trabajador);

        return response()->json($this->servicio->listar($actividad), 201);
    }

    public function destroy(Actividad $actividad, int $trabajador): JsonResponse
    {
        $this->servicio->desasignar($actividad, $trabajador);

        return response()->json($this->servicio->listar($actividad->load('asignacion')));
    }
}
