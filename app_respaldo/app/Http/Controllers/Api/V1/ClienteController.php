<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClienteRequest;
use App\Http\Resources\ClienteResource;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ClienteController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Cliente::query()
            ->when($request->string('estado')->toString(), fn ($q, $e) => $q->where('estado', $e))
            ->when($request->string('buscar')->toString(), function ($q, $b) {
                $q->where(fn ($q) => $q
                    ->where('rut', 'ilike', "%{$b}%")
                    ->orWhere('razon_social', 'ilike', "%{$b}%")
                    ->orWhere('nombre', 'ilike', "%{$b}%"));
            })
            ->orderBy('razon_social');

        if ($request->boolean('todos')) { // para llenar selects
            return ClienteResource::collection($query->limit(1000)->get());
        }

        return ClienteResource::collection(
            $query->paginate(min($request->integer('per_page', 15), 100))
        );
    }

    public function store(ClienteRequest $request): ClienteResource
    {
        return new ClienteResource(Cliente::create($request->validated()));
    }

    public function show(Cliente $cliente): ClienteResource
    {
        return new ClienteResource($cliente);
    }

    public function update(ClienteRequest $request, Cliente $cliente): ClienteResource
    {
        $cliente->update($request->validated());

        return new ClienteResource($cliente);
    }

    public function destroy(Cliente $cliente): Response
    {
        $cliente->delete();

        return response()->noContent();
    }
}