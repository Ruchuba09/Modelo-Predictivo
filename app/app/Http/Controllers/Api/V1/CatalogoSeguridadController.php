<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\EventoService;
use Illuminate\Http\JsonResponse;

class CatalogoSeguridadController extends Controller
{
    public function __invoke(EventoService $servicio): JsonResponse
    {
        return response()->json($servicio->catalogos());
    }
}
