<?php

namespace App\Services;

use App\DataTransferObjects\FiltroPrediccionData;
use App\Exceptions\ModeloPredictivoException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Cliente del servicio Python del modelo predictivo (python/servicio.py).
 *
 * El servicio entrena tres modelos de tasa (incidentes, P(lesión | incidente) y todos los eventos)
 * y reparte el riesgo entre áreas, cuadrillas, trabajadores y actividades. Este servicio solo
 * consulta: las respuestas ya traen nombres y contexto, y los Resources les dan forma.
 */
class ModeloPredictivoService
{
    /** Reentrenar puede tardar más que una consulta. */
    private const TIEMPO_ENTRENAMIENTO = 300;

    public function estado(): array
    {
        return $this->get('/health', [], 10);
    }

    /** @return array<int, string> */
    public function tipos(): array
    {
        return $this->get('/tipos')['tipos'] ?? [];
    }

    /** Ranking de proyectos y, si se indica un proyecto, el análisis de sus entidades. */
    public function predicciones(FiltroPrediccionData $filtro): array
    {
        return $this->get('/predicciones', $filtro->toQuery());
    }

    /** Todas las entidades vigentes por nivel (proyecto, área, cuadrilla, trabajador, actividad, cliente, faena). */
    public function entidades(FiltroPrediccionData $filtro): array
    {
        return $this->get('/predicciones/entidades', [
            'tipo_objetivo' => $filtro->objetivo->value,
            'horizonte_dias' => $filtro->horizonteDias,
        ]);
    }

    /** Los tres modelos: qué predicen, cuál se publicó y su calidad. */
    public function resumen(): array
    {
        return $this->get('/modelos');
    }

    /** Aciertos de las predicciones registradas cuyo plazo ya terminó. */
    public function evaluacion(): array
    {
        return $this->get('/modelo/evaluacion')['evaluacion'] ?? [];
    }

    /** Reentrena los tres modelos aunque los datos no hayan cambiado. */
    public function entrenar(): array
    {
        return $this->respuesta(fn () => $this->cliente(self::TIEMPO_ENTRENAMIENTO)->post('/modelo/entrenar'));
    }

    private function cliente(?int $tiempo = null): PendingRequest
    {
        return Http::acceptJson()
            ->baseUrl(rtrim((string) config('services.predictive_model.url'), '/'))
            ->timeout($tiempo ?? (int) config('services.predictive_model.timeout', 180));
    }

    private function get(string $ruta, array $parametros = [], ?int $tiempo = null): array
    {
        return $this->respuesta(fn () => $this->cliente($tiempo)->get($ruta, $parametros));
    }

    /** @param  callable(): Response  $solicitud */
    private function respuesta(callable $solicitud): array
    {
        try {
            $response = $solicitud();
        } catch (ConnectionException) {
            throw ModeloPredictivoException::noDisponible();
        }

        $datos = $response->json();
        if ($response->failed()) {
            // FastAPI explica el error en "detail"; un 422 es un filtro inválido y se informa tal cual.
            $detalle = is_array($datos) && is_string($datos['detail'] ?? null) ? $datos['detail'] : null;
            $estado = $response->status() === 422 ? 422 : 503;

            throw new ModeloPredictivoException($detalle ?? ModeloPredictivoException::NO_DISPONIBLE, $estado);
        }
        if (! is_array($datos)) {
            throw ModeloPredictivoException::respuestaInvalida();
        }

        return $datos;
    }
}
