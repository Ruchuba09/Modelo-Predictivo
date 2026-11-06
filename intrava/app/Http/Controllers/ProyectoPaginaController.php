<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * Pantallas Inertia de proyectos. Los datos se cargan desde /api/v1/proyectos.
 */
class ProyectoPaginaController extends Controller
{
    public function show(int $id): Response
    {
        return Inertia::render('proyectos/Show', [
            'id' => $id,
        ]);
    }
}
