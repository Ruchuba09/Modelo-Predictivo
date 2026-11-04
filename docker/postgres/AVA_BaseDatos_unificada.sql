-- ======================================================================
-- AVA: BASE DE DATOS UNIFICADA CON DATOS BASICOS DE PRUEBA
-- PostgreSQL 16. Generado a partir de AVA_BaseDatos.sql, las vistas del
-- modelo predictivo (01) y la ampliacion del modelo de datos (03).
--
-- Se ejecuta en una base vacia (si ya tiene tablas se detiene sin cambiar
-- nada). Todo corre en una transaccion: si algo falla, no queda nada a medias.
--
-- Crear una base nueva y cargarla:
--   createdb -U postgres ava
--   psql -U postgres -d ava -v ON_ERROR_STOP=1 -f AVA_BaseDatos_unificada.sql
--
-- La app usa la base indicada en DB_DATABASE de app/.env.
-- Solo para desarrollo y pruebas: incluye usuarios de prueba.
-- ======================================================================

BEGIN;

SET LOCAL client_encoding = 'UTF8';
SET LOCAL client_min_messages = warning;
SET LOCAL check_function_bodies = false;

DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL OR to_regclass('public.eventos') IS NOT NULL THEN
        RAISE EXCEPTION 'La base ya tiene el esquema de AVA. Ejecuta este archivo en una base vacia.';
    END IF;
END $$;

-- ======================================================================
-- 1. ESQUEMA BASE
-- ======================================================================

CREATE SCHEMA IF NOT EXISTS laravel;

COMMENT ON SCHEMA public IS '';

CREATE SCHEMA IF NOT EXISTS usuarios;

CREATE TABLE laravel.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);

CREATE SEQUENCE laravel.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE laravel.migrations_id_seq OWNED BY laravel.migrations.id;

CREATE TABLE public.actividades (
    id_actividad bigint NOT NULL,
    id_asignacion bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    fecha_inicio date,
    fecha_termino date,
    estado character varying(30) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_fechas_actividad CHECK (((fecha_termino IS NULL) OR (fecha_inicio IS NULL) OR (fecha_termino >= fecha_inicio)))
);

CREATE SEQUENCE public.actividades_id_actividad_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.actividades_id_actividad_seq OWNED BY public.actividades.id_actividad;

CREATE TABLE public.administrativos (
    id_trabajador bigint NOT NULL
);

CREATE TABLE public.areas (
    id_area bigint NOT NULL,
    id_faena bigint NOT NULL,
    codigo_area character varying(50) NOT NULL,
    descripcion text
);

CREATE SEQUENCE public.areas_id_area_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.areas_id_area_seq OWNED BY public.areas.id_area;

CREATE TABLE public.asignaciones (
    id_asignacion bigint NOT NULL,
    id_administrador bigint NOT NULL,
    id_proyecto bigint NOT NULL,
    id_cuadrilla bigint NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_termino date
);

CREATE SEQUENCE public.asignaciones_id_asignacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.asignaciones_id_asignacion_seq OWNED BY public.asignaciones.id_asignacion;

CREATE TABLE public.clientes (
    id_cliente bigint NOT NULL,
    rut character varying(20) NOT NULL,
    razon_social character varying(255) NOT NULL,
    nombre character varying(255),
    email character varying(255),
    telefono character varying(50),
    direccion character varying(255),
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);

CREATE SEQUENCE public.clientes_id_cliente_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.clientes_id_cliente_seq OWNED BY public.clientes.id_cliente;

CREATE TABLE public.cuadrillas (
    id_cuadrilla bigint NOT NULL,
    id_supervisor bigint NOT NULL,
    numero_cuadrilla character varying(50) NOT NULL
);

CREATE SEQUENCE public.cuadrillas_id_cuadrilla_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cuadrillas_id_cuadrilla_seq OWNED BY public.cuadrillas.id_cuadrilla;

CREATE TABLE public.departamentos (
    id_departamento bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);

CREATE SEQUENCE public.departamentos_id_departamento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.departamentos_id_departamento_seq OWNED BY public.departamentos.id_departamento;

CREATE TABLE public.evento_trabajador (
    id_evento bigint NOT NULL,
    id_trabajador bigint NOT NULL
);

CREATE TABLE public.eventos (
    id_evento bigint NOT NULL,
    id_tipo_evento bigint NOT NULL,
    id_administrador bigint,
    id_area bigint,
    id_proyecto bigint NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    descripcion text NOT NULL,
    estado character varying(30) DEFAULT 'abierto'::character varying NOT NULL,
    condicion numeric,
    evidencia json,
    referencia character varying(255),
    id_trabajador bigint,
    id_supervisor bigint,
    fecha_cierre timestamp(0) without time zone,
    justificacion text,
    evidencia_cierre json
);

CREATE SEQUENCE public.eventos_id_evento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.eventos_id_evento_seq OWNED BY public.eventos.id_evento;

CREATE TABLE public.evidencias (
    id_evidencia bigint NOT NULL,
    id_evento bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    ruta character varying(500) NOT NULL,
    tipo_archivo character varying(100),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE public.evidencias_id_evidencia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.evidencias_id_evidencia_seq OWNED BY public.evidencias.id_evidencia;

CREATE TABLE public.faenas (
    id_faena bigint NOT NULL,
    codigo_faena character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL
);

CREATE SEQUENCE public.faenas_id_faena_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.faenas_id_faena_seq OWNED BY public.faenas.id_faena;

CREATE TABLE public.hallazgos_intrava (
    id_intrava uuid NOT NULL,
    id_proyecto bigint,
    id_proyecto_intrava bigint,
    id_subproceso_intrava bigint,
    id_responsable_intrava bigint,
    id_segundo_responsable_intrava bigint,
    id_creador_intrava bigint,
    id_administrador_intrava bigint,
    correlativo bigint,
    correlativo_corporativo bigint,
    tipo character varying(150),
    origen character varying(150),
    requisito_incumplido text,
    fecha_creacion date,
    fecha_deteccion date,
    fecha_cierre date,
    estado character varying(255),
    estado_inmediata integer,
    estado_analisis integer,
    estado_correctiva integer,
    estado_recursos integer,
    estado_evidencia integer,
    estado_resultado integer,
    estado_riesgos integer,
    tratamiento_completo integer,
    razon_no_tratamiento text,
    prioridad numeric(12,3),
    url text,
    proyecto jsonb,
    datos jsonb,
    causa_raiz jsonb,
    payload jsonb NOT NULL,
    sincronizado_en timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.informes_investigacion_intrava (
    id_local bigint NOT NULL,
    id_intrava bigint NOT NULL,
    uuid_intrava uuid,
    id_reporte_flash_intrava bigint,
    id_proyecto bigint,
    id_proyecto_intrava bigint,
    proyecto_alias character varying(255),
    general jsonb,
    analisis_causal jsonb DEFAULT '[]'::jsonb NOT NULL,
    causa_raiz text,
    accidentado jsonb,
    payload jsonb NOT NULL,
    sincronizado_en timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.informes_investigacion_intrava_id_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.informes_investigacion_intrava_id_local_seq OWNED BY public.informes_investigacion_intrava.id_local;

CREATE TABLE public.obreros (
    id_trabajador bigint NOT NULL,
    id_tipo_obrero bigint NOT NULL,
    id_cuadrilla bigint
);

CREATE TABLE public.permisos (
    id_permiso bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);

CREATE SEQUENCE public.permisos_id_permiso_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.permisos_id_permiso_seq OWNED BY public.permisos.id_permiso;

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;

CREATE TABLE public.personas (
    id_persona bigint NOT NULL,
    rut character varying(20) NOT NULL,
    nombre_1 character varying(100) NOT NULL,
    nombre_2 character varying(100),
    apellido_1 character varying(100) NOT NULL,
    apellido_2 character varying(100)
);

CREATE SEQUENCE public.personas_id_persona_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.personas_id_persona_seq OWNED BY public.personas.id_persona;

CREATE TABLE public.proyectos (
    id_proyecto bigint NOT NULL,
    id_faena bigint NOT NULL,
    id_cliente bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    ubicacion character varying(255),
    fecha_inicio date,
    fecha_termino date,
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);

CREATE SEQUENCE public.proyectos_id_proyecto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.proyectos_id_proyecto_seq OWNED BY public.proyectos.id_proyecto;

CREATE TABLE public.reportes_flash_intrava (
    id_local bigint NOT NULL,
    id_intrava bigint NOT NULL,
    id_proyecto bigint,
    id_proyecto_intrava bigint,
    proyecto_alias character varying(255),
    area character varying(150),
    fecha date,
    hora time without time zone,
    turno character varying(50),
    clasificacion character varying(150),
    casuistica character varying(150),
    descripcion text,
    reportado_por character varying(255),
    cargo character varying(150),
    hora_reporte time without time zone,
    payload jsonb NOT NULL,
    sincronizado_en timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.reportes_flash_intrava_id_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.reportes_flash_intrava_id_local_seq OWNED BY public.reportes_flash_intrava.id_local;

CREATE TABLE public.reportes_previene_intrava (
    id_local bigint NOT NULL,
    id_intrava bigint NOT NULL,
    id_proyecto bigint,
    id_proyecto_intrava bigint,
    identificador bigint,
    proyecto_alias character varying(255),
    fecha date,
    hora time without time zone,
    area character varying(100),
    descripcion text,
    acciones_inmediatas text,
    urgencia smallint,
    aviso_jefatura character varying(2),
    estado character varying(30),
    evidencias_creacion integer,
    cierre_comentario text,
    cierre_fecha date,
    cierre_hora time without time zone,
    cerrado_por character varying(255),
    evidencias_cierre integer,
    payload jsonb NOT NULL,
    sincronizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reportes_previene_intrava_aviso_jefatura_check CHECK (((aviso_jefatura)::text = ANY ((ARRAY['SI'::character varying, 'NO'::character varying])::text[]))),
    CONSTRAINT reportes_previene_intrava_evidencias_cierre_check CHECK ((evidencias_cierre >= 0)),
    CONSTRAINT reportes_previene_intrava_evidencias_creacion_check CHECK ((evidencias_creacion >= 0)),
    CONSTRAINT reportes_previene_intrava_urgencia_check CHECK (((urgencia >= 1) AND (urgencia <= 5)))
);

CREATE SEQUENCE public.reportes_previene_intrava_id_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.reportes_previene_intrava_id_local_seq OWNED BY public.reportes_previene_intrava.id_local;

CREATE TABLE public.rol_permiso (
    id_rol bigint NOT NULL,
    id_permiso bigint NOT NULL
);

CREATE TABLE public.roles (
    id_rol bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);

CREATE SEQUENCE public.roles_id_rol_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;

CREATE TABLE public.supervisores (
    id_trabajador bigint NOT NULL
);

CREATE TABLE public.tipo_eventos (
    id_tipo_evento bigint NOT NULL,
    nombre character varying(100) NOT NULL
);

CREATE SEQUENCE public.tipo_eventos_id_tipo_evento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.tipo_eventos_id_tipo_evento_seq OWNED BY public.tipo_eventos.id_tipo_evento;

CREATE TABLE public.tipo_obreros (
    id_tipo_obrero bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);

CREATE SEQUENCE public.tipo_obreros_id_tipo_obrero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.tipo_obreros_id_tipo_obrero_seq OWNED BY public.tipo_obreros.id_tipo_obrero;

CREATE TABLE public.trabajador_departamento (
    id_trabajador bigint NOT NULL,
    id_departamento bigint NOT NULL
);

CREATE TABLE public.trabajadores (
    id_trabajador bigint NOT NULL,
    id_persona bigint NOT NULL,
    cargo character varying(100),
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.trabajadores_cuadrillas (
    id_trabajador bigint NOT NULL,
    id_cuadrilla bigint NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_tc_fechas CHECK (((fecha_fin IS NULL) OR (fecha_fin >= fecha_inicio)))
);

CREATE SEQUENCE public.trabajadores_id_trabajador_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.trabajadores_id_trabajador_seq OWNED BY public.trabajadores.id_trabajador;

CREATE TABLE public.users (
    id_user bigint NOT NULL,
    id_trabajador bigint NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp without time zone,
    password character varying(255) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remember_token character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.users_id_user_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_user_seq OWNED BY public.users.id_user;

CREATE TABLE public.usuario_rol (
    id_user bigint NOT NULL,
    id_rol bigint NOT NULL
);

ALTER TABLE ONLY laravel.migrations ALTER COLUMN id SET DEFAULT nextval('laravel.migrations_id_seq'::regclass);

ALTER TABLE ONLY public.actividades ALTER COLUMN id_actividad SET DEFAULT nextval('public.actividades_id_actividad_seq'::regclass);

ALTER TABLE ONLY public.areas ALTER COLUMN id_area SET DEFAULT nextval('public.areas_id_area_seq'::regclass);

ALTER TABLE ONLY public.asignaciones ALTER COLUMN id_asignacion SET DEFAULT nextval('public.asignaciones_id_asignacion_seq'::regclass);

ALTER TABLE ONLY public.clientes ALTER COLUMN id_cliente SET DEFAULT nextval('public.clientes_id_cliente_seq'::regclass);

ALTER TABLE ONLY public.cuadrillas ALTER COLUMN id_cuadrilla SET DEFAULT nextval('public.cuadrillas_id_cuadrilla_seq'::regclass);

ALTER TABLE ONLY public.departamentos ALTER COLUMN id_departamento SET DEFAULT nextval('public.departamentos_id_departamento_seq'::regclass);

ALTER TABLE ONLY public.eventos ALTER COLUMN id_evento SET DEFAULT nextval('public.eventos_id_evento_seq'::regclass);

ALTER TABLE ONLY public.evidencias ALTER COLUMN id_evidencia SET DEFAULT nextval('public.evidencias_id_evidencia_seq'::regclass);

ALTER TABLE ONLY public.faenas ALTER COLUMN id_faena SET DEFAULT nextval('public.faenas_id_faena_seq'::regclass);

ALTER TABLE ONLY public.informes_investigacion_intrava ALTER COLUMN id_local SET DEFAULT nextval('public.informes_investigacion_intrava_id_local_seq'::regclass);

ALTER TABLE ONLY public.permisos ALTER COLUMN id_permiso SET DEFAULT nextval('public.permisos_id_permiso_seq'::regclass);

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);

ALTER TABLE ONLY public.personas ALTER COLUMN id_persona SET DEFAULT nextval('public.personas_id_persona_seq'::regclass);

ALTER TABLE ONLY public.proyectos ALTER COLUMN id_proyecto SET DEFAULT nextval('public.proyectos_id_proyecto_seq'::regclass);

ALTER TABLE ONLY public.reportes_flash_intrava ALTER COLUMN id_local SET DEFAULT nextval('public.reportes_flash_intrava_id_local_seq'::regclass);

ALTER TABLE ONLY public.reportes_previene_intrava ALTER COLUMN id_local SET DEFAULT nextval('public.reportes_previene_intrava_id_local_seq'::regclass);

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);

ALTER TABLE ONLY public.tipo_eventos ALTER COLUMN id_tipo_evento SET DEFAULT nextval('public.tipo_eventos_id_tipo_evento_seq'::regclass);

ALTER TABLE ONLY public.tipo_obreros ALTER COLUMN id_tipo_obrero SET DEFAULT nextval('public.tipo_obreros_id_tipo_obrero_seq'::regclass);

ALTER TABLE ONLY public.trabajadores ALTER COLUMN id_trabajador SET DEFAULT nextval('public.trabajadores_id_trabajador_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id_user SET DEFAULT nextval('public.users_id_user_seq'::regclass);

ALTER TABLE ONLY laravel.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id_actividad);

ALTER TABLE ONLY public.administrativos
    ADD CONSTRAINT administrativos_pkey PRIMARY KEY (id_trabajador);

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id_area);

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_pkey PRIMARY KEY (id_asignacion);

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente);

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_rut_key UNIQUE (rut);

ALTER TABLE ONLY public.cuadrillas
    ADD CONSTRAINT cuadrillas_numero_cuadrilla_key UNIQUE (numero_cuadrilla);

ALTER TABLE ONLY public.cuadrillas
    ADD CONSTRAINT cuadrillas_pkey PRIMARY KEY (id_cuadrilla);

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (id_departamento);

ALTER TABLE ONLY public.evento_trabajador
    ADD CONSTRAINT evento_trabajador_pkey PRIMARY KEY (id_evento, id_trabajador);

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id_evento);

ALTER TABLE ONLY public.evidencias
    ADD CONSTRAINT evidencias_pkey PRIMARY KEY (id_evidencia);

ALTER TABLE ONLY public.faenas
    ADD CONSTRAINT faenas_codigo_faena_key UNIQUE (codigo_faena);

ALTER TABLE ONLY public.faenas
    ADD CONSTRAINT faenas_pkey PRIMARY KEY (id_faena);

ALTER TABLE ONLY public.hallazgos_intrava
    ADD CONSTRAINT hallazgos_intrava_pkey PRIMARY KEY (id_intrava);

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_id_intrava_key UNIQUE (id_intrava);

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_pkey PRIMARY KEY (id_local);

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_uuid_intrava_key UNIQUE (uuid_intrava);

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT obreros_pkey PRIMARY KEY (id_trabajador);

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id_permiso);

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id_persona);

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_rut_key UNIQUE (rut);

ALTER TABLE ONLY public.trabajadores_cuadrillas
    ADD CONSTRAINT pk_trabajadores_cuadrillas PRIMARY KEY (id_trabajador, id_cuadrilla, fecha_inicio);

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id_proyecto);

ALTER TABLE ONLY public.reportes_flash_intrava
    ADD CONSTRAINT reportes_flash_intrava_id_intrava_key UNIQUE (id_intrava);

ALTER TABLE ONLY public.reportes_flash_intrava
    ADD CONSTRAINT reportes_flash_intrava_pkey PRIMARY KEY (id_local);

ALTER TABLE ONLY public.reportes_previene_intrava
    ADD CONSTRAINT reportes_previene_intrava_id_intrava_key UNIQUE (id_intrava);

ALTER TABLE ONLY public.reportes_previene_intrava
    ADD CONSTRAINT reportes_previene_intrava_pkey PRIMARY KEY (id_local);

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_pkey PRIMARY KEY (id_rol, id_permiso);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);

ALTER TABLE ONLY public.supervisores
    ADD CONSTRAINT supervisores_pkey PRIMARY KEY (id_trabajador);

ALTER TABLE ONLY public.tipo_eventos
    ADD CONSTRAINT tipo_eventos_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.tipo_eventos
    ADD CONSTRAINT tipo_eventos_pkey PRIMARY KEY (id_tipo_evento);

ALTER TABLE ONLY public.tipo_obreros
    ADD CONSTRAINT tipo_obreros_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.tipo_obreros
    ADD CONSTRAINT tipo_obreros_pkey PRIMARY KEY (id_tipo_obrero);

ALTER TABLE ONLY public.trabajador_departamento
    ADD CONSTRAINT trabajador_departamento_pkey PRIMARY KEY (id_trabajador, id_departamento);

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT trabajadores_id_persona_key UNIQUE (id_persona);

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT trabajadores_pkey PRIMARY KEY (id_trabajador);

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT uq_area_faena_codigo UNIQUE (id_faena, codigo_area);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_trabajador_key UNIQUE (id_trabajador);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_user);

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT usuario_rol_pkey PRIMARY KEY (id_user, id_rol);

CREATE INDEX idx_actividades_asignacion ON public.actividades USING btree (id_asignacion);

CREATE INDEX idx_areas_faena ON public.areas USING btree (id_faena);

CREATE INDEX idx_asignaciones_administrador ON public.asignaciones USING btree (id_administrador);

CREATE INDEX idx_asignaciones_cuadrilla ON public.asignaciones USING btree (id_cuadrilla);

CREATE INDEX idx_asignaciones_proyecto ON public.asignaciones USING btree (id_proyecto);

CREATE INDEX idx_cuadrillas_supervisor ON public.cuadrillas USING btree (id_supervisor);

CREATE INDEX idx_eventos_administrador ON public.eventos USING btree (id_administrador);

CREATE INDEX idx_eventos_area ON public.eventos USING btree (id_area);

CREATE INDEX idx_eventos_estado ON public.eventos USING btree (estado);

CREATE INDEX idx_eventos_fecha_creacion ON public.eventos USING btree (fecha_creacion);

CREATE INDEX idx_eventos_proyecto ON public.eventos USING btree (id_proyecto);

CREATE INDEX idx_eventos_referencia ON public.eventos USING btree (referencia);

CREATE INDEX idx_eventos_supervisor ON public.eventos USING btree (id_supervisor);

CREATE INDEX idx_eventos_tipo ON public.eventos USING btree (id_tipo_evento);

CREATE INDEX idx_eventos_trabajador ON public.eventos USING btree (id_trabajador);

CREATE INDEX idx_evidencias_evento ON public.evidencias USING btree (id_evento);

CREATE INDEX idx_flash_intrava_proyecto_fecha ON public.reportes_flash_intrava USING btree (id_proyecto_intrava, fecha);

CREATE INDEX idx_hallazgo_intrava_proyecto_fecha ON public.hallazgos_intrava USING btree (id_proyecto_intrava, fecha_creacion);

CREATE INDEX idx_investigacion_intrava_flash ON public.informes_investigacion_intrava USING btree (id_reporte_flash_intrava);

CREATE INDEX idx_investigacion_intrava_proyecto ON public.informes_investigacion_intrava USING btree (id_proyecto_intrava);

CREATE INDEX idx_obreros_cuadrilla ON public.obreros USING btree (id_cuadrilla);

CREATE INDEX idx_obreros_tipo ON public.obreros USING btree (id_tipo_obrero);

CREATE INDEX idx_previene_intrava_proyecto_fecha ON public.reportes_previene_intrava USING btree (id_proyecto_intrava, fecha);

CREATE INDEX idx_proyectos_cliente ON public.proyectos USING btree (id_cliente);

CREATE INDEX idx_proyectos_faena ON public.proyectos USING btree (id_faena);

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT fk_actividad_asignacion FOREIGN KEY (id_asignacion) REFERENCES public.asignaciones(id_asignacion) ON DELETE CASCADE;

ALTER TABLE ONLY public.administrativos
    ADD CONSTRAINT fk_administrativo_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT fk_area_faena FOREIGN KEY (id_faena) REFERENCES public.faenas(id_faena) ON DELETE CASCADE;

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT fk_asignacion_administrador FOREIGN KEY (id_administrador) REFERENCES public.administrativos(id_trabajador) ON DELETE RESTRICT;

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT fk_asignacion_cuadrilla FOREIGN KEY (id_cuadrilla) REFERENCES public.cuadrillas(id_cuadrilla) ON DELETE RESTRICT;

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT fk_asignacion_proyecto FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE;

ALTER TABLE ONLY public.cuadrillas
    ADD CONSTRAINT fk_cuadrilla_supervisor FOREIGN KEY (id_supervisor) REFERENCES public.supervisores(id_trabajador) ON DELETE RESTRICT;

ALTER TABLE ONLY public.evento_trabajador
    ADD CONSTRAINT fk_et_evento FOREIGN KEY (id_evento) REFERENCES public.eventos(id_evento) ON DELETE CASCADE;

ALTER TABLE ONLY public.evento_trabajador
    ADD CONSTRAINT fk_et_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_administrador FOREIGN KEY (id_administrador) REFERENCES public.administrativos(id_trabajador) ON DELETE RESTRICT;

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_area FOREIGN KEY (id_area) REFERENCES public.areas(id_area) ON DELETE RESTRICT;

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_proyecto FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE;

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_tipo FOREIGN KEY (id_tipo_evento) REFERENCES public.tipo_eventos(id_tipo_evento) ON DELETE RESTRICT;

ALTER TABLE ONLY public.evidencias
    ADD CONSTRAINT fk_evidencia_evento FOREIGN KEY (id_evento) REFERENCES public.eventos(id_evento) ON DELETE CASCADE;

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT fk_obrero_cuadrilla FOREIGN KEY (id_cuadrilla) REFERENCES public.cuadrillas(id_cuadrilla) ON DELETE SET NULL;

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT fk_obrero_tipo FOREIGN KEY (id_tipo_obrero) REFERENCES public.tipo_obreros(id_tipo_obrero) ON DELETE RESTRICT;

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT fk_obrero_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_cliente FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE RESTRICT;

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_faena FOREIGN KEY (id_faena) REFERENCES public.faenas(id_faena) ON DELETE RESTRICT;

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso) REFERENCES public.permisos(id_permiso) ON DELETE CASCADE;

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON DELETE CASCADE;

ALTER TABLE ONLY public.supervisores
    ADD CONSTRAINT fk_supervisor_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;

ALTER TABLE ONLY public.trabajadores_cuadrillas
    ADD CONSTRAINT fk_tc_cuadrilla FOREIGN KEY (id_cuadrilla) REFERENCES public.cuadrillas(id_cuadrilla);

ALTER TABLE ONLY public.trabajadores_cuadrillas
    ADD CONSTRAINT fk_tc_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador);

ALTER TABLE ONLY public.trabajador_departamento
    ADD CONSTRAINT fk_td_departamento FOREIGN KEY (id_departamento) REFERENCES public.departamentos(id_departamento) ON DELETE CASCADE;

ALTER TABLE ONLY public.trabajador_departamento
    ADD CONSTRAINT fk_td_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT fk_trabajador_persona FOREIGN KEY (id_persona) REFERENCES public.personas(id_persona) ON DELETE CASCADE;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT fk_usuario_rol_user FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON DELETE CASCADE;

ALTER TABLE ONLY public.hallazgos_intrava
    ADD CONSTRAINT hallazgos_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;

ALTER TABLE ONLY public.reportes_flash_intrava
    ADD CONSTRAINT reportes_flash_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;

ALTER TABLE ONLY public.reportes_previene_intrava
    ADD CONSTRAINT reportes_previene_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;

-- Lo que la aplicacion usa y el dump no traia.
ALTER TABLE public.eventos ADD COLUMN severidad character varying(100);

ALTER TABLE public.proyectos
    ADD COLUMN id_proyecto_intrava bigint,
    ADD COLUMN centro_costo character varying(50),
    ADD COLUMN alias character varying(255),
    ADD COLUMN num_contrato character varying(100),
    ADD CONSTRAINT proyectos_id_proyecto_intrava_unique UNIQUE (id_proyecto_intrava);

CREATE TABLE public.password_reset_tokens (
    email character varying(255) PRIMARY KEY,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);

CREATE TABLE public.situacion_criticas (
    id bigserial PRIMARY KEY,
    id_trabajador bigint NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE,
    id_supervisor bigint REFERENCES public.supervisores(id_trabajador) ON DELETE SET NULL,
    id_evento bigint NOT NULL REFERENCES public.eventos(id_evento) ON DELETE CASCADE,
    referencia character varying(255) NOT NULL,
    condicion smallint NOT NULL
);

-- ======================================================================
-- 2. DATOS BASICOS DE PRUEBA (usuarios y catalogos de AVA_BaseDatos.sql)
-- ======================================================================

INSERT INTO laravel.migrations (id, migration, batch) VALUES
    (1, '2026_09_18_000001_fix_legacy_usuario_ids', 1),
    (2, '2026_09_21_000240_create_clientes_table', 1),
    (3, '2026_09_26_213300_create_personas_table', 1),
    (4, '2026_09_28_222436_create_personal_access_tokens_table', 1),
    (5, '2026_10_28_000001_create_situacion_criticas_table', 1),
    (6, '2026_11_04_000001_normalizar_estado_eventos', 1),
    (7, '2026_11_04_000002_alinear_esquema_base', 1);

INSERT INTO public.personas (id_persona, rut, nombre_1, nombre_2, apellido_1, apellido_2) VALUES
    ('1', '11111111-1', 'Carlos', 'Andres', 'Perez', 'Soto'),
    ('2', '12222222-2', 'Maria', 'Jose', 'Gonzalez', 'Rojas'),
    ('3', '13333333-3', 'Pedro', NULL, 'Muñoz', 'Silva'),
    ('4', '14444444-4', 'Juan', 'Pablo', 'Ramirez', 'Diaz'),
    ('5', '15555555-5', 'Luis', 'Alberto', 'Contreras', 'Vera'),
    ('6', '16666666-6', 'Daniel', NULL, 'Sepulveda', 'Torres');

INSERT INTO public.trabajadores (id_trabajador, id_persona, cargo, estado, fecha_creacion, ultima_actualizacion) VALUES
    ('1', '1', 'Administrador SGI', 'activo', '2026-09-23 19:07:40.327097', '2026-09-23 19:07:40.327097'),
    ('2', '2', 'Supervisor', 'activo', '2026-09-23 19:07:40.327097', '2026-09-23 19:07:40.327097'),
    ('3', '3', 'Electricista', 'activo', '2026-09-23 19:07:40.327097', '2026-09-23 19:07:40.327097'),
    ('4', '4', 'Mecanico', 'activo', '2026-09-23 19:07:40.327097', '2026-09-23 19:07:40.327097'),
    ('5', '5', 'Soldador', 'activo', '2026-09-23 19:07:40.327097', '2026-09-23 19:07:40.327097'),
    ('6', '6', 'Electricista', 'activo', '2026-09-23 19:07:40.327097', '2026-09-23 19:07:40.327097');

INSERT INTO public.administrativos (id_trabajador) VALUES
    ('1');

INSERT INTO public.supervisores (id_trabajador) VALUES
    ('2');

INSERT INTO public.departamentos (id_departamento, nombre, descripcion, estado) VALUES
    ('1', 'Seguridad y Salud Ocupacional', 'Gestion de seguridad y prevencion de riesgos', 'activo'),
    ('2', 'Operaciones', 'Gestion de operaciones en terreno', 'activo');

INSERT INTO public.trabajador_departamento (id_trabajador, id_departamento) VALUES
    ('1', '1'),
    ('2', '2');

INSERT INTO public.roles (id_rol, nombre, descripcion, estado) VALUES
    ('1', 'Administrador', 'Administrador general del sistema', 'activo'),
    ('2', 'Supervisor', 'Supervisor de cuadrillas y eventos', 'activo'),
    ('3', 'Trabajador', 'Usuario trabajador del sistema', 'activo');

INSERT INTO public.permisos (id_permiso, nombre, descripcion) VALUES
    ('1', 'gestionar_usuarios', 'Crear, modificar y desactivar usuarios'),
    ('2', 'gestionar_eventos', 'Crear y modificar eventos'),
    ('3', 'ver_eventos', 'Consultar eventos registrados'),
    ('4', 'gestionar_asignaciones', 'Administrar asignaciones de cuadrillas'),
    ('5', 'ver_reportes', 'Consultar reportes del sistema'),
    ('6', 'gestionar_proyectos', 'Crear y modificar proyectos'),
    ('7', 'proyectos.ver', 'Consultar proyectos registrados'),
    ('8', 'eventos.crear', 'Permite registrar eventos y Tarjetas PARE'),
    ('9', 'eventos.ver', NULL),
    ('10', 'eventos.mis-reportes', NULL),
    ('11', 'eventos.cerrar', NULL);

INSERT INTO public.rol_permiso (id_rol, id_permiso) VALUES
    ('1', '1'),
    ('1', '2'),
    ('1', '3'),
    ('1', '4'),
    ('1', '5'),
    ('1', '6'),
    ('2', '2'),
    ('2', '3'),
    ('2', '4'),
    ('2', '5'),
    ('3', '3'),
    ('1', '7'),
    ('1', '8'),
    ('1', '9'),
    ('1', '10'),
    ('1', '11');

INSERT INTO public.users (id_user, id_trabajador, email, email_verified_at, password, fecha_creacion, remember_token, created_at, updated_at) VALUES
    ('1', '1', 'admin@empresa.cl', NULL, '$2y$12$cBuB1NiuDloDZENw7HlbP.eHhRCpUWIoumNNGkGAp9qIajn5wa1.e', '2026-09-23 19:07:40.327097', NULL, '2026-09-23 19:07:40.327097', '2026-09-23 23:58:20'),
    ('2', '2', 'supervisor@empresa.cl', NULL, '$2y$12$PDManN.w3MwBCnF/kr4POe.d0fiZPSx4Pja3xor/abslAM5OsuHvS', '2026-09-23 19:07:40.327097', NULL, '2026-09-23 19:07:40.327097', '2026-09-24 18:42:21'),
    ('3', '3', 'trabajador@empresa.cl', NULL, '$2y$12$g3HltkQqCn42/Q/c7hczo.wKvSakRxtouoBU9lBCk53.h.m5aBWpm', '2026-09-23 19:07:40.327097', NULL, '2026-09-23 19:07:40.327097', '2026-09-23 19:07:40.327097');

INSERT INTO public.usuario_rol (id_user, id_rol) VALUES
    ('1', '1'),
    ('2', '2'),
    ('3', '3');

INSERT INTO public.tipo_obreros (id_tipo_obrero, nombre, descripcion, estado) VALUES
    ('1', 'Electricista', 'Trabajador especializado en instalaciones electricas', 'activo'),
    ('2', 'Mecanico', 'Trabajador especializado en labores mecanicas', 'activo'),
    ('3', 'Soldador', 'Trabajador especializado en soldadura', 'activo');

INSERT INTO public.clientes (id_cliente, rut, razon_social, nombre, email, telefono, direccion, estado) VALUES
    ('1', '76000001-1', 'Empresa Minera Norte S.A.', 'Minera Norte', 'contacto@mineranorte.cl', '+56911111111', 'Antofagasta, Chile', 'activo'),
    ('2', '76000002-2', 'Industria del Pacifico Ltda.', 'Industria Pacifico', 'contacto@pacifico.cl', '+56922222222', 'Concepcion, Chile', 'activo');

INSERT INTO public.faenas (id_faena, codigo_faena, nombre) VALUES
    ('1', 'FAE-001', 'Faena Minera Norte'),
    ('2', 'FAE-002', 'Planta Industrial Pacifico');

INSERT INTO public.areas (id_area, id_faena, codigo_area, descripcion) VALUES
    ('1', '1', 'ELEC', 'Area electrica'),
    ('2', '1', 'MEC', 'Area mecanica'),
    ('3', '2', 'MANT', 'Area de mantenimiento');

INSERT INTO public.cuadrillas (id_cuadrilla, id_supervisor, numero_cuadrilla) VALUES
    ('1', '2', 'C-001'),
    ('2', '2', 'C-002');

INSERT INTO public.obreros (id_trabajador, id_tipo_obrero, id_cuadrilla) VALUES
    ('3', '1', '1'),
    ('4', '2', '1'),
    ('5', '3', '2'),
    ('6', '1', '2');

INSERT INTO public.tipo_eventos (id_tipo_evento, nombre) VALUES
    ('1', 'Incidente'),
    ('2', 'Hallazgo'),
    ('3', 'No conformidad'),
    ('4', 'Accidente'),
    ('5', 'Observacion preventiva');

INSERT INTO public.tipo_eventos (id_tipo_evento, nombre) VALUES (6, 'Tarjeta PARE');

INSERT INTO public.trabajadores_cuadrillas (id_trabajador, id_cuadrilla, fecha_inicio) VALUES
    (3, 1, '2025-09-01'),
    (4, 1, '2025-09-01'),
    (5, 2, '2025-09-08'),
    (6, 2, '2025-09-08');

INSERT INTO public.proyectos (id_proyecto, id_faena, id_cliente, nombre, descripcion, ubicacion, fecha_inicio, fecha_termino, estado, id_proyecto_intrava, centro_costo, alias, num_contrato) VALUES
    (1, 1, 1, 'Montaje Planta Norte', 'Proyecto de montaje y mantenimiento industrial', 'Antofagasta', '2025-09-01', '2027-03-31', 'activo', 880001, 'CC-0001', 'Planta Norte', 'CT-0001'),
    (2, 2, 2, 'Mantenimiento Planta Pacifico', 'Mantenimiento preventivo y correctivo', 'Concepcion', '2025-09-08', '2027-02-28', 'activo', 880002, 'CC-0002', 'Planta Pacifico', 'CT-0002');

INSERT INTO public.asignaciones (id_asignacion, id_administrador, id_proyecto, id_cuadrilla, fecha_inicio, fecha_termino) VALUES
    (1, 1, 1, 1, '2025-09-01', '2027-03-31'),
    (2, 1, 2, 2, '2025-09-08', '2027-02-28');

INSERT INTO public.actividades (id_actividad, id_asignacion, nombre, descripcion, fecha_inicio, fecha_termino, estado) VALUES
    (1, 1, 'Montaje de estructura', 'Armado y montaje de estructura metálica', '2025-09-01', '2026-06-30', 'completada'),
    (2, 1, 'Tendido eléctrico', 'Canalización y tendido de cables', '2026-03-02', NULL, 'en_progreso'),
    (3, 2, 'Mantención de bombas', 'Mantención preventiva de bombas', '2025-09-08', '2026-08-31', 'completada'),
    (4, 2, 'Reparación de soldaduras', 'Reparación de líneas de proceso', '2026-04-06', NULL, 'en_progreso');

INSERT INTO public.eventos (id_evento, id_tipo_evento, id_administrador, id_area, id_proyecto, fecha_creacion, fecha_actualizacion, descripcion, estado, condicion, referencia, id_trabajador, id_supervisor, fecha_cierre, justificacion, severidad) VALUES
    (1, 2, 1, 1, 1, '2025-09-02 12:30:00', '2025-09-05 12:30:00', 'Extintor con inspección vencida en el sector.', 'cerrado', 1, 'REF-0001', 4, 2, '2025-09-05 12:30:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (2, 3, 1, 2, 1, '2025-09-04 13:00:00', '2025-09-12 13:00:00', 'Procedimiento de bloqueo aplicado sin verificación cruzada.', 'cerrado', 4, 'REF-0002', 4, 2, '2025-09-12 13:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (3, 4, 1, 2, 1, '2025-09-10 10:00:00', '2025-09-30 10:00:00', 'Contusión en hombro por desprendimiento de componente mecánico.', 'cerrado', 8, 'REF-0003', 4, 2, '2025-09-30 10:00:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Crítica'),
    (4, 5, 1, 1, 1, '2025-09-18 12:15:00', '2025-09-27 12:15:00', 'Se sugiere señalizar mejor el tránsito peatonal.', 'cerrado', 4, 'REF-0004', 4, 2, '2025-09-27 12:15:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (5, 6, 1, 2, 1, '2025-09-26 12:45:00', '2025-09-26 12:45:00', 'Se detiene trabajo por ausencia de segregación del área.', 'en_revision', 7, 'REF-0005', 3, 2, NULL, NULL, 'Alta'),
    (6, 1, 1, 1, 1, '2025-09-23 10:00:00', '2025-10-13 10:00:00', 'Derrame contenido de aceite hidráulico en zona de trabajo.', 'cerrado', 5, 'REF-0006', 4, 2, '2025-10-13 10:00:00', 'Se reemplazó el elemento defectuoso.', 'Media'),
    (7, 2, 1, 1, 1, '2025-11-17 08:00:00', '2025-12-03 08:00:00', 'Baranda provisoria sin fijación completa.', 'cerrado', 9, 'REF-0007', 4, 2, '2025-12-03 08:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (8, 3, 1, 2, 1, '2025-11-28 12:00:00', '2025-12-03 12:00:00', 'Registro de charla diaria incompleto.', 'cerrado', 7, 'REF-0008', 3, 2, '2025-12-03 12:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (9, 4, 1, 2, 1, '2025-11-25 09:00:00', '2025-12-05 09:00:00', 'Trabajador sufre corte superficial en mano durante montaje.', 'cerrado', 10, 'REF-0009', 4, 2, '2025-12-05 09:00:00', 'Se reemplazó el elemento defectuoso.', 'Crítica'),
    (10, 5, 1, 2, 1, '2025-12-01 18:45:00', '2025-12-01 18:45:00', 'Se refuerza uso correcto de arnés en altura.', 'abierto', 7, 'REF-0010', 3, 2, NULL, NULL, 'Baja'),
    (11, 6, 1, 1, 1, '2025-12-12 11:15:00', '2026-01-01 11:15:00', 'Se detiene soldadura por falta de vigía de fuego.', 'cerrado', 6, 'REF-0011', 4, 2, '2026-01-01 11:15:00', 'Se reemplazó el elemento defectuoso.', 'Alta'),
    (12, 1, 1, 1, 1, '2025-12-19 15:00:00', '2025-12-27 15:00:00', 'Derrame contenido de aceite hidráulico en zona de trabajo.', 'cerrado', 5, 'REF-0012', 3, 2, '2025-12-27 15:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (13, 2, 1, 1, 1, '2025-12-16 08:45:00', '2025-12-28 08:45:00', 'Se detecta cable eléctrico sin protección adecuada.', 'cerrado', 3, 'REF-0013', 4, 2, '2025-12-28 08:45:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Baja'),
    (14, 3, 1, 2, 1, '2025-12-22 11:45:00', '2026-01-02 11:45:00', 'Permiso de trabajo sin firma del responsable.', 'cerrado', 2, 'REF-0014', 4, 2, '2026-01-02 11:45:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Media'),
    (15, 4, 1, 1, 1, '2026-02-18 09:30:00', '2026-02-18 09:30:00', 'Contusión en hombro por desprendimiento de componente mecánico.', 'en_revision', 1, 'REF-0015', 4, 2, NULL, NULL, 'Alta'),
    (16, 5, 1, 2, 1, '2026-02-17 12:15:00', '2026-03-06 12:15:00', 'Se sugiere señalizar mejor el tránsito peatonal.', 'cerrado', 4, 'REF-0016', 4, 2, '2026-03-06 12:15:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (17, 6, 1, 1, 1, '2026-02-23 07:30:00', '2026-03-08 07:30:00', 'Se detiene izaje por viento sobre el límite permitido.', 'cerrado', 4, 'REF-0017', 4, 2, '2026-03-08 07:30:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (18, 1, 1, 1, 1, '2026-03-04 11:45:00', '2026-03-13 11:45:00', 'Golpe menor a equipo durante maniobra de traslado.', 'cerrado', 3, 'REF-0018', 3, 2, '2026-03-13 11:45:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Media'),
    (19, 2, 1, 2, 1, '2026-03-12 17:00:00', '2026-03-22 17:00:00', 'Se detecta cable eléctrico sin protección adecuada.', 'cerrado', 9, 'REF-0019', 4, 2, '2026-03-22 17:00:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (20, 3, 1, 1, 1, '2026-03-10 15:15:00', '2026-03-10 15:15:00', 'Registro de charla diaria incompleto.', 'abierto', 1, 'REF-0020', 3, 2, NULL, NULL, 'Baja'),
    (21, 4, 1, 2, 1, '2026-03-16 09:30:00', '2026-03-28 09:30:00', 'Trabajador sufre corte superficial en mano durante montaje.', 'cerrado', 6, 'REF-0021', 4, 2, '2026-03-28 09:30:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (22, 5, 1, 2, 1, '2026-05-15 09:00:00', '2026-05-29 09:00:00', 'Trabajadores ordenan el área antes de iniciar.', 'cerrado', 1, 'REF-0022', 3, 2, '2026-05-29 09:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Baja'),
    (23, 6, 1, 2, 1, '2026-05-12 09:45:00', '2026-05-25 09:45:00', 'Se detiene izaje por viento sobre el límite permitido.', 'cerrado', 2, 'REF-0023', 3, 2, '2026-05-25 09:45:00', 'Medida correctiva aplicada y verificada en terreno.', 'Alta'),
    (24, 1, 1, 2, 1, '2026-05-19 11:45:00', '2026-06-06 11:45:00', 'Golpe menor a equipo durante maniobra de traslado.', 'cerrado', 4, 'REF-0024', 3, 2, '2026-06-06 11:45:00', 'Se reemplazó el elemento defectuoso.', 'Media'),
    (25, 2, 1, 2, 1, '2026-05-28 13:45:00', '2026-05-28 13:45:00', 'Se detecta cable eléctrico sin protección adecuada.', 'en_revision', 4, 'REF-0025', 3, 2, NULL, NULL, 'Baja'),
    (26, 3, 1, 1, 1, '2026-06-01 10:00:00', '2026-06-09 10:00:00', 'Registro de charla diaria incompleto.', 'cerrado', 7, 'REF-0026', 3, 2, '2026-06-09 10:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Baja'),
    (27, 4, 1, 1, 1, '2026-06-01 14:30:00', '2026-06-08 14:30:00', 'Contusión en hombro por desprendimiento de componente mecánico.', 'cerrado', 4, 'REF-0027', 3, 2, '2026-06-08 14:30:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Alta'),
    (28, 5, 1, 1, 1, '2026-06-09 11:45:00', '2026-06-20 11:45:00', 'Se refuerza uso correcto de arnés en altura.', 'cerrado', 2, 'REF-0028', 3, 2, '2026-06-20 11:45:00', 'Medida correctiva aplicada y verificada en terreno.', 'Baja'),
    (29, 6, 1, 2, 1, '2026-06-18 13:15:00', '2026-07-08 13:15:00', 'Se detiene soldadura por falta de vigía de fuego.', 'cerrado', 5, 'REF-0029', 4, 2, '2026-07-08 13:15:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Media'),
    (30, 1, 1, 2, 1, '2026-08-14 09:15:00', '2026-08-14 09:15:00', 'Derrame contenido de aceite hidráulico en zona de trabajo.', 'abierto', 9, 'REF-0030', 3, 2, NULL, NULL, 'Alta'),
    (31, 2, 1, 2, 1, '2026-08-18 16:00:00', '2026-08-24 16:00:00', 'Baranda provisoria sin fijación completa.', 'cerrado', 7, 'REF-0031', 4, 2, '2026-08-24 16:00:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Media'),
    (32, 3, 1, 2, 1, '2026-08-24 09:00:00', '2026-09-02 09:00:00', 'Permiso de trabajo sin firma del responsable.', 'cerrado', 8, 'REF-0032', 4, 2, '2026-09-02 09:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Baja'),
    (33, 4, 1, 2, 1, '2026-08-25 14:00:00', '2026-08-30 14:00:00', 'Contusión en hombro por desprendimiento de componente mecánico.', 'cerrado', 10, 'REF-0033', 4, 2, '2026-08-30 14:00:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Alta'),
    (34, 5, 1, 1, 1, '2026-09-01 08:00:00', '2026-09-08 08:00:00', 'Se sugiere señalizar mejor el tránsito peatonal.', 'cerrado', 6, 'REF-0034', 4, 2, '2026-09-08 08:00:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (35, 6, 1, 2, 1, '2026-10-30 16:30:00', '2026-10-30 16:30:00', 'Se detiene izaje por viento sobre el límite permitido.', 'en_revision', 10, 'REF-0035', 3, 2, NULL, NULL, 'Media'),
    (36, 1, 1, 1, 1, '2026-10-28 10:00:00', '2026-10-28 10:00:00', 'Caída de herramienta desde plataforma sin lesionados.', 'abierto', 5, 'REF-0036', 4, 2, NULL, NULL, 'Media'),
    (37, 2, 1, 3, 2, '2025-09-17 12:00:00', '2025-10-06 12:00:00', 'Extintor con inspección vencida en el sector.', 'cerrado', 4, 'REF-0037', 5, 2, '2025-10-06 12:00:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (38, 3, 1, 3, 2, '2025-09-24 12:30:00', '2025-10-04 12:30:00', 'Permiso de trabajo sin firma del responsable.', 'cerrado', 2, 'REF-0038', 6, 2, '2025-10-04 12:30:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Baja'),
    (39, 4, 1, 3, 2, '2025-09-29 16:45:00', '2025-10-05 16:45:00', 'Trabajador sufre corte superficial en mano durante montaje.', 'cerrado', 1, 'REF-0039', 5, 2, '2025-10-05 16:45:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Media'),
    (40, 5, 1, 3, 2, '2025-10-01 07:30:00', '2025-10-01 07:30:00', 'Se sugiere señalizar mejor el tránsito peatonal.', 'abierto', 4, 'REF-0040', 6, 2, NULL, NULL, 'Baja'),
    (41, 6, 1, 3, 2, '2025-10-06 13:30:00', '2025-10-26 13:30:00', 'Se detiene trabajo por ausencia de segregación del área.', 'cerrado', 7, 'REF-0041', 5, 2, '2025-10-26 13:30:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Alta'),
    (42, 1, 1, 3, 2, '2025-10-14 13:15:00', '2025-10-31 13:15:00', 'Derrame contenido de aceite hidráulico en zona de trabajo.', 'cerrado', 10, 'REF-0042', 6, 2, '2025-10-31 13:15:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Baja'),
    (43, 2, 1, 3, 2, '2025-12-11 07:30:00', '2025-12-29 07:30:00', 'Se detecta cable eléctrico sin protección adecuada.', 'cerrado', 9, 'REF-0043', 6, 2, '2025-12-29 07:30:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (44, 3, 1, 3, 2, '2025-12-18 15:45:00', '2026-01-03 15:45:00', 'Procedimiento de bloqueo aplicado sin verificación cruzada.', 'cerrado', 4, 'REF-0044', 5, 2, '2026-01-03 15:45:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (45, 4, 1, 3, 2, '2025-12-23 15:00:00', '2025-12-23 15:00:00', 'Contusión en hombro por desprendimiento de componente mecánico.', 'en_revision', 8, 'REF-0045', 5, 2, NULL, NULL, 'Crítica'),
    (46, 5, 1, 3, 2, '2025-12-22 16:00:00', '2026-01-06 16:00:00', 'Se refuerza uso correcto de arnés en altura.', 'cerrado', 10, 'REF-0046', 6, 2, '2026-01-06 16:00:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Baja'),
    (47, 6, 1, 3, 2, '2025-12-30 12:00:00', '2026-01-18 12:00:00', 'Se detiene izaje por viento sobre el límite permitido.', 'cerrado', 6, 'REF-0047', 5, 2, '2026-01-18 12:00:00', 'Se reemplazó el elemento defectuoso.', 'Alta'),
    (48, 1, 1, 3, 2, '2026-01-09 18:30:00', '2026-01-14 18:30:00', 'Caída de herramienta desde plataforma sin lesionados.', 'cerrado', 1, 'REF-0048', 5, 2, '2026-01-14 18:30:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (49, 2, 1, 3, 2, '2026-03-10 13:15:00', '2026-03-25 13:15:00', 'Baranda provisoria sin fijación completa.', 'cerrado', 2, 'REF-0049', 6, 2, '2026-03-25 13:15:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Baja'),
    (50, 3, 1, 3, 2, '2026-03-17 11:30:00', '2026-03-17 11:30:00', 'Registro de charla diaria incompleto.', 'abierto', 6, 'REF-0050', 6, 2, NULL, NULL, 'Baja'),
    (51, 4, 1, 3, 2, '2026-03-18 08:00:00', '2026-04-07 08:00:00', 'Torcedura de tobillo al descender de andamio.', 'cerrado', 6, 'REF-0051', 5, 2, '2026-04-07 08:00:00', 'Se reemplazó el elemento defectuoso.', 'Media'),
    (52, 5, 1, 3, 2, '2026-03-26 18:30:00', '2026-04-01 18:30:00', 'Se refuerza uso correcto de arnés en altura.', 'cerrado', 1, 'REF-0052', 5, 2, '2026-04-01 18:30:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Baja'),
    (53, 6, 1, 3, 2, '2026-04-02 16:15:00', '2026-04-13 16:15:00', 'Se detiene soldadura por falta de vigía de fuego.', 'cerrado', 7, 'REF-0053', 5, 2, '2026-04-13 16:15:00', 'Se reemplazó el elemento defectuoso.', 'Media'),
    (54, 1, 1, 3, 2, '2026-04-07 08:15:00', '2026-04-23 08:15:00', 'Golpe menor a equipo durante maniobra de traslado.', 'cerrado', 4, 'REF-0054', 5, 2, '2026-04-23 08:15:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (55, 2, 1, 3, 2, '2026-04-06 16:00:00', '2026-04-06 16:00:00', 'Baranda provisoria sin fijación completa.', 'en_revision', 6, 'REF-0055', 6, 2, NULL, NULL, 'Media'),
    (56, 3, 1, 3, 2, '2026-06-01 13:45:00', '2026-06-12 13:45:00', 'Permiso de trabajo sin firma del responsable.', 'cerrado', 10, 'REF-0056', 6, 2, '2026-06-12 13:45:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (57, 4, 1, 3, 2, '2026-06-09 14:00:00', '2026-06-26 14:00:00', 'Contusión en hombro por desprendimiento de componente mecánico.', 'cerrado', 8, 'REF-0057', 5, 2, '2026-06-26 14:00:00', 'Se reemplazó el elemento defectuoso.', 'Media'),
    (58, 5, 1, 3, 2, '2026-06-08 18:00:00', '2026-06-20 18:00:00', 'Se refuerza uso correcto de arnés en altura.', 'cerrado', 3, 'REF-0058', 6, 2, '2026-06-20 18:00:00', 'Se reemplazó el elemento defectuoso.', 'Baja'),
    (59, 6, 1, 3, 2, '2026-06-19 08:30:00', '2026-07-09 08:30:00', 'Se detiene soldadura por falta de vigía de fuego.', 'cerrado', 3, 'REF-0059', 6, 2, '2026-07-09 08:30:00', 'Se reemplazó el elemento defectuoso.', 'Media'),
    (60, 1, 1, 3, 2, '2026-06-26 11:45:00', '2026-06-26 11:45:00', 'Caída de herramienta desde plataforma sin lesionados.', 'abierto', 6, 'REF-0060', 5, 2, NULL, NULL, 'Alta'),
    (61, 2, 1, 3, 2, '2026-07-01 18:30:00', '2026-07-15 18:30:00', 'Se detecta cable eléctrico sin protección adecuada.', 'cerrado', 8, 'REF-0061', 6, 2, '2026-07-15 18:30:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (62, 3, 1, 3, 2, '2026-07-01 08:30:00', '2026-07-19 08:30:00', 'Registro de charla diaria incompleto.', 'cerrado', 1, 'REF-0062', 6, 2, '2026-07-19 08:30:00', 'Medida correctiva aplicada y verificada en terreno.', 'Media'),
    (63, 4, 1, 3, 2, '2026-08-20 12:15:00', '2026-08-29 12:15:00', 'Contusión en hombro por desprendimiento de componente mecánico.', 'cerrado', 3, 'REF-0063', 6, 2, '2026-08-29 12:15:00', 'Medida correctiva aplicada y verificada en terreno.', 'Alta'),
    (64, 5, 1, 3, 2, '2026-08-25 14:15:00', '2026-09-12 14:15:00', 'Trabajadores ordenan el área antes de iniciar.', 'cerrado', 7, 'REF-0064', 6, 2, '2026-09-12 14:15:00', 'Medida correctiva aplicada y verificada en terreno.', 'Baja'),
    (65, 6, 1, 3, 2, '2026-08-31 16:00:00', '2026-08-31 16:00:00', 'Se detiene soldadura por falta de vigía de fuego.', 'en_revision', 2, 'REF-0065', 5, 2, NULL, NULL, 'Media'),
    (66, 1, 1, 3, 2, '2026-09-04 08:45:00', '2026-09-17 08:45:00', 'Derrame contenido de aceite hidráulico en zona de trabajo.', 'cerrado', 2, 'REF-0066', 6, 2, '2026-09-17 08:45:00', 'Medida correctiva aplicada y verificada en terreno.', 'Baja'),
    (67, 2, 1, 3, 2, '2026-09-08 18:45:00', '2026-09-19 18:45:00', 'Extintor con inspección vencida en el sector.', 'cerrado', 5, 'REF-0067', 5, 2, '2026-09-19 18:45:00', 'Se capacitó a la cuadrilla y se actualizó el procedimiento.', 'Media'),
    (68, 3, 1, 3, 2, '2026-10-26 14:45:00', '2026-10-26 14:45:00', 'Registro de charla diaria incompleto.', 'abierto', 9, 'REF-0068', 6, 2, NULL, NULL, 'Media');

INSERT INTO public.evento_trabajador (id_evento, id_trabajador) VALUES
    (1, 4),
    (2, 4),
    (3, 4),
    (4, 4),
    (5, 3),
    (6, 4),
    (7, 4),
    (7, 3),
    (8, 3),
    (9, 4),
    (10, 3),
    (11, 4),
    (12, 3),
    (13, 4),
    (14, 4),
    (14, 3),
    (15, 4),
    (16, 4),
    (17, 4),
    (18, 3),
    (19, 4),
    (20, 3),
    (21, 4),
    (21, 3),
    (22, 3),
    (23, 3),
    (24, 3),
    (25, 3),
    (26, 3),
    (27, 3),
    (28, 3),
    (28, 4),
    (29, 4),
    (30, 3),
    (31, 4),
    (32, 4),
    (33, 4),
    (34, 4),
    (35, 3),
    (35, 4),
    (36, 4),
    (37, 5),
    (38, 6),
    (39, 5),
    (40, 6),
    (41, 5),
    (42, 6),
    (42, 5),
    (43, 6),
    (44, 5),
    (45, 5),
    (46, 6),
    (47, 5),
    (48, 5),
    (49, 6),
    (49, 5),
    (50, 6),
    (51, 5),
    (52, 5),
    (53, 5),
    (54, 5),
    (55, 6),
    (56, 6),
    (56, 5),
    (57, 5),
    (58, 6),
    (59, 6),
    (60, 5),
    (61, 6),
    (62, 6),
    (63, 6),
    (63, 5),
    (64, 6),
    (65, 5),
    (66, 6),
    (67, 5),
    (68, 6);

INSERT INTO public.evidencias (id_evidencia, id_evento, nombre, ruta, tipo_archivo) VALUES
    (1, 1, 'foto_evento_1.jpg', '/evidencias/eventos/1/foto_evento_1.jpg', 'image/jpeg'),
    (2, 2, 'foto_evento_2.jpg', '/evidencias/eventos/2/foto_evento_2.jpg', 'image/jpeg'),
    (3, 3, 'foto_evento_3.jpg', '/evidencias/eventos/3/foto_evento_3.jpg', 'image/jpeg'),
    (4, 4, 'foto_evento_4.jpg', '/evidencias/eventos/4/foto_evento_4.jpg', 'image/jpeg'),
    (5, 5, 'foto_evento_5.jpg', '/evidencias/eventos/5/foto_evento_5.jpg', 'image/jpeg'),
    (6, 6, 'foto_evento_6.jpg', '/evidencias/eventos/6/foto_evento_6.jpg', 'image/jpeg'),
    (7, 7, 'foto_evento_7.jpg', '/evidencias/eventos/7/foto_evento_7.jpg', 'image/jpeg'),
    (8, 8, 'foto_evento_8.jpg', '/evidencias/eventos/8/foto_evento_8.jpg', 'image/jpeg');

INSERT INTO public.situacion_criticas (id, id_trabajador, id_supervisor, id_evento, referencia, condicion) VALUES
    (1, 4, 2, 4, 'REF-0004', 8),
    (2, 4, 2, 11, 'REF-0011', 9);

INSERT INTO public.reportes_previene_intrava (id_local, id_intrava, id_proyecto, id_proyecto_intrava, identificador, proyecto_alias, fecha, hora, area, descripcion, acciones_inmediatas, urgencia, aviso_jefatura, estado, evidencias_creacion, cierre_comentario, cierre_fecha, payload) VALUES
    (1, 990001, 1, 880001, 1001, 'Planta Norte', '2025-11-25', '09:30', 'ELEC', 'Escalera en mal estado retirada del área.', 'Se aisló el área y se avisó a la jefatura.', 2, 'NO', 'cerrado', 1, 'Condición corregida.', '2025-12-02', '{}'),
    (2, 990002, 1, 880001, 1002, 'Planta Norte', '2026-05-19', '09:30', 'ELEC', 'Falta de orden en bodega de materiales.', 'Se aisló el área y se avisó a la jefatura.', 3, 'SI', 'cerrado', 1, 'Condición corregida.', '2026-05-26', '{}'),
    (3, 990003, 1, 880001, 1003, 'Planta Norte', '2026-08-18', '09:30', 'ELEC', 'Conexión eléctrica provisoria sin protección.', 'Se aisló el área y se avisó a la jefatura.', 4, 'SI', 'abierto', 1, NULL, NULL, '{}'),
    (4, 990004, 2, 880002, 1004, 'Planta Pacifico', '2025-12-16', '09:30', 'MANT', 'Piso resbaladizo junto a sala de bombas.', 'Se aisló el área y se avisó a la jefatura.', 2, 'NO', 'cerrado', 1, 'Condición corregida.', '2025-12-23', '{}'),
    (5, 990005, 2, 880002, 1005, 'Planta Pacifico', '2026-06-09', '09:30', 'MANT', 'Herramientas sin inspección mensual.', 'Se aisló el área y se avisó a la jefatura.', 3, 'SI', 'cerrado', 1, 'Condición corregida.', '2026-06-16', '{}'),
    (6, 990006, 2, 880002, 1006, 'Planta Pacifico', '2026-08-25', '09:30', 'MANT', 'Fuga menor de gas en línea de proceso.', 'Se aisló el área y se avisó a la jefatura.', 5, 'SI', 'abierto', 1, NULL, NULL, '{}');

INSERT INTO public.reportes_flash_intrava (id_local, id_intrava, id_proyecto, id_proyecto_intrava, proyecto_alias, area, fecha, hora, turno, clasificacion, descripcion, reportado_por, cargo, payload) VALUES
    (1, 995001, 1, 880001, 'Planta Norte', 'ELEC', '2026-03-03', '11:00', 'Día', 'Incidente', 'Caída de material desde nivel superior sin lesionados.', 'Supervisor de turno', 'Supervisor', '{}'),
    (2, 995002, 1, 880001, 'Planta Norte', 'ELEC', '2026-08-25', '11:00', 'Día', 'Accidente', 'Trabajador con golpe en extremidad superior.', 'Supervisor de turno', 'Supervisor', '{}'),
    (3, 995003, 2, 880002, 'Planta Pacifico', 'MANT', '2026-03-24', '11:00', 'Día', 'Incidente', 'Contacto de maquinaria con estructura fija.', 'Supervisor de turno', 'Supervisor', '{}'),
    (4, 995004, 2, 880002, 'Planta Pacifico', 'MANT', '2026-06-16', '11:00', 'Día', 'Accidente', 'Quemadura leve durante trabajos de soldadura.', 'Supervisor de turno', 'Supervisor', '{}');

INSERT INTO public.informes_investigacion_intrava (id_local, id_intrava, id_reporte_flash_intrava, id_proyecto, id_proyecto_intrava, proyecto_alias, causa_raiz, payload) VALUES
    (1, 996001, 995002, 1, 880001, 'Planta Norte', 'Falta de segregación del área de trabajo.', '{}'),
    (2, 996002, 995004, 2, 880002, 'Planta Pacifico', 'Elemento de protección personal inadecuado.', '{}');

INSERT INTO public.hallazgos_intrava (id_intrava, id_proyecto, id_proyecto_intrava, tipo, origen, fecha_creacion, fecha_deteccion, fecha_cierre, estado, payload) VALUES
    ('00000000-0000-4000-8000-000000000001', 1, 880001, 'Condición insegura', 'Inspección planificada', '2025-12-16', '2025-12-16', '2026-01-06', 'cerrado', '{}'),
    ('00000000-0000-4000-8000-000000000002', 1, 880001, 'Acción insegura', 'Inspección planificada', '2026-05-26', '2026-05-26', '2026-06-16', 'cerrado', '{}'),
    ('00000000-0000-4000-8000-000000000003', 2, 880002, 'Condición insegura', 'Inspección planificada', '2025-12-30', '2025-12-30', '2026-01-20', 'cerrado', '{}'),
    ('00000000-0000-4000-8000-000000000004', 2, 880002, 'Incumplimiento documental', 'Inspección planificada', '2026-06-23', '2026-06-23', '2026-07-14', 'cerrado', '{}');

-- ======================================================================
-- 3. VISTAS DEL MODELO PREDICTIVO
-- ======================================================================

-- Vistas para el modelo predictivo, unidad: proyecto por semana (lunes).
-- PostgreSQL. Crea las vistas y, si faltan, las columnas de eventos que usan.

ALTER TABLE public.eventos
    ADD COLUMN IF NOT EXISTS severidad VARCHAR(100),
    ADD COLUMN IF NOT EXISTS fecha_ocurrencia TIMESTAMP WITHOUT TIME ZONE;

CREATE OR REPLACE VIEW public.v_eventos_unificados AS
SELECT e.id_proyecto,
       COALESCE(e.fecha_ocurrencia, e.fecha_creacion)::date AS fecha,
       lower(regexp_replace(trim(te.nombre), '\s+', '_', 'g')) AS tipo,
       CASE
           WHEN e.severidad ILIKE 'baja%' THEN 1
           WHEN e.severidad ILIKE 'media%' THEN 2
           WHEN e.severidad ILIKE 'alta%' THEN 3
           WHEN e.severidad ILIKE ANY (ARRAY['cr_tic%', 'grave%']) THEN 4
       END AS severidad,
       'eventos'::text AS origen,
       e.id_evento::text AS id_origen
FROM public.eventos e
JOIN public.tipo_eventos te USING (id_tipo_evento)
UNION ALL
SELECT id_proyecto, fecha, 'reporte_previene', urgencia::numeric,
       'reportes_previene_intrava', id_local::text
FROM public.reportes_previene_intrava
WHERE id_proyecto IS NOT NULL AND fecha IS NOT NULL
UNION ALL
SELECT id_proyecto, fecha, 'reporte_flash', NULL,
       'reportes_flash_intrava', id_local::text
FROM public.reportes_flash_intrava
WHERE id_proyecto IS NOT NULL AND fecha IS NOT NULL
UNION ALL
-- El informe hereda la fecha de su Reporte Flash; la de sincronizacion no es una
-- fecha del evento, asi que un informe sin Flash con fecha no entra a la serie.
SELECT i.id_proyecto, f.fecha,
       'informe_investigacion', NULL,
       'informes_investigacion_intrava', i.id_local::text
FROM public.informes_investigacion_intrava i
JOIN public.reportes_flash_intrava f
       ON f.id_intrava = i.id_reporte_flash_intrava
WHERE i.id_proyecto IS NOT NULL AND f.fecha IS NOT NULL
UNION ALL
SELECT id_proyecto, COALESCE(fecha_deteccion, fecha_creacion),
       'hallazgo', NULL, 'hallazgos_intrava', id_intrava::text
FROM public.hallazgos_intrava
WHERE id_proyecto IS NOT NULL
  AND COALESCE(fecha_deteccion, fecha_creacion) IS NOT NULL;

CREATE OR REPLACE VIEW public.v_proyecto_semanas AS
WITH rango AS (
    SELECT p.id_proyecto,
           date_trunc('week', LEAST(
               p.fecha_inicio,
               (SELECT min(u.fecha) FROM public.v_eventos_unificados u
                WHERE u.id_proyecto = p.id_proyecto)
           ))::date AS ini,
           date_trunc('week', LEAST(COALESCE(p.fecha_termino, CURRENT_DATE),
                                    CURRENT_DATE))::date AS fin
    FROM public.proyectos p
)
SELECT r.id_proyecto, s::date AS semana
FROM rango r,
     LATERAL generate_series(r.ini, r.fin, interval '1 week') s
WHERE r.ini IS NOT NULL AND r.ini <= r.fin;

CREATE OR REPLACE VIEW public.v_conteo_semanal_tipo AS
SELECT id_proyecto,
       date_trunc('week', fecha)::date AS semana,
       tipo,
       count(*) AS n,
       max(severidad) AS sev_max
FROM public.v_eventos_unificados
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW public.v_proyecto_semana_contexto AS
SELECT sp.id_proyecto,
       sp.semana,
       count(DISTINCT a.id_cuadrilla) AS n_cuadrillas,
       count(DISTINCT c.id_supervisor) AS n_supervisores,
       count(DISTINCT o.id_trabajador) AS n_obreros,
       count(DISTINCT ac.id_actividad) AS n_actividades
FROM public.v_proyecto_semanas sp
LEFT JOIN public.asignaciones a
       ON a.id_proyecto = sp.id_proyecto
      AND a.fecha_inicio < sp.semana + 7
      AND COALESCE(a.fecha_termino, 'infinity'::date) >= sp.semana
LEFT JOIN public.cuadrillas c ON c.id_cuadrilla = a.id_cuadrilla
LEFT JOIN public.obreros o ON o.id_cuadrilla = a.id_cuadrilla
LEFT JOIN public.actividades ac
       ON ac.id_asignacion = a.id_asignacion
      AND COALESCE(ac.fecha_inicio, sp.semana) < sp.semana + 7
      AND COALESCE(ac.fecha_termino, 'infinity'::date) >= sp.semana
GROUP BY sp.id_proyecto, sp.semana;

CREATE OR REPLACE VIEW public.v_proyecto_estatico AS
SELECT p.id_proyecto,
       p.id_faena,
       p.id_cliente,
       p.fecha_inicio,
       p.fecha_termino,
       (SELECT count(*) FROM public.areas ar WHERE ar.id_faena = p.id_faena)
           AS n_areas_faena
FROM public.proyectos p;

-- ======================================================================
-- 4. AMPLIACION DEL MODELO DE DATOS
-- ======================================================================

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
    ADD COLUMN IF NOT EXISTS severidad VARCHAR(100),
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



-- ======================================================================
-- 5. DATOS DE PRUEBA DE LA AMPLIACION
-- ======================================================================

INSERT INTO public.empresas (id_empresa, rut, razon_social, tipo) VALUES
    (1, '77000001-1', 'AVA Servicios SpA', 'propia'),
    (2, '77000002-2', 'Montajes del Norte Ltda.', 'contratista');

INSERT INTO public.cat_sistema_trabajo (nombre, dias_trabajo, dias_descanso) VALUES
    ('7x7', 7, 7), ('4x3', 4, 3);

INSERT INTO public.cat_categoria_evento (id_categoria_evento, nombre) VALUES
    (1, 'Caída de altura'), (2, 'Contacto eléctrico'), (3, 'Atrapamiento'), (4, 'Golpeado por objeto');

INSERT INTO public.cat_causa (tipo, nombre) VALUES
    ('inmediata', 'Condición insegura'), ('inmediata', 'Acción insegura'),
    ('basica', 'Falta de capacitación'), ('basica', 'Supervisión insuficiente');

INSERT INTO public.cat_parte_cuerpo (nombre) VALUES ('Mano'), ('Pie'), ('Hombro');
INSERT INTO public.cat_tipo_lesion (nombre) VALUES ('Corte'), ('Contusión'), ('Torcedura');
INSERT INTO public.cat_tipo_capacitacion (nombre, vigencia_meses) VALUES ('Trabajo en altura', 24), ('Primeros auxilios', 12);
INSERT INTO public.cat_epp (nombre) VALUES ('Casco'), ('Arnés'), ('Guantes');

UPDATE public.faenas SET altitud_msnm = 2300, latitud = -23.650000, longitud = -70.400000 WHERE id_faena = 1;
UPDATE public.faenas SET altitud_msnm = 10, latitud = -36.820000, longitud = -73.050000 WHERE id_faena = 2;
UPDATE public.trabajadores t SET fecha_ingreso = DATE '2025-08-01', id_empresa = 1 WHERE id_trabajador IN (1, 2);
UPDATE public.trabajadores t SET fecha_ingreso = DATE '2025-08-18', id_empresa = 2 WHERE id_trabajador IN (3, 4, 5, 6);
UPDATE public.cuadrillas SET id_turno = 1, id_sistema_trabajo = 1, id_empresa = 2;

INSERT INTO public.trabajador_cuadrilla (id_trabajador, id_cuadrilla, fecha_inicio)
SELECT id_trabajador, id_cuadrilla, fecha_inicio FROM public.trabajadores_cuadrillas;

-- Completa las columnas nuevas de los eventos de prueba.
UPDATE public.eventos e SET
    fecha_ocurrencia = e.fecha_creacion - (e.id_evento % 4 + 1) * INTERVAL '1 hour',
    tipo_reporte = (ARRAY['autoreporte', 'supervisor', 'prevencionista'])[e.id_evento % 3 + 1],
    id_actividad = CASE WHEN e.id_proyecto = 1 THEN e.id_evento % 2 + 1 ELSE e.id_evento % 2 + 3 END,
    id_turno = 1,
    id_empresa = 2,
    id_potencial_severidad = LEAST(e.id_severidad + 1, 4),
    id_categoria_evento = e.id_evento % 4 + 1;

INSERT INTO public.horas_hombre (id_proyecto, id_cuadrilla, id_empresa, fecha, n_trabajadores, horas_normales, horas_extra, fuente)
SELECT a.id_proyecto, a.id_cuadrilla, 2, s::date, 2,
       160 + (EXTRACT(WEEK FROM s)::int % 5) * 8, EXTRACT(WEEK FROM s)::int % 4 * 4, 'datos de prueba'
FROM public.asignaciones a,
     LATERAL generate_series(a.fecha_inicio, DATE '2026-10-26', INTERVAL '1 week') s;

INSERT INTO public.proyecto_avance_semanal (id_proyecto, semana, avance_fisico_pct, avance_planificado_pct, dias_atraso)
SELECT a.id_proyecto, s::date,
       LEAST(100, ROUND((s::date - a.fecha_inicio) * 100.0 / (a.fecha_termino - a.fecha_inicio) * 0.92, 2)),
       LEAST(100, ROUND((s::date - a.fecha_inicio) * 100.0 / (a.fecha_termino - a.fecha_inicio), 2)),
       (s::date - a.fecha_inicio) / 60
FROM public.asignaciones a,
     LATERAL generate_series(a.fecha_inicio, DATE '2026-10-26', INTERVAL '1 week') s;

INSERT INTO public.clima_diario (id_faena, fecha, temp_max, temp_min, viento_max_kmh, precipitacion_mm, fuente)
SELECT f.id_faena, s::date,
       22 + 6 * SIN(EXTRACT(DOY FROM s) / 58.0), 8 + 5 * SIN(EXTRACT(DOY FROM s) / 58.0),
       15 + EXTRACT(WEEK FROM s)::int % 25, CASE WHEN f.id_faena = 2 THEN EXTRACT(WEEK FROM s)::int % 6 ELSE 0 END, 'datos de prueba'
FROM public.faenas f,
     LATERAL generate_series(DATE '2025-09-01', DATE '2026-10-26', INTERVAL '1 week') s;

INSERT INTO public.proyecto_fase (id_proyecto, id_fase, fecha_inicio, fecha_termino) VALUES
    (1, 1, DATE '2025-09-01', DATE '2025-11-30'), (1, 4, DATE '2025-12-01', NULL),
    (2, 1, DATE '2025-09-08', DATE '2025-10-31'), (2, 3, DATE '2025-11-01', NULL);

INSERT INTO public.intervenciones_prevencion (id_proyecto, id_cuadrilla, id_tipo_intervencion, id_responsable, fecha, duracion_min, n_participantes, descripcion)
SELECT a.id_proyecto, a.id_cuadrilla, EXTRACT(MONTH FROM s)::int % 6 + 1, 2, s::date, 30, 4, 'Actividad de prevención de prueba.'
FROM public.asignaciones a,
     LATERAL generate_series(a.fecha_inicio, DATE '2026-10-26', INTERVAL '1 month') s;

INSERT INTO public.permisos_trabajo (id_proyecto, id_tipo_permiso, id_emisor, fecha_inicio, fecha_termino, estado)
SELECT a.id_proyecto, EXTRACT(MONTH FROM s)::int % 6 + 1, 2, s + INTERVAL '8 hour', s + INTERVAL '18 hour', 'cerrado'
FROM public.asignaciones a,
     LATERAL generate_series(a.fecha_inicio, DATE '2026-10-26', INTERVAL '1 month') s;

INSERT INTO public.riesgos_proyecto (id_riesgo, id_proyecto, id_area, id_categoria_evento, peligro, probabilidad, consecuencia) VALUES
    (1, 1, 1, 2, 'Contacto con energía eléctrica', 3, 4),
    (2, 2, 3, 3, 'Atrapamiento por partes móviles', 2, 4);

INSERT INTO public.controles_riesgo (id_riesgo, descripcion, jerarquia) VALUES
    (1, 'Bloqueo y etiquetado antes de intervenir tableros.', 'administrativo'),
    (2, 'Protecciones fijas en partes móviles.', 'ingenieria');

INSERT INTO public.medidas_correctivas (id_evento, tipo, descripcion, id_responsable, fecha_compromiso, fecha_cierre, estado, eficaz)
SELECT e.id_evento, 'correctiva', 'Medida asociada al evento ' || e.referencia || '.', 2,
       e.fecha_creacion::date + 15, e.fecha_cierre::date, 'cerrada', TRUE
FROM public.eventos e WHERE e.id_evento IN (1, 2, 3, 4);

-- ======================================================================
-- CIERRE
-- ======================================================================

-- Los datos son nuevos: se validan las claves foraneas creadas como NOT VALID.
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT conrelid::regclass AS tabla, conname FROM pg_constraint
             WHERE NOT convalidated AND contype = 'f' LOOP
        EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', r.tabla, r.conname);
    END LOOP;
END $$;

-- Deja cada secuencia despues del ultimo id cargado.
DO $$
DECLARE r record; maximo bigint;
BEGIN
    FOR r IN SELECT table_schema, table_name, column_name
             FROM information_schema.columns
             WHERE table_schema IN ('public', 'laravel') AND column_default LIKE 'nextval(%' LOOP
        EXECUTE format('SELECT max(%I) FROM %I.%I', r.column_name, r.table_schema, r.table_name) INTO maximo;
        PERFORM setval(pg_get_serial_sequence(format('%I.%I', r.table_schema, r.table_name), r.column_name),
                       COALESCE(maximo, 1), maximo IS NOT NULL);
    END LOOP;
END $$;

COMMIT;
