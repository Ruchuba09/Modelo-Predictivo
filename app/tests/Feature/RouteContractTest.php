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

    public function test_quadrilla_api_routes_enforce_permissions(): void
    {
        $route = Route::getRoutes()->getByName('api.v1.cuadrillas.index');

        $this->assertNotNull($route);
        $this->assertContains('permission:cuadrillas.ver', $route->gatherMiddleware());
    }
}
