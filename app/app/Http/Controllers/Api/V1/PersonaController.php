<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PersonaRequest;
use App\Http\Resources\PersonaResource;
use App\Models\Persona;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PersonaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Persona::query()
            ->when($request->string('buscar')->toString(), function ($q, $b) {
                $q->where(fn ($q) => $q
                    ->where('rut', 'ilike', "%{$b}%")
                    ->orWhere('nombre_1', 'ilike', "%{$b}%")
                    ->orWhere('apellido_1', 'ilike', "%{$b}%"));
            })
            ->orderBy('apellido_1')
            ->orderBy('nombre_1');

        // ?todos=1 sirve para llenar selects en el frontend (con tope de seguridad)
        if ($request->boolean('todos')) {
            return PersonaResource::collection($query->limit(1000)->get());
        }

        return PersonaResource::collection(
            $query->paginate(min($request->integer('per_page', 15), 100))
        );
    }

    public function store(PersonaRequest $request): PersonaResource
    {
        return new PersonaResource(Persona::create($request->validated()));
        // Laravel responde 201 automáticamente en el store de un Resource nuevo
    }

    public function show(Persona $persona): PersonaResource
    {
        return new PersonaResource($persona);
    }

    public function update(PersonaRequest $request, Persona $persona): PersonaResource
    {
        $persona->update($request->validated());

        return new PersonaResource($persona);
    }

    public function destroy(Persona $persona): Response
    {
        $persona->delete();

        return response()->noContent();
    }
}