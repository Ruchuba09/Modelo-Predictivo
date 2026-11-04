<?php

namespace App\Http\Controllers;

use App\Models\Proyecto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pantallas Inertia del modelo predictivo. Los datos se cargan desde
 * /api/v1/modelo-predictivo (ModeloPredictivoController).
 */
class ModeloPredictivoPaginaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ModeloPredictivo/Index', [
            'proyectos' => Proyecto::select('id_proyecto', 'nombre')->get(),
        ]);
    }

    public function eventoEstimado(Request $request, Proyecto $proyecto): Response
    {
        $filtros = $request->validate([
            'tipo_objetivo' => ['sometimes', 'string', 'max:100'],
            'horizonte' => ['sometimes', 'integer', 'between:1,52'],
        ]);

        return Inertia::render('ModeloPredictivo/DetalleEventoEstimado', [
            'proyecto' => $proyecto->only(['id_proyecto', 'nombre']),
            'tipoObjetivo' => $filtros['tipo_objetivo'] ?? 'incidentes_reales',
            'horizonte' => (int) ($filtros['horizonte'] ?? 4),
        ]);
    }
}
