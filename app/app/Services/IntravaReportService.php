<?php

namespace App\Services;

use App\Models\HallazgoIntrava;
use App\Models\InformeInvestigacionIntrava;
use App\Models\ReporteFlashIntrava;
use App\Models\ReportePrevieneIntrava;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class IntravaReportService
{
    public function previene(array $filters): LengthAwarePaginator
    {
        $query = ReportePrevieneIntrava::with('proyecto');
        $this->filterProjectAndDates($query, $filters, 'fecha');
        $query->when($filters['id_intrava'] ?? null, fn ($q, $id) => $q->where('id_intrava', $id));
        $this->filterStatusAndText($query, $filters, ['proyecto_alias', 'descripcion', 'area']);

        return $query->orderByDesc('fecha')->paginate($this->perPage($filters));
    }

    public function flash(array $filters): LengthAwarePaginator
    {
        $query = ReporteFlashIntrava::with('proyecto');
        $this->filterProjectAndDates($query, $filters, 'fecha');
        $query->when($filters['id_intrava'] ?? null, fn ($q, $id) => $q->where('id_intrava', $id));
        $this->filterText($query, $filters, ['proyecto_alias', 'descripcion', 'area', 'reportado_por']);

        return $query->orderByDesc('fecha')->paginate($this->perPage($filters));
    }

    public function investigaciones(array $filters): LengthAwarePaginator
    {
        $query = InformeInvestigacionIntrava::with(['proyecto', 'reporteFlash']);
        $this->filterProject($query, $filters);
        $query->when($filters['id_reporte_flash_intrava'] ?? null, fn ($q, $id) => $q->where('id_reporte_flash_intrava', $id));
        $query->when($filters['id_intrava'] ?? null, fn ($q, $id) => $q->where('id_intrava', $id));
        $query->when($filters['uuid_intrava'] ?? null, fn ($q, $id) => $q->where('uuid_intrava', $id));
        $this->filterText($query, $filters, ['proyecto_alias', 'causa_raiz']);

        return $query->orderByDesc('sincronizado_en')->paginate($this->perPage($filters));
    }

    public function hallazgos(array $filters): LengthAwarePaginator
    {
        $query = HallazgoIntrava::with('proyectoLocal');
        $this->filterProject($query, $filters);
        $this->filterDates($query, $filters, 'fecha_creacion');
        $query->when($filters['id_intrava'] ?? null, fn ($q, $id) => $q->where('id_intrava', $id));
        $query->when($filters['estado'] ?? null, fn ($q, $state) => $q->where('estado', 'ilike', "%{$state}%"));
        $this->filterText($query, $filters, ['tipo', 'origen', 'requisito_incumplido']);

        return $query->orderByDesc('fecha_creacion')->paginate($this->perPage($filters));
    }

    private function filterProjectAndDates(Builder $query, array $filters, string $dateColumn): void
    {
        $this->filterProject($query, $filters);
        $this->filterDates($query, $filters, $dateColumn);
    }

    private function filterProject(Builder $query, array $filters): void
    {
        $query->when($filters['id_proyecto'] ?? null, fn ($q, $id) => $q->where('id_proyecto', $id))
            ->when($filters['id_proyecto_intrava'] ?? null, fn ($q, $id) => $q->where('id_proyecto_intrava', $id));
    }

    private function filterDates(Builder $query, array $filters, string $column): void
    {
        $query->when($filters['desde'] ?? null, fn ($q, $date) => $q->whereDate($column, '>=', $date))
            ->when($filters['hasta'] ?? null, fn ($q, $date) => $q->whereDate($column, '<=', $date));
    }

    private function filterStatusAndText(Builder $query, array $filters, array $columns): void
    {
        $query->when($filters['estado'] ?? null, fn ($q, $state) => $q->where('estado', 'ilike', "%{$state}%"));
        $this->filterText($query, $filters, $columns);
    }

    private function filterText(Builder $query, array $filters, array $columns): void
    {
        $search = $filters['buscar'] ?? '';
        if ($search === '') {
            return;
        }

        $query->where(function ($subquery) use ($columns, $search) {
            foreach ($columns as $index => $column) {
                $method = $index === 0 ? 'where' : 'orWhere';
                $subquery->{$method}($column, 'ilike', "%{$search}%");
            }
        });
    }

    private function perPage(array $filters): int
    {
        return min(max((int) ($filters['per_page'] ?? 20), 1), 100);
    }
}
