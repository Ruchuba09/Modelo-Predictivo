<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AreaRequest;
use App\Http\Resources\AreaResource;
use App\Models\Area;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AreaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Area::query()->with('faena')
            ->when($request->integer('id_faena'), fn ($q, $f) => $q->where('id_faena', $f))
            ->when($request->string('buscar')->toString(), function ($q, $b) {
                $q->where(fn ($q) => $q
                    ->where('codigo_area', 'ilike', "%{$b}%")
                    ->orWhere('descripcion', 'ilike', "%{$b}%"));
            })
            ->orderBy('codigo_area');

        if ($request->boolean('todos')) { // para llenar selects
            return AreaResource::collection($query->limit(1000)->get());
        }

        return AreaResource::collection(
            $query->paginate(min($request->integer('per_page', 15), 100))
        );
    }

    public function store(AreaRequest $request): AreaResource
    {
        return new AreaResource(Area::create($request->validated())->load('faena'));
    }

    public function show(Area $area): AreaResource
    {
        return new AreaResource($area->load('faena'));
    }

    public function update(AreaRequest $request, Area $area): AreaResource
    {
        $area->update($request->validated());
        return new AreaResource($area->load('faena'));
    }

    public function destroy(Area $area): Response
    {
        $area->delete(); // si hay eventos en esta área, el handler responde 409

        return response()->noContent();
    }
}