<?php

namespace Tests\Unit;

use App\Http\Middleware\PermissionMiddleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class PermissionMiddlewareTest extends TestCase
{
    public function test_allows_a_user_with_the_requested_permission(): void
    {
        $request = Request::create('/cuadrillas');
        $request->setUserResolver(fn () => new class
        {
            public function tienePermiso(string $permission): bool
            {
                return $permission === 'cuadrillas.ver';
            }
        });

        $response = (new PermissionMiddleware())->handle(
            $request,
            fn () => new Response('ok'),
            'cuadrillas.ver'
        );

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_rejects_a_user_without_the_requested_permission(): void
    {
        $request = Request::create('/usuarios');
        $request->setUserResolver(fn () => new class
        {
            public function tienePermiso(string $permission): bool
            {
                return false;
            }
        });

        $this->expectException(HttpException::class);

        (new PermissionMiddleware())->handle($request, fn () => new Response('ok'), 'usuarios.ver');
    }
}
