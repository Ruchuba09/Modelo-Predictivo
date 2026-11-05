<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RouteContractTest extends TestCase
{
    public function test_event_page_and_json_api_use_distinct_route_names(): void
    {
        $this->assertSame('/eventos/532', route('eventos.show', 532, false));
        $this->assertSame('/api/v1/eventos/532', route('api.v1.eventos.show', 532, false));
    }

    public function test_cuadrilla_api_routes_require_management_role(): void
    {
        $route = Route::getRoutes()->getByName('api.v1.cuadrillas.index');

        $this->assertNotNull($route);
        $this->assertContains('role:Administrador,Supervisor', $route->gatherMiddleware());
    }

    public function test_test_data_routes_are_admin_only(): void
    {
        foreach (['index', 'poblar', 'limpiar'] as $accion) {
            $ruta = Route::getRoutes()->getByName("api.v1.datos-prueba.{$accion}");

            $this->assertNotNull($ruta);
            $this->assertContains('role:Administrador', $ruta->gatherMiddleware());
        }
    }

    public function test_catalog_writes_are_admin_only(): void
    {
        $lectura = Route::getRoutes()->getByName('api.v1.personas.index');
        $escritura = Route::getRoutes()->getByName('api.v1.personas.store');

        $this->assertContains('role:Administrador,Supervisor', $lectura->gatherMiddleware());
        $this->assertContains('role:Administrador', $escritura->gatherMiddleware());
    }

    public function test_api_login_is_throttled(): void
    {
        $route = Route::getRoutes()->getByName('api.v1.auth.login');

        $this->assertContains('throttle:login', $route->gatherMiddleware());
    }

    public function test_evidence_files_are_scoped_to_their_event(): void
    {
        $this->assertSame('/eventos/7/archivos/foto.jpg', route('eventos.archivo', [7, 'foto.jpg'], false));
    }
}
