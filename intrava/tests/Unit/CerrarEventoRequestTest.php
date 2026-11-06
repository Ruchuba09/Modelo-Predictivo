<?php

namespace Tests\Unit;

use App\Http\Requests\CerrarEventoRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class CerrarEventoRequestTest extends TestCase
{
    public function test_cerrar_evento_requiere_al_menos_una_evidencia(): void
    {
        $request = new CerrarEventoRequest();
        $rules = $request->rules();
        $messages = $request->messages();

        // Sin evidencia de cierre
        $validator = Validator::make([
            'justificacion' => 'Se procedió al aislamiento de la zona y corrección.',
            'evidencia_cierre' => [],
        ], $rules, $messages);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('evidencia_cierre', $validator->errors()->messages());
        $this->assertSame(
            'Es obligatorio adjuntar al menos una evidencia para cerrar el reporte.',
            $validator->errors()->first('evidencia_cierre')
        );
    }

    public function test_cerrar_evento_con_evidencia_valida_pasa_validacion(): void
    {
        $archivo = UploadedFile::fake()->create('evidencia_solucion.jpg', 500, 'image/jpeg');

        $request = new CerrarEventoRequest();
        $rules = $request->rules();
        $messages = $request->messages();

        $validator = Validator::make([
            'justificacion' => 'Se reparó la baranda de seguridad y se verificó el área.',
            'evidencia_cierre' => [$archivo],
        ], $rules, $messages);

        $this->assertFalse($validator->fails());
    }

    public function test_cerrar_evento_rechaza_mas_de_tres_evidencias(): void
    {
        $archivos = [
            UploadedFile::fake()->create('doc1.jpg', 100, 'image/jpeg'),
            UploadedFile::fake()->create('doc2.jpg', 100, 'image/jpeg'),
            UploadedFile::fake()->create('doc3.jpg', 100, 'image/jpeg'),
            UploadedFile::fake()->create('doc4.jpg', 100, 'image/jpeg'),
        ];

        $request = new CerrarEventoRequest();
        $rules = $request->rules();
        $messages = $request->messages();

        $validator = Validator::make([
            'justificacion' => 'Resolución completada.',
            'evidencia_cierre' => $archivos,
        ], $rules, $messages);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('evidencia_cierre', $validator->errors()->messages());
    }
}
