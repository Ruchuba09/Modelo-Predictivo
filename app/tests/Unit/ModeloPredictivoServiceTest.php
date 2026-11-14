<?php

namespace Tests\Unit;

use App\DataTransferObjects\FiltroPrediccionData;
use App\Enums\ObjetivoPrediccion;
use App\Exceptions\ModeloPredictivoException;
use App\Http\Resources\ModeloPredictivo\EntidadesRiesgoResource;
use App\Http\Resources\ModeloPredictivo\PrediccionesResource;
use App\Http\Resources\ModeloPredictivo\ResumenModelosResource;
use App\Services\ModeloPredictivoService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as SolicitudHttp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ModeloPredictivoServiceTest extends TestCase
{
    private const URL = 'http://modelo.test';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.predictive_model.url' => self::URL]);
    }

    private function servicio(): ModeloPredictivoService
    {
        return new ModeloPredictivoService();
    }

    /** Convierte un recurso en el JSON que recibe el frontend. */
    private function aJson(object $recurso): array
    {
        return json_decode($recurso->response(Request::create('/'))->getContent(), true);
    }

    public function test_el_filtro_usa_valores_predeterminados(): void
    {
        $filtro = FiltroPrediccionData::fromArray([]);

        $this->assertSame(ObjetivoPrediccion::IncidentesReales, $filtro->objetivo);
        $this->assertSame(30, $filtro->horizonteDias);
        $this->assertSame(['tipo_objetivo' => 'incidentes_reales', 'horizonte_dias' => 30], $filtro->toQuery());
        $this->assertSame(7, $filtro->conProyecto(7)->toQuery()['id_proyecto']);
    }

    public function test_envia_el_filtro_al_servicio_python(): void
    {
        Http::fake([self::URL.'/predicciones*' => Http::response(['predicciones' => []])]);

        $this->servicio()->predicciones(new FiltroPrediccionData(ObjetivoPrediccion::Lesiones, 90, 3));

        Http::assertSent(fn (SolicitudHttp $solicitud) => str_starts_with($solicitud->url(), self::URL.'/predicciones?')
            && $solicitud['tipo_objetivo'] === 'lesiones'
            && (int) $solicitud['horizonte_dias'] === 90
            && (int) $solicitud['id_proyecto'] === 3);
    }

    public function test_sin_conexion_responde_servicio_no_disponible(): void
    {
        Http::fake(fn () => throw new ConnectionException('sin red'));

        try {
            $this->servicio()->tipos();
            $this->fail('Se esperaba ModeloPredictivoException.');
        } catch (ModeloPredictivoException $error) {
            $this->assertSame(503, $error->estado);
            $this->assertSame(ModeloPredictivoException::NO_DISPONIBLE, $error->getMessage());
        }
    }

    public function test_un_filtro_rechazado_conserva_el_detalle_y_el_422(): void
    {
        Http::fake([self::URL.'/*' => Http::response(['detail' => 'El objetivo seleccionado no existe.'], 422)]);

        try {
            $this->servicio()->entidades(new FiltroPrediccionData());
            $this->fail('Se esperaba ModeloPredictivoException.');
        } catch (ModeloPredictivoException $error) {
            $this->assertSame(422, $error->estado);
            $this->assertSame('El objetivo seleccionado no existe.', $error->getMessage());
            $this->assertSame(422, $error->render()->getStatusCode());
        }
    }

    public function test_un_error_interno_del_servicio_es_503(): void
    {
        Http::fake([self::URL.'/*' => Http::response('Internal Server Error', 500)]);

        $this->expectExceptionObject(ModeloPredictivoException::noDisponible());
        $this->servicio()->evaluacion();
    }

    public function test_una_respuesta_que_no_es_json_es_invalida(): void
    {
        Http::fake([self::URL.'/*' => Http::response('hola', 200)]);

        $this->expectExceptionObject(ModeloPredictivoException::respuestaInvalida());
        $this->servicio()->resumen();
    }

    public function test_predicciones_publica_solo_los_campos_del_contrato(): void
    {
        $json = $this->aJson(new PrediccionesResource([
            'tipo_objetivo' => 'lesiones',
            'horizonte_dias' => 30,
            'modelo' => 'Gradient boosting de Poisson × Proporción histórica suavizada',
            'interno' => 'no se publica',
            'modelos' => ['proyecto' => ['publicado' => true, 'modelo' => 'X', 'metricas' => ['auc_roc' => 0.7],
                'modelo_lesion' => ['modelo' => 'Regresión logística', 'secreto' => 1]]],
            'predicciones' => [['id_proyecto' => 1, 'prob_evento' => 0.2, 'tasa_semanal' => 0.05, 'otro' => 1]],
        ]));

        $this->assertSame('Incidentes con lesión', $json['etiqueta_objetivo']);
        $this->assertArrayNotHasKey('interno', $json);
        $this->assertSame(['id_proyecto' => 1, 'prob_evento' => 0.2, 'tasa_semanal' => 0.05], $json['predicciones'][0]);
        $this->assertSame(['modelo' => 'Regresión logística'], $json['modelos']['proyecto']['modelo_lesion']);
        // Un campo ausente se omite: el frontend distingue "sin dato" de cero.
        $this->assertArrayNotHasKey('mejora_log_loss_pct', $json['modelos']['proyecto']);
        $this->assertNull($json['historial']);
    }

    public function test_entidades_conserva_los_niveles(): void
    {
        $json = $this->aJson(new EntidadesRiesgoResource([
            'tipo_objetivo' => 'todos',
            'niveles' => ['proyecto' => [['id' => 1, 'nombre' => 'P1', 'prob_evento' => 0.5, 'indicadores' => []]], 'cuadrilla' => []],
            'modelos' => [],
        ]));

        $this->assertSame('P1', $json['niveles']['proyecto'][0]['nombre']);
        $this->assertSame([], $json['niveles']['cuadrilla']);
    }

    public function test_resumen_de_los_tres_modelos(): void
    {
        $json = $this->aJson(new ResumenModelosResource([
            'semana_base' => '2026-11-02',
            'objetivos' => [['tipo_objetivo' => 'incidentes_reales', 'clave' => 'A', 'tasa_semanal_total' => 2.9,
                'calidad' => ['area' => ['modelo' => 'Gradient boosting de Poisson']]]],
            'modelo_lesion' => ['clave' => 'B', 'probabilidad_media' => 0.28, 'calidad' => ['modelo' => 'Proporción histórica suavizada']],
        ]));

        $this->assertSame('2026-11-02', $json['semana_base']);
        $this->assertSame('Gradient boosting de Poisson', $json['objetivos'][0]['calidad']['area']['modelo']);
        $this->assertSame('B', $json['modelo_lesion']['clave']);
        $this->assertSame('Proporción histórica suavizada', $json['modelo_lesion']['calidad']['modelo']);
    }
}
