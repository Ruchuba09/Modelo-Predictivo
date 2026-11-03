<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\IntravaReportResource;
use App\Services\IntravaReportService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IntravaReportController extends Controller
{
    public function __construct(private readonly IntravaReportService $servicio) {}

    public function previene(Request $request): AnonymousResourceCollection
    {
        $filters = $this->validarFiltros($request);

        return IntravaReportResource::collection($this->servicio->previene($filters));
    }

    public function flash(Request $request): AnonymousResourceCollection
    {
        $filters = $this->validarFiltros($request);

        return IntravaReportResource::collection($this->servicio->flash($filters));
    }

    public function investigaciones(Request $request): AnonymousResourceCollection
    {
        $filters = $this->validarFiltros($request);

        return IntravaReportResource::collection($this->servicio->investigaciones($filters));
    }

    public function hallazgos(Request $request): AnonymousResourceCollection
    {
        $filters = $this->validarFiltros($request, true);

        return IntravaReportResource::collection($this->servicio->hallazgos($filters));
    }

    private function validarFiltros(Request $request, bool $idEsUuid = false): array
    {
        return $request->validate([
            'id_proyecto' => ['sometimes', 'integer', 'min:1'],
            'id_proyecto_intrava' => ['sometimes', 'integer', 'min:1'],
            'id_intrava' => ['sometimes', $idEsUuid ? 'uuid' : 'integer'],
            'uuid_intrava' => ['sometimes', 'uuid'],
            'id_reporte_flash_intrava' => ['sometimes', 'integer', 'min:1'],
            'desde' => ['sometimes', 'date'],
            'hasta' => ['sometimes', 'date', 'after_or_equal:desde'],
            'estado' => ['sometimes', 'string', 'max:255'],
            'buscar' => ['sometimes', 'string', 'max:255'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
    }
}
