<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Support\Rut;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'rut' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $login = trim($datos['rut']);
        $usuario = User::query()
            ->when(filter_var($login, FILTER_VALIDATE_EMAIL),
                fn ($query) => $query->where('email', $login),
                fn ($query) => $query->whereHas('trabajador.persona',
                    fn ($persona) => $persona->where('rut', Rut::clean($login))))
            ->first();

        if (! $usuario || ! Hash::check($datos['password'], $usuario->password)) {
            throw ValidationException::withMessages([
                'rut' => ['Las credenciales proporcionadas no son válidas.'],
            ]);
        }

        $token = $usuario->createToken($datos['device_name'] ?? 'api')->plainTextToken;

        return response()->json([
            'token_type' => 'Bearer',
            'access_token' => $token,
            'user' => new UsuarioResource($usuario->load('roles')),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}
