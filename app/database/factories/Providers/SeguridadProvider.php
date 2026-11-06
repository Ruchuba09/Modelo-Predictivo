<?php

namespace Database\Factories\Providers;

use Faker\Provider\Base;

/** Vocabulario ficticio de montaje industrial y seguridad, para datos de prueba realistas. */
class SeguridadProvider extends Base
{
    public const MINERAS = [
        'Minera Cordillera Norte', 'Minera Altiplano', 'Compañía Minera Salar Grande', 'Minera Quebrada Blanca Sur',
        'Minera Pampa Seca', 'Minera Valle Alto', 'Compañía Minera Cerro Rojo', 'Minera Desierto Central',
    ];

    public const FAENAS = [
        'Faena Cerro Rojo', 'Faena Pampa Seca', 'Faena Salar Grande', 'Faena Valle Alto', 'Faena Altos del Norte',
        'Faena Quebrada Honda', 'Faena Loma Bayas', 'Faena Mar Azul',
    ];

    public const AREAS = [
        ['CHA', 'Chancado primario'], ['MOL', 'Molienda'], ['FLO', 'Flotación'], ['ESP', 'Espesadores'],
        ['REL', 'Tranque de relaves'], ['SAL', 'Sala eléctrica'], ['BOM', 'Estación de bombas'], ['IFA', 'Instalación de faena'],
        ['CAM', 'Camino interior'], ['PAT', 'Patio de materiales'],
    ];

    public const PROYECTOS = [
        'Montaje electromecánico', 'Sistema de agua recuperada', 'Conducción de relaves', 'Ampliación de molienda',
        'Mitigación de polvo', 'Montaje de espesador', 'Obras civiles de planta', 'Reemplazo de correas',
        'Línea de impulsión', 'Subestación eléctrica',
    ];

    public const ACTIVIDADES = [
        'Montaje de estructuras', 'Izaje de equipos', 'Tendido de cañerías', 'Soldadura de HDPE', 'Tendido eléctrico',
        'Excavación de zanjas', 'Hormigonado de fundaciones', 'Instalación de andamios', 'Traslado de materiales',
        'Pruebas hidráulicas', 'Conexionado de tableros', 'Mantención de maquinaria',
    ];

    public const CARGOS = [
        'Maestro mayor', 'Maestro primera', 'Ayudante', 'Soldador', 'Rigger', 'Operador de grúa', 'Operador de excavadora',
        'Electricista', 'Instrumentista', 'Cañerista', 'Mecánico', 'Andamiero', 'Conductor',
    ];

    public const CONDICIONES = [
        'Andamio sin tarjeta de inspección vigente en zona de trabajo en altura.',
        'Trabajador sin arnés de seguridad en plataforma elevada.',
        'Eslinga con desgaste visible antes de maniobra de izaje.',
        'Área de izaje sin segregación ni señalización.',
        'Camión estacionado sin cuñas en camino interior.',
        'Retroceso de vehículo sin apoyo de señalero.',
        'Tablero eléctrico abierto sin bloqueo de energías.',
        'Cable eléctrico expuesto en zona de tránsito peatonal.',
        'Derrame menor de aceite hidráulico bajo equipo.',
        'Superficie resbaladiza por acumulación de agua en pasillo.',
        'Herramienta de mano con mango en mal estado.',
        'Esmeril angular sin protección instalada.',
        'Falta de orden y aseo en acceso a la zona de trabajo.',
        'AST no actualizado para la tarea en ejecución.',
        'Maquinaria operando cerca de personal sin demarcación.',
        'Trabajador informa cansancio después de turno extendido.',
    ];

    public const INCIDENTES = [
        'Trabajador sufre golpe en mano al manipular herramienta.',
        'Contusión en hombro por desprendimiento de componente mecánico.',
        'Caída a distinto nivel desde andamio, sin lesión grave.',
        'Torcedura de tobillo al tropezar en camino peatonal.',
        'Camioneta colisiona con cerco al realizar retroceso.',
        'Camión con rampla pierde carga menor en camino interior.',
        'Excavadora daña tubería enterrada durante excavación.',
        'Grúa golpea estructura durante maniobra de izaje.',
        'Atrapamiento leve de dedo al posicionar pieza metálica.',
        'Contacto eléctrico sin lesión durante conexionado de tablero.',
        'Derrame de hidrocarburo por corte de manguera hidráulica.',
        'Corte en antebrazo durante operación de esmeril.',
    ];

    public const CAUSAS = [
        'Falta de segregación del área de trabajo.', 'Supervisión insuficiente de la tarea.',
        'Procedimiento de trabajo no difundido.', 'Evaluación de riesgos incompleta.',
        'Fatiga del trabajador.', 'Mantención deficiente del equipo.', 'Falta de capacitación específica.',
    ];

    public const MEDIDAS = [
        'Reforzar charla de cinco minutos con la cuadrilla.', 'Actualizar el procedimiento de trabajo seguro.',
        'Segregar el área y señalizar el acceso.', 'Inspeccionar equipos antes de cada turno.',
        'Capacitar a la cuadrilla en la tarea crítica.', 'Revisar la planificación de turnos y descansos.',
    ];

    public function nombreMinera(): string
    {
        return static::randomElement(self::MINERAS);
    }

    public function nombreFaena(): string
    {
        return static::randomElement(self::FAENAS);
    }

    public function nombreProyecto(): string
    {
        return static::randomElement(self::PROYECTOS);
    }

    public function nombreActividad(): string
    {
        return static::randomElement(self::ACTIVIDADES);
    }

    public function cargoTerreno(): string
    {
        return static::randomElement(self::CARGOS);
    }

    public function descripcionCondicion(): string
    {
        return static::randomElement(self::CONDICIONES);
    }

    public function descripcionIncidente(): string
    {
        return static::randomElement(self::INCIDENTES);
    }

    public function causaRaiz(): string
    {
        return static::randomElement(self::CAUSAS);
    }
}
