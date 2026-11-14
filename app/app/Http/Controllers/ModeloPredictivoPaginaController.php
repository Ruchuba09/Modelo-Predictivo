<?php

namespace App\Http\Controllers;

use App\DataTransferObjects\FiltroPrediccionData;
use App\Http\Requests\ModeloPredictivo\FiltroPrediccionRequest;
use App\Models\Proyecto;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pantallas Inertia del modelo predictivo. Los datos se cargan desde
 * /api/v1/modelo-predictivo (Api\V1\ModeloPredictivoController).
 */
class ModeloPredictivoPaginaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ModeloPredictivo/Index', [
            'proyectos' => Proyecto::select('id_proyecto', 'nombre')->orderBy('nombre')->get(),
        ]);
    }

    /** Qué predice cada uno de los tres modelos y qué tan confiable es. */
    public function modelos(): Response
    {
        return Inertia::render('ModeloPredictivo/Modelos', [
            'horizontes' => FiltroPrediccionData::HORIZONTES_DIAS,
        ]);
    }

    /** Lo predicho comparado con lo ocurrido. */
    public function evaluacion(): Response
    {
        return Inertia::render('ModeloPredictivo/Evaluacion');
    }

    /** Riesgo de un proyecto para los tres objetivos y todos los plazos, por área. */
    public function proyecto(Proyecto $proyecto): Response
    {
        return Inertia::render('ModeloPredictivo/Proyecto', [
            'proyecto' => $proyecto->only(['id_proyecto', 'nombre']),
            'proyectos' => Proyecto::select('id_proyecto', 'nombre')->orderBy('nombre')->get(),
            'horizontes' => FiltroPrediccionData::HORIZONTES_DIAS,
        ]);
    }

    public function eventoEstimado(FiltroPrediccionRequest $request, Proyecto $proyecto): Response
    {
        $filtro = $request->toData();

        return Inertia::render('ModeloPredictivo/DetalleEventoEstimado', [
            'proyecto' => $proyecto->only(['id_proyecto', 'nombre']),
            'tipoObjetivo' => $filtro->objetivo->value,
            'horizonte' => $filtro->horizonteDias,
        ]);
    }
}
