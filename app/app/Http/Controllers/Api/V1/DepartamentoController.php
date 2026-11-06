<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartamentoRequest;
use App\Http\Resources\DepartamentoResource;
use App\Models\Departamento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DepartamentoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Departamento::query()
            ->withCount('trabajadores')
            ->when($request->string('estado')->toString(), fn ($q, $e) => $q->where('estado', $e))
            ->when($request->string('buscar')->toString(),
                fn ($q, $b) => $q->where('nombre', 'ilike', "%{$b}%"))
            ->orderBy('nombre');

        if ($request->boolean('todos')) {
            return DepartamentoResource::collection($query->limit(1000)->get());
        }

        return DepartamentoResource::collection(
            $query->paginate(min($request->integer('per_page', 15), 100))
        );
    }

    public function store(DepartamentoRequest $request): DepartamentoResource
    {
        return new DepartamentoResource(Departamento::create($request->validated()));
    }

    public function show(Departamento $departamento): DepartamentoResource
    {
        return new DepartamentoResource($departamento->loadCount('trabajadores'));
    }

    public function update(DepartamentoRequest $request, Departamento $departamento): DepartamentoResource
    {
        $departamento->update($request->validated());

        return new DepartamentoResource($departamento->loadCount('trabajadores'));
    }

    public function destroy(Departamento $departamento): Response
    {
        $departamento->delete(); // si tiene trabajadores, el handler responde 409

        return response()->noContent();
    }
}