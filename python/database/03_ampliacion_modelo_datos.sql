-- ============================================================
-- AMPLIACION DEL MODELO DE DATOS (seguridad / modelo predictivo)
-- PostgreSQL 12+. Se ejecuta DESPUES de bd_proyecto_completa_intrava.sql
-- Es ADITIVA e idempotente: solo agrega tablas, columnas, indices y
-- catalogos; no borra ni cambia datos existentes.
-- Las claves foraneas nuevas sobre tablas existentes se crean NOT VALID:
-- se exigen en filas nuevas, y los datos viejos se validan despues con
--   ALTER TABLE ... VALIDATE CONSTRAINT <nombre>;
-- Todo lo nuevo es opcional (NULL) hasta que el cliente lo empiece a cargar.
-- ============================================================

BEGIN;

-- Helper para agregar FKs de forma idempotente
CREATE OR REPLACE FUNCTION pg_temp.add_fk(p_table regclass, p_name text, p_def text)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = p_name AND conrelid = p_table) THEN
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s NOT VALID',
                       p_table, p_name, p_def);
    END IF;
END $$ LANGUAGE plpgsql;

-- ============================================================
-- 1. CATALOGOS
-- ============================================================

-- Escala unica de severidad: se usa para severidad real Y potencial
CREATE TABLE IF NOT EXISTS public.cat_severidad (
    id_severidad BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    nivel  SMALLINT    NOT NULL UNIQUE
);
INSERT INTO public.cat_severidad (nombre, nivel) VALUES
    ('Baja', 1), ('Media', 2), ('Alta', 3), ('Crítica', 4)
ON CONFLICT DO NOTHING;

-- Categoria / subcategoria de evento (caida de altura, atrapamiento, ...)
CREATE TABLE IF NOT EXISTS public.cat_categoria_evento (
    id_categoria_evento BIGSERIAL PRIMARY KEY,
    id_padre BIGINT REFERENCES public.cat_categoria_evento(id_categoria_evento),
    nombre VARCHAR(150) NOT NULL,
    UNIQUE (id_padre, nombre)
);

-- Causas inmediatas y basicas
CREATE TABLE IF NOT EXISTS public.cat_causa (
    id_causa BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('inmediata', 'basica')),
    id_padre BIGINT REFERENCES public.cat_causa(id_causa),
    nombre VARCHAR(200) NOT NULL,
    UNIQUE (tipo, nombre)
);

CREATE TABLE IF NOT EXISTS public.cat_parte_cuerpo (
    id_parte_cuerpo BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.cat_tipo_lesion (
    id_tipo_lesion BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.cat_turno (
    id_turno BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    hora_inicio TIME,
    hora_fin TIME
);
INSERT INTO public.cat_turno (nombre) VALUES ('Día'), ('Noche'), ('Tarde')
ON CONFLICT DO NOTHING;

-- Sistema de trabajo (7x7, 4x3, 14x14, diurno, ...)
CREATE TABLE IF NOT EXISTS public.cat_sistema_trabajo (
    id_sistema_trabajo BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    dias_trabajo SMALLINT,
    dias_descanso SMALLINT
);

CREATE TABLE IF NOT EXISTS public.cat_fase_proyecto (
    id_fase BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    orden SMALLINT
);
INSERT INTO public.cat_fase_proyecto (nombre, orden) VALUES
    ('Movilización', 1), ('Obras tempranas', 2), ('Obra gruesa', 3),
    ('Montaje', 4), ('Puesta en marcha', 5), ('Cierre y desmovilización', 6)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cat_tipo_intervencion (
    id_tipo_intervencion BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO public.cat_tipo_intervencion (nombre) VALUES
    ('Charla de seguridad'), ('Inspección planificada'), ('Auditoría'),
    ('Simulacro'), ('Capacitación en terreno'), ('Reunión de comité')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cat_tipo_permiso_trabajo (
    id_tipo_permiso BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO public.cat_tipo_permiso_trabajo (nombre) VALUES
    ('Trabajo en altura'), ('Trabajo en caliente'), ('Espacio confinado'),
    ('Excavación'), ('Izaje'), ('Bloqueo y etiquetado (energías)')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cat_tipo_capacitacion (
    id_tipo_capacitacion BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigencia_meses SMALLINT
);

CREATE TABLE IF NOT EXISTS public.cat_epp (
    id_epp BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
);

-- Empresas: propia, contratistas y subcontratistas
CREATE TABLE IF NOT EXISTS public.empresas (
    id_empresa BIGSERIAL PRIMARY KEY,
    rut VARCHAR(20) UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'propia'
        CHECK (tipo IN ('propia', 'contratista', 'subcontratista')),
    estado VARCHAR(30) NOT NULL DEFAULT 'activo'
);

-- ============================================================
-- 2. TIPOS DE EVENTO: codigo estable (para no depender del nombre)
-- ============================================================

ALTER TABLE public.tipo_eventos
    ADD COLUMN IF NOT EXISTS codigo VARCHAR(50),
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tipo_eventos_codigo
    ON public.tipo_eventos(codigo) WHERE codigo IS NOT NULL;
COMMENT ON COLUMN public.tipo_eventos.codigo IS
    'Codigo estable, ej. tarjeta_pare, cuasi_accidente. Completar para los tipos existentes.';

-- Ejemplo para sumar tipos que podrian faltar (descomentar y ajustar):
-- INSERT INTO public.tipo_eventos (nombre, codigo) VALUES
--     ('Cuasi accidente', 'cuasi_accidente'),
--     ('Incidente ambiental', 'incidente_ambiental'),
--     ('Daño a equipo', 'dano_equipo'),
--     ('Observación de conducta', 'observacion_conducta')
-- ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 3. FAENAS Y CLIMA
-- ============================================================

ALTER TABLE public.faenas
    ADD COLUMN IF NOT EXISTS altitud_msnm INTEGER,
    ADD COLUMN IF NOT EXISTS latitud  NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS longitud NUMERIC(9,6);

CREATE TABLE IF NOT EXISTS public.clima_diario (
    id_faena BIGINT NOT NULL REFERENCES public.faenas(id_faena) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    temp_max NUMERIC(5,2),
    temp_min NUMERIC(5,2),
    viento_max_kmh NUMERIC(6,2),
    precipitacion_mm NUMERIC(7,2),
    fuente VARCHAR(100),
    PRIMARY KEY (id_faena, fecha)
);

-- ============================================================
-- 4. TRABAJADORES, EMPRESAS, HISTORIAL DE CUADRILLAS
-- ============================================================

ALTER TABLE public.trabajadores
    ADD COLUMN IF NOT EXISTS fecha_ingreso DATE,
    ADD COLUMN IF NOT EXISTS fecha_egreso  DATE,
    ADD COLUMN IF NOT EXISTS id_empresa BIGINT;
SELECT pg_temp.add_fk('public.trabajadores', 'fk_trabajador_empresa',
    'FOREIGN KEY (id_empresa) REFERENCES public.empresas(id_empresa)');
COMMENT ON COLUMN public.trabajadores.fecha_ingreso IS
    'Fecha real de ingreso a la empresa (fecha_creacion es solo cuando se creo el registro).';

-- Historial de pertenencia a cuadrillas (obreros.id_cuadrilla solo guarda lo actual)
CREATE TABLE IF NOT EXISTS public.trabajador_cuadrilla (
    id_trabajador_cuadrilla BIGSERIAL PRIMARY KEY,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    id_cuadrilla  BIGINT NOT NULL REFERENCES public.cuadrillas(id_cuadrilla) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_termino DATE,
    CONSTRAINT chk_tc_fechas CHECK (fecha_termino IS NULL OR fecha_termino >= fecha_inicio)
);
CREATE INDEX IF NOT EXISTS idx_tc_trabajador ON public.trabajador_cuadrilla(id_trabajador, fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_tc_cuadrilla  ON public.trabajador_cuadrilla(id_cuadrilla, fecha_inicio);

ALTER TABLE public.cuadrillas
    ADD COLUMN IF NOT EXISTS id_turno BIGINT,
    ADD COLUMN IF NOT EXISTS id_sistema_trabajo BIGINT,
    ADD COLUMN IF NOT EXISTS id_empresa BIGINT;
SELECT pg_temp.add_fk('public.cuadrillas', 'fk_cuadrilla_turno',
    'FOREIGN KEY (id_turno) REFERENCES public.cat_turno(id_turno)');
SELECT pg_temp.add_fk('public.cuadrillas', 'fk_cuadrilla_sistema',
    'FOREIGN KEY (id_sistema_trabajo) REFERENCES public.cat_sistema_trabajo(id_sistema_trabajo)');
SELECT pg_temp.add_fk('public.cuadrillas', 'fk_cuadrilla_empresa',
    'FOREIGN KEY (id_empresa) REFERENCES public.empresas(id_empresa)');

-- Capacitaciones / certificaciones
CREATE TABLE IF NOT EXISTS public.trabajador_capacitacion (
    id_trabajador_capacitacion BIGSERIAL PRIMARY KEY,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    id_tipo_capacitacion BIGINT NOT NULL REFERENCES public.cat_tipo_capacitacion(id_tipo_capacitacion),
    fecha_realizacion DATE NOT NULL,
    fecha_vencimiento DATE,
    horas NUMERIC(6,2)
);
CREATE INDEX IF NOT EXISTS idx_tcap_trabajador ON public.trabajador_capacitacion(id_trabajador);

-- Entrega de EPP
CREATE TABLE IF NOT EXISTS public.entrega_epp (
    id_entrega BIGSERIAL PRIMARY KEY,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    id_epp BIGINT NOT NULL REFERENCES public.cat_epp(id_epp),
    fecha_entrega DATE NOT NULL,
    fecha_reposicion DATE
);
CREATE INDEX IF NOT EXISTS idx_epp_trabajador ON public.entrega_epp(id_trabajador);

-- Aptitud vigente. SOLO si esta apto o no: NO guardar detalle clinico
-- (son datos sensibles; basta con el indicador de vigencia).
CREATE TABLE IF NOT EXISTS public.trabajador_aptitud (
    id_aptitud BIGSERIAL PRIMARY KEY,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    tipo_aptitud VARCHAR(100) NOT NULL,
    apto BOOLEAN NOT NULL,
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE
);
CREATE INDEX IF NOT EXISTS idx_aptitud_trabajador ON public.trabajador_aptitud(id_trabajador);

-- ============================================================
-- 5. EXPOSICION: HORAS TRABAJADAS, ASISTENCIA, AVANCE
-- ============================================================

-- Horas-hombre agregadas (por dia, proyecto y cuadrilla/empresa opcional)
CREATE TABLE IF NOT EXISTS public.horas_hombre (
    id_horas BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_cuadrilla BIGINT REFERENCES public.cuadrillas(id_cuadrilla) ON DELETE SET NULL,
    id_empresa BIGINT REFERENCES public.empresas(id_empresa) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    n_trabajadores INTEGER CHECK (n_trabajadores >= 0),
    horas_normales NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (horas_normales >= 0),
    horas_extra    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (horas_extra >= 0),
    fuente VARCHAR(100)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_horas_hombre
    ON public.horas_hombre (id_proyecto, COALESCE(id_cuadrilla, 0), COALESCE(id_empresa, 0), fecha);
CREATE INDEX IF NOT EXISTS idx_horas_proyecto_fecha ON public.horas_hombre(id_proyecto, fecha);

-- Asistencia diaria por trabajador (fatiga, dias consecutivos, ausentismo)
CREATE TABLE IF NOT EXISTS public.asistencia_diaria (
    id_asistencia BIGSERIAL PRIMARY KEY,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    id_turno BIGINT REFERENCES public.cat_turno(id_turno),
    horas_normales NUMERIC(5,2) NOT NULL DEFAULT 0,
    horas_extra    NUMERIC(5,2) NOT NULL DEFAULT 0,
    ausente BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_ausencia VARCHAR(30) CHECK (tipo_ausencia IN ('falta', 'permiso', 'licencia', 'vacaciones', 'otro')),
    UNIQUE (id_trabajador, id_proyecto, fecha)
);
CREATE INDEX IF NOT EXISTS idx_asistencia_proyecto_fecha ON public.asistencia_diaria(id_proyecto, fecha);

-- Fases del proyecto
CREATE TABLE IF NOT EXISTS public.proyecto_fase (
    id_proyecto_fase BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_fase BIGINT NOT NULL REFERENCES public.cat_fase_proyecto(id_fase),
    fecha_inicio DATE NOT NULL,
    fecha_termino DATE,
    CONSTRAINT chk_pf_fechas CHECK (fecha_termino IS NULL OR fecha_termino >= fecha_inicio)
);
CREATE INDEX IF NOT EXISTS idx_pf_proyecto ON public.proyecto_fase(id_proyecto, fecha_inicio);

-- Avance fisico y presion de plazos (una fila por proyecto y semana, lunes)
CREATE TABLE IF NOT EXISTS public.proyecto_avance_semanal (
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    semana DATE NOT NULL,
    avance_fisico_pct NUMERIC(5,2) CHECK (avance_fisico_pct BETWEEN 0 AND 100),
    avance_planificado_pct NUMERIC(5,2) CHECK (avance_planificado_pct BETWEEN 0 AND 100),
    dias_atraso INTEGER,
    PRIMARY KEY (id_proyecto, semana)
);

-- Maquinaria y equipos
CREATE TABLE IF NOT EXISTS public.equipos (
    id_equipo BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(100),
    id_empresa BIGINT REFERENCES public.empresas(id_empresa)
);
CREATE TABLE IF NOT EXISTS public.proyecto_equipo (
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_equipo BIGINT NOT NULL REFERENCES public.equipos(id_equipo) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_termino DATE,
    PRIMARY KEY (id_proyecto, id_equipo, fecha_inicio)
);
CREATE TABLE IF NOT EXISTS public.mantenciones_equipo (
    id_mantencion BIGSERIAL PRIMARY KEY,
    id_equipo BIGINT NOT NULL REFERENCES public.equipos(id_equipo) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo VARCHAR(30) CHECK (tipo IN ('preventiva', 'correctiva', 'inspeccion')),
    resultado VARCHAR(100)
);

-- ============================================================
-- 6. EVENTOS: columnas nuevas y claves que faltaban
-- ============================================================

ALTER TABLE public.eventos
    ADD COLUMN IF NOT EXISTS fecha_ocurrencia TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS id_reportante BIGINT,
    ADD COLUMN IF NOT EXISTS tipo_reporte VARCHAR(20),
    ADD COLUMN IF NOT EXISTS id_actividad BIGINT,
    ADD COLUMN IF NOT EXISTS id_turno BIGINT,
    ADD COLUMN IF NOT EXISTS id_equipo BIGINT,
    ADD COLUMN IF NOT EXISTS id_empresa BIGINT,
    ADD COLUMN IF NOT EXISTS sector VARCHAR(150),
    ADD COLUMN IF NOT EXISTS nivel_elevacion VARCHAR(50),
    ADD COLUMN IF NOT EXISTS latitud  NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS longitud NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS id_severidad BIGINT,
    ADD COLUMN IF NOT EXISTS id_potencial_severidad BIGINT,
    ADD COLUMN IF NOT EXISTS id_categoria_evento BIGINT,
    ADD COLUMN IF NOT EXISTS id_causa_inmediata BIGINT,
    ADD COLUMN IF NOT EXISTS id_causa_basica BIGINT;

ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS chk_evento_tipo_reporte;
ALTER TABLE public.eventos ADD CONSTRAINT chk_evento_tipo_reporte
    CHECK (tipo_reporte IS NULL OR tipo_reporte IN
           ('autoreporte', 'supervisor', 'prevencionista', 'tercero', 'otro'));

COMMENT ON COLUMN public.eventos.fecha_creacion IS
    'Cuando se REGISTRO el evento. Cuando ocurrio esta en fecha_ocurrencia.';
COMMENT ON COLUMN public.eventos.fecha_ocurrencia IS
    'Fecha y hora en que ocurrio realmente. Pendiente de cargar; no se rellena con fecha_creacion.';
COMMENT ON COLUMN public.eventos.condicion IS
    'PENDIENTE: definir con el cliente que significa este valor numerico.';
COMMENT ON COLUMN public.eventos.id_potencial_severidad IS
    'Severidad que el evento PUDO haber tenido (distinta de la severidad real).';

SELECT pg_temp.add_fk('public.eventos', 'fk_evento_trabajador',
    'FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_supervisor',
    'FOREIGN KEY (id_supervisor) REFERENCES public.supervisores(id_trabajador) ON DELETE SET NULL');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_reportante',
    'FOREIGN KEY (id_reportante) REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_actividad',
    'FOREIGN KEY (id_actividad) REFERENCES public.actividades(id_actividad) ON DELETE SET NULL');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_turno',
    'FOREIGN KEY (id_turno) REFERENCES public.cat_turno(id_turno)');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_equipo',
    'FOREIGN KEY (id_equipo) REFERENCES public.equipos(id_equipo) ON DELETE SET NULL');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_empresa',
    'FOREIGN KEY (id_empresa) REFERENCES public.empresas(id_empresa) ON DELETE SET NULL');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_severidad',
    'FOREIGN KEY (id_severidad) REFERENCES public.cat_severidad(id_severidad)');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_potencial',
    'FOREIGN KEY (id_potencial_severidad) REFERENCES public.cat_severidad(id_severidad)');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_categoria',
    'FOREIGN KEY (id_categoria_evento) REFERENCES public.cat_categoria_evento(id_categoria_evento)');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_causa_inmediata',
    'FOREIGN KEY (id_causa_inmediata) REFERENCES public.cat_causa(id_causa)');
SELECT pg_temp.add_fk('public.eventos', 'fk_evento_causa_basica',
    'FOREIGN KEY (id_causa_basica) REFERENCES public.cat_causa(id_causa)');

CREATE INDEX IF NOT EXISTS idx_eventos_fecha_ocurrencia ON public.eventos(fecha_ocurrencia);
CREATE INDEX IF NOT EXISTS idx_eventos_actividad ON public.eventos(id_actividad);
CREATE INDEX IF NOT EXISTS idx_eventos_severidad ON public.eventos(id_severidad);

-- Pasar la severidad en texto libre al catalogo (solo donde se reconoce el texto)
UPDATE public.eventos e
SET id_severidad = s.id_severidad
FROM public.cat_severidad s
WHERE e.id_severidad IS NULL
  AND e.severidad IS NOT NULL
  AND s.nivel = CASE
        WHEN e.severidad ILIKE 'baja%'  THEN 1
        WHEN e.severidad ILIKE 'media%' THEN 2
        WHEN e.severidad ILIKE 'alta%'  THEN 3
        WHEN e.severidad ILIKE 'cr_tic%' OR e.severidad ILIKE 'grave%' THEN 4
      END;

-- Personas involucradas: un solo lugar (evento_trabajador) con su rol
ALTER TABLE public.evento_trabajador
    ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'involucrado';
ALTER TABLE public.evento_trabajador DROP CONSTRAINT IF EXISTS chk_et_rol;
ALTER TABLE public.evento_trabajador ADD CONSTRAINT chk_et_rol
    CHECK (rol IN ('afectado', 'testigo', 'involucrado', 'reportante'));
CREATE INDEX IF NOT EXISTS idx_et_trabajador ON public.evento_trabajador(id_trabajador);

-- eventos.id_trabajador queda duplicado: se copia a evento_trabajador (sin tocarlo)
INSERT INTO public.evento_trabajador (id_evento, id_trabajador, rol)
SELECT e.id_evento, e.id_trabajador, 'involucrado'
FROM public.eventos e
JOIN public.trabajadores t ON t.id_trabajador = e.id_trabajador
WHERE e.id_trabajador IS NOT NULL
ON CONFLICT DO NOTHING;

-- Detalle de lesion (solo para eventos con personas lesionadas)
CREATE TABLE IF NOT EXISTS public.evento_lesion (
    id_lesion BIGSERIAL PRIMARY KEY,
    id_evento BIGINT NOT NULL REFERENCES public.eventos(id_evento) ON DELETE CASCADE,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    id_parte_cuerpo BIGINT REFERENCES public.cat_parte_cuerpo(id_parte_cuerpo),
    id_tipo_lesion BIGINT REFERENCES public.cat_tipo_lesion(id_tipo_lesion),
    con_tiempo_perdido BOOLEAN NOT NULL DEFAULT FALSE,
    dias_perdidos INTEGER CHECK (dias_perdidos >= 0),
    atencion_mutualidad BOOLEAN,
    numero_diat VARCHAR(50),
    costo NUMERIC(14,2),
    fatal BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (id_evento, id_trabajador)
);
CREATE INDEX IF NOT EXISTS idx_lesion_evento ON public.evento_lesion(id_evento);

-- ============================================================
-- 7. PREVENCION: INTERVENCIONES, PERMISOS, RIESGOS, MEDIDAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.intervenciones_prevencion (
    id_intervencion BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_cuadrilla BIGINT REFERENCES public.cuadrillas(id_cuadrilla) ON DELETE SET NULL,
    id_area BIGINT REFERENCES public.areas(id_area) ON DELETE SET NULL,
    id_tipo_intervencion BIGINT NOT NULL REFERENCES public.cat_tipo_intervencion(id_tipo_intervencion),
    id_responsable BIGINT REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    duracion_min INTEGER CHECK (duracion_min >= 0),
    n_participantes INTEGER CHECK (n_participantes >= 0),
    descripcion TEXT
);
CREATE INDEX IF NOT EXISTS idx_interv_proyecto_fecha ON public.intervenciones_prevencion(id_proyecto, fecha);

CREATE TABLE IF NOT EXISTS public.permisos_trabajo (
    id_permiso_trabajo BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_area BIGINT REFERENCES public.areas(id_area) ON DELETE SET NULL,
    id_actividad BIGINT REFERENCES public.actividades(id_actividad) ON DELETE SET NULL,
    id_tipo_permiso BIGINT NOT NULL REFERENCES public.cat_tipo_permiso_trabajo(id_tipo_permiso),
    id_emisor BIGINT REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL,
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    fecha_termino TIMESTAMP WITHOUT TIME ZONE,
    estado VARCHAR(30) NOT NULL DEFAULT 'vigente',
    CONSTRAINT chk_permiso_fechas CHECK (fecha_termino IS NULL OR fecha_termino >= fecha_inicio)
);
CREATE INDEX IF NOT EXISTS idx_permiso_proyecto_fecha ON public.permisos_trabajo(id_proyecto, fecha_inicio);

-- Analisis de riesgo del trabajo (ART / ATS)
CREATE TABLE IF NOT EXISTS public.analisis_riesgo_trabajo (
    id_art BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_actividad BIGINT REFERENCES public.actividades(id_actividad) ON DELETE SET NULL,
    id_area BIGINT REFERENCES public.areas(id_area) ON DELETE SET NULL,
    id_responsable BIGINT REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    nivel_riesgo SMALLINT CHECK (nivel_riesgo BETWEEN 1 AND 5),
    n_participantes INTEGER CHECK (n_participantes >= 0)
);
CREATE INDEX IF NOT EXISTS idx_art_proyecto_fecha ON public.analisis_riesgo_trabajo(id_proyecto, fecha);

-- Matriz de riesgos del proyecto y sus controles
CREATE TABLE IF NOT EXISTS public.riesgos_proyecto (
    id_riesgo BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_area BIGINT REFERENCES public.areas(id_area) ON DELETE SET NULL,
    id_categoria_evento BIGINT REFERENCES public.cat_categoria_evento(id_categoria_evento),
    peligro VARCHAR(255) NOT NULL,
    probabilidad SMALLINT NOT NULL CHECK (probabilidad BETWEEN 1 AND 5),
    consecuencia SMALLINT NOT NULL CHECK (consecuencia BETWEEN 1 AND 5),
    nivel_riesgo SMALLINT GENERATED ALWAYS AS (probabilidad * consecuencia) STORED,
    estado VARCHAR(30) NOT NULL DEFAULT 'vigente'
);
CREATE TABLE IF NOT EXISTS public.controles_riesgo (
    id_control BIGSERIAL PRIMARY KEY,
    id_riesgo BIGINT NOT NULL REFERENCES public.riesgos_proyecto(id_riesgo) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    jerarquia VARCHAR(20) CHECK (jerarquia IN
        ('eliminacion', 'sustitucion', 'ingenieria', 'administrativo', 'epp')),
    estado VARCHAR(30) NOT NULL DEFAULT 'vigente'
);

-- Medidas correctivas / preventivas con seguimiento y verificacion de eficacia
-- (si tu app ya tiene un modelo "Medida" con otra tabla, unificar con esta)
CREATE TABLE IF NOT EXISTS public.medidas_correctivas (
    id_medida BIGSERIAL PRIMARY KEY,
    id_evento BIGINT REFERENCES public.eventos(id_evento) ON DELETE CASCADE,
    id_hallazgo_intrava UUID REFERENCES public.hallazgos_intrava(id_intrava) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'correctiva'
        CHECK (tipo IN ('inmediata', 'correctiva', 'preventiva')),
    descripcion TEXT NOT NULL,
    id_responsable BIGINT REFERENCES public.trabajadores(id_trabajador) ON DELETE SET NULL,
    fecha_compromiso DATE,
    fecha_cierre DATE,
    estado VARCHAR(30) NOT NULL DEFAULT 'abierta',
    fecha_verificacion DATE,
    eficaz BOOLEAN,
    CONSTRAINT chk_medida_origen CHECK (id_evento IS NOT NULL OR id_hallazgo_intrava IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_medida_evento ON public.medidas_correctivas(id_evento);
CREATE INDEX IF NOT EXISTS idx_medida_compromiso ON public.medidas_correctivas(fecha_compromiso);

-- Comite paritario
CREATE TABLE IF NOT EXISTS public.comite_reuniones (
    id_reunion BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    id_faena BIGINT REFERENCES public.faenas(id_faena) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    n_asistentes INTEGER,
    n_acuerdos INTEGER,
    n_acuerdos_cumplidos INTEGER,
    CONSTRAINT chk_comite_ambito CHECK (id_proyecto IS NOT NULL OR id_faena IS NOT NULL)
);

-- Hitos que alteran la serie de reportes (campanas de reporte, cambio de formulario...)
CREATE TABLE IF NOT EXISTS public.hitos_reporte (
    id_hito BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'otro'
        CHECK (tipo IN ('campana_reporte', 'cambio_formulario', 'cambio_sistema', 'otro')),
    descripcion TEXT NOT NULL
);

-- ============================================================
-- 8. INTEGRACION INTRAVA: enlaces que faltaban
-- ============================================================

ALTER TABLE public.reportes_previene_intrava ADD COLUMN IF NOT EXISTS id_area BIGINT;
ALTER TABLE public.reportes_flash_intrava    ADD COLUMN IF NOT EXISTS id_area BIGINT;
SELECT pg_temp.add_fk('public.reportes_previene_intrava', 'fk_previene_area',
    'FOREIGN KEY (id_area) REFERENCES public.areas(id_area) ON DELETE SET NULL');
SELECT pg_temp.add_fk('public.reportes_flash_intrava', 'fk_flash_area',
    'FOREIGN KEY (id_area) REFERENCES public.areas(id_area) ON DELETE SET NULL');

-- Enlazar el texto "area" con areas.id_area SOLO cuando hay un unico calce
UPDATE public.reportes_previene_intrava r
SET id_area = m.id_area
FROM (
    SELECT r2.id_local, min(a.id_area) AS id_area
    FROM public.reportes_previene_intrava r2
    JOIN public.proyectos p ON p.id_proyecto = r2.id_proyecto
    JOIN public.areas a ON a.id_faena = p.id_faena
     AND (lower(a.codigo_area) = lower(trim(r2.area))
       OR lower(a.descripcion) = lower(trim(r2.area)))
    WHERE r2.id_area IS NULL
    GROUP BY r2.id_local
    HAVING count(DISTINCT a.id_area) = 1
) m
WHERE r.id_local = m.id_local;

UPDATE public.reportes_flash_intrava r
SET id_area = m.id_area
FROM (
    SELECT r2.id_local, min(a.id_area) AS id_area
    FROM public.reportes_flash_intrava r2
    JOIN public.proyectos p ON p.id_proyecto = r2.id_proyecto
    JOIN public.areas a ON a.id_faena = p.id_faena
     AND (lower(a.codigo_area) = lower(trim(r2.area))
       OR lower(a.descripcion) = lower(trim(r2.area)))
    WHERE r2.id_area IS NULL
    GROUP BY r2.id_local
    HAVING count(DISTINCT a.id_area) = 1
) m
WHERE r.id_local = m.id_local;

-- Equivalencia entre personas de INTRAVA (responsables, creadores) y trabajadores locales
CREATE TABLE IF NOT EXISTS public.intrava_trabajador_map (
    id_intrava BIGINT PRIMARY KEY,
    id_trabajador BIGINT NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE
);

-- Registros de INTRAVA que no calzaron con un proyecto local (no entran al modelo)
CREATE OR REPLACE VIEW public.v_intrava_sin_proyecto AS
SELECT 'reporte_previene' AS tipo, id_local::text AS id, id_proyecto_intrava, proyecto_alias, fecha
FROM public.reportes_previene_intrava WHERE id_proyecto IS NULL
UNION ALL
SELECT 'reporte_flash', id_local::text, id_proyecto_intrava, proyecto_alias, fecha
FROM public.reportes_flash_intrava WHERE id_proyecto IS NULL
UNION ALL
SELECT 'informe_investigacion', id_local::text, id_proyecto_intrava, proyecto_alias, NULL
FROM public.informes_investigacion_intrava WHERE id_proyecto IS NULL
UNION ALL
SELECT 'hallazgo', id_intrava::text, id_proyecto_intrava, NULL, fecha_creacion
FROM public.hallazgos_intrava WHERE id_proyecto IS NULL;

-- ============================================================
-- 9. VISTA DE FEATURES EXTRA PARA EL MODELO (proyecto x semana)
-- Son valores de la semana misma; el script de Python los desplaza
-- una semana para no usar informacion del futuro.
-- ============================================================

CREATE OR REPLACE VIEW public.v_proyecto_semana_extra AS
SELECT sp.id_proyecto,
       sp.semana,
       hh.horas_hombre,
       hh.horas_extra,
       hh.pct_horas_contratistas,
       av.avance_fisico_pct,
       av.avance_planificado_pct,
       av.dias_atraso,
       cl.temp_max, cl.temp_min, cl.viento_max_kmh, cl.precipitacion_mm,
       iv.n_intervenciones,
       iv.n_participantes_interv,
       pt.n_permisos_trabajo,
       asi.horas_dia_prom,
       asi.tasa_ausentismo,
       med.n_medidas_vencidas
FROM public.v_proyecto_semanas sp
LEFT JOIN (
    SELECT h.id_proyecto, date_trunc('week', h.fecha)::date AS semana,
           sum(h.horas_normales + h.horas_extra) AS horas_hombre,
           sum(h.horas_extra) AS horas_extra,
           sum(CASE WHEN em.tipo IN ('contratista', 'subcontratista')
                    THEN h.horas_normales + h.horas_extra END)
             / NULLIF(sum(h.horas_normales + h.horas_extra), 0) AS pct_horas_contratistas
    FROM public.horas_hombre h
    LEFT JOIN public.empresas em ON em.id_empresa = h.id_empresa
    GROUP BY 1, 2
) hh  USING (id_proyecto, semana)
LEFT JOIN (
    SELECT id_proyecto, date_trunc('week', semana)::date AS semana,
           max(avance_fisico_pct) AS avance_fisico_pct,
           max(avance_planificado_pct) AS avance_planificado_pct,
           max(dias_atraso) AS dias_atraso
    FROM public.proyecto_avance_semanal GROUP BY 1, 2
) av  USING (id_proyecto, semana)
LEFT JOIN (
    SELECT p.id_proyecto, date_trunc('week', c.fecha)::date AS semana,
           max(c.temp_max) AS temp_max, min(c.temp_min) AS temp_min,
           max(c.viento_max_kmh) AS viento_max_kmh,
           sum(c.precipitacion_mm) AS precipitacion_mm
    FROM public.clima_diario c
    JOIN public.proyectos p ON p.id_faena = c.id_faena
    GROUP BY 1, 2
) cl  USING (id_proyecto, semana)
LEFT JOIN (
    SELECT id_proyecto, date_trunc('week', fecha)::date AS semana,
           count(*) AS n_intervenciones,
           sum(n_participantes) AS n_participantes_interv
    FROM public.intervenciones_prevencion GROUP BY 1, 2
) iv  USING (id_proyecto, semana)
LEFT JOIN (
    SELECT id_proyecto, date_trunc('week', fecha_inicio)::date AS semana,
           count(*) AS n_permisos_trabajo
    FROM public.permisos_trabajo GROUP BY 1, 2
) pt  USING (id_proyecto, semana)
LEFT JOIN (
    SELECT id_proyecto, date_trunc('week', fecha)::date AS semana,
           avg(horas_normales + horas_extra) FILTER (WHERE NOT ausente) AS horas_dia_prom,
           avg(CASE WHEN ausente THEN 1.0 ELSE 0.0 END) AS tasa_ausentismo
    FROM public.asistencia_diaria GROUP BY 1, 2
) asi USING (id_proyecto, semana)
LEFT JOIN (
    -- medidas abiertas y vencidas al inicio de la semana (punto en el tiempo)
    SELECT s.id_proyecto, s.semana, count(*) AS n_medidas_vencidas
    FROM public.v_proyecto_semanas s
    JOIN public.eventos e ON e.id_proyecto = s.id_proyecto
    JOIN public.medidas_correctivas m ON m.id_evento = e.id_evento
    WHERE m.fecha_compromiso < s.semana
      AND (m.fecha_cierre IS NULL OR m.fecha_cierre >= s.semana)
    GROUP BY 1, 2
) med USING (id_proyecto, semana);

COMMIT;