<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FaenaRequest;
use App\Http\Resources\FaenaResource;
use App\Models\Faena;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class FaenaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Faena::query()
            ->withCount('areas')
            ->when($request->string('buscar')->toString(), function ($q, $b) {
                $q->where(fn ($q) => $q
                    ->where('codigo_faena', 'ilike', "%{$b}%")
                    ->orWhere('nombre', 'ilike', "%{$b}%"));
            })
            ->orderBy('nombre');

        if ($request->boolean('todos')) { // para llenar selects
            return FaenaResource::collection($query->limit(1000)->get());
        }

        return FaenaResource::collection(
            $query->paginate(min($request->integer('per_page', 15), 100))
        );
    }

    public function store(FaenaRequest $request): FaenaResource
    {
        return new FaenaResource(Faena::create($request->validated()));
    }

    public function show(Faena $faena): FaenaResource
    {
        return new FaenaResource($faena->loadCount('areas'));
    }

    public function update(FaenaRequest $request, Faena $faena): FaenaResource
    {
        $faena->update($request->validated());

        return new FaenaResource($faena->loadCount('areas'));
    }

    public function destroy(Faena $faena): Response
    {
        $faena->delete(); // si tiene áreas o proyectos, el handler responde 409

        return response()->noContent();
    }
}