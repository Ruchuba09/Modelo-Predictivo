<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $notificaciones = collect();

        if ($user) {
            $eventos = \App\Models\Evento::query()->orderByDesc('fecha_creacion');

            if (! $user->tienePermiso('eventos.ver')) {
                $eventos->where('id_trabajador', $user->id_trabajador);
            }

            $notificaciones = $eventos->take(5)->get()->map(function ($evento) {
                return [
                    'id' => $evento->id_evento,
                    'titulo' => 'NUEVO REPORTE',
                    'mensaje' => 'Se abrió un reporte #' . $evento->id_evento . ' con fecha ' . $evento->fecha_creacion->format('d-m-Y'),
                    'fecha' => $evento->fecha_creacion->diffForHumans(),
                ];
            });
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id_user,
                    'email' => $user->email,
                    'roles' => $user->rolesArray(),
                    'permisos' => $user->permisosArray(),
                ] : null,
            ],
            'notificaciones' => $notificaciones,
        ];
    }
}
