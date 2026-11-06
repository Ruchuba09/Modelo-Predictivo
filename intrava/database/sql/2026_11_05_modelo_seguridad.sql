-- Amplia el modelo de datos de seguridad. Es idempotente y conserva los datos existentes.
-- Lo aplica la migracion 2026_11_05_000001 y esta copiado en AVA_BaseDatos_unificada.sql.

-- ---------------------------------------------------------------- catalogos

CREATE TABLE IF NOT EXISTS public.cat_riesgo_critico (
    id_riesgo_critico BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO public.cat_riesgo_critico (codigo, nombre) VALUES
    ('altura', 'Trabajo en altura'), ('confinado', 'Espacio confinado'), ('electrico', 'Energía eléctrica'),
    ('izaje', 'Izaje de carga'), ('excavacion', 'Excavación'), ('caliente', 'Trabajo en caliente'),
    ('vehiculos', 'Vehículos y maquinaria'), ('sin_riesgo_critico', 'Sin riesgo crítico')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cat_clasificacion_incidente (
    id_clasificacion_incidente BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    con_lesion BOOLEAN NOT NULL DEFAULT FALSE,
    laboral BOOLEAN NOT NULL DEFAULT TRUE
);
COMMENT ON COLUMN public.cat_clasificacion_incidente.laboral IS
    'FALSE si ocurre fuera de la exposicion en terreno (trayecto, comun): no se usa como objetivo del modelo.';
INSERT INTO public.cat_clasificacion_incidente (codigo, nombre, con_lesion, laboral) VALUES
    ('FATAL', 'Accidente fatal', TRUE, TRUE),
    ('CTP', 'Accidente con tiempo perdido', TRUE, TRUE),
    ('STP', 'Accidente sin tiempo perdido', TRUE, TRUE),
    ('EP', 'Enfermedad profesional', TRUE, TRUE),
    ('DMS', 'Daño material significativo', FALSE, TRUE),
    ('DMNS', 'Daño material no significativo', FALSE, TRUE),
    ('DAS', 'Daño ambiental significativo', FALSE, TRUE),
    ('DANS', 'Daño ambiental no significativo', FALSE, TRUE),
    ('FO', 'Falla operacional', FALSE, TRUE),
    ('CUASI', 'Cuasi accidente', FALSE, TRUE),
    ('AT', 'Accidente de trayecto', TRUE, FALSE),
    ('COMUN', 'Accidente o enfermedad común', FALSE, FALSE),
    ('OTRO', 'Otro', FALSE, TRUE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cat_condicion_pare (
    id_condicion SMALLINT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);
INSERT INTO public.cat_condicion_pare (id_condicion, nombre) VALUES
    (1, 'Condiciones de trabajo no seguras'), (2, 'Herramientas inadecuadas o en mal estado'), (3, 'EPP inadecuados'),
    (4, 'Sin capacitación o autorización para la actividad'), (5, 'Sin procedimiento o sin difusión'),
    (6, 'Sin recursos humanos o materiales necesarios'), (7, 'Sin AST, VATS o ERT'), (8, 'Sin permisos exigidos'),
    (9, 'Sin condiciones físicas o emocionales'), (10, 'Otro riesgo no controlado')
ON CONFLICT DO NOTHING;

-- Escala de cinco niveles de AVA. Los niveles previos (1 a 4) suben uno.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.cat_severidad WHERE nombre = 'Leve') THEN
        UPDATE public.cat_severidad SET nivel = nivel + 100;
        UPDATE public.cat_severidad SET nivel = nivel - 99;
        INSERT INTO public.cat_severidad (nombre, nivel) VALUES ('Leve', 1);
    END IF;
END $$;

ALTER TABLE public.cat_causa
    ADD COLUMN IF NOT EXISTS codigo VARCHAR(10),
    ADD COLUMN IF NOT EXISTS subtipo VARCHAR(30);
ALTER TABLE public.cat_causa DROP CONSTRAINT IF EXISTS cat_causa_tipo_check;
ALTER TABLE public.cat_causa ADD CONSTRAINT cat_causa_tipo_check CHECK (tipo IN ('inmediata', 'basica', 'raiz'));

-- Las cargas con identificadores explicitos no avanzan las secuencias.
SELECT setval(pg_get_serial_sequence('public.cat_causa', 'id_causa'), GREATEST((SELECT max(id_causa) FROM public.cat_causa), 1));
SELECT setval(pg_get_serial_sequence('public.cat_categoria_evento', 'id_categoria_evento'), GREATEST((SELECT max(id_categoria_evento) FROM public.cat_categoria_evento), 1));
SELECT setval(pg_get_serial_sequence('public.roles', 'id_rol'), GREATEST((SELECT max(id_rol) FROM public.roles), 1));

-- Catalogos del formato de investigacion FG-08-02 de AVA.
INSERT INTO public.cat_causa (tipo, subtipo, codigo, nombre)
SELECT v.tipo, v.subtipo, v.codigo, v.nombre
FROM (VALUES
    ('inmediata','acto','A01','Actuar sin autorización'), ('inmediata','acto','A02','Actuar a velocidad anormal'),
    ('inmediata','acto','A03','Omitir o neutralizar dispositivos de protección'),
    ('inmediata','acto','A04','Uso inadecuado de herramientas y equipos de protección'),
    ('inmediata','acto','A05','Mal manejo de materiales, equipos e insumos'),
    ('inmediata','acto','A06','Ubicarse en posiciones y posturas incorrectas'),
    ('inmediata','acto','A07','Intervenir equipos energizados o en movimiento'),
    ('inmediata','acto','A08','No usar equipos de protección personal'),
    ('inmediata','acto','A09','Desviarse de los métodos o normativa aceptada'),
    ('inmediata','acto','A10','Presentarse en condiciones anormales'), ('inmediata','acto','A11','Acción de terceros'),
    ('inmediata','acto','A12','Uso de vestuario o elementos extraños'), ('inmediata','acto','A13','Uso inadecuado de datos o información'),
    ('inmediata','acto','A14','Conducta o comportamiento inapropiado'), ('inmediata','acto','A15','No advertir o señalizar'),
    ('inmediata','acto','A16','Otro acto subestándar'),
    ('inmediata','condicion','C01','Falta de protecciones o defensas'), ('inmediata','condicion','C02','Protecciones y defensas bajo especificación'),
    ('inmediata','condicion','C03','Herramientas, materiales o instalaciones defectuosas'), ('inmediata','condicion','C04','Orden y aseo deficientes'),
    ('inmediata','condicion','C05','Factores o condiciones ambientales anormales'), ('inmediata','condicion','C06','Equipo de protección fuera de especificación'),
    ('inmediata','condicion','C07','Área o recinto congestionado'), ('inmediata','condicion','C08','Superficie de trabajo en mal estado'),
    ('inmediata','condicion','C09','Almacenamiento y orden defectuoso'), ('inmediata','condicion','C10','Problema en sistema de energía'),
    ('inmediata','condicion','C11','Sobrecarga o saturación de sistemas o equipos'), ('inmediata','condicion','C12','Sistemas de información deficientes'),
    ('inmediata','condicion','C13','Identificación y señalización incorrectas'), ('inmediata','condicion','C14','Otra condición subestándar'),
    ('inmediata','condicion','C15','Fatiga o falla de materiales'),
    ('basica','personal','P01','Capacidad física o fisiológica inadecuada'), ('basica','personal','P02','Capacidad mental o psicológica inadecuada'),
    ('basica','personal','P03','Estrés físico o fisiológico'), ('basica','personal','P04','Estrés mental o psicológico'),
    ('basica','personal','P05','Falta de conocimiento'), ('basica','personal','P06','Falta de habilidad'),
    ('basica','personal','P07','Motivación inapropiada'), ('basica','personal','P08','Fatiga o cansancio'),
    ('basica','trabajo','T01','Liderazgo y supervisión inadecuada'), ('basica','trabajo','T02','Ingeniería inadecuada'),
    ('basica','trabajo','T03','Adquisiciones inadecuadas'), ('basica','trabajo','T04','Mantención inadecuada'),
    ('basica','trabajo','T05','Herramientas y equipos inadecuados'), ('basica','trabajo','T06','Estándares de trabajo inadecuados'),
    ('basica','trabajo','T07','Uso y desgaste'), ('basica','trabajo','T08','Abuso y mal uso'),
    ('basica','trabajo','T09','Diseño inadecuado'), ('basica','trabajo','T10','Señalización inexistente'),
    ('raiz',NULL,'R01','Liderazgo y compromiso'), ('raiz',NULL,'R02','Planificación'), ('raiz',NULL,'R03','Gestión de comunicación'),
    ('raiz',NULL,'R04','Participación'), ('raiz',NULL,'R05','Evaluación de riesgos'), ('raiz',NULL,'R06','Cumplimiento legal'),
    ('raiz',NULL,'R07','Salud de los trabajadores'), ('raiz',NULL,'R08','Capacitación y competencias'),
    ('raiz',NULL,'R09','Mantención de equipos e infraestructura'), ('raiz',NULL,'R10','Adquisiciones y suministros'),
    ('raiz',NULL,'R11','Incidentes y accidentes'), ('raiz',NULL,'R12','Impactos ambientales'), ('raiz',NULL,'R13','Monitoreo'),
    ('raiz',NULL,'R14','Auditoría'), ('raiz',NULL,'R15','Gestión de cambio'), ('raiz',NULL,'R16','Revisión de la gerencia')
) AS v(tipo, subtipo, codigo, nombre)
WHERE NOT EXISTS (SELECT 1 FROM public.cat_causa c WHERE c.tipo = v.tipo AND c.nombre = v.nombre);

INSERT INTO public.cat_categoria_evento (nombre)
SELECT v.nombre
FROM (VALUES ('Golpeado contra'), ('Golpeado por'), ('Cogido por'), ('Proyección de'), ('Contacto con'), ('Caída mismo nivel'),
             ('Caída distinto nivel'), ('Pérdida de equilibrio'), ('Sobreesfuerzo'), ('Sobrecarga'), ('Atrición'), ('Otros')) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM public.cat_categoria_evento c WHERE c.nombre = v.nombre AND c.id_padre IS NULL);

-- ---------------------------------------------------------------- tipos de evento

ALTER TABLE public.tipo_eventos
    ADD COLUMN IF NOT EXISTS es_incidente BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS es_proactivo BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE public.tipo_eventos
SET codigo = lower(regexp_replace(trim(translate(nombre, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')), '[[:space:]]+', '_', 'g'))
WHERE codigo IS NULL;
UPDATE public.tipo_eventos SET es_incidente = TRUE WHERE codigo IN ('incidente', 'accidente');
UPDATE public.tipo_eventos SET es_proactivo = TRUE
WHERE codigo IN ('tarjeta_pare', 'hallazgo', 'no_conformidad', 'observacion_preventiva', 'observacion_de_seguridad');

-- ---------------------------------------------------------------- eventos

ALTER TABLE public.eventos
    ADD COLUMN IF NOT EXISTS id_clasificacion_incidente BIGINT REFERENCES public.cat_clasificacion_incidente(id_clasificacion_incidente),
    ADD COLUMN IF NOT EXISTS tipo_detencion VARCHAR(20),
    ADD COLUMN IF NOT EXISTS fecha_detencion TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS fecha_reinicio TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS id_autoriza_reinicio BIGINT REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS dia_ciclo SMALLINT;
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS chk_evento_tipo_detencion;
ALTER TABLE public.eventos ADD CONSTRAINT chk_evento_tipo_detencion
    CHECK (tipo_detencion IS NULL OR tipo_detencion IN ('sin_detencion', 'parcial', 'total'));
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS chk_evento_dia_ciclo;
ALTER TABLE public.eventos ADD CONSTRAINT chk_evento_dia_ciclo CHECK (dia_ciclo IS NULL OR dia_ciclo BETWEEN 1 AND 30);
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS chk_evento_reinicio;
ALTER TABLE public.eventos ADD CONSTRAINT chk_evento_reinicio
    CHECK (fecha_reinicio IS NULL OR fecha_detencion IS NULL OR fecha_reinicio >= fecha_detencion);

-- La condicion es el codigo (1 a 10) de la Tarjeta PARE.
ALTER TABLE public.eventos ALTER COLUMN condicion TYPE SMALLINT USING round(condicion)::smallint;
UPDATE public.eventos SET condicion = NULL WHERE condicion NOT BETWEEN 1 AND 10;
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS fk_evento_condicion;
ALTER TABLE public.eventos ADD CONSTRAINT fk_evento_condicion
    FOREIGN KEY (condicion) REFERENCES public.cat_condicion_pare(id_condicion);
COMMENT ON COLUMN public.eventos.condicion IS 'Condicion de la Tarjeta PARE (ver cat_condicion_pare).';
COMMENT ON COLUMN public.eventos.severidad IS 'Nombre de id_severidad, mantenido por un trigger. La fuente es id_severidad.';

-- id_severidad manda; quien solo envia el texto sigue funcionando.
CREATE OR REPLACE FUNCTION public.sincronizar_severidad_evento() RETURNS trigger AS $$
BEGIN
    IF NEW.id_severidad IS NOT NULL THEN
        SELECT nombre INTO NEW.severidad FROM public.cat_severidad WHERE id_severidad = NEW.id_severidad;
    ELSIF NEW.severidad IS NOT NULL THEN
        SELECT id_severidad, nombre INTO NEW.id_severidad, NEW.severidad
        FROM public.cat_severidad
        WHERE nivel = CASE
            WHEN NEW.severidad ILIKE 'leve%' THEN 1 WHEN NEW.severidad ILIKE 'baja%' THEN 2
            WHEN NEW.severidad ILIKE 'media%' THEN 3 WHEN NEW.severidad ILIKE 'alta%' THEN 4
            WHEN NEW.severidad ILIKE ANY (ARRAY['cr_tic%', 'grave%']) THEN 5 END;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_evento_severidad ON public.eventos;
CREATE TRIGGER trg_evento_severidad BEFORE INSERT OR UPDATE OF severidad, id_severidad ON public.eventos
    FOR EACH ROW EXECUTE FUNCTION public.sincronizar_severidad_evento();
UPDATE public.eventos SET severidad = severidad WHERE id_severidad IS NULL AND severidad IS NOT NULL;

-- ---------------------------------------------------------------- Intrava

ALTER TABLE public.hallazgos_intrava
    ADD COLUMN IF NOT EXISTS id_area BIGINT REFERENCES public.areas(id_area) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_hallazgos_area ON public.hallazgos_intrava(id_area);

ALTER TABLE public.reportes_flash_intrava
    ADD COLUMN IF NOT EXISTS id_clasificacion_incidente BIGINT REFERENCES public.cat_clasificacion_incidente(id_clasificacion_incidente);
UPDATE public.reportes_flash_intrava r
SET id_clasificacion_incidente = c.id_clasificacion_incidente
FROM public.cat_clasificacion_incidente c
WHERE r.id_clasificacion_incidente IS NULL AND c.codigo = CASE
    WHEN r.clasificacion ILIKE '%fatal%' THEN 'FATAL'
    WHEN r.clasificacion ILIKE ANY (ARRAY['%CTP%', '%con tiempo perdido%']) THEN 'CTP'
    WHEN r.clasificacion ILIKE ANY (ARRAY['%STP%', '%sin tiempo perdido%', '%accidente%', '%lesi_n%']) AND r.clasificacion NOT ILIKE '%cuasi%' THEN 'STP'
    WHEN r.clasificacion ILIKE '%trayecto%' THEN 'AT'
    WHEN r.clasificacion ILIKE '%cuasi%' THEN 'CUASI'
    WHEN r.clasificacion ILIKE '%material%' THEN 'DMNS'
    WHEN r.clasificacion ILIKE '%ambiental%' THEN 'DANS'
    WHEN r.clasificacion ILIKE '%operacional%' THEN 'FO' END;

-- Criticidad del formato de AVA. El documento traslapa Bajo (3 a 6) y Medio (5 a 9); 5 y 6 se tratan como Medio.
ALTER TABLE public.informes_investigacion_intrava
    ADD COLUMN IF NOT EXISTS probabilidad SMALLINT CHECK (probabilidad BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS consecuencia SMALLINT CHECK (consecuencia BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS criticidad SMALLINT GENERATED ALWAYS AS (probabilidad * consecuencia) STORED,
    ADD COLUMN IF NOT EXISTS nivel_criticidad VARCHAR(10) GENERATED ALWAYS AS (
        CASE WHEN probabilidad * consecuencia <= 2 THEN 'Leve'
             WHEN probabilidad * consecuencia <= 4 THEN 'Bajo'
             WHEN probabilidad * consecuencia <= 9 THEN 'Medio'
             WHEN probabilidad * consecuencia <= 16 THEN 'Alto'
             ELSE 'Serio' END) STORED,
    ADD COLUMN IF NOT EXISTS id_causa_raiz BIGINT REFERENCES public.cat_causa(id_causa),
    ADD COLUMN IF NOT EXISTS id_clasificacion_incidente BIGINT REFERENCES public.cat_clasificacion_incidente(id_clasificacion_incidente);

-- ---------------------------------------------------------------- operacion

ALTER TABLE public.actividades
    ADD COLUMN IF NOT EXISTS id_riesgo_critico BIGINT REFERENCES public.cat_riesgo_critico(id_riesgo_critico);

CREATE TABLE IF NOT EXISTS public.jefes_zona (
    id_trabajador BIGINT PRIMARY KEY REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE
);
ALTER TABLE public.cuadrillas
    ADD COLUMN IF NOT EXISTS id_jefe_zona BIGINT REFERENCES public.jefes_zona(id_trabajador) ON DELETE SET NULL;
INSERT INTO public.roles (nombre, descripcion, estado)
SELECT 'Jefe de zona', 'Responsable de una o más cuadrillas', 'activo'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE nombre = 'Jefe de zona');

-- Un supervisor lidera una sola cuadrilla. Si hoy hay repetidos, la regla queda solo en la validacion de la app.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.cuadrillas GROUP BY id_supervisor HAVING count(*) > 1)
       AND to_regclass('public.uq_cuadrilla_supervisor') IS NULL THEN
        CREATE UNIQUE INDEX uq_cuadrilla_supervisor ON public.cuadrillas(id_supervisor);
    END IF;
END $$;

-- Una actividad activa por trabajador, hasta que se complete o se desasigne.
CREATE TABLE IF NOT EXISTS public.actividad_trabajador (
    id_actividad_trabajador BIGSERIAL PRIMARY KEY,
    id_actividad BIGINT NOT NULL REFERENCES public.actividades(id_actividad) ON DELETE CASCADE,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    id_asignado_por BIGINT REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL,
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITHOUT TIME ZONE,
    motivo_fin VARCHAR(20) CHECK (motivo_fin IN ('completada', 'desasignada')),
    CONSTRAINT chk_at_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_at_trabajador_activo ON public.actividad_trabajador(id_trabajador) WHERE fecha_fin IS NULL;
CREATE INDEX IF NOT EXISTS idx_at_actividad ON public.actividad_trabajador(id_actividad);

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS codigo_historico VARCHAR(60);
COMMENT ON COLUMN public.clientes.codigo_historico IS 'Nombre del cliente en incidentes_historicos, para unir ambos.';
CREATE INDEX IF NOT EXISTS idx_proyectos_contrato ON public.proyectos(num_contrato);

-- Un solo historial de membresia: se traslada trabajador_cuadrilla y se elimina.
DO $$
BEGIN
    IF to_regclass('public.trabajador_cuadrilla') IS NOT NULL THEN
        INSERT INTO public.trabajadores_cuadrillas (id_trabajador, id_cuadrilla, fecha_inicio, fecha_fin)
        SELECT id_trabajador, id_cuadrilla, fecha_inicio, fecha_termino FROM public.trabajador_cuadrilla
        ON CONFLICT DO NOTHING;
        DROP TABLE public.trabajador_cuadrilla;
    END IF;
END $$;

INSERT INTO public.trabajadores_cuadrillas (id_trabajador, id_cuadrilla, fecha_inicio)
SELECT o.id_trabajador, o.id_cuadrilla,
       COALESCE((SELECT min(a.fecha_inicio) FROM public.asignaciones a WHERE a.id_cuadrilla = o.id_cuadrilla), CURRENT_DATE)
FROM public.obreros o
WHERE o.id_cuadrilla IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.trabajadores_cuadrillas tc
                  WHERE tc.id_trabajador = o.id_trabajador AND tc.id_cuadrilla = o.id_cuadrilla AND tc.fecha_fin IS NULL);

-- ---------------------------------------------------------------- predicciones publicadas

CREATE TABLE IF NOT EXISTS public.predicciones_registradas (
    id_prediccion BIGSERIAL PRIMARY KEY,
    generada_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    semana DATE NOT NULL,
    nivel VARCHAR(20) NOT NULL,
    id_entidad BIGINT NOT NULL,
    tipo_objetivo VARCHAR(100) NOT NULL,
    horizonte SMALLINT NOT NULL,
    probabilidad NUMERIC(7,6) NOT NULL,
    modelo VARCHAR(100),
    metodo VARCHAR(20),
    UNIQUE (semana, nivel, id_entidad, tipo_objetivo, horizonte)
);
COMMENT ON TABLE public.predicciones_registradas IS 'Lo que el modelo predijo cada semana, para medir despues si acerto.';

-- ---------------------------------------------------------------- vistas

CREATE OR REPLACE VIEW public.v_eventos_unificados AS
SELECT e.id_proyecto,
       COALESCE(e.fecha_ocurrencia, e.fecha_creacion)::date AS fecha,
       COALESCE(te.codigo, lower(regexp_replace(trim(te.nombre), '\s+', '_', 'g')))::text AS tipo,
       s.nivel::numeric AS severidad,
       'eventos'::text AS origen,
       e.id_evento::text AS id_origen,
       e.id_area,
       COALESCE(ci.con_lesion, FALSE) AS con_lesion,
       COALESCE(ci.laboral, TRUE) AS laboral
FROM public.eventos e
JOIN public.tipo_eventos te USING (id_tipo_evento)
LEFT JOIN public.cat_severidad s ON s.id_severidad = e.id_severidad
LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = e.id_clasificacion_incidente
UNION ALL
SELECT id_proyecto, fecha, 'reporte_previene', urgencia::numeric,
       'reportes_previene_intrava', id_local::text, id_area, FALSE, TRUE
FROM public.reportes_previene_intrava
WHERE id_proyecto IS NOT NULL AND fecha IS NOT NULL
UNION ALL
SELECT r.id_proyecto, r.fecha, 'reporte_flash', NULL,
       'reportes_flash_intrava', r.id_local::text, r.id_area,
       COALESCE(ci.con_lesion, FALSE), COALESCE(ci.laboral, TRUE)
FROM public.reportes_flash_intrava r
LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = r.id_clasificacion_incidente
WHERE r.id_proyecto IS NOT NULL AND r.fecha IS NOT NULL
UNION ALL
SELECT i.id_proyecto, f.fecha, 'informe_investigacion', NULL,
       'informes_investigacion_intrava', i.id_local::text, f.id_area, FALSE, TRUE
FROM public.informes_investigacion_intrava i
JOIN public.reportes_flash_intrava f ON f.id_intrava = i.id_reporte_flash_intrava
WHERE i.id_proyecto IS NOT NULL AND f.fecha IS NOT NULL
UNION ALL
SELECT id_proyecto, COALESCE(fecha_deteccion, fecha_creacion), 'hallazgo', NULL,
       'hallazgos_intrava', id_intrava::text, id_area, FALSE, TRUE
FROM public.hallazgos_intrava
WHERE id_proyecto IS NOT NULL AND COALESCE(fecha_deteccion, fecha_creacion) IS NOT NULL;
