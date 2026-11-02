--
-- PostgreSQL database dump
--

\restrict ngqMcCRHKu6Dv41DbqS0y5kxjufd0KoomAoUsxmBaevvsqzga4Z7hYUWl4W2d1m

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: laravel; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA laravel;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: usuarios; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA usuarios;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: migrations; Type: TABLE; Schema: laravel; Owner: -
--

CREATE TABLE laravel.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: laravel; Owner: -
--

CREATE SEQUENCE laravel.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: laravel; Owner: -
--

ALTER SEQUENCE laravel.migrations_id_seq OWNED BY laravel.migrations.id;


--
-- Name: actividades; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: actividades_id_actividad_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.actividades_id_actividad_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: actividades_id_actividad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.actividades_id_actividad_seq OWNED BY public.actividades.id_actividad;


--
-- Name: administrativos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administrativos (
    id_trabajador bigint NOT NULL
);


--
-- Name: areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.areas (
    id_area bigint NOT NULL,
    id_faena bigint NOT NULL,
    codigo_area character varying(50) NOT NULL,
    descripcion text
);


--
-- Name: areas_id_area_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.areas_id_area_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: areas_id_area_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.areas_id_area_seq OWNED BY public.areas.id_area;


--
-- Name: asignaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asignaciones (
    id_asignacion bigint NOT NULL,
    id_administrador bigint NOT NULL,
    id_proyecto bigint NOT NULL,
    id_cuadrilla bigint NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_termino date
);


--
-- Name: asignaciones_id_asignacion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asignaciones_id_asignacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asignaciones_id_asignacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asignaciones_id_asignacion_seq OWNED BY public.asignaciones.id_asignacion;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clientes_id_cliente_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clientes_id_cliente_seq OWNED BY public.clientes.id_cliente;


--
-- Name: cuadrillas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuadrillas (
    id_cuadrilla bigint NOT NULL,
    id_supervisor bigint NOT NULL,
    numero_cuadrilla character varying(50) NOT NULL
);


--
-- Name: cuadrillas_id_cuadrilla_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuadrillas_id_cuadrilla_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuadrillas_id_cuadrilla_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuadrillas_id_cuadrilla_seq OWNED BY public.cuadrillas.id_cuadrilla;


--
-- Name: departamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departamentos (
    id_departamento bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);


--
-- Name: departamentos_id_departamento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departamentos_id_departamento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departamentos_id_departamento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departamentos_id_departamento_seq OWNED BY public.departamentos.id_departamento;


--
-- Name: evento_trabajador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evento_trabajador (
    id_evento bigint NOT NULL,
    id_trabajador bigint NOT NULL
);


--
-- Name: eventos; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: eventos_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eventos_id_evento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eventos_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eventos_id_evento_seq OWNED BY public.eventos.id_evento;


--
-- Name: evidencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidencias (
    id_evidencia bigint NOT NULL,
    id_evento bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    ruta character varying(500) NOT NULL,
    tipo_archivo character varying(100),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: evidencias_id_evidencia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evidencias_id_evidencia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evidencias_id_evidencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evidencias_id_evidencia_seq OWNED BY public.evidencias.id_evidencia;


--
-- Name: faenas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faenas (
    id_faena bigint NOT NULL,
    codigo_faena character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL
);


--
-- Name: faenas_id_faena_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.faenas_id_faena_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: faenas_id_faena_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.faenas_id_faena_seq OWNED BY public.faenas.id_faena;


--
-- Name: hallazgos_intrava; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: informes_investigacion_intrava; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: informes_investigacion_intrava_id_local_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.informes_investigacion_intrava_id_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: informes_investigacion_intrava_id_local_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.informes_investigacion_intrava_id_local_seq OWNED BY public.informes_investigacion_intrava.id_local;


--
-- Name: obreros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obreros (
    id_trabajador bigint NOT NULL,
    id_tipo_obrero bigint NOT NULL,
    id_cuadrilla bigint
);


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos (
    id_permiso bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);


--
-- Name: permisos_id_permiso_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permisos_id_permiso_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permisos_id_permiso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permisos_id_permiso_seq OWNED BY public.permisos.id_permiso;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personas (
    id_persona bigint NOT NULL,
    rut character varying(20) NOT NULL,
    nombre_1 character varying(100) NOT NULL,
    nombre_2 character varying(100),
    apellido_1 character varying(100) NOT NULL,
    apellido_2 character varying(100)
);


--
-- Name: personas_id_persona_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personas_id_persona_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personas_id_persona_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personas_id_persona_seq OWNED BY public.personas.id_persona;


--
-- Name: proyectos; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: proyectos_id_proyecto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proyectos_id_proyecto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proyectos_id_proyecto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proyectos_id_proyecto_seq OWNED BY public.proyectos.id_proyecto;


--
-- Name: reportes_flash_intrava; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: reportes_flash_intrava_id_local_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reportes_flash_intrava_id_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reportes_flash_intrava_id_local_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reportes_flash_intrava_id_local_seq OWNED BY public.reportes_flash_intrava.id_local;


--
-- Name: reportes_previene_intrava; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: reportes_previene_intrava_id_local_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reportes_previene_intrava_id_local_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reportes_previene_intrava_id_local_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reportes_previene_intrava_id_local_seq OWNED BY public.reportes_previene_intrava.id_local;


--
-- Name: rol_permiso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol_permiso (
    id_rol bigint NOT NULL,
    id_permiso bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id_rol bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_rol_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- Name: supervisores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supervisores (
    id_trabajador bigint NOT NULL
);


--
-- Name: tipo_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_eventos (
    id_tipo_evento bigint NOT NULL,
    nombre character varying(100) NOT NULL
);


--
-- Name: tipo_eventos_id_tipo_evento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipo_eventos_id_tipo_evento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_eventos_id_tipo_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipo_eventos_id_tipo_evento_seq OWNED BY public.tipo_eventos.id_tipo_evento;


--
-- Name: tipo_obreros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_obreros (
    id_tipo_obrero bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL
);


--
-- Name: tipo_obreros_id_tipo_obrero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipo_obreros_id_tipo_obrero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_obreros_id_tipo_obrero_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipo_obreros_id_tipo_obrero_seq OWNED BY public.tipo_obreros.id_tipo_obrero;


--
-- Name: trabajador_departamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajador_departamento (
    id_trabajador bigint NOT NULL,
    id_departamento bigint NOT NULL
);


--
-- Name: trabajadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajadores (
    id_trabajador bigint NOT NULL,
    id_persona bigint NOT NULL,
    cargo character varying(100),
    estado character varying(30) DEFAULT 'activo'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: trabajadores_cuadrillas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trabajadores_cuadrillas (
    id_trabajador bigint NOT NULL,
    id_cuadrilla bigint NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_tc_fechas CHECK (((fecha_fin IS NULL) OR (fecha_fin >= fecha_inicio)))
);


--
-- Name: trabajadores_id_trabajador_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trabajadores_id_trabajador_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trabajadores_id_trabajador_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trabajadores_id_trabajador_seq OWNED BY public.trabajadores.id_trabajador;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: users_id_user_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_user_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_user_seq OWNED BY public.users.id_user;


--
-- Name: usuario_rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_rol (
    id_user bigint NOT NULL,
    id_rol bigint NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: laravel; Owner: -
--

ALTER TABLE ONLY laravel.migrations ALTER COLUMN id SET DEFAULT nextval('laravel.migrations_id_seq'::regclass);


--
-- Name: actividades id_actividad; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades ALTER COLUMN id_actividad SET DEFAULT nextval('public.actividades_id_actividad_seq'::regclass);


--
-- Name: areas id_area; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas ALTER COLUMN id_area SET DEFAULT nextval('public.areas_id_area_seq'::regclass);


--
-- Name: asignaciones id_asignacion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones ALTER COLUMN id_asignacion SET DEFAULT nextval('public.asignaciones_id_asignacion_seq'::regclass);


--
-- Name: clientes id_cliente; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id_cliente SET DEFAULT nextval('public.clientes_id_cliente_seq'::regclass);


--
-- Name: cuadrillas id_cuadrilla; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuadrillas ALTER COLUMN id_cuadrilla SET DEFAULT nextval('public.cuadrillas_id_cuadrilla_seq'::regclass);


--
-- Name: departamentos id_departamento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos ALTER COLUMN id_departamento SET DEFAULT nextval('public.departamentos_id_departamento_seq'::regclass);


--
-- Name: eventos id_evento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos ALTER COLUMN id_evento SET DEFAULT nextval('public.eventos_id_evento_seq'::regclass);


--
-- Name: evidencias id_evidencia; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidencias ALTER COLUMN id_evidencia SET DEFAULT nextval('public.evidencias_id_evidencia_seq'::regclass);


--
-- Name: faenas id_faena; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faenas ALTER COLUMN id_faena SET DEFAULT nextval('public.faenas_id_faena_seq'::regclass);


--
-- Name: informes_investigacion_intrava id_local; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes_investigacion_intrava ALTER COLUMN id_local SET DEFAULT nextval('public.informes_investigacion_intrava_id_local_seq'::regclass);


--
-- Name: permisos id_permiso; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id_permiso SET DEFAULT nextval('public.permisos_id_permiso_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: personas id_persona; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas ALTER COLUMN id_persona SET DEFAULT nextval('public.personas_id_persona_seq'::regclass);


--
-- Name: proyectos id_proyecto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos ALTER COLUMN id_proyecto SET DEFAULT nextval('public.proyectos_id_proyecto_seq'::regclass);


--
-- Name: reportes_flash_intrava id_local; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_flash_intrava ALTER COLUMN id_local SET DEFAULT nextval('public.reportes_flash_intrava_id_local_seq'::regclass);


--
-- Name: reportes_previene_intrava id_local; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_previene_intrava ALTER COLUMN id_local SET DEFAULT nextval('public.reportes_previene_intrava_id_local_seq'::regclass);


--
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- Name: tipo_eventos id_tipo_evento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_eventos ALTER COLUMN id_tipo_evento SET DEFAULT nextval('public.tipo_eventos_id_tipo_evento_seq'::regclass);


--
-- Name: tipo_obreros id_tipo_obrero; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_obreros ALTER COLUMN id_tipo_obrero SET DEFAULT nextval('public.tipo_obreros_id_tipo_obrero_seq'::regclass);


--
-- Name: trabajadores id_trabajador; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores ALTER COLUMN id_trabajador SET DEFAULT nextval('public.trabajadores_id_trabajador_seq'::regclass);


--
-- Name: users id_user; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id_user SET DEFAULT nextval('public.users_id_user_seq'::regclass);


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: laravel; Owner: -
--

COPY laravel.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000001_create_cache_table	1
2	0001_01_01_000002_create_jobs_table	1
3	0001_01_01_000003_create_roles_table	1
4	0001_01_01_000004_create_proyectos_table	1
5	2026_09_07_233333_create_trabajadors_table	1
6	2026_09_07_235320_create_targetas_table	1
7	2026_09_07_235336_create_medidas_table	1
8	2026_09_08_000000_create_users_table	1
9	2026_09_08_024702_create_escala_riesgos_table	1
10	2026_09_08_025454_create_permisos_table	1
11	2026_09_08_025639_create_tipo_trabajadors_table	1
12	2026_09_10_194833_create_usuario_rols_table	1
13	2026_09_10_194905_create_rol_permisos_table	1
14	2026_09_12_233943_create_modelo_tarjeta_pare_table	1
15	2026_09_12_234844_create_tarjeta_pares_table	1
16	2026_09_13_233524_create_telescope_entries_table	1
17	2026_09_16_210734_create_administrativos_table	1
18	2026_09_17_214743_create_eventos_table	1
19	2026_09_17_215431_create_incidentes_table	1
20	2026_09_17_215446_create_fatalidads_table	1
21	2026_09_17_224644_create_obreros_table	1
22	2026_09_17_224733_create_supervisors_table	1
23	2026_09_17_224754_create_cuadrillas_table	1
24	2026_09_28_011843_create_telescope_entries_table	2
25	2026_09_28_222436_create_personal_access_tokens_table	3
\.


--
-- Data for Name: actividades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actividades (id_actividad, id_asignacion, nombre, descripcion, fecha_inicio, fecha_termino, estado, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- Data for Name: administrativos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.administrativos (id_trabajador) FROM stdin;
1
\.


--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.areas (id_area, id_faena, codigo_area, descripcion) FROM stdin;
1	1	ELEC	Area electrica
2	1	MEC	Area mecanica
3	2	MANT	Area de mantenimiento
\.


--
-- Data for Name: asignaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asignaciones (id_asignacion, id_administrador, id_proyecto, id_cuadrilla, fecha_creacion, fecha_inicio, fecha_termino) FROM stdin;
1	1	1	1	2026-09-23 19:07:40.327097	2026-09-15	2026-12-31
2	1	2	2	2026-09-23 19:07:40.327097	2026-10-01	2027-02-28
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id_cliente, rut, razon_social, nombre, email, telefono, direccion, estado) FROM stdin;
1	76000001-1	Empresa Minera Norte S.A.	Minera Norte	contacto@mineranorte.cl	+56911111111	Antofagasta, Chile	activo
2	76000002-2	Industria del Pacifico Ltda.	Industria Pacifico	contacto@pacifico.cl	+56922222222	Concepcion, Chile	activo
\.


--
-- Data for Name: cuadrillas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuadrillas (id_cuadrilla, id_supervisor, numero_cuadrilla) FROM stdin;
1	2	C-001
2	2	C-002
\.


--
-- Data for Name: departamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departamentos (id_departamento, nombre, descripcion, estado) FROM stdin;
1	Seguridad y Salud Ocupacional	Gestion de seguridad y prevencion de riesgos	activo
2	Operaciones	Gestion de operaciones en terreno	activo
\.


--
-- Data for Name: evento_trabajador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evento_trabajador (id_evento, id_trabajador) FROM stdin;
1	3
1	4
2	5
3	6
4	3
5	6
6	5
7	3
8	6
9	3
10	6
11	3
12	5
13	4
14	4
15	5
16	5
17	3
18	3
19	3
20	4
21	6
22	3
23	4
24	3
25	4
26	3
27	6
28	3
29	5
30	5
31	5
32	5
33	3
34	6
35	5
36	4
37	4
38	5
39	6
40	5
41	3
42	4
43	6
44	3
45	5
46	4
47	6
48	6
49	4
50	3
51	5
52	4
53	3
54	4
55	3
56	3
57	5
58	4
59	6
60	3
61	3
62	4
63	6
64	3
65	5
66	6
67	4
68	5
69	4
70	3
71	3
72	4
73	3
74	5
75	4
76	4
77	5
78	3
79	5
80	5
81	3
82	5
83	4
84	3
85	5
86	3
87	4
88	3
89	6
90	6
91	4
92	3
93	4
94	5
95	5
96	3
97	6
98	4
99	5
100	3
101	3
102	3
103	5
104	6
105	6
106	5
107	3
108	3
109	3
110	5
111	5
112	6
113	3
114	3
115	3
116	4
117	6
118	3
119	4
120	6
121	5
122	4
123	5
124	3
125	6
126	4
127	3
128	4
129	6
130	4
131	3
132	6
133	6
134	4
135	3
136	6
137	3
138	4
139	6
140	5
141	4
142	5
143	5
144	5
145	5
146	5
147	6
148	6
149	6
150	3
151	5
152	6
153	6
154	4
155	3
156	3
157	5
158	5
159	4
160	5
161	3
162	6
163	3
164	6
165	6
166	3
167	4
168	3
169	6
170	3
171	3
172	5
173	4
174	6
175	6
176	6
177	6
178	3
179	6
180	3
181	3
182	6
183	5
184	4
185	3
186	4
187	3
188	6
189	6
190	3
191	4
192	3
193	4
194	6
195	6
196	3
197	5
198	6
199	4
200	5
201	6
202	6
203	4
204	3
205	5
206	4
207	6
208	4
209	5
210	4
211	6
212	5
213	3
214	5
215	5
216	3
217	4
218	5
219	6
220	5
221	5
222	4
223	5
224	6
225	3
226	6
227	5
228	3
229	3
230	5
231	4
232	3
233	4
234	3
235	3
236	6
237	4
238	5
239	5
240	5
241	3
242	4
243	5
244	3
245	4
246	3
247	5
248	6
249	3
250	6
251	3
252	4
253	6
254	4
255	5
256	5
257	5
258	3
259	5
260	3
261	4
262	4
263	4
264	4
265	6
266	5
267	5
268	4
269	5
270	3
271	4
272	4
273	6
274	3
275	4
276	4
277	6
278	4
279	3
280	5
281	6
282	4
283	6
284	4
285	3
286	3
287	3
288	6
289	6
290	3
291	6
292	4
293	5
294	3
295	5
296	3
297	3
298	4
299	5
300	3
301	5
302	5
303	4
304	6
305	6
306	6
307	6
308	5
309	5
310	3
311	5
312	4
313	4
314	6
315	3
316	5
317	4
318	5
319	4
320	6
321	6
322	3
323	5
324	5
325	4
326	5
327	3
328	3
329	6
330	4
331	5
332	3
333	6
334	4
335	4
336	4
337	6
338	4
339	5
340	3
341	6
342	4
343	4
344	5
345	4
346	6
347	5
348	4
349	4
350	6
351	4
352	3
353	6
354	3
355	3
356	4
357	6
358	3
359	3
360	4
361	6
362	5
363	5
364	6
365	3
366	5
367	3
368	4
369	4
370	3
371	3
372	5
373	5
374	3
375	6
376	5
377	6
378	6
379	5
380	6
381	3
382	3
383	3
384	6
385	5
386	5
387	3
388	3
389	6
390	4
391	6
392	3
393	5
394	4
395	6
396	4
397	4
398	3
399	5
400	5
401	4
402	3
403	5
404	6
405	6
406	6
407	3
408	5
409	4
410	3
411	3
412	5
413	3
414	6
415	5
416	6
417	5
418	5
419	6
420	3
421	5
422	3
423	6
424	4
425	6
426	5
427	4
428	3
429	6
430	3
431	5
432	3
433	5
434	4
435	4
436	4
437	4
438	6
439	5
440	4
441	3
442	3
443	5
444	3
445	4
446	5
447	6
448	5
449	5
450	6
451	6
452	6
453	5
454	6
455	3
456	3
457	3
458	6
459	4
460	5
461	3
462	4
463	4
464	3
465	3
466	5
467	5
468	4
469	5
470	5
471	5
472	3
473	3
474	6
475	6
476	6
477	5
478	6
479	6
480	3
481	5
482	3
483	5
484	4
485	4
486	3
487	5
488	4
489	3
490	6
491	5
492	6
493	4
494	6
495	4
496	3
497	6
498	3
499	3
500	4
\.


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eventos (id_evento, id_tipo_evento, id_administrador, id_area, id_proyecto, fecha_creacion, fecha_actualizacion, descripcion, estado, condicion, evidencia, referencia, id_trabajador, id_supervisor, fecha_cierre, justificacion, evidencia_cierre) FROM stdin;
1	2	1	1	1	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097	Se detecta cable electrico sin proteccion adecuada.	abierto	\N	\N	\N	\N	\N	\N	\N	\N
2	1	1	2	1	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097	Trabajador reporta desprendimiento de componente mecanico.	en_revision	\N	\N	\N	\N	\N	\N	\N	\N
3	5	1	3	2	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	\N	\N	\N	\N	\N	\N	\N	\N
4	1	1	3	2	2026-09-23 16:40:14.950718	2026-09-27 21:12:47.327242	Se identifica material obstruyendo una via de circulacion.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000001.jpg"}	AUTO-000001	3	2	\N	\N	\N
5	3	1	3	2	2026-02-27 14:56:45.011139	2026-05-27 09:34:56.012948	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000002.jpg"}	AUTO-000002	6	2	\N	\N	\N
6	4	1	3	2	2026-07-17 09:39:46.601865	2026-07-18 12:27:38.242321	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000003.jpg"}	AUTO-000003	5	2	\N	\N	\N
7	1	1	3	2	2026-05-21 22:49:09.763433	2026-06-12 11:05:00.117072	Se observa material almacenado fuera del area autorizada.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000004.jpg"}	AUTO-000004	3	2	2026-06-12 11:05:00	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000004.jpg"}
8	4	1	3	2	2026-01-05 23:09:25.479689	2026-08-28 09:34:40.464807	Se observa trabajador sin equipo de proteccion completo.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000005.jpg"}	AUTO-000005	6	2	2026-08-28 09:34:40	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000005.jpg"}
9	3	1	3	2	2025-11-17 06:53:25.538722	2025-12-28 02:08:47.503863	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000006.jpg"}	AUTO-000006	3	2	2025-12-28 02:08:48	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000006.jpg"}
10	5	1	2	1	2026-06-09 01:10:21.881807	2026-08-14 06:13:11.866782	Se observa oportunidad de mejora en procedimiento de mantenimiento.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000007.jpg"}	AUTO-000007	6	2	\N	\N	\N
11	1	1	3	2	2026-05-13 15:37:59.541026	2026-06-02 00:15:54.913625	Se identifica condicion insegura en instalacion electrica.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000008.jpg"}	AUTO-000008	3	2	\N	\N	\N
12	3	1	3	2	2025-12-19 02:25:30.948356	2026-08-30 09:51:03.818254	Se detecta herramienta en condicion insegura.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000009.jpg"}	AUTO-000009	5	2	\N	\N	\N
13	4	1	2	1	2026-01-26 18:05:43.328523	2026-09-14 20:29:44.487165	Se identifica condicion insegura en instalacion electrica.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000010.jpg"}	AUTO-000010	4	2	\N	\N	\N
14	3	1	1	1	2026-07-04 21:13:18.538688	2026-08-14 09:26:03.720672	Se observa material almacenado fuera del area autorizada.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000011.jpg"}	AUTO-000011	4	2	\N	\N	\N
15	2	1	1	1	2025-12-26 08:37:11.434303	2026-03-20 11:29:11.875482	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000012.jpg"}	AUTO-000012	5	2	2026-03-20 11:29:12	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000012.jpg"}
16	1	1	3	2	2026-06-13 18:09:36.269866	2026-06-22 15:54:05.640272	Se observa trabajador sin equipo de proteccion completo.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000013.jpg"}	AUTO-000013	5	2	2026-06-22 15:54:06	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000013.jpg"}
17	5	1	2	1	2026-05-01 08:55:40.702414	2026-08-04 00:58:00.305736	Se identifica falta de señalizacion preventiva.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000014.jpg"}	AUTO-000014	3	2	\N	\N	\N
18	2	1	3	2	2026-09-05 11:13:11.990799	2026-09-06 16:33:45.023189	Se observa derrame menor en sector de trabajo.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000015.jpg"}	AUTO-000015	3	2	2026-09-06 16:33:45	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000015.jpg"}
19	2	1	1	1	2026-06-06 08:09:52.129297	2026-09-12 15:24:14.909716	Se reporta desprendimiento de componente mecanico.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000016.jpg"}	AUTO-000016	3	2	2026-09-12 15:24:15	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000016.jpg"}
20	3	1	2	1	2026-08-29 21:51:05.558446	2026-09-11 19:51:15.091963	Se identifica falta de señalizacion preventiva.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000017.jpg"}	AUTO-000017	4	2	2026-09-11 19:51:15	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000017.jpg"}
21	5	1	3	2	2026-08-10 03:51:06.211409	2026-09-04 04:57:58.523149	Se observa area de trabajo con orden y limpieza deficientes.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000018.jpg"}	AUTO-000018	6	2	\N	\N	\N
22	3	1	3	2	2026-03-28 01:15:02.462095	2026-08-02 22:07:04.959446	Se detecta herramienta en condicion insegura.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000019.jpg"}	AUTO-000019	3	2	\N	\N	\N
23	3	1	1	1	2025-10-26 17:10:44.02877	2025-12-19 19:15:28.382232	Se detecta herramienta en condicion insegura.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000020.jpg"}	AUTO-000020	4	2	\N	\N	\N
24	1	1	3	2	2026-06-20 05:12:02.876736	2026-09-06 05:25:00.885446	Se observa trabajador sin equipo de proteccion completo.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000021.jpg"}	AUTO-000021	3	2	\N	\N	\N
25	1	1	3	2	2026-08-17 17:37:13.302555	2026-09-08 16:02:40.444574	Se detecta riesgo asociado a trabajo en altura.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000022.jpg"}	AUTO-000022	4	2	2026-09-08 16:02:40	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000022.jpg"}
26	4	1	3	2	2026-03-05 14:48:07.592182	2026-04-05 16:00:33.620509	Se reporta desprendimiento de componente mecanico.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000023.jpg"}	AUTO-000023	3	2	\N	\N	\N
27	2	1	3	2	2026-01-26 18:14:16.251423	2026-09-11 04:43:22.415751	Se identifica material obstruyendo una via de circulacion.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000024.jpg"}	AUTO-000024	6	2	\N	\N	\N
82	2	1	1	1	2025-12-13 07:13:22.487199	2026-01-01 21:02:36.303399	Se detecta cable electrico sin proteccion adecuada.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000079.jpg"}	AUTO-000079	5	2	\N	\N	\N
28	4	1	3	2	2025-12-31 10:50:12.026559	2026-01-29 05:17:48.145902	Se observa trabajador sin equipo de proteccion completo.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000025.jpg"}	AUTO-000025	3	2	2026-01-29 05:17:48	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000025.jpg"}
29	5	1	1	1	2025-11-04 05:08:41.737541	2026-02-26 22:54:33.942226	Se detecta herramienta en condicion insegura.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000026.jpg"}	AUTO-000026	5	2	\N	\N	\N
30	2	1	2	1	2026-09-30 14:26:16.340175	2026-09-30 22:57:43.60678	Se identifica condicion insegura en instalacion electrica.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000027.jpg"}	AUTO-000027	5	2	\N	\N	\N
31	3	1	2	1	2025-10-13 00:17:27.559403	2025-12-21 20:38:29.483132	Se observa material almacenado fuera del area autorizada.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000028.jpg"}	AUTO-000028	5	2	\N	\N	\N
32	1	1	3	2	2026-07-23 13:45:03.517283	2026-08-27 11:40:01.044635	Se observa derrame menor en sector de trabajo.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000029.jpg"}	AUTO-000029	5	2	\N	\N	\N
33	2	1	2	1	2025-12-06 22:56:25.554833	2026-02-23 07:05:34.472759	Se observa material almacenado fuera del area autorizada.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000030.jpg"}	AUTO-000030	3	2	\N	\N	\N
34	4	1	3	2	2026-02-19 00:51:08.409413	2026-05-24 11:02:05.435314	Se observa trabajador sin equipo de proteccion completo.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000031.jpg"}	AUTO-000031	6	2	2026-05-24 11:02:05	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000031.jpg"}
35	1	1	2	1	2025-10-28 14:54:05.205289	2025-11-18 01:57:33.203812	Se reporta uso incorrecto de herramienta manual.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000032.jpg"}	AUTO-000032	5	2	2025-11-18 01:57:33	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000032.jpg"}
36	4	1	3	2	2026-01-29 20:41:43.914216	2026-06-04 15:10:25.631338	Se observa trabajador sin equipo de proteccion completo.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000033.jpg"}	AUTO-000033	4	2	\N	\N	\N
37	3	1	2	1	2026-04-22 16:37:39.310513	2026-06-08 14:24:52.701952	Se reporta uso incorrecto de herramienta manual.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000034.jpg"}	AUTO-000034	4	2	2026-06-08 14:24:53	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000034.jpg"}
38	1	1	1	1	2025-11-11 22:07:16.293384	2026-06-25 02:34:08.041144	Se reporta uso incorrecto de herramienta manual.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000035.jpg"}	AUTO-000035	5	2	\N	\N	\N
39	1	1	3	2	2026-09-07 12:40:24.629523	2026-09-11 16:24:24.740435	Se identifica condicion insegura en instalacion electrica.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000036.jpg"}	AUTO-000036	6	2	\N	\N	\N
40	2	1	1	1	2026-09-09 07:07:07.150151	2026-09-22 03:02:35.221826	Se observa derrame menor en sector de trabajo.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000037.jpg"}	AUTO-000037	5	2	\N	\N	\N
41	4	1	3	2	2026-03-15 20:46:27.038311	2026-04-06 20:41:21.180272	Se identifica falta de señalizacion preventiva.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000038.jpg"}	AUTO-000038	3	2	\N	\N	\N
42	3	1	3	2	2026-09-12 07:56:27.4156	2026-09-22 04:15:44.055989	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000039.jpg"}	AUTO-000039	4	2	2026-09-22 04:15:44	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000039.jpg"}
43	3	1	1	1	2026-03-07 12:10:53.792813	2026-08-03 23:50:17.388584	Se detecta elemento de proteccion deteriorado.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000040.jpg"}	AUTO-000040	6	2	2026-08-03 23:50:17	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000040.jpg"}
44	3	1	3	2	2026-02-16 06:20:47.981573	2026-09-08 10:48:17.475994	Se detecta elemento de proteccion deteriorado.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000041.jpg"}	AUTO-000041	3	2	\N	\N	\N
45	1	1	3	2	2026-06-03 06:43:28.573459	2026-07-14 06:06:03.189008	Se detecta elemento de proteccion deteriorado.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000042.jpg"}	AUTO-000042	5	2	2026-07-14 06:06:03	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000042.jpg"}
46	3	1	2	1	2025-12-01 22:52:23.141271	2026-09-14 18:13:42.807513	Se reporta desprendimiento de componente mecanico.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000043.jpg"}	AUTO-000043	4	2	\N	\N	\N
47	4	1	2	1	2026-07-13 08:55:32.78665	2026-07-31 09:59:51.409822	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000044.jpg"}	AUTO-000044	6	2	2026-07-31 09:59:51	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000044.jpg"}
48	5	1	2	1	2026-05-17 02:20:48.837597	2026-09-18 00:35:36.799778	Se identifica condicion insegura en instalacion electrica.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000045.jpg"}	AUTO-000045	6	2	\N	\N	\N
49	4	1	3	2	2026-06-05 09:28:46.341139	2026-09-24 23:34:06.41624	Se reporta uso incorrecto de herramienta manual.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000046.jpg"}	AUTO-000046	4	2	\N	\N	\N
50	2	1	2	1	2025-12-06 16:36:44.915455	2026-06-30 01:53:06.958759	Se reporta uso incorrecto de herramienta manual.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000047.jpg"}	AUTO-000047	3	2	\N	\N	\N
51	1	1	3	2	2026-07-22 02:19:45.469035	2026-08-13 02:58:53.059908	Se identifica falta de señalizacion preventiva.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000048.jpg"}	AUTO-000048	5	2	\N	\N	\N
52	4	1	3	2	2026-04-06 08:22:15.520052	2026-07-02 02:01:48.284754	Se identifica condicion insegura en instalacion electrica.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000049.jpg"}	AUTO-000049	4	2	\N	\N	\N
53	5	1	3	2	2026-02-19 09:57:41.124236	2026-06-15 04:11:28.686114	Se observa derrame menor en sector de trabajo.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000050.jpg"}	AUTO-000050	3	2	2026-06-15 04:11:29	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000050.jpg"}
83	3	1	2	1	2025-11-03 20:23:15.11271	2026-05-07 21:33:42.52601	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000080.jpg"}	AUTO-000080	4	2	\N	\N	\N
54	2	1	2	1	2025-11-29 08:39:02.116259	2026-09-17 01:34:26.485283	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000051.jpg"}	AUTO-000051	4	2	2026-09-17 01:34:26	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000051.jpg"}
55	5	1	3	2	2026-01-05 09:54:39.992955	2026-05-27 16:19:03.427666	Se detecta herramienta en condicion insegura.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000052.jpg"}	AUTO-000052	3	2	2026-05-27 16:19:03	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000052.jpg"}
56	4	1	1	1	2026-09-24 20:33:10.506352	2026-09-28 10:11:09.913138	Se observa trabajador sin equipo de proteccion completo.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000053.jpg"}	AUTO-000053	3	2	\N	\N	\N
57	3	1	3	2	2025-10-30 23:08:08.936149	2026-08-10 22:43:08.157002	Se observa trabajador sin equipo de proteccion completo.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000054.jpg"}	AUTO-000054	5	2	2026-08-10 22:43:08	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000054.jpg"}
58	3	1	3	2	2025-12-06 16:18:28.078367	2026-08-23 15:53:03.198051	Se detecta equipo sin inspeccion preventiva actualizada.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000055.jpg"}	AUTO-000055	4	2	\N	\N	\N
59	5	1	3	2	2026-03-25 02:17:40.655268	2026-08-23 12:58:40.830298	Se observa derrame menor en sector de trabajo.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000056.jpg"}	AUTO-000056	6	2	\N	\N	\N
60	3	1	1	1	2026-02-12 06:31:06.815674	2026-09-12 23:21:51.776998	Se identifica condicion insegura en instalacion electrica.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000057.jpg"}	AUTO-000057	3	2	2026-09-12 23:21:52	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000057.jpg"}
61	5	1	3	2	2026-04-07 03:21:04.102206	2026-09-13 02:20:38.336813	Se identifica falta de señalizacion preventiva.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000058.jpg"}	AUTO-000058	3	2	2026-09-13 02:20:38	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000058.jpg"}
62	3	1	1	1	2026-03-01 02:34:03.735772	2026-07-01 09:30:06.325838	Se observa derrame menor en sector de trabajo.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000059.jpg"}	AUTO-000059	4	2	2026-07-01 09:30:06	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000059.jpg"}
63	4	1	3	2	2026-09-27 07:32:59.700363	2026-09-28 22:33:28.48781	Se identifica condicion insegura en instalacion electrica.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000060.jpg"}	AUTO-000060	6	2	\N	\N	\N
64	4	1	2	1	2026-03-17 16:12:44.267443	2026-07-04 10:09:37.025158	Se detecta herramienta en condicion insegura.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000061.jpg"}	AUTO-000061	3	2	\N	\N	\N
65	2	1	3	2	2025-10-30 14:53:09.32944	2025-11-07 02:39:17.77143	Se detecta riesgo asociado a trabajo en altura.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000062.jpg"}	AUTO-000062	5	2	\N	\N	\N
66	4	1	2	1	2026-08-30 19:29:16.219289	2026-09-18 11:54:27.01724	Se reporta desprendimiento de componente mecanico.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000063.jpg"}	AUTO-000063	6	2	\N	\N	\N
67	1	1	3	2	2026-07-20 10:18:13.008675	2026-08-07 07:42:27.79891	Se detecta herramienta en condicion insegura.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000064.jpg"}	AUTO-000064	4	2	\N	\N	\N
68	3	1	3	2	2026-08-22 04:05:06.15506	2026-09-12 19:07:27.272897	Se detecta cable electrico sin proteccion adecuada.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000065.jpg"}	AUTO-000065	5	2	\N	\N	\N
69	2	1	2	1	2025-12-07 17:55:27.211503	2026-05-13 14:39:21.652902	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000066.jpg"}	AUTO-000066	4	2	\N	\N	\N
70	4	1	2	1	2026-09-25 07:46:17.311921	2026-09-26 19:15:27.334011	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000067.jpg"}	AUTO-000067	3	2	2026-09-26 19:15:27	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000067.jpg"}
71	1	1	1	1	2025-10-10 04:25:10.839755	2025-12-08 14:57:25.952822	Se identifica falta de señalizacion preventiva.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000068.jpg"}	AUTO-000068	3	2	\N	\N	\N
72	4	1	3	2	2026-02-03 08:31:39.354177	2026-05-25 22:37:29.75358	Se reporta desprendimiento de componente mecanico.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000069.jpg"}	AUTO-000069	4	2	\N	\N	\N
73	1	1	3	2	2026-03-04 04:31:15.710191	2026-08-15 00:38:21.686456	Se observa material almacenado fuera del area autorizada.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000070.jpg"}	AUTO-000070	3	2	\N	\N	\N
74	2	1	1	1	2026-02-08 10:11:57.547444	2026-06-10 06:33:58.492021	Se observa trabajador sin equipo de proteccion completo.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000071.jpg"}	AUTO-000071	5	2	\N	\N	\N
75	1	1	3	2	2026-05-08 23:16:08.732051	2026-05-26 05:51:47.56408	Se identifica falta de señalizacion preventiva.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000072.jpg"}	AUTO-000072	4	2	\N	\N	\N
76	4	1	3	2	2026-03-10 06:27:20.529178	2026-07-17 16:42:51.569483	Se observa derrame menor en sector de trabajo.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000073.jpg"}	AUTO-000073	4	2	\N	\N	\N
77	4	1	3	2	2026-03-03 06:21:55.912913	2026-05-13 03:34:05.774371	Se observa material almacenado fuera del area autorizada.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000074.jpg"}	AUTO-000074	5	2	\N	\N	\N
78	2	1	2	1	2026-01-11 09:47:22.609456	2026-06-14 23:35:59.929479	Se observa derrame menor en sector de trabajo.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000075.jpg"}	AUTO-000075	3	2	\N	\N	\N
79	4	1	3	2	2026-09-26 13:29:08.621366	2026-09-29 21:13:55.260979	Se identifica falta de señalizacion preventiva.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000076.jpg"}	AUTO-000076	5	2	\N	\N	\N
80	3	1	2	1	2026-05-24 00:34:37.037651	2026-06-07 16:49:38.753154	Se observa trabajador sin equipo de proteccion completo.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000077.jpg"}	AUTO-000077	5	2	\N	\N	\N
81	4	1	3	2	2026-04-21 16:41:28.774492	2026-08-31 17:42:08.791823	Se observa derrame menor en sector de trabajo.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000078.jpg"}	AUTO-000078	3	2	\N	\N	\N
84	1	1	1	1	2026-08-25 13:30:36.882996	2026-09-06 04:15:29.484393	Se identifica material obstruyendo una via de circulacion.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000081.jpg"}	AUTO-000081	3	2	\N	\N	\N
85	5	1	3	2	2026-05-11 11:39:05.496464	2026-07-05 23:47:18.702061	Se reporta desprendimiento de componente mecanico.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000082.jpg"}	AUTO-000082	5	2	\N	\N	\N
86	3	1	3	2	2025-12-09 09:55:43.158077	2026-01-07 01:51:29.643989	Se reporta uso incorrecto de herramienta manual.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000083.jpg"}	AUTO-000083	3	2	\N	\N	\N
87	1	1	1	1	2025-10-07 02:36:24.580161	2026-08-15 15:28:02.086437	Se observa trabajador sin equipo de proteccion completo.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000084.jpg"}	AUTO-000084	4	2	2026-08-15 15:28:02	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000084.jpg"}
88	2	1	1	1	2026-02-12 14:03:51.265433	2026-09-20 02:52:08.158685	Se detecta riesgo asociado a trabajo en altura.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000085.jpg"}	AUTO-000085	3	2	\N	\N	\N
89	1	1	2	1	2026-09-09 23:49:49.057879	2026-09-12 20:01:14.878574	Se detecta elemento de proteccion deteriorado.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000086.jpg"}	AUTO-000086	6	2	2026-09-12 20:01:15	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000086.jpg"}
90	5	1	3	2	2026-02-19 18:14:30.194058	2026-07-19 03:35:28.559509	Se detecta herramienta en condicion insegura.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000087.jpg"}	AUTO-000087	6	2	2026-07-19 03:35:29	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000087.jpg"}
91	1	1	1	1	2026-03-30 20:47:56.995683	2026-06-15 01:27:43.036692	Se detecta cable electrico sin proteccion adecuada.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000088.jpg"}	AUTO-000088	4	2	2026-06-15 01:27:43	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000088.jpg"}
92	1	1	3	2	2026-06-01 01:32:37.330415	2026-10-01 15:46:33.771482	Se observa area de trabajo con orden y limpieza deficientes.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000089.jpg"}	AUTO-000089	3	2	\N	\N	\N
93	4	1	3	2	2026-07-22 15:23:57.654692	2026-09-30 05:19:41.514959	Se reporta desprendimiento de componente mecanico.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000090.jpg"}	AUTO-000090	4	2	\N	\N	\N
94	1	1	2	1	2026-01-15 06:40:08.242629	2026-07-24 00:16:12.621915	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000091.jpg"}	AUTO-000091	5	2	2026-07-24 00:16:13	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000091.jpg"}
95	2	1	3	2	2026-07-16 22:56:39.950566	2026-07-29 04:37:26.188111	Se detecta riesgo asociado a trabajo en altura.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000092.jpg"}	AUTO-000092	5	2	\N	\N	\N
96	4	1	3	2	2025-12-20 00:19:40.106442	2026-05-25 16:56:20.645538	Se identifica material obstruyendo una via de circulacion.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000093.jpg"}	AUTO-000093	3	2	\N	\N	\N
97	1	1	1	1	2026-09-07 16:35:34.911023	2026-09-11 04:24:50.401216	Se identifica material obstruyendo una via de circulacion.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000094.jpg"}	AUTO-000094	6	2	\N	\N	\N
98	1	1	3	2	2025-10-08 10:34:02.991256	2026-03-07 11:08:58.303927	Se observa material almacenado fuera del area autorizada.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000095.jpg"}	AUTO-000095	4	2	\N	\N	\N
99	4	1	3	2	2026-08-31 16:09:24.263928	2026-09-10 14:13:57.904404	Se identifica falta de señalizacion preventiva.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000096.jpg"}	AUTO-000096	5	2	\N	\N	\N
100	3	1	3	2	2026-02-13 01:04:34.793065	2026-08-11 00:54:45.508654	Se identifica falta de señalizacion preventiva.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000097.jpg"}	AUTO-000097	3	2	\N	\N	\N
101	4	1	3	2	2025-10-18 00:11:16.556842	2026-08-31 16:19:02.940419	Se observa area de trabajo con orden y limpieza deficientes.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000098.jpg"}	AUTO-000098	3	2	\N	\N	\N
102	1	1	1	1	2025-10-26 07:22:41.440805	2025-12-07 06:39:41.531303	Se identifica condicion insegura en instalacion electrica.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000099.jpg"}	AUTO-000099	3	2	\N	\N	\N
103	4	1	3	2	2026-02-12 07:12:46.544556	2026-05-02 01:11:26.948037	Se identifica condicion insegura en instalacion electrica.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000100.jpg"}	AUTO-000100	5	2	\N	\N	\N
104	4	1	2	1	2026-09-28 15:54:53.60735	2026-09-28 20:39:49.820856	Se detecta cable electrico sin proteccion adecuada.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000101.jpg"}	AUTO-000101	6	2	\N	\N	\N
105	1	1	3	2	2026-03-15 13:56:58.006741	2026-07-02 06:56:16.792626	Se observa oportunidad de mejora en procedimiento de mantenimiento.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000102.jpg"}	AUTO-000102	6	2	\N	\N	\N
106	2	1	3	2	2025-11-12 23:50:38.142543	2026-05-02 06:41:58.528472	Se reporta desprendimiento de componente mecanico.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000103.jpg"}	AUTO-000103	5	2	\N	\N	\N
107	5	1	1	1	2026-05-01 06:22:15.60761	2026-05-23 17:19:14.827218	Se reporta uso incorrecto de herramienta manual.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000104.jpg"}	AUTO-000104	3	2	2026-05-23 17:19:15	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000104.jpg"}
108	4	1	3	2	2026-04-27 19:02:56.349956	2026-09-09 18:32:12.055814	Se identifica material obstruyendo una via de circulacion.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000105.jpg"}	AUTO-000105	3	2	\N	\N	\N
109	3	1	3	2	2025-12-29 11:02:43.695003	2026-02-02 00:11:16.044953	Se reporta desprendimiento de componente mecanico.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000106.jpg"}	AUTO-000106	3	2	\N	\N	\N
110	3	1	2	1	2026-01-05 09:45:05.31629	2026-04-27 08:59:56.662455	Se detecta elemento de proteccion deteriorado.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000107.jpg"}	AUTO-000107	5	2	\N	\N	\N
111	4	1	2	1	2026-01-21 03:47:09.432239	2026-07-10 04:23:15.355738	Se detecta herramienta en condicion insegura.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000108.jpg"}	AUTO-000108	5	2	\N	\N	\N
112	2	1	2	1	2026-08-29 16:02:31.7833	2026-09-21 00:38:52.118177	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000109.jpg"}	AUTO-000109	6	2	\N	\N	\N
113	5	1	1	1	2025-10-16 05:10:34.090975	2026-01-04 17:26:30.131491	Se detecta herramienta en condicion insegura.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000110.jpg"}	AUTO-000110	3	2	\N	\N	\N
114	1	1	2	1	2025-11-21 20:08:56.031233	2026-02-19 08:41:58.812193	Se reporta uso incorrecto de herramienta manual.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000111.jpg"}	AUTO-000111	3	2	\N	\N	\N
115	3	1	3	2	2026-04-16 23:32:27.870158	2026-09-12 06:56:48.337696	Se detecta herramienta en condicion insegura.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000112.jpg"}	AUTO-000112	3	2	2026-09-12 06:56:48	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000112.jpg"}
116	2	1	2	1	2026-08-04 17:59:14.518503	2026-09-06 09:57:51.6528	Se detecta elemento de proteccion deteriorado.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000113.jpg"}	AUTO-000113	4	2	2026-09-06 09:57:52	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000113.jpg"}
117	3	1	3	2	2026-03-23 14:18:27.944702	2026-05-04 22:14:05.418443	Se identifica falta de señalizacion preventiva.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000114.jpg"}	AUTO-000114	6	2	2026-05-04 22:14:05	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000114.jpg"}
118	4	1	3	2	2025-12-29 08:17:39.061498	2026-02-28 07:58:27.793512	Se identifica falta de señalizacion preventiva.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000115.jpg"}	AUTO-000115	3	2	\N	\N	\N
119	1	1	2	1	2026-02-05 05:00:09.36384	2026-08-24 01:12:37.598861	Se detecta herramienta en condicion insegura.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000116.jpg"}	AUTO-000116	4	2	\N	\N	\N
120	5	1	3	2	2026-02-15 10:06:27.640647	2026-07-14 15:43:24.797443	Se observa trabajador sin equipo de proteccion completo.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000117.jpg"}	AUTO-000117	6	2	\N	\N	\N
121	5	1	1	1	2026-06-04 05:48:28.715181	2026-09-28 16:24:31.188408	Se identifica condicion insegura en instalacion electrica.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000118.jpg"}	AUTO-000118	5	2	\N	\N	\N
122	1	1	3	2	2026-01-30 02:04:04.140166	2026-04-14 16:31:38.17983	Se identifica condicion insegura en instalacion electrica.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000119.jpg"}	AUTO-000119	4	2	2026-04-14 16:31:38	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000119.jpg"}
123	2	1	3	2	2025-11-20 12:15:31.391101	2026-05-09 01:10:53.305221	Se detecta herramienta en condicion insegura.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000120.jpg"}	AUTO-000120	5	2	\N	\N	\N
124	1	1	1	1	2026-03-05 20:56:42.7183	2026-04-29 03:05:01.763727	Se observa material almacenado fuera del area autorizada.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000121.jpg"}	AUTO-000121	3	2	\N	\N	\N
125	3	1	3	2	2026-06-08 18:45:47.541116	2026-07-18 12:44:17.043319	Se identifica falta de señalizacion preventiva.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000122.jpg"}	AUTO-000122	6	2	\N	\N	\N
126	3	1	3	2	2026-03-09 07:44:41.11328	2026-09-21 15:17:55.854813	Se detecta riesgo asociado a trabajo en altura.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000123.jpg"}	AUTO-000123	4	2	\N	\N	\N
127	2	1	2	1	2026-05-18 01:42:50.053177	2026-05-28 19:37:02.99561	Se reporta desprendimiento de componente mecanico.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000124.jpg"}	AUTO-000124	3	2	2026-05-28 19:37:03	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000124.jpg"}
128	5	1	3	2	2026-08-28 20:01:43.830757	2026-09-18 21:57:27.59154	Se detecta elemento de proteccion deteriorado.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000125.jpg"}	AUTO-000125	4	2	2026-09-18 21:57:28	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000125.jpg"}
129	4	1	2	1	2025-12-02 17:52:11.73856	2026-08-02 22:58:10.998848	Se detecta elemento de proteccion deteriorado.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000126.jpg"}	AUTO-000126	6	2	\N	\N	\N
130	1	1	3	2	2026-07-08 03:26:58.902053	2026-08-08 04:39:32.31087	Se observa trabajador sin equipo de proteccion completo.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000127.jpg"}	AUTO-000127	4	2	\N	\N	\N
131	1	1	3	2	2026-02-13 00:06:27.323275	2026-08-24 12:22:25.333363	Se detecta elemento de proteccion deteriorado.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000128.jpg"}	AUTO-000128	3	2	\N	\N	\N
132	1	1	3	2	2026-03-30 04:45:09.834343	2026-04-30 15:51:28.106516	Se detecta riesgo asociado a trabajo en altura.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000129.jpg"}	AUTO-000129	6	2	2026-04-30 15:51:28	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000129.jpg"}
133	2	1	1	1	2026-04-11 22:43:35.627596	2026-09-12 14:59:20.161938	Se observa derrame menor en sector de trabajo.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000130.jpg"}	AUTO-000130	6	2	\N	\N	\N
134	3	1	3	2	2026-04-17 13:36:34.184044	2026-05-15 21:01:23.412222	Se reporta uso incorrecto de herramienta manual.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000131.jpg"}	AUTO-000131	4	2	\N	\N	\N
135	5	1	2	1	2025-10-15 10:48:33.802889	2026-07-29 17:39:51.369873	Se observa derrame menor en sector de trabajo.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000132.jpg"}	AUTO-000132	3	2	\N	\N	\N
136	2	1	3	2	2026-01-10 00:08:46.192149	2026-01-25 12:43:18.297148	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000133.jpg"}	AUTO-000133	6	2	\N	\N	\N
137	4	1	3	2	2026-01-05 08:51:06.606764	2026-09-10 10:25:10.108721	Se detecta equipo sin inspeccion preventiva actualizada.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000134.jpg"}	AUTO-000134	3	2	\N	\N	\N
138	2	1	2	1	2026-05-13 01:14:09.988369	2026-07-03 04:45:37.399108	Se identifica condicion insegura en instalacion electrica.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000135.jpg"}	AUTO-000135	4	2	2026-07-03 04:45:37	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000135.jpg"}
139	4	1	3	2	2025-12-01 07:55:05.990085	2025-12-11 19:51:26.493551	Se detecta cable electrico sin proteccion adecuada.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000136.jpg"}	AUTO-000136	6	2	\N	\N	\N
140	3	1	2	1	2026-03-27 23:01:29.180883	2026-04-20 04:35:15.647977	Se detecta herramienta en condicion insegura.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000137.jpg"}	AUTO-000137	5	2	\N	\N	\N
141	5	1	3	2	2026-01-23 11:27:55.415216	2026-02-27 14:24:33.116589	Se detecta riesgo asociado a trabajo en altura.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000138.jpg"}	AUTO-000138	4	2	\N	\N	\N
142	5	1	2	1	2025-12-16 04:06:23.685442	2026-03-31 08:28:40.863334	Se detecta cable electrico sin proteccion adecuada.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000139.jpg"}	AUTO-000139	5	2	\N	\N	\N
143	2	1	3	2	2025-11-10 09:10:53.585387	2026-08-09 09:52:34.488529	Se detecta cable electrico sin proteccion adecuada.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000140.jpg"}	AUTO-000140	5	2	\N	\N	\N
144	5	1	3	2	2026-07-27 17:36:11.540018	2026-09-17 15:00:36.397505	Se detecta riesgo asociado a trabajo en altura.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000141.jpg"}	AUTO-000141	5	2	\N	\N	\N
145	4	1	1	1	2026-03-07 15:33:52.821567	2026-06-25 20:48:45.913613	Se observa material almacenado fuera del area autorizada.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000142.jpg"}	AUTO-000142	5	2	\N	\N	\N
146	3	1	3	2	2025-12-05 11:36:36.925437	2026-06-24 02:32:35.928	Se detecta riesgo asociado a trabajo en altura.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000143.jpg"}	AUTO-000143	5	2	\N	\N	\N
147	5	1	1	1	2025-12-15 15:34:18.297917	2026-02-25 14:57:34.294226	Se detecta herramienta en condicion insegura.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000144.jpg"}	AUTO-000144	6	2	\N	\N	\N
148	2	1	3	2	2026-02-24 01:08:57.467134	2026-04-26 03:56:43.4058	Se observa derrame menor en sector de trabajo.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000145.jpg"}	AUTO-000145	6	2	2026-04-26 03:56:43	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000145.jpg"}
149	5	1	1	1	2026-06-28 00:23:31.687363	2026-08-11 11:46:59.157689	Se identifica material obstruyendo una via de circulacion.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000146.jpg"}	AUTO-000146	6	2	\N	\N	\N
150	3	1	1	1	2026-09-29 16:44:47.563036	2026-09-29 22:49:27.47394	Se detecta herramienta en condicion insegura.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000147.jpg"}	AUTO-000147	3	2	2026-09-29 22:49:27	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000147.jpg"}
151	1	1	3	2	2026-08-24 05:37:05.497632	2026-09-26 15:37:27.176282	Se observa area de trabajo con orden y limpieza deficientes.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000148.jpg"}	AUTO-000148	5	2	\N	\N	\N
152	2	1	3	2	2026-04-28 20:19:44.65767	2026-07-15 09:29:46.106663	Se detecta riesgo asociado a trabajo en altura.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000149.jpg"}	AUTO-000149	6	2	\N	\N	\N
153	2	1	3	2	2026-05-23 02:26:05.068189	2026-09-16 08:11:13.500421	Se identifica condicion insegura en instalacion electrica.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000150.jpg"}	AUTO-000150	6	2	\N	\N	\N
154	5	1	1	1	2026-04-16 13:54:57.951533	2026-07-19 00:08:44.908647	Se observa area de trabajo con orden y limpieza deficientes.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000151.jpg"}	AUTO-000151	4	2	\N	\N	\N
155	1	1	3	2	2026-08-06 23:34:23.405426	2026-10-01 16:12:32.211795	Se detecta herramienta en condicion insegura.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000152.jpg"}	AUTO-000152	3	2	\N	\N	\N
156	4	1	3	2	2025-11-27 11:23:55.931876	2026-04-29 11:49:42.796621	Se detecta elemento de proteccion deteriorado.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000153.jpg"}	AUTO-000153	3	2	2026-04-29 11:49:43	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000153.jpg"}
157	1	1	2	1	2026-01-03 05:41:59.394054	2026-03-05 00:27:05.083828	Se detecta cable electrico sin proteccion adecuada.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000154.jpg"}	AUTO-000154	5	2	2026-03-05 00:27:05	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000154.jpg"}
158	5	1	3	2	2026-05-02 16:44:03.600996	2026-08-25 16:38:33.855421	Se observa material almacenado fuera del area autorizada.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000155.jpg"}	AUTO-000155	5	2	2026-08-25 16:38:34	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000155.jpg"}
159	2	1	3	2	2026-04-14 06:03:33.147004	2026-07-22 19:50:33.364648	Se identifica material obstruyendo una via de circulacion.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000156.jpg"}	AUTO-000156	4	2	\N	\N	\N
160	1	1	2	1	2026-09-19 23:04:48.501328	2026-09-20 01:25:19.604987	Se reporta uso incorrecto de herramienta manual.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000157.jpg"}	AUTO-000157	5	2	\N	\N	\N
161	1	1	2	1	2025-11-06 10:08:53.839255	2026-05-06 11:38:21.45529	Se observa trabajador sin equipo de proteccion completo.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000158.jpg"}	AUTO-000158	3	2	\N	\N	\N
162	5	1	1	1	2026-03-04 08:21:34.971982	2026-09-11 06:59:44.243372	Se detecta riesgo asociado a trabajo en altura.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000159.jpg"}	AUTO-000159	6	2	\N	\N	\N
163	5	1	1	1	2026-03-30 05:55:40.396944	2026-08-27 08:37:56.16731	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000160.jpg"}	AUTO-000160	3	2	2026-08-27 08:37:56	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000160.jpg"}
164	5	1	2	1	2026-02-25 23:33:14.924117	2026-06-10 14:01:28.802952	Se reporta uso incorrecto de herramienta manual.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000161.jpg"}	AUTO-000161	6	2	2026-06-10 14:01:29	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000161.jpg"}
165	5	1	3	2	2025-11-26 21:06:23.474007	2026-08-24 09:57:10.897611	Se observa trabajador sin equipo de proteccion completo.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000162.jpg"}	AUTO-000162	6	2	\N	\N	\N
166	5	1	1	1	2026-02-27 15:23:23.959659	2026-07-01 04:12:56.098863	Se reporta uso incorrecto de herramienta manual.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000163.jpg"}	AUTO-000163	3	2	\N	\N	\N
167	1	1	3	2	2026-08-07 17:38:02.27464	2026-10-01 12:39:55.465235	Se detecta cable electrico sin proteccion adecuada.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000164.jpg"}	AUTO-000164	4	2	\N	\N	\N
168	5	1	1	1	2026-09-07 06:03:45.009899	2026-09-16 23:44:19.337604	Se identifica condicion insegura en instalacion electrica.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000165.jpg"}	AUTO-000165	3	2	\N	\N	\N
169	5	1	1	1	2026-02-08 22:21:29.638778	2026-03-16 09:37:15.542719	Se reporta desprendimiento de componente mecanico.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000166.jpg"}	AUTO-000166	6	2	\N	\N	\N
170	5	1	3	2	2026-05-03 19:41:44.249397	2026-06-30 19:04:44.250805	Se observa trabajador sin equipo de proteccion completo.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000167.jpg"}	AUTO-000167	3	2	\N	\N	\N
171	4	1	3	2	2026-07-22 16:46:01.679544	2026-09-26 04:38:04.456543	Se detecta herramienta en condicion insegura.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000168.jpg"}	AUTO-000168	3	2	\N	\N	\N
172	5	1	3	2	2026-08-23 08:40:14.705791	2026-09-11 02:04:02.374907	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000169.jpg"}	AUTO-000169	5	2	2026-09-11 02:04:02	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000169.jpg"}
173	3	1	2	1	2025-12-18 19:15:27.677145	2026-09-18 11:13:07.711336	Se observa area de trabajo con orden y limpieza deficientes.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000170.jpg"}	AUTO-000170	4	2	\N	\N	\N
174	3	1	3	2	2026-03-25 23:59:10.576471	2026-07-04 01:29:06.251378	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000171.jpg"}	AUTO-000171	6	2	\N	\N	\N
175	5	1	3	2	2026-04-25 15:09:27.088853	2026-09-15 16:55:14.674216	Se identifica condicion insegura en instalacion electrica.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000172.jpg"}	AUTO-000172	6	2	\N	\N	\N
176	2	1	2	1	2026-09-05 13:44:40.515772	2026-09-20 02:40:17.124622	Se detecta cable electrico sin proteccion adecuada.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000173.jpg"}	AUTO-000173	6	2	\N	\N	\N
177	4	1	1	1	2026-03-01 07:22:42.933938	2026-04-13 19:22:51.008064	Se detecta cable electrico sin proteccion adecuada.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000174.jpg"}	AUTO-000174	6	2	\N	\N	\N
178	1	1	1	1	2025-11-20 14:34:01.933311	2026-07-01 00:08:44.90582	Se identifica falta de señalizacion preventiva.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000175.jpg"}	AUTO-000175	3	2	\N	\N	\N
179	4	1	1	1	2025-11-14 13:45:14.497277	2026-08-27 05:44:36.866408	Se detecta cable electrico sin proteccion adecuada.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000176.jpg"}	AUTO-000176	6	2	\N	\N	\N
180	1	1	3	2	2026-08-13 04:50:49.883472	2026-09-18 10:33:46.303072	Se reporta uso incorrecto de herramienta manual.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000177.jpg"}	AUTO-000177	3	2	\N	\N	\N
181	1	1	1	1	2026-09-13 06:56:34.052416	2026-09-26 16:15:47.604119	Se observa derrame menor en sector de trabajo.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000178.jpg"}	AUTO-000178	3	2	\N	\N	\N
182	1	1	3	2	2026-06-18 13:33:12.974393	2026-06-27 16:04:14.622612	Se detecta riesgo asociado a trabajo en altura.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000179.jpg"}	AUTO-000179	6	2	2026-06-27 16:04:15	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000179.jpg"}
183	4	1	1	1	2026-04-08 09:51:34.727727	2026-07-01 20:10:40.940022	Se observa trabajador sin equipo de proteccion completo.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000180.jpg"}	AUTO-000180	5	2	\N	\N	\N
184	5	1	2	1	2026-03-29 04:01:52.179618	2026-04-23 13:20:41.462631	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000181.jpg"}	AUTO-000181	4	2	\N	\N	\N
185	1	1	3	2	2026-02-05 22:38:23.497919	2026-08-25 11:39:33.904897	Se detecta cable electrico sin proteccion adecuada.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000182.jpg"}	AUTO-000182	3	2	\N	\N	\N
186	3	1	2	1	2026-03-13 19:44:49.038363	2026-09-17 23:47:15.00516	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000183.jpg"}	AUTO-000183	4	2	\N	\N	\N
187	2	1	2	1	2026-09-01 03:30:43.040916	2026-09-29 22:15:07.483746	Se identifica material obstruyendo una via de circulacion.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000184.jpg"}	AUTO-000184	3	2	2026-09-29 22:15:07	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000184.jpg"}
188	1	1	3	2	2026-07-19 21:50:41.772794	2026-08-12 11:09:28.927993	Se detecta herramienta en condicion insegura.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000185.jpg"}	AUTO-000185	6	2	\N	\N	\N
189	3	1	3	2	2026-08-09 19:20:46.623027	2026-09-28 01:14:30.128306	Se detecta elemento de proteccion deteriorado.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000186.jpg"}	AUTO-000186	6	2	\N	\N	\N
190	3	1	1	1	2026-09-13 03:59:00.362381	2026-09-18 23:54:55.032416	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000187.jpg"}	AUTO-000187	3	2	\N	\N	\N
191	2	1	2	1	2026-01-10 12:15:23.22205	2026-06-19 22:31:59.481984	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000188.jpg"}	AUTO-000188	4	2	\N	\N	\N
192	3	1	1	1	2026-05-27 03:15:20.32834	2026-06-19 21:51:32.601573	Se detecta herramienta en condicion insegura.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000189.jpg"}	AUTO-000189	3	2	2026-06-19 21:51:33	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000189.jpg"}
193	5	1	1	1	2026-06-10 20:01:53.271857	2026-09-16 00:52:24.594002	Se identifica condicion insegura en instalacion electrica.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000190.jpg"}	AUTO-000190	4	2	2026-09-16 00:52:25	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000190.jpg"}
194	4	1	3	2	2025-12-06 07:47:33.939775	2026-01-17 14:40:49.46961	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000191.jpg"}	AUTO-000191	6	2	\N	\N	\N
195	2	1	2	1	2026-05-02 09:09:04.161184	2026-07-26 07:39:36.134486	Se detecta cable electrico sin proteccion adecuada.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000192.jpg"}	AUTO-000192	6	2	\N	\N	\N
196	1	1	3	2	2026-07-23 19:40:51.844722	2026-08-08 22:57:59.638312	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000193.jpg"}	AUTO-000193	3	2	\N	\N	\N
197	5	1	3	2	2026-04-12 13:09:21.832089	2026-07-14 04:30:52.579552	Se detecta riesgo asociado a trabajo en altura.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000194.jpg"}	AUTO-000194	5	2	\N	\N	\N
198	4	1	3	2	2026-04-01 04:51:56.024588	2026-08-11 21:02:34.792169	Se observa trabajador sin equipo de proteccion completo.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000195.jpg"}	AUTO-000195	6	2	\N	\N	\N
199	3	1	3	2	2026-04-18 13:42:25.229063	2026-08-23 16:14:11.40492	Se observa material almacenado fuera del area autorizada.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000196.jpg"}	AUTO-000196	4	2	\N	\N	\N
200	1	1	1	1	2025-12-12 20:33:25.448019	2026-07-03 01:38:53.658209	Se detecta cable electrico sin proteccion adecuada.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000197.jpg"}	AUTO-000197	5	2	\N	\N	\N
201	3	1	1	1	2026-04-06 17:48:47.368226	2026-05-25 11:27:15.897667	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000198.jpg"}	AUTO-000198	6	2	\N	\N	\N
202	3	1	1	1	2026-02-12 18:56:14.890732	2026-09-09 09:54:15.507934	Se reporta uso incorrecto de herramienta manual.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000199.jpg"}	AUTO-000199	6	2	\N	\N	\N
203	2	1	2	1	2025-10-11 13:33:01.509968	2026-07-25 14:54:39.181774	Se detecta cable electrico sin proteccion adecuada.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000200.jpg"}	AUTO-000200	4	2	\N	\N	\N
204	3	1	3	2	2026-08-01 02:17:12.582218	2026-08-10 00:38:48.530841	Se identifica condicion insegura en instalacion electrica.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000201.jpg"}	AUTO-000201	3	2	2026-08-10 00:38:49	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000201.jpg"}
205	2	1	2	1	2025-10-31 01:26:33.08806	2026-07-20 04:35:21.82326	Se identifica falta de señalizacion preventiva.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000202.jpg"}	AUTO-000202	5	2	2026-07-20 04:35:22	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000202.jpg"}
206	2	1	1	1	2025-10-11 04:43:50.773508	2026-02-01 10:33:27.486519	Se observa area de trabajo con orden y limpieza deficientes.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000203.jpg"}	AUTO-000203	4	2	\N	\N	\N
207	5	1	3	2	2026-02-26 10:23:14.762287	2026-07-13 03:01:13.053056	Se observa derrame menor en sector de trabajo.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000204.jpg"}	AUTO-000204	6	2	2026-07-13 03:01:13	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000204.jpg"}
208	5	1	1	1	2026-06-25 20:25:06.837117	2026-09-02 03:16:23.186264	Se detecta riesgo asociado a trabajo en altura.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000205.jpg"}	AUTO-000205	4	2	\N	\N	\N
209	5	1	2	1	2026-03-15 06:49:27.359391	2026-08-29 01:51:54.267659	Se detecta riesgo asociado a trabajo en altura.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000206.jpg"}	AUTO-000206	5	2	\N	\N	\N
210	4	1	3	2	2026-02-03 20:16:29.244221	2026-07-12 03:37:26.485631	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000207.jpg"}	AUTO-000207	4	2	2026-07-12 03:37:26	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000207.jpg"}
211	1	1	3	2	2026-02-09 13:06:05.768349	2026-05-10 14:22:48.02426	Se observa derrame menor en sector de trabajo.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000208.jpg"}	AUTO-000208	6	2	\N	\N	\N
212	1	1	3	2	2026-02-20 08:10:09.518042	2026-08-27 05:26:09.297551	Se identifica material obstruyendo una via de circulacion.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000209.jpg"}	AUTO-000209	5	2	\N	\N	\N
213	4	1	3	2	2026-02-16 12:56:44.074819	2026-08-15 10:59:15.171749	Se reporta uso incorrecto de herramienta manual.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000210.jpg"}	AUTO-000210	3	2	\N	\N	\N
214	2	1	3	2	2025-11-06 18:37:09.324642	2026-06-14 13:53:09.582266	Se observa material almacenado fuera del area autorizada.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000211.jpg"}	AUTO-000211	5	2	2026-06-14 13:53:10	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000211.jpg"}
215	4	1	2	1	2026-05-08 12:20:04.02066	2026-08-11 11:07:59.003219	Se detecta riesgo asociado a trabajo en altura.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000212.jpg"}	AUTO-000212	5	2	\N	\N	\N
216	3	1	3	2	2026-03-31 22:14:42.237805	2026-05-14 20:25:39.082649	Se identifica material obstruyendo una via de circulacion.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000213.jpg"}	AUTO-000213	3	2	\N	\N	\N
217	5	1	3	2	2026-06-16 10:43:13.124881	2026-06-17 06:50:50.851082	Se observa material almacenado fuera del area autorizada.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000214.jpg"}	AUTO-000214	4	2	\N	\N	\N
218	4	1	2	1	2025-12-05 03:27:30.026779	2026-03-15 15:42:54.35763	Se observa derrame menor en sector de trabajo.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000215.jpg"}	AUTO-000215	5	2	2026-03-15 15:42:54	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000215.jpg"}
219	3	1	3	2	2026-02-24 06:56:47.21386	2026-08-09 10:37:33.887607	Se observa trabajador sin equipo de proteccion completo.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000216.jpg"}	AUTO-000216	6	2	2026-08-09 10:37:34	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000216.jpg"}
220	4	1	1	1	2026-04-28 20:26:22.442211	2026-05-30 08:29:07.180941	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000217.jpg"}	AUTO-000217	5	2	2026-05-30 08:29:07	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000217.jpg"}
221	2	1	3	2	2026-01-22 02:38:18.571824	2026-09-07 07:12:08.653668	Se observa trabajador sin equipo de proteccion completo.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000218.jpg"}	AUTO-000218	5	2	\N	\N	\N
222	1	1	1	1	2026-04-07 13:00:47.1102	2026-05-11 19:29:39.701028	Se identifica condicion insegura en instalacion electrica.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000219.jpg"}	AUTO-000219	4	2	\N	\N	\N
223	5	1	3	2	2026-01-20 20:15:22.102378	2026-02-23 04:12:53.476426	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000220.jpg"}	AUTO-000220	5	2	2026-02-23 04:12:53	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000220.jpg"}
224	5	1	3	2	2026-07-25 07:03:12.170374	2026-10-01 01:33:51.600806	Se detecta elemento de proteccion deteriorado.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000221.jpg"}	AUTO-000221	6	2	\N	\N	\N
225	2	1	3	2	2026-01-13 16:50:02.011606	2026-04-06 20:06:44.080255	Se observa material almacenado fuera del area autorizada.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000222.jpg"}	AUTO-000222	3	2	2026-04-06 20:06:44	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000222.jpg"}
226	5	1	1	1	2026-07-05 03:59:57.495573	2026-07-09 19:05:21.717745	Se observa material almacenado fuera del area autorizada.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000223.jpg"}	AUTO-000223	6	2	\N	\N	\N
227	5	1	3	2	2026-05-04 18:28:09.279378	2026-06-13 00:41:02.995095	Se identifica condicion insegura en instalacion electrica.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000224.jpg"}	AUTO-000224	5	2	\N	\N	\N
228	3	1	2	1	2026-07-03 11:19:37.751897	2026-07-12 12:06:28.574133	Se reporta desprendimiento de componente mecanico.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000225.jpg"}	AUTO-000225	3	2	\N	\N	\N
229	2	1	2	1	2025-11-22 00:15:49.102296	2026-02-27 23:45:47.777278	Se observa derrame menor en sector de trabajo.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000226.jpg"}	AUTO-000226	3	2	\N	\N	\N
230	4	1	3	2	2026-03-11 01:08:13.990029	2026-05-25 10:31:07.523403	Se identifica material obstruyendo una via de circulacion.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000227.jpg"}	AUTO-000227	5	2	\N	\N	\N
231	1	1	3	2	2026-08-05 06:03:32.520827	2026-09-03 16:39:51.724117	Se observa trabajador sin equipo de proteccion completo.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000228.jpg"}	AUTO-000228	4	2	\N	\N	\N
232	1	1	3	2	2026-01-06 13:47:20.517201	2026-05-11 05:37:18.902807	Se detecta herramienta en condicion insegura.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000229.jpg"}	AUTO-000229	3	2	\N	\N	\N
233	2	1	1	1	2026-05-08 04:52:02.622637	2026-06-19 03:31:17.481221	Se observa derrame menor en sector de trabajo.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000230.jpg"}	AUTO-000230	4	2	\N	\N	\N
234	4	1	1	1	2026-02-01 10:32:06.908562	2026-07-29 02:29:46.595427	Se detecta elemento de proteccion deteriorado.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000231.jpg"}	AUTO-000231	3	2	2026-07-29 02:29:47	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000231.jpg"}
235	5	1	2	1	2026-01-04 09:12:03.330563	2026-06-25 12:16:35.007963	Se observa trabajador sin equipo de proteccion completo.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000232.jpg"}	AUTO-000232	3	2	\N	\N	\N
236	2	1	2	1	2026-05-08 16:17:48.450904	2026-08-16 03:30:37.31414	Se reporta desprendimiento de componente mecanico.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000233.jpg"}	AUTO-000233	6	2	2026-08-16 03:30:37	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000233.jpg"}
237	2	1	2	1	2026-01-31 11:51:07.820758	2026-06-23 17:28:07.879336	Se reporta desprendimiento de componente mecanico.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000234.jpg"}	AUTO-000234	4	2	\N	\N	\N
238	5	1	3	2	2025-11-29 17:58:50.326587	2026-04-10 00:02:44.810942	Se identifica material obstruyendo una via de circulacion.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000235.jpg"}	AUTO-000235	5	2	\N	\N	\N
239	1	1	1	1	2026-09-14 19:28:19.739277	2026-09-22 15:38:33.8495	Se detecta herramienta en condicion insegura.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000236.jpg"}	AUTO-000236	5	2	2026-09-22 15:38:34	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000236.jpg"}
240	5	1	1	1	2025-12-03 04:42:27.256401	2026-03-30 07:02:59.397299	Se observa area de trabajo con orden y limpieza deficientes.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000237.jpg"}	AUTO-000237	5	2	\N	\N	\N
241	1	1	2	1	2026-06-16 02:49:21.950477	2026-09-21 12:10:37.013946	Se reporta desprendimiento de componente mecanico.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000238.jpg"}	AUTO-000238	3	2	\N	\N	\N
242	2	1	3	2	2026-06-17 13:17:37.505935	2026-07-17 05:30:15.521013	Se observa derrame menor en sector de trabajo.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000239.jpg"}	AUTO-000239	4	2	\N	\N	\N
243	4	1	1	1	2026-03-18 17:08:05.259211	2026-08-29 04:58:00.143797	Se observa oportunidad de mejora en procedimiento de mantenimiento.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000240.jpg"}	AUTO-000240	5	2	\N	\N	\N
244	3	1	1	1	2026-03-17 00:41:53.128517	2026-08-13 06:23:51.738627	Se reporta uso incorrecto de herramienta manual.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000241.jpg"}	AUTO-000241	3	2	\N	\N	\N
245	5	1	3	2	2026-05-02 10:37:42.904191	2026-09-08 04:49:13.823278	Se detecta cable electrico sin proteccion adecuada.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000242.jpg"}	AUTO-000242	4	2	2026-09-08 04:49:14	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000242.jpg"}
246	3	1	2	1	2025-11-26 15:39:44.969918	2026-06-20 08:23:19.717902	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000243.jpg"}	AUTO-000243	3	2	2026-06-20 08:23:20	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000243.jpg"}
247	1	1	2	1	2026-02-10 08:23:24.2502	2026-03-03 12:48:34.642039	Se detecta cable electrico sin proteccion adecuada.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000244.jpg"}	AUTO-000244	5	2	\N	\N	\N
248	2	1	1	1	2026-01-09 03:49:12.743714	2026-03-29 08:48:23.068742	Se observa trabajador sin equipo de proteccion completo.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000245.jpg"}	AUTO-000245	6	2	\N	\N	\N
249	4	1	3	2	2026-04-08 12:50:53.124618	2026-07-15 23:57:05.859816	Se detecta herramienta en condicion insegura.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000246.jpg"}	AUTO-000246	3	2	\N	\N	\N
250	2	1	1	1	2026-06-12 16:08:49.479681	2026-07-10 14:43:39.846064	Se identifica condicion insegura en instalacion electrica.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000247.jpg"}	AUTO-000247	6	2	\N	\N	\N
251	3	1	1	1	2026-09-05 20:20:35.59447	2026-09-10 10:15:46.185708	Se identifica condicion insegura en instalacion electrica.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000248.jpg"}	AUTO-000248	3	2	\N	\N	\N
252	3	1	2	1	2026-09-17 12:44:50.102495	2026-09-25 13:15:31.747092	Se observa trabajador sin equipo de proteccion completo.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000249.jpg"}	AUTO-000249	4	2	\N	\N	\N
253	5	1	2	1	2026-09-28 19:17:47.926982	2026-09-29 03:57:49.808633	Se observa area de trabajo con orden y limpieza deficientes.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000250.jpg"}	AUTO-000250	6	2	\N	\N	\N
254	2	1	3	2	2026-03-21 12:35:55.236357	2026-05-04 09:00:12.997775	Se detecta equipo sin inspeccion preventiva actualizada.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000251.jpg"}	AUTO-000251	4	2	\N	\N	\N
255	1	1	3	2	2026-06-11 22:29:09.382751	2026-08-22 14:08:30.530594	Se identifica material obstruyendo una via de circulacion.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000252.jpg"}	AUTO-000252	5	2	\N	\N	\N
256	1	1	3	2	2025-11-26 05:27:30.620013	2026-08-03 18:42:01.898574	Se detecta herramienta en condicion insegura.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000253.jpg"}	AUTO-000253	5	2	\N	\N	\N
257	5	1	1	1	2026-03-03 16:01:20.456381	2026-09-23 20:42:32.014755	Se identifica falta de señalizacion preventiva.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000254.jpg"}	AUTO-000254	5	2	\N	\N	\N
258	1	1	1	1	2026-03-17 08:35:31.874298	2026-06-01 18:14:15.896228	Se identifica falta de señalizacion preventiva.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000255.jpg"}	AUTO-000255	3	2	\N	\N	\N
259	2	1	3	2	2025-11-24 11:27:34.545068	2026-02-22 22:27:23.159641	Se reporta desprendimiento de componente mecanico.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000256.jpg"}	AUTO-000256	5	2	\N	\N	\N
260	1	1	3	2	2026-04-29 00:42:41.005774	2026-09-04 19:55:08.458125	Se observa area de trabajo con orden y limpieza deficientes.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000257.jpg"}	AUTO-000257	3	2	\N	\N	\N
261	1	1	1	1	2026-07-28 06:11:27.238245	2026-09-06 07:39:07.51963	Se identifica falta de señalizacion preventiva.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000258.jpg"}	AUTO-000258	4	2	\N	\N	\N
262	3	1	2	1	2026-01-23 07:58:46.54903	2026-05-31 19:48:11.64519	Se reporta uso incorrecto de herramienta manual.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000259.jpg"}	AUTO-000259	4	2	\N	\N	\N
263	3	1	2	1	2026-07-21 01:21:53.525867	2026-09-26 16:17:10.328738	Se observa trabajador sin equipo de proteccion completo.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000260.jpg"}	AUTO-000260	4	2	\N	\N	\N
264	1	1	3	2	2026-05-20 14:35:20.235181	2026-08-29 05:14:16.103481	Se detecta riesgo asociado a trabajo en altura.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000261.jpg"}	AUTO-000261	4	2	\N	\N	\N
265	1	1	3	2	2026-05-15 01:58:22.488828	2026-05-27 11:24:43.044408	Se observa trabajador sin equipo de proteccion completo.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000262.jpg"}	AUTO-000262	6	2	\N	\N	\N
266	5	1	1	1	2026-07-28 05:15:00.636704	2026-08-02 12:04:51.215532	Se detecta riesgo asociado a trabajo en altura.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000263.jpg"}	AUTO-000263	5	2	\N	\N	\N
267	1	1	3	2	2026-02-08 17:20:28.208548	2026-03-29 18:30:21.464823	Se reporta uso incorrecto de herramienta manual.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000264.jpg"}	AUTO-000264	5	2	\N	\N	\N
268	4	1	3	2	2025-10-14 05:48:30.502071	2026-04-18 12:10:35.26202	Se detecta riesgo asociado a trabajo en altura.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000265.jpg"}	AUTO-000265	4	2	2026-04-18 12:10:35	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000265.jpg"}
269	4	1	3	2	2025-10-26 01:42:46.332045	2026-08-06 05:47:39.34808	Se reporta desprendimiento de componente mecanico.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000266.jpg"}	AUTO-000266	5	2	\N	\N	\N
270	4	1	2	1	2025-12-15 09:54:35.13521	2026-05-15 03:28:23.863235	Se observa derrame menor en sector de trabajo.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000267.jpg"}	AUTO-000267	3	2	\N	\N	\N
271	5	1	3	2	2026-09-27 15:58:54.767109	2026-09-30 21:27:24.102877	Se observa material almacenado fuera del area autorizada.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000268.jpg"}	AUTO-000268	4	2	\N	\N	\N
272	3	1	1	1	2026-01-03 23:41:55.571548	2026-09-11 22:15:13.837926	Se detecta elemento de proteccion deteriorado.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000269.jpg"}	AUTO-000269	4	2	\N	\N	\N
273	1	1	1	1	2025-12-01 01:30:22.811906	2026-08-20 20:03:18.676658	Se detecta herramienta en condicion insegura.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000270.jpg"}	AUTO-000270	6	2	\N	\N	\N
274	2	1	2	1	2025-11-03 19:14:46.803128	2026-03-13 17:45:46.645245	Se detecta cable electrico sin proteccion adecuada.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000271.jpg"}	AUTO-000271	3	2	\N	\N	\N
275	4	1	1	1	2026-03-04 20:38:03.67327	2026-08-11 08:52:19.310671	Se observa derrame menor en sector de trabajo.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000272.jpg"}	AUTO-000272	4	2	\N	\N	\N
276	4	1	2	1	2025-11-30 05:21:42.389211	2026-07-27 12:54:58.23704	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000273.jpg"}	AUTO-000273	4	2	\N	\N	\N
277	4	1	3	2	2026-01-15 21:14:03.602509	2026-08-25 07:18:46.055305	Se reporta uso incorrecto de herramienta manual.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000274.jpg"}	AUTO-000274	6	2	\N	\N	\N
278	3	1	3	2	2026-08-10 19:59:34.312391	2026-09-03 21:42:59.02985	Se detecta equipo sin inspeccion preventiva actualizada.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000275.jpg"}	AUTO-000275	4	2	\N	\N	\N
279	2	1	3	2	2026-03-25 18:35:10.323159	2026-06-11 17:08:45.105196	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000276.jpg"}	AUTO-000276	3	2	\N	\N	\N
280	1	1	3	2	2026-01-21 21:55:00.112836	2026-07-18 22:58:27.899498	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000277.jpg"}	AUTO-000277	5	2	2026-07-18 22:58:28	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000277.jpg"}
281	4	1	2	1	2026-05-03 17:02:31.302165	2026-08-25 08:10:53.042561	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000278.jpg"}	AUTO-000278	6	2	2026-08-25 08:10:53	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000278.jpg"}
282	2	1	2	1	2026-09-29 08:57:38.767043	2026-10-01 17:15:16.702714	Se reporta uso incorrecto de herramienta manual.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000279.jpg"}	AUTO-000279	4	2	\N	\N	\N
283	2	1	2	1	2026-04-30 18:19:13.441936	2026-07-15 09:51:01.127845	Se detecta herramienta en condicion insegura.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000280.jpg"}	AUTO-000280	6	2	\N	\N	\N
284	1	1	3	2	2026-08-30 16:23:37.701198	2026-09-05 21:10:49.555243	Se detecta elemento de proteccion deteriorado.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000281.jpg"}	AUTO-000281	4	2	\N	\N	\N
285	2	1	3	2	2026-07-21 17:47:02.85148	2026-09-14 21:37:23.450699	Se observa derrame menor en sector de trabajo.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000282.jpg"}	AUTO-000282	3	2	\N	\N	\N
286	2	1	3	2	2026-08-02 13:46:59.963665	2026-09-30 02:53:53.950816	Se identifica material obstruyendo una via de circulacion.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000283.jpg"}	AUTO-000283	3	2	\N	\N	\N
287	4	1	1	1	2025-10-19 16:02:45.680382	2026-08-25 06:59:40.920145	Se observa derrame menor en sector de trabajo.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000284.jpg"}	AUTO-000284	3	2	2026-08-25 06:59:41	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000284.jpg"}
288	1	1	2	1	2025-12-03 20:13:45.916479	2026-02-24 05:08:17.030966	Se observa material almacenado fuera del area autorizada.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000285.jpg"}	AUTO-000285	6	2	\N	\N	\N
289	5	1	2	1	2026-07-23 20:36:47.143914	2026-07-24 19:32:57.785854	Se reporta uso incorrecto de herramienta manual.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000286.jpg"}	AUTO-000286	6	2	\N	\N	\N
290	5	1	3	2	2025-12-30 22:06:56.128701	2026-01-12 12:26:33.051755	Se identifica condicion insegura en instalacion electrica.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000287.jpg"}	AUTO-000287	3	2	2026-01-12 12:26:33	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000287.jpg"}
291	5	1	3	2	2026-09-09 22:15:29.240578	2026-09-15 09:09:04.618729	Se detecta herramienta en condicion insegura.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000288.jpg"}	AUTO-000288	6	2	2026-09-15 09:09:05	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000288.jpg"}
292	4	1	3	2	2026-04-09 00:35:24.342845	2026-04-09 18:23:38.23749	Se detecta cable electrico sin proteccion adecuada.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000289.jpg"}	AUTO-000289	4	2	\N	\N	\N
293	2	1	2	1	2025-12-09 12:41:50.409746	2026-09-12 07:12:05.176843	Se observa material almacenado fuera del area autorizada.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000290.jpg"}	AUTO-000290	5	2	\N	\N	\N
294	1	1	3	2	2025-11-08 20:12:20.834828	2026-02-08 13:13:37.202381	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000291.jpg"}	AUTO-000291	3	2	\N	\N	\N
295	4	1	2	1	2026-01-01 07:16:51.361973	2026-07-04 08:21:31.565844	Se reporta desprendimiento de componente mecanico.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000292.jpg"}	AUTO-000292	5	2	\N	\N	\N
296	5	1	1	1	2025-10-11 13:13:19.896524	2026-05-21 08:28:41.165078	Se observa trabajador sin equipo de proteccion completo.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000293.jpg"}	AUTO-000293	3	2	\N	\N	\N
297	3	1	3	2	2026-01-20 00:16:34.716082	2026-04-16 05:07:09.894479	Se observa area de trabajo con orden y limpieza deficientes.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000294.jpg"}	AUTO-000294	3	2	\N	\N	\N
298	2	1	2	1	2026-07-31 14:17:24.93823	2026-09-28 10:41:27.92546	Se detecta cable electrico sin proteccion adecuada.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000295.jpg"}	AUTO-000295	4	2	\N	\N	\N
299	3	1	1	1	2025-12-23 10:52:43.331173	2026-09-02 21:43:31.567428	Se identifica condicion insegura en instalacion electrica.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000296.jpg"}	AUTO-000296	5	2	2026-09-02 21:43:32	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000296.jpg"}
300	4	1	3	2	2025-12-23 15:29:10.798214	2026-07-05 08:55:47.371252	Se identifica condicion insegura en instalacion electrica.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000297.jpg"}	AUTO-000297	3	2	\N	\N	\N
301	4	1	3	2	2026-01-28 17:38:15.695466	2026-06-26 17:13:17.655591	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000298.jpg"}	AUTO-000298	5	2	2026-06-26 17:13:18	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000298.jpg"}
302	1	1	3	2	2026-01-27 04:57:35.87811	2026-07-02 15:32:58.688002	Se detecta cable electrico sin proteccion adecuada.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000299.jpg"}	AUTO-000299	5	2	2026-07-02 15:32:59	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000299.jpg"}
303	1	1	1	1	2026-04-29 11:18:48.321828	2026-06-22 19:10:58.631954	Se identifica falta de señalizacion preventiva.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000300.jpg"}	AUTO-000300	4	2	\N	\N	\N
304	2	1	1	1	2026-03-21 15:40:30.968349	2026-07-05 02:14:28.581779	Se detecta elemento de proteccion deteriorado.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000301.jpg"}	AUTO-000301	6	2	\N	\N	\N
305	5	1	3	2	2026-05-22 23:40:45.785876	2026-08-23 13:49:32.032896	Se reporta desprendimiento de componente mecanico.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000302.jpg"}	AUTO-000302	6	2	\N	\N	\N
306	5	1	3	2	2026-08-07 02:42:46.516643	2026-08-29 17:05:09.650245	Se reporta uso incorrecto de herramienta manual.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000303.jpg"}	AUTO-000303	6	2	\N	\N	\N
307	1	1	2	1	2025-12-19 09:49:17.316922	2026-01-18 09:35:35.905704	Se detecta cable electrico sin proteccion adecuada.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000304.jpg"}	AUTO-000304	6	2	\N	\N	\N
308	1	1	1	1	2026-05-18 02:30:45.813151	2026-07-10 10:55:53.529535	Se detecta herramienta en condicion insegura.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000305.jpg"}	AUTO-000305	5	2	2026-07-10 10:55:54	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000305.jpg"}
309	3	1	3	2	2025-11-27 17:28:25.106852	2026-07-18 03:38:33.80295	Se detecta elemento de proteccion deteriorado.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000306.jpg"}	AUTO-000306	5	2	\N	\N	\N
310	1	1	3	2	2026-09-05 06:13:04.625574	2026-09-17 21:36:12.90288	Se observa trabajador sin equipo de proteccion completo.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000307.jpg"}	AUTO-000307	3	2	2026-09-17 21:36:13	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000307.jpg"}
311	4	1	2	1	2025-10-21 05:11:05.569651	2026-09-10 07:36:06.688854	Se reporta uso incorrecto de herramienta manual.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000308.jpg"}	AUTO-000308	5	2	\N	\N	\N
312	3	1	1	1	2026-07-29 08:47:11.696942	2026-08-24 16:56:43.819124	Se observa trabajador sin equipo de proteccion completo.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000309.jpg"}	AUTO-000309	4	2	\N	\N	\N
313	2	1	1	1	2026-05-13 00:41:50.640805	2026-06-20 12:48:28.025928	Se detecta herramienta en condicion insegura.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000310.jpg"}	AUTO-000310	4	2	\N	\N	\N
314	5	1	3	2	2026-01-26 04:42:15.490999	2026-07-06 21:27:40.546075	Se observa trabajador sin equipo de proteccion completo.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000311.jpg"}	AUTO-000311	6	2	\N	\N	\N
315	4	1	3	2	2026-07-02 21:50:54.573059	2026-08-29 17:17:49.445711	Se observa material almacenado fuera del area autorizada.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000312.jpg"}	AUTO-000312	3	2	\N	\N	\N
316	1	1	3	2	2026-05-07 15:03:21.463736	2026-07-02 09:50:25.519096	Se detecta elemento de proteccion deteriorado.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000313.jpg"}	AUTO-000313	5	2	\N	\N	\N
317	2	1	3	2	2026-05-17 23:48:14.206559	2026-08-29 14:13:56.906801	Se observa area de trabajo con orden y limpieza deficientes.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000314.jpg"}	AUTO-000314	4	2	\N	\N	\N
318	3	1	1	1	2026-06-01 19:52:44.229392	2026-08-11 11:44:27.058807	Se detecta riesgo asociado a trabajo en altura.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000315.jpg"}	AUTO-000315	5	2	\N	\N	\N
319	3	1	3	2	2026-01-23 20:28:44.519655	2026-08-23 05:43:39.122446	Se observa material almacenado fuera del area autorizada.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000316.jpg"}	AUTO-000316	4	2	\N	\N	\N
320	3	1	2	1	2025-11-06 19:53:55.200521	2026-01-21 07:51:40.836984	Se identifica falta de señalizacion preventiva.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000317.jpg"}	AUTO-000317	6	2	\N	\N	\N
321	2	1	1	1	2026-04-04 23:01:35.313493	2026-06-26 09:38:19.263843	Se reporta desprendimiento de componente mecanico.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000318.jpg"}	AUTO-000318	6	2	\N	\N	\N
322	2	1	1	1	2026-01-02 17:30:59.076911	2026-08-08 12:53:48.367411	Se reporta uso incorrecto de herramienta manual.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000319.jpg"}	AUTO-000319	3	2	\N	\N	\N
323	3	1	3	2	2026-03-29 11:26:34.836968	2026-05-22 18:03:21.289296	Se observa area de trabajo con orden y limpieza deficientes.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000320.jpg"}	AUTO-000320	5	2	\N	\N	\N
324	3	1	1	1	2026-09-12 16:19:12.649027	2026-09-19 16:15:09.276664	Se identifica condicion insegura en instalacion electrica.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000321.jpg"}	AUTO-000321	5	2	\N	\N	\N
325	4	1	3	2	2026-05-06 20:38:47.183722	2026-09-08 06:52:29.884639	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000322.jpg"}	AUTO-000322	4	2	\N	\N	\N
326	2	1	1	1	2026-08-17 05:12:39.218302	2026-09-11 02:24:54.619736	Se identifica material obstruyendo una via de circulacion.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000323.jpg"}	AUTO-000323	5	2	\N	\N	\N
327	3	1	1	1	2026-07-12 14:58:34.746897	2026-09-22 14:25:11.19188	Se identifica falta de señalizacion preventiva.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000324.jpg"}	AUTO-000324	3	2	2026-09-22 14:25:11	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000324.jpg"}
328	2	1	1	1	2026-01-27 14:49:10.196363	2026-08-18 02:21:57.505355	Se observa material almacenado fuera del area autorizada.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000325.jpg"}	AUTO-000325	3	2	\N	\N	\N
329	5	1	2	1	2026-04-05 13:49:17.83056	2026-08-29 21:18:29.02263	Se detecta elemento de proteccion deteriorado.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000326.jpg"}	AUTO-000326	6	2	\N	\N	\N
330	1	1	3	2	2026-09-25 21:00:35.523325	2026-09-27 20:48:02.733539	Se detecta herramienta en condicion insegura.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000327.jpg"}	AUTO-000327	4	2	\N	\N	\N
331	5	1	2	1	2026-03-15 09:28:59.892235	2026-04-16 16:55:41.856661	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000328.jpg"}	AUTO-000328	5	2	2026-04-16 16:55:42	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000328.jpg"}
332	5	1	2	1	2026-06-04 18:09:32.652109	2026-07-02 01:43:49.972464	Se observa derrame menor en sector de trabajo.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000329.jpg"}	AUTO-000329	3	2	\N	\N	\N
333	5	1	1	1	2026-09-22 07:20:21.150339	2026-09-22 20:28:50.28441	Se identifica material obstruyendo una via de circulacion.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000330.jpg"}	AUTO-000330	6	2	2026-09-22 20:28:50	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000330.jpg"}
334	5	1	3	2	2026-08-21 12:39:49.927164	2026-09-27 15:18:20.843587	Se detecta elemento de proteccion deteriorado.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000331.jpg"}	AUTO-000331	4	2	\N	\N	\N
335	1	1	3	2	2026-08-11 14:49:21.947697	2026-08-26 22:29:44.116077	Se identifica condicion insegura en instalacion electrica.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000332.jpg"}	AUTO-000332	4	2	\N	\N	\N
336	2	1	2	1	2026-02-18 07:20:16.82765	2026-08-28 18:58:35.92449	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000333.jpg"}	AUTO-000333	4	2	\N	\N	\N
337	3	1	1	1	2025-10-16 17:45:06.6553	2026-01-11 15:24:56.173105	Se observa material almacenado fuera del area autorizada.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000334.jpg"}	AUTO-000334	6	2	\N	\N	\N
338	3	1	1	1	2026-02-27 13:45:56.247361	2026-04-29 02:32:05.601123	Se reporta desprendimiento de componente mecanico.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000335.jpg"}	AUTO-000335	4	2	2026-04-29 02:32:06	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000335.jpg"}
339	3	1	3	2	2026-08-09 23:41:36.202552	2026-09-12 12:26:02.563275	Se detecta elemento de proteccion deteriorado.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000336.jpg"}	AUTO-000336	5	2	\N	\N	\N
340	3	1	3	2	2026-02-06 07:35:06.449121	2026-05-06 07:17:04.132708	Se observa trabajador sin equipo de proteccion completo.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000337.jpg"}	AUTO-000337	3	2	\N	\N	\N
341	1	1	2	1	2025-10-10 17:05:30.334625	2026-08-12 08:11:24.158983	Se reporta desprendimiento de componente mecanico.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000338.jpg"}	AUTO-000338	6	2	\N	\N	\N
342	2	1	3	2	2026-07-12 01:52:24.161506	2026-07-23 02:51:20.780033	Se detecta herramienta en condicion insegura.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000339.jpg"}	AUTO-000339	4	2	2026-07-23 02:51:21	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000339.jpg"}
343	4	1	1	1	2025-11-17 02:29:12.982263	2025-12-30 08:48:12.832063	Se observa material almacenado fuera del area autorizada.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000340.jpg"}	AUTO-000340	4	2	\N	\N	\N
344	4	1	3	2	2025-12-26 02:26:56.573681	2026-04-02 10:07:20.11514	Se identifica material obstruyendo una via de circulacion.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000341.jpg"}	AUTO-000341	5	2	\N	\N	\N
345	2	1	2	1	2026-07-10 15:41:02.938619	2026-09-14 22:54:58.739144	Se identifica condicion insegura en instalacion electrica.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000342.jpg"}	AUTO-000342	4	2	\N	\N	\N
346	3	1	3	2	2026-06-17 05:04:58.244623	2026-09-03 08:41:19.862856	Se observa area de trabajo con orden y limpieza deficientes.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000343.jpg"}	AUTO-000343	6	2	\N	\N	\N
347	3	1	3	2	2026-09-04 00:06:50.101097	2026-09-10 17:45:12.244178	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000344.jpg"}	AUTO-000344	5	2	\N	\N	\N
348	1	1	3	2	2025-10-06 13:24:04.207343	2026-07-09 03:44:15.380557	Se observa trabajador sin equipo de proteccion completo.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000345.jpg"}	AUTO-000345	4	2	\N	\N	\N
349	5	1	2	1	2026-01-05 08:26:19.230004	2026-02-26 07:25:45.557923	Se identifica falta de señalizacion preventiva.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000346.jpg"}	AUTO-000346	4	2	\N	\N	\N
350	1	1	3	2	2026-03-27 04:18:07.94383	2026-07-10 21:09:53.809884	Se detecta herramienta en condicion insegura.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000347.jpg"}	AUTO-000347	6	2	\N	\N	\N
351	1	1	3	2	2025-11-23 19:03:19.005155	2026-06-15 10:16:35.528699	Se detecta herramienta en condicion insegura.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000348.jpg"}	AUTO-000348	4	2	2026-06-15 10:16:36	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000348.jpg"}
352	2	1	3	2	2026-06-21 14:30:39.029406	2026-08-13 17:53:02.358684	Se detecta equipo sin inspeccion preventiva actualizada.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000349.jpg"}	AUTO-000349	3	2	\N	\N	\N
353	4	1	3	2	2026-02-17 00:02:16.056457	2026-04-23 20:51:14.384061	Se detecta cable electrico sin proteccion adecuada.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000350.jpg"}	AUTO-000350	6	2	\N	\N	\N
354	1	1	3	2	2026-09-01 09:56:48.607115	2026-09-07 00:10:21.901512	Se reporta desprendimiento de componente mecanico.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000351.jpg"}	AUTO-000351	3	2	\N	\N	\N
355	2	1	3	2	2025-10-07 13:20:27.212888	2026-08-29 18:44:31.220431	Se reporta desprendimiento de componente mecanico.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000352.jpg"}	AUTO-000352	3	2	2026-08-29 18:44:31	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000352.jpg"}
356	5	1	3	2	2026-01-05 11:28:09.061926	2026-03-25 20:44:37.767943	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000353.jpg"}	AUTO-000353	4	2	2026-03-25 20:44:38	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000353.jpg"}
357	1	1	1	1	2025-12-28 05:53:34.971365	2026-04-29 07:51:27.498232	Se detecta equipo sin inspeccion preventiva actualizada.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000354.jpg"}	AUTO-000354	6	2	\N	\N	\N
358	4	1	2	1	2026-06-03 16:07:48.969646	2026-06-19 03:34:32.181417	Se detecta herramienta en condicion insegura.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000355.jpg"}	AUTO-000355	3	2	2026-06-19 03:34:32	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000355.jpg"}
359	4	1	3	2	2025-11-23 03:51:44.403208	2026-04-10 21:39:17.085044	Se identifica material obstruyendo una via de circulacion.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000356.jpg"}	AUTO-000356	3	2	\N	\N	\N
360	4	1	2	1	2025-10-08 20:10:38.015211	2026-06-02 15:38:38.466311	Se detecta cable electrico sin proteccion adecuada.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000357.jpg"}	AUTO-000357	4	2	\N	\N	\N
361	3	1	1	1	2026-06-16 20:54:19.0091	2026-08-07 16:44:46.029153	Se observa oportunidad de mejora en procedimiento de mantenimiento.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000358.jpg"}	AUTO-000358	6	2	\N	\N	\N
362	1	1	3	2	2026-07-03 11:27:08.520308	2026-07-04 01:41:00.05687	Se identifica material obstruyendo una via de circulacion.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000359.jpg"}	AUTO-000359	5	2	\N	\N	\N
363	1	1	1	1	2026-07-30 02:44:05.623591	2026-08-26 13:57:51.542591	Se observa trabajador sin equipo de proteccion completo.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000360.jpg"}	AUTO-000360	5	2	\N	\N	\N
364	3	1	3	2	2025-10-10 17:44:04.710847	2025-12-12 04:49:38.791564	Se detecta elemento de proteccion deteriorado.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000361.jpg"}	AUTO-000361	6	2	\N	\N	\N
365	1	1	2	1	2026-05-17 13:35:08.193246	2026-07-14 16:13:00.014642	Se detecta elemento de proteccion deteriorado.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000362.jpg"}	AUTO-000362	3	2	\N	\N	\N
366	5	1	3	2	2026-04-05 10:25:23.092254	2026-08-14 19:31:07.664813	Se identifica material obstruyendo una via de circulacion.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000363.jpg"}	AUTO-000363	5	2	2026-08-14 19:31:08	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000363.jpg"}
367	3	1	2	1	2026-02-23 08:53:59.590808	2026-09-10 17:58:11.733642	Se observa trabajador sin equipo de proteccion completo.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000364.jpg"}	AUTO-000364	3	2	\N	\N	\N
368	5	1	3	2	2026-03-04 17:40:17.852902	2026-10-01 03:49:43.965671	Se observa material almacenado fuera del area autorizada.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000365.jpg"}	AUTO-000365	4	2	\N	\N	\N
369	5	1	1	1	2025-11-28 10:46:38.175577	2026-06-11 16:52:53.047398	Se reporta uso incorrecto de herramienta manual.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000366.jpg"}	AUTO-000366	4	2	2026-06-11 16:52:53	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000366.jpg"}
370	2	1	2	1	2026-07-18 09:59:32.872092	2026-07-19 15:23:31.777352	Se identifica falta de señalizacion preventiva.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000367.jpg"}	AUTO-000367	3	2	2026-07-19 15:23:32	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000367.jpg"}
371	1	1	3	2	2026-08-25 15:26:15.779978	2026-09-23 02:34:01.22843	Se identifica material obstruyendo una via de circulacion.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000368.jpg"}	AUTO-000368	3	2	\N	\N	\N
372	1	1	3	2	2026-05-08 00:03:30.277755	2026-08-13 12:03:04.325439	Se observa trabajador sin equipo de proteccion completo.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000369.jpg"}	AUTO-000369	5	2	2026-08-13 12:03:04	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000369.jpg"}
373	5	1	3	2	2026-04-03 16:48:03.394799	2026-07-03 02:58:11.704801	Se identifica falta de señalizacion preventiva.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000370.jpg"}	AUTO-000370	5	2	\N	\N	\N
374	4	1	2	1	2026-01-08 16:00:09.00459	2026-04-29 08:58:06.180551	Se identifica material obstruyendo una via de circulacion.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000371.jpg"}	AUTO-000371	3	2	2026-04-29 08:58:06	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000371.jpg"}
375	3	1	3	2	2025-11-15 06:13:30.227722	2026-01-28 19:17:40.659888	Se detecta herramienta en condicion insegura.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000372.jpg"}	AUTO-000372	6	2	2026-01-28 19:17:41	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000372.jpg"}
376	2	1	2	1	2026-04-08 00:35:20.259047	2026-09-06 11:09:55.304367	Se observa derrame menor en sector de trabajo.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000373.jpg"}	AUTO-000373	5	2	\N	\N	\N
377	3	1	1	1	2026-08-04 21:46:20.404187	2026-08-16 06:59:30.977056	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000374.jpg"}	AUTO-000374	6	2	2026-08-16 06:59:31	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000374.jpg"}
378	5	1	3	2	2026-06-11 11:49:06.620243	2026-08-14 03:11:55.437037	Se identifica falta de señalizacion preventiva.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000375.jpg"}	AUTO-000375	6	2	\N	\N	\N
379	1	1	1	1	2025-12-01 22:58:07.437869	2026-07-30 11:16:16.955122	Se reporta uso incorrecto de herramienta manual.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000376.jpg"}	AUTO-000376	5	2	\N	\N	\N
380	3	1	3	2	2026-05-27 09:54:49.541054	2026-07-05 19:50:16.4106	Se identifica falta de señalizacion preventiva.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000377.jpg"}	AUTO-000377	6	2	\N	\N	\N
381	4	1	2	1	2026-04-15 20:55:36.972726	2026-05-08 07:22:02.504222	Se observa trabajador sin equipo de proteccion completo.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000378.jpg"}	AUTO-000378	3	2	\N	\N	\N
382	3	1	1	1	2025-10-14 00:25:36.087978	2026-06-12 22:20:07.31528	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000379.jpg"}	AUTO-000379	3	2	\N	\N	\N
383	2	1	1	1	2025-11-18 23:42:48.149286	2026-06-27 18:27:13.34752	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000380.jpg"}	AUTO-000380	3	2	2026-06-27 18:27:13	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000380.jpg"}
384	3	1	2	1	2026-06-29 12:38:51.281293	2026-09-14 05:17:36.998905	Se reporta desprendimiento de componente mecanico.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000381.jpg"}	AUTO-000381	6	2	2026-09-14 05:17:37	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000381.jpg"}
385	4	1	3	2	2025-11-18 01:28:07.201789	2026-08-06 09:55:43.889947	Se detecta herramienta en condicion insegura.	en_revision	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000382.jpg"}	AUTO-000382	5	2	\N	\N	\N
386	1	1	3	2	2025-11-23 04:39:32.905278	2026-06-16 23:18:19.980258	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000383.jpg"}	AUTO-000383	5	2	2026-06-16 23:18:20	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000383.jpg"}
387	1	1	1	1	2026-04-25 12:42:41.600538	2026-06-22 09:25:53.468031	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000384.jpg"}	AUTO-000384	3	2	\N	\N	\N
388	4	1	3	2	2026-08-15 03:10:43.344007	2026-09-17 10:02:03.616781	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000385.jpg"}	AUTO-000385	3	2	\N	\N	\N
389	1	1	2	1	2026-09-01 01:11:38.695194	2026-09-14 00:18:25.54535	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000386.jpg"}	AUTO-000386	6	2	\N	\N	\N
390	1	1	2	1	2025-11-18 16:03:38.296747	2026-05-11 07:47:55.348983	Se observa derrame menor en sector de trabajo.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000387.jpg"}	AUTO-000387	4	2	2026-05-11 07:47:55	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000387.jpg"}
391	5	1	2	1	2026-03-28 00:55:06.74282	2026-08-28 18:19:33.576509	Se observa area de trabajo con orden y limpieza deficientes.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000388.jpg"}	AUTO-000388	6	2	\N	\N	\N
392	5	1	3	2	2025-11-19 11:40:24.808424	2026-06-11 02:16:25.482929	Se identifica condicion insegura en instalacion electrica.	en_revision	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000389.jpg"}	AUTO-000389	3	2	\N	\N	\N
393	5	1	2	1	2026-01-06 00:17:20.080416	2026-06-12 05:55:28.76564	Se identifica condicion insegura en instalacion electrica.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000390.jpg"}	AUTO-000390	5	2	\N	\N	\N
394	1	1	2	1	2026-03-26 18:56:45.064643	2026-04-22 12:50:10.012844	Se detecta elemento de proteccion deteriorado.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000391.jpg"}	AUTO-000391	4	2	\N	\N	\N
395	1	1	2	1	2026-04-18 14:19:49.232013	2026-04-24 08:10:45.694422	Se detecta herramienta en condicion insegura.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000392.jpg"}	AUTO-000392	6	2	\N	\N	\N
396	4	1	3	2	2026-02-16 23:02:58.383348	2026-07-05 12:01:55.071152	Se detecta cable electrico sin proteccion adecuada.	abierto	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000393.jpg"}	AUTO-000393	4	2	\N	\N	\N
397	2	1	2	1	2026-03-06 02:39:01.645572	2026-06-18 10:05:54.300967	Se observa derrame menor en sector de trabajo.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000394.jpg"}	AUTO-000394	4	2	\N	\N	\N
398	5	1	3	2	2026-09-23 13:34:38.257156	2026-09-30 23:55:22.382084	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000395.jpg"}	AUTO-000395	3	2	2026-09-30 23:55:22	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000395.jpg"}
399	4	1	1	1	2026-07-09 00:51:23.022956	2026-08-04 16:35:54.063058	Se observa material almacenado fuera del area autorizada.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000396.jpg"}	AUTO-000396	5	2	\N	\N	\N
400	1	1	3	2	2026-05-14 20:09:07.556881	2026-08-02 01:50:28.902605	Se identifica condicion insegura en instalacion electrica.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000397.jpg"}	AUTO-000397	5	2	\N	\N	\N
401	3	1	3	2	2026-01-03 11:32:06.730085	2026-06-15 16:24:34.348103	Se observa derrame menor en sector de trabajo.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000398.jpg"}	AUTO-000398	4	2	2026-06-15 16:24:34	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000398.jpg"}
402	1	1	1	1	2026-02-05 16:52:10.574641	2026-02-26 11:52:26.848279	Se identifica condicion insegura en instalacion electrica.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000399.jpg"}	AUTO-000399	3	2	\N	\N	\N
403	1	1	3	2	2026-03-23 00:31:03.297164	2026-06-06 13:14:00.563735	Se observa trabajador sin equipo de proteccion completo.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000400.jpg"}	AUTO-000400	5	2	2026-06-06 13:14:01	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000400.jpg"}
404	4	1	1	1	2026-09-10 19:54:54.865357	2026-09-23 19:30:53.485424	Se observa trabajador sin equipo de proteccion completo.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000401.jpg"}	AUTO-000401	6	2	2026-09-23 19:30:53	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000401.jpg"}
405	4	1	3	2	2025-12-01 17:03:35.488113	2026-04-11 12:59:51.888763	Se observa area de trabajo con orden y limpieza deficientes.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000402.jpg"}	AUTO-000402	6	2	\N	\N	\N
406	2	1	1	1	2026-09-22 06:35:24.296467	2026-09-24 00:20:53.177665	Se identifica falta de señalizacion preventiva.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000403.jpg"}	AUTO-000403	6	2	2026-09-24 00:20:53	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000403.jpg"}
407	1	1	3	2	2026-09-12 03:43:02.697206	2026-09-24 02:50:40.821991	Se reporta uso incorrecto de herramienta manual.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000404.jpg"}	AUTO-000404	3	2	\N	\N	\N
408	3	1	3	2	2026-06-23 10:34:32.804677	2026-07-03 10:18:59.07252	Se identifica condicion insegura en instalacion electrica.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000405.jpg"}	AUTO-000405	5	2	\N	\N	\N
409	5	1	3	2	2025-12-31 07:11:07.653272	2026-05-23 21:17:04.04204	Se observa material almacenado fuera del area autorizada.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000406.jpg"}	AUTO-000406	4	2	\N	\N	\N
410	3	1	3	2	2026-08-08 14:42:32.999099	2026-08-25 05:43:12.131813	Se detecta herramienta en condicion insegura.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000407.jpg"}	AUTO-000407	3	2	\N	\N	\N
411	3	1	3	2	2026-09-11 03:53:37.825928	2026-09-12 01:00:00.504829	Se detecta elemento de proteccion deteriorado.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000408.jpg"}	AUTO-000408	3	2	\N	\N	\N
412	4	1	3	2	2026-04-23 19:06:56.409779	2026-08-03 18:17:19.273307	Se observa material almacenado fuera del area autorizada.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000409.jpg"}	AUTO-000409	5	2	\N	\N	\N
413	1	1	1	1	2026-05-10 00:33:13.154677	2026-06-03 01:20:47.231745	Se detecta equipo sin inspeccion preventiva actualizada.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000410.jpg"}	AUTO-000410	3	2	\N	\N	\N
414	2	1	2	1	2025-10-09 17:16:51.053141	2025-11-29 22:02:04.261252	Se observa area de trabajo con orden y limpieza deficientes.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000411.jpg"}	AUTO-000411	6	2	\N	\N	\N
415	1	1	3	2	2025-12-02 12:29:33.285873	2025-12-17 04:35:31.71059	Se detecta elemento de proteccion deteriorado.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000412.jpg"}	AUTO-000412	5	2	2025-12-17 04:35:32	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000412.jpg"}
416	2	1	2	1	2026-02-05 09:46:58.209042	2026-04-01 22:46:50.227758	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000413.jpg"}	AUTO-000413	6	2	\N	\N	\N
417	2	1	2	1	2025-10-31 13:33:14.898073	2026-05-17 06:12:46.782409	Se observa area de trabajo con orden y limpieza deficientes.	cerrado	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000414.jpg"}	AUTO-000414	5	2	2026-05-17 06:12:47	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000414.jpg"}
418	1	1	3	2	2026-07-28 11:50:46.015755	2026-09-17 05:59:45.77401	Se detecta cable electrico sin proteccion adecuada.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000415.jpg"}	AUTO-000415	5	2	\N	\N	\N
419	3	1	3	2	2026-05-15 05:50:53.263469	2026-08-26 00:24:17.114016	Se observa area de trabajo con orden y limpieza deficientes.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000416.jpg"}	AUTO-000416	6	2	\N	\N	\N
449	2	1	1	1	2025-11-21 18:52:22.13593	2026-03-14 08:43:23.048643	Se detecta cable electrico sin proteccion adecuada.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000446.jpg"}	AUTO-000446	5	2	\N	\N	\N
420	1	1	2	1	2026-08-24 22:29:34.591057	2026-09-08 05:15:56.773493	Se identifica material obstruyendo una via de circulacion.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000417.jpg"}	AUTO-000417	3	2	2026-09-08 05:15:57	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000417.jpg"}
421	3	1	1	1	2026-01-27 02:35:35.637322	2026-06-01 20:43:20.145111	Se observa area de trabajo con orden y limpieza deficientes.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000418.jpg"}	AUTO-000418	5	2	\N	\N	\N
422	5	1	2	1	2026-02-06 00:23:16.909733	2026-09-09 04:44:30.028165	Se observa area de trabajo con orden y limpieza deficientes.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000419.jpg"}	AUTO-000419	3	2	\N	\N	\N
423	5	1	1	1	2026-08-25 08:39:19.234181	2026-09-27 15:31:19.421913	Se detecta herramienta en condicion insegura.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000420.jpg"}	AUTO-000420	6	2	\N	\N	\N
424	3	1	2	1	2026-04-26 11:02:38.788575	2026-09-11 10:34:29.235393	Se identifica falta de señalizacion preventiva.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000421.jpg"}	AUTO-000421	4	2	\N	\N	\N
425	1	1	1	1	2026-05-14 08:21:09.845648	2026-09-05 22:47:52.079808	Se detecta cable electrico sin proteccion adecuada.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000422.jpg"}	AUTO-000422	6	2	\N	\N	\N
426	1	1	1	1	2026-02-24 20:22:44.943463	2026-08-27 20:09:57.753855	Se observa material almacenado fuera del area autorizada.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000423.jpg"}	AUTO-000423	5	2	\N	\N	\N
427	2	1	3	2	2025-10-29 11:11:56.330208	2026-03-27 11:58:29.557867	Se detecta cable electrico sin proteccion adecuada.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000424.jpg"}	AUTO-000424	4	2	\N	\N	\N
428	5	1	3	2	2026-01-08 06:03:08.550487	2026-03-25 14:37:04.949669	Se observa derrame menor en sector de trabajo.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000425.jpg"}	AUTO-000425	3	2	\N	\N	\N
429	3	1	3	2	2026-07-20 12:10:59.492899	2026-07-28 18:14:23.545052	Se reporta uso incorrecto de herramienta manual.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000426.jpg"}	AUTO-000426	6	2	\N	\N	\N
430	1	1	3	2	2025-12-03 21:38:31.944229	2026-07-30 15:00:46.80794	Se identifica material obstruyendo una via de circulacion.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000427.jpg"}	AUTO-000427	3	2	\N	\N	\N
431	2	1	1	1	2026-09-16 17:37:59.249426	2026-09-25 23:00:26.789546	Se identifica falta de señalizacion preventiva.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000428.jpg"}	AUTO-000428	5	2	\N	\N	\N
432	1	1	1	1	2026-04-27 00:19:44.215114	2026-06-30 08:27:19.432828	Se observa trabajador sin equipo de proteccion completo.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000429.jpg"}	AUTO-000429	3	2	\N	\N	\N
433	1	1	1	1	2025-10-08 10:05:51.309968	2026-07-29 11:46:52.90931	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000430.jpg"}	AUTO-000430	5	2	2026-07-29 11:46:53	Supervisor verifica que la condicion fue solucionada.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000430.jpg"}
434	5	1	2	1	2026-09-01 17:49:11.607319	2026-09-14 12:38:20.811217	Se observa derrame menor en sector de trabajo.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000431.jpg"}	AUTO-000431	4	2	\N	\N	\N
435	4	1	3	2	2026-05-11 05:31:05.535635	2026-08-03 16:59:47.078387	Se detecta herramienta en condicion insegura.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000432.jpg"}	AUTO-000432	4	2	\N	\N	\N
436	4	1	2	1	2025-12-12 18:00:54.929961	2026-03-16 04:57:06.615255	Se identifica material obstruyendo una via de circulacion.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000433.jpg"}	AUTO-000433	4	2	\N	\N	\N
437	5	1	3	2	2026-08-27 03:26:43.435717	2026-09-10 22:26:48.513752	Se observa trabajador sin equipo de proteccion completo.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000434.jpg"}	AUTO-000434	4	2	\N	\N	\N
438	3	1	2	1	2026-02-07 14:22:44.745599	2026-06-14 06:21:58.237339	Se identifica condicion insegura en instalacion electrica.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000435.jpg"}	AUTO-000435	6	2	\N	\N	\N
439	4	1	3	2	2026-01-31 06:07:56.078554	2026-06-21 23:56:58.123397	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000436.jpg"}	AUTO-000436	5	2	\N	\N	\N
440	5	1	3	2	2026-06-02 09:14:06.759766	2026-06-07 23:55:46.870711	Se observa oportunidad de mejora en procedimiento de mantenimiento.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000437.jpg"}	AUTO-000437	4	2	\N	\N	\N
441	3	1	3	2	2025-11-20 01:30:26.191596	2026-07-24 09:09:49.577178	Se identifica falta de señalizacion preventiva.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000438.jpg"}	AUTO-000438	3	2	\N	\N	\N
442	4	1	3	2	2026-09-08 07:29:01.355028	2026-09-19 17:48:39.79973	Se observa area de trabajo con orden y limpieza deficientes.	abierto	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000439.jpg"}	AUTO-000439	3	2	\N	\N	\N
443	4	1	3	2	2026-05-15 15:25:02.604259	2026-09-11 05:27:51.127121	Se identifica falta de señalizacion preventiva.	abierto	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000440.jpg"}	AUTO-000440	5	2	\N	\N	\N
444	2	1	3	2	2026-08-28 20:16:31.050729	2026-09-29 04:59:21.406632	Se detecta riesgo asociado a trabajo en altura.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000441.jpg"}	AUTO-000441	3	2	\N	\N	\N
445	3	1	1	1	2026-04-18 15:31:10.021908	2026-05-16 15:28:41.687265	Se identifica falta de señalizacion preventiva.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000442.jpg"}	AUTO-000442	4	2	2026-05-16 15:28:42	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000442.jpg"}
446	2	1	1	1	2026-08-17 16:05:28.824082	2026-08-19 01:54:05.37685	Se identifica falta de señalizacion preventiva.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000443.jpg"}	AUTO-000443	5	2	\N	\N	\N
447	3	1	2	1	2026-09-26 11:26:19.258425	2026-09-27 11:54:24.723016	Se detecta elemento de proteccion deteriorado.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000444.jpg"}	AUTO-000444	6	2	\N	\N	\N
448	3	1	3	2	2026-07-16 09:55:28.264002	2026-08-14 21:52:12.60323	Se identifica falta de señalizacion preventiva.	cerrado	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000445.jpg"}	AUTO-000445	5	2	2026-08-14 21:52:13	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000445.jpg"}
450	3	1	1	1	2026-05-09 12:16:44.221453	2026-08-03 11:30:05.470136	Se observa area de trabajo con orden y limpieza deficientes.	abierto	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000447.jpg"}	AUTO-000447	6	2	\N	\N	\N
451	4	1	3	2	2026-05-29 01:50:13.161474	2026-08-27 16:15:14.819331	Se detecta cable electrico sin proteccion adecuada.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000448.jpg"}	AUTO-000448	6	2	2026-08-27 16:15:15	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000448.jpg"}
452	4	1	3	2	2026-02-23 02:30:35.136949	2026-09-17 12:28:13.00676	Se reporta desprendimiento de componente mecanico.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000449.jpg"}	AUTO-000449	6	2	\N	\N	\N
453	4	1	1	1	2025-12-29 19:18:46.893178	2026-05-04 08:19:20.157217	Se identifica condicion insegura en instalacion electrica.	cerrado	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000450.jpg"}	AUTO-000450	5	2	2026-05-04 08:19:20	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000450.jpg"}
454	4	1	3	2	2025-12-26 01:21:42.479242	2026-06-13 23:59:56.807097	Se observa derrame menor en sector de trabajo.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000451.jpg"}	AUTO-000451	6	2	2026-06-13 23:59:57	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000451.jpg"}
455	5	1	3	2	2025-11-12 10:16:35.409719	2026-04-12 02:37:55.243348	Se detecta equipo sin inspeccion preventiva actualizada.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000452.jpg"}	AUTO-000452	3	2	\N	\N	\N
456	1	1	3	2	2026-02-27 04:39:51.125167	2026-08-06 19:04:51.733607	Se detecta cable electrico sin proteccion adecuada.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000453.jpg"}	AUTO-000453	3	2	\N	\N	\N
457	3	1	1	1	2026-06-10 01:58:33.857615	2026-07-17 16:35:02.516194	Se observa derrame menor en sector de trabajo.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000454.jpg"}	AUTO-000454	3	2	2026-07-17 16:35:03	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000454.jpg"}
458	2	1	3	2	2026-06-21 01:02:54.036955	2026-08-22 10:42:57.605024	Se detecta herramienta en condicion insegura.	en_revision	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000455.jpg"}	AUTO-000455	6	2	\N	\N	\N
459	2	1	3	2	2026-05-12 02:38:55.316386	2026-08-17 21:01:45.860356	Se identifica material obstruyendo una via de circulacion.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000456.jpg"}	AUTO-000456	4	2	\N	\N	\N
460	4	1	2	1	2025-12-28 02:00:55.337456	2026-06-03 09:18:33.424775	Se detecta cable electrico sin proteccion adecuada.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000457.jpg"}	AUTO-000457	5	2	\N	\N	\N
461	4	1	3	2	2025-11-19 11:59:15.192191	2025-11-26 22:08:25.311713	Se identifica condicion insegura en instalacion electrica.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000458.jpg"}	AUTO-000458	3	2	2025-11-26 22:08:25	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000458.jpg"}
462	4	1	3	2	2026-04-25 18:12:22.423174	2026-06-12 12:58:43.661171	Se observa material almacenado fuera del area autorizada.	abierto	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000459.jpg"}	AUTO-000459	4	2	\N	\N	\N
463	1	1	1	1	2025-11-21 16:31:07.641837	2026-05-12 19:49:29.38361	Se detecta cable electrico sin proteccion adecuada.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000460.jpg"}	AUTO-000460	4	2	2026-05-12 19:49:29	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000460.jpg"}
464	3	1	3	2	2026-01-01 08:20:22.60969	2026-09-27 19:08:39.463522	Se identifica falta de señalizacion preventiva.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000461.jpg"}	AUTO-000461	3	2	\N	\N	\N
465	1	1	1	1	2026-01-18 03:30:03.751987	2026-03-14 16:57:14.438726	Se reporta uso incorrecto de herramienta manual.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000462.jpg"}	AUTO-000462	3	2	2026-03-14 16:57:14	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000462.jpg"}
466	3	1	1	1	2026-07-06 04:15:43.667334	2026-07-31 00:36:15.655109	Se reporta uso incorrecto de herramienta manual.	cerrado	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000463.jpg"}	AUTO-000463	5	2	2026-07-31 00:36:16	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000463.jpg"}
467	1	1	3	2	2026-01-24 18:53:17.821027	2026-07-01 21:53:14.690233	Se observa area de trabajo con orden y limpieza deficientes.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000464.jpg"}	AUTO-000464	5	2	\N	\N	\N
468	2	1	2	1	2026-05-03 12:55:44.191509	2026-07-10 00:55:13.688971	Se detecta cable electrico sin proteccion adecuada.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000465.jpg"}	AUTO-000465	4	2	\N	\N	\N
469	3	1	3	2	2026-01-29 19:49:43.36092	2026-06-23 02:01:23.870842	Se identifica condicion insegura en instalacion electrica.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000466.jpg"}	AUTO-000466	5	2	\N	\N	\N
470	5	1	2	1	2026-01-25 03:17:05.287578	2026-07-03 15:42:13.870327	Se identifica material obstruyendo una via de circulacion.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000467.jpg"}	AUTO-000467	5	2	\N	\N	\N
471	4	1	3	2	2026-01-02 13:51:22.110362	2026-03-29 18:25:36.720436	Se identifica falta de señalizacion preventiva.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000468.jpg"}	AUTO-000468	5	2	\N	\N	\N
472	3	1	1	1	2025-10-12 11:08:43.390806	2026-07-01 15:15:28.333521	Se detecta cable electrico sin proteccion adecuada.	cerrado	7	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000469.jpg"}	AUTO-000469	3	2	2026-07-01 15:15:28	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000469.jpg"}
473	1	1	3	2	2026-01-29 12:50:50.634338	2026-09-08 07:02:31.646467	Se observa derrame menor en sector de trabajo.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000470.jpg"}	AUTO-000470	3	2	\N	\N	\N
474	3	1	3	2	2025-12-20 01:20:40.324429	2026-01-20 17:13:56.963116	Se identifica material obstruyendo una via de circulacion.	en_revision	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000471.jpg"}	AUTO-000471	6	2	\N	\N	\N
475	4	1	3	2	2026-08-03 12:00:33.058296	2026-09-17 01:15:52.896336	Se detecta cable electrico sin proteccion adecuada.	cerrado	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000472.jpg"}	AUTO-000472	6	2	2026-09-17 01:15:53	Medida de control implementada correctamente.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000472.jpg"}
476	2	1	3	2	2026-04-25 09:25:00.574785	2026-05-05 01:41:49.738129	Se detecta herramienta en condicion insegura.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000473.jpg"}	AUTO-000473	6	2	\N	\N	\N
477	4	1	2	1	2026-08-06 19:42:07.252367	2026-09-06 01:14:36.182903	Se detecta herramienta en condicion insegura.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000474.jpg"}	AUTO-000474	5	2	\N	\N	\N
478	1	1	3	2	2026-02-26 13:32:58.300066	2026-08-13 16:37:38.089658	Se identifica material obstruyendo una via de circulacion.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000475.jpg"}	AUTO-000475	6	2	\N	\N	\N
479	3	1	1	1	2026-08-23 19:36:09.497331	2026-08-30 12:28:43.844664	Se identifica condicion insegura en instalacion electrica.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000476.jpg"}	AUTO-000476	6	2	\N	\N	\N
480	4	1	2	1	2026-05-23 16:32:45.627779	2026-07-01 00:44:28.454181	Se reporta uso incorrecto de herramienta manual.	en_revision	4	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000477.jpg"}	AUTO-000477	3	2	\N	\N	\N
481	2	1	3	2	2025-10-11 05:17:11.736348	2026-05-20 02:01:31.810519	Se reporta desprendimiento de componente mecanico.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000478.jpg"}	AUTO-000478	5	2	\N	\N	\N
482	3	1	3	2	2025-12-20 01:37:17.489972	2026-03-29 21:22:11.606376	Se detecta elemento de proteccion deteriorado.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000479.jpg"}	AUTO-000479	3	2	\N	\N	\N
483	4	1	2	1	2026-09-21 20:45:12.500544	2026-09-22 23:03:12.993288	Se identifica falta de señalizacion preventiva.	en_revision	9	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000480.jpg"}	AUTO-000480	5	2	\N	\N	\N
484	3	1	2	1	2026-09-29 06:49:54.945921	2026-09-30 06:38:52.66044	Se identifica condicion insegura en instalacion electrica.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000481.jpg"}	AUTO-000481	4	2	\N	\N	\N
485	1	1	3	2	2025-10-17 06:00:11.604157	2026-03-13 02:06:57.573118	Se observa trabajador sin equipo de proteccion completo.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000482.jpg"}	AUTO-000482	4	2	\N	\N	\N
486	2	1	3	2	2026-02-06 07:11:20.597618	2026-03-18 07:27:14.019806	Se detecta equipo sin inspeccion preventiva actualizada.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000483.jpg"}	AUTO-000483	3	2	2026-03-18 07:27:14	Riesgo mitigado y evento validado para cierre.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000483.jpg"}
487	2	1	3	2	2025-11-26 08:38:24.632726	2026-09-25 09:34:15.454439	Se reporta desprendimiento de componente mecanico.	abierto	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000484.jpg"}	AUTO-000484	5	2	\N	\N	\N
488	1	1	1	1	2026-09-12 22:01:19.694871	2026-09-30 16:38:51.347244	Se identifica falta de señalizacion preventiva.	abierto	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000485.jpg"}	AUTO-000485	4	2	\N	\N	\N
489	2	1	3	2	2026-09-21 01:49:42.372846	2026-09-28 06:18:21.975202	Se observa area de trabajo con orden y limpieza deficientes.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000486.jpg"}	AUTO-000486	3	2	\N	\N	\N
490	1	1	3	2	2025-10-07 13:48:49.721672	2025-10-19 00:54:06.43121	Se identifica falta de señalizacion preventiva.	en_revision	10	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000487.jpg"}	AUTO-000487	6	2	\N	\N	\N
491	3	1	2	1	2026-06-13 22:34:08.867779	2026-09-19 21:25:12.636994	Se detecta riesgo asociado a trabajo en altura.	en_revision	2	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000488.jpg"}	AUTO-000488	5	2	\N	\N	\N
492	1	1	2	1	2026-04-04 05:19:08.475022	2026-09-09 17:34:30.815928	Se observa oportunidad de mejora en procedimiento de mantenimiento.	cerrado	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000489.jpg"}	AUTO-000489	6	2	2026-09-09 17:34:31	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000489.jpg"}
493	3	1	3	2	2025-11-07 15:29:33.748882	2026-02-19 23:04:41.450201	Se detecta elemento de proteccion deteriorado.	en_revision	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000490.jpg"}	AUTO-000490	4	2	\N	\N	\N
494	5	1	2	1	2026-02-13 19:21:46.067251	2026-02-22 08:05:59.108098	Se observa material almacenado fuera del area autorizada.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000491.jpg"}	AUTO-000491	6	2	\N	\N	\N
495	5	1	3	2	2026-03-20 11:07:15.352536	2026-05-11 01:37:11.236473	Se observa trabajador sin equipo de proteccion completo.	cerrado	3	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000492.jpg"}	AUTO-000492	4	2	2026-05-11 01:37:11	Hallazgo controlado mediante accion correctiva.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000492.jpg"}
496	5	1	1	1	2025-10-10 23:41:19.050936	2026-08-03 22:03:04.252841	Se observa material almacenado fuera del area autorizada.	en_revision	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000493.jpg"}	AUTO-000493	3	2	\N	\N	\N
497	3	1	1	1	2025-12-23 14:54:45.069398	2026-06-28 03:39:08.760496	Se observa material almacenado fuera del area autorizada.	abierto	8	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000494.jpg"}	AUTO-000494	6	2	\N	\N	\N
498	2	1	2	1	2026-05-30 04:25:23.485482	2026-08-18 19:31:35.009148	Se identifica condicion insegura en instalacion electrica.	cerrado	5	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000495.jpg"}	AUTO-000495	3	2	2026-08-18 19:31:35	Condicion corregida y verificada en terreno.	{"tipo" : "fotografia_cierre", "archivo" : "cierre_evento_000495.jpg"}
499	1	1	1	1	2026-06-28 19:16:40.599911	2026-09-13 15:24:47.212274	Se reporta uso incorrecto de herramienta manual.	abierto	6	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000496.jpg"}	AUTO-000496	3	2	\N	\N	\N
500	3	1	3	2	2025-12-26 11:10:12.47404	2026-06-22 05:06:18.606474	Se detecta riesgo asociado a trabajo en altura.	abierto	1	{"tipo" : "fotografia", "archivo" : "evidencia_evento_000497.jpg"}	AUTO-000497	4	2	\N	\N	\N
501	4	\N	\N	1	2026-11-01 16:52:48	2026-11-01 16:52:48	Registro de prueba para verificar la sincronización entre Flutter, Laravel y PostgreSQL.	abierta	1	[]	Prueba integracion ava movil	1	\N	\N	\N	\N
502	4	1	\N	1	2026-11-01 21:07:50	2026-11-01 21:09:00	Faltaba agua y tenia que limpiarme	cerrada	6	[]	fuente de agua	1	\N	2026-11-01 21:09:00	Se le entrego agua	[]
\.


--
-- Data for Name: evidencias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evidencias (id_evidencia, id_evento, nombre, ruta, tipo_archivo, fecha_creacion) FROM stdin;
1	1	foto_cable_01.jpg	/evidencias/eventos/1/foto_cable_01.jpg	image/jpeg	2026-09-23 19:07:40.327097
2	1	foto_cable_02.jpg	/evidencias/eventos/1/foto_cable_02.jpg	image/jpeg	2026-09-23 19:07:40.327097
3	2	informe_incidente.pdf	/evidencias/eventos/2/informe_incidente.pdf	application/pdf	2026-09-23 19:07:40.327097
4	4	evidencia_AUTO-000001.jpg	/evidencias/eventos/4/evidencia_AUTO-000001.jpg	image/jpeg	2026-09-23 16:40:14.950718
5	5	evidencia_AUTO-000002.jpg	/evidencias/eventos/5/evidencia_AUTO-000002.jpg	image/jpeg	2026-02-27 14:56:45.011139
6	6	evidencia_AUTO-000003.jpg	/evidencias/eventos/6/evidencia_AUTO-000003.jpg	image/jpeg	2026-07-17 09:39:46.601865
7	7	evidencia_AUTO-000004.jpg	/evidencias/eventos/7/evidencia_AUTO-000004.jpg	image/jpeg	2026-05-21 22:49:09.763433
8	8	evidencia_AUTO-000005.jpg	/evidencias/eventos/8/evidencia_AUTO-000005.jpg	image/jpeg	2026-01-05 23:09:25.479689
9	9	evidencia_AUTO-000006.jpg	/evidencias/eventos/9/evidencia_AUTO-000006.jpg	image/jpeg	2025-11-17 06:53:25.538722
10	10	evidencia_AUTO-000007.jpg	/evidencias/eventos/10/evidencia_AUTO-000007.jpg	image/jpeg	2026-06-09 01:10:21.881807
11	11	evidencia_AUTO-000008.jpg	/evidencias/eventos/11/evidencia_AUTO-000008.jpg	image/jpeg	2026-05-13 15:37:59.541026
12	12	evidencia_AUTO-000009.jpg	/evidencias/eventos/12/evidencia_AUTO-000009.jpg	image/jpeg	2025-12-19 02:25:30.948356
13	13	evidencia_AUTO-000010.jpg	/evidencias/eventos/13/evidencia_AUTO-000010.jpg	image/jpeg	2026-01-26 18:05:43.328523
14	14	evidencia_AUTO-000011.jpg	/evidencias/eventos/14/evidencia_AUTO-000011.jpg	image/jpeg	2026-07-04 21:13:18.538688
15	15	evidencia_AUTO-000012.jpg	/evidencias/eventos/15/evidencia_AUTO-000012.jpg	image/jpeg	2025-12-26 08:37:11.434303
16	16	evidencia_AUTO-000013.jpg	/evidencias/eventos/16/evidencia_AUTO-000013.jpg	image/jpeg	2026-06-13 18:09:36.269866
17	17	evidencia_AUTO-000014.jpg	/evidencias/eventos/17/evidencia_AUTO-000014.jpg	image/jpeg	2026-05-01 08:55:40.702414
18	18	evidencia_AUTO-000015.jpg	/evidencias/eventos/18/evidencia_AUTO-000015.jpg	image/jpeg	2026-09-05 11:13:11.990799
19	19	evidencia_AUTO-000016.jpg	/evidencias/eventos/19/evidencia_AUTO-000016.jpg	image/jpeg	2026-06-06 08:09:52.129297
20	20	evidencia_AUTO-000017.jpg	/evidencias/eventos/20/evidencia_AUTO-000017.jpg	image/jpeg	2026-08-29 21:51:05.558446
21	21	evidencia_AUTO-000018.jpg	/evidencias/eventos/21/evidencia_AUTO-000018.jpg	image/jpeg	2026-08-10 03:51:06.211409
22	22	evidencia_AUTO-000019.jpg	/evidencias/eventos/22/evidencia_AUTO-000019.jpg	image/jpeg	2026-03-28 01:15:02.462095
23	23	evidencia_AUTO-000020.jpg	/evidencias/eventos/23/evidencia_AUTO-000020.jpg	image/jpeg	2025-10-26 17:10:44.02877
24	24	evidencia_AUTO-000021.jpg	/evidencias/eventos/24/evidencia_AUTO-000021.jpg	image/jpeg	2026-06-20 05:12:02.876736
25	25	evidencia_AUTO-000022.jpg	/evidencias/eventos/25/evidencia_AUTO-000022.jpg	image/jpeg	2026-08-17 17:37:13.302555
26	26	evidencia_AUTO-000023.jpg	/evidencias/eventos/26/evidencia_AUTO-000023.jpg	image/jpeg	2026-03-05 14:48:07.592182
27	27	evidencia_AUTO-000024.jpg	/evidencias/eventos/27/evidencia_AUTO-000024.jpg	image/jpeg	2026-01-26 18:14:16.251423
28	28	evidencia_AUTO-000025.jpg	/evidencias/eventos/28/evidencia_AUTO-000025.jpg	image/jpeg	2025-12-31 10:50:12.026559
29	29	evidencia_AUTO-000026.jpg	/evidencias/eventos/29/evidencia_AUTO-000026.jpg	image/jpeg	2025-11-04 05:08:41.737541
30	30	evidencia_AUTO-000027.jpg	/evidencias/eventos/30/evidencia_AUTO-000027.jpg	image/jpeg	2026-09-30 14:26:16.340175
31	31	evidencia_AUTO-000028.jpg	/evidencias/eventos/31/evidencia_AUTO-000028.jpg	image/jpeg	2025-10-13 00:17:27.559403
32	32	evidencia_AUTO-000029.jpg	/evidencias/eventos/32/evidencia_AUTO-000029.jpg	image/jpeg	2026-07-23 13:45:03.517283
33	33	evidencia_AUTO-000030.jpg	/evidencias/eventos/33/evidencia_AUTO-000030.jpg	image/jpeg	2025-12-06 22:56:25.554833
34	34	evidencia_AUTO-000031.jpg	/evidencias/eventos/34/evidencia_AUTO-000031.jpg	image/jpeg	2026-02-19 00:51:08.409413
35	35	evidencia_AUTO-000032.jpg	/evidencias/eventos/35/evidencia_AUTO-000032.jpg	image/jpeg	2025-10-28 14:54:05.205289
36	36	evidencia_AUTO-000033.jpg	/evidencias/eventos/36/evidencia_AUTO-000033.jpg	image/jpeg	2026-01-29 20:41:43.914216
37	37	evidencia_AUTO-000034.jpg	/evidencias/eventos/37/evidencia_AUTO-000034.jpg	image/jpeg	2026-04-22 16:37:39.310513
38	38	evidencia_AUTO-000035.jpg	/evidencias/eventos/38/evidencia_AUTO-000035.jpg	image/jpeg	2025-11-11 22:07:16.293384
39	39	evidencia_AUTO-000036.jpg	/evidencias/eventos/39/evidencia_AUTO-000036.jpg	image/jpeg	2026-09-07 12:40:24.629523
40	40	evidencia_AUTO-000037.jpg	/evidencias/eventos/40/evidencia_AUTO-000037.jpg	image/jpeg	2026-09-09 07:07:07.150151
41	41	evidencia_AUTO-000038.jpg	/evidencias/eventos/41/evidencia_AUTO-000038.jpg	image/jpeg	2026-03-15 20:46:27.038311
42	42	evidencia_AUTO-000039.jpg	/evidencias/eventos/42/evidencia_AUTO-000039.jpg	image/jpeg	2026-09-12 07:56:27.4156
43	43	evidencia_AUTO-000040.jpg	/evidencias/eventos/43/evidencia_AUTO-000040.jpg	image/jpeg	2026-03-07 12:10:53.792813
44	44	evidencia_AUTO-000041.jpg	/evidencias/eventos/44/evidencia_AUTO-000041.jpg	image/jpeg	2026-02-16 06:20:47.981573
45	45	evidencia_AUTO-000042.jpg	/evidencias/eventos/45/evidencia_AUTO-000042.jpg	image/jpeg	2026-06-03 06:43:28.573459
46	46	evidencia_AUTO-000043.jpg	/evidencias/eventos/46/evidencia_AUTO-000043.jpg	image/jpeg	2025-12-01 22:52:23.141271
47	47	evidencia_AUTO-000044.jpg	/evidencias/eventos/47/evidencia_AUTO-000044.jpg	image/jpeg	2026-07-13 08:55:32.78665
48	48	evidencia_AUTO-000045.jpg	/evidencias/eventos/48/evidencia_AUTO-000045.jpg	image/jpeg	2026-05-17 02:20:48.837597
49	49	evidencia_AUTO-000046.jpg	/evidencias/eventos/49/evidencia_AUTO-000046.jpg	image/jpeg	2026-06-05 09:28:46.341139
50	50	evidencia_AUTO-000047.jpg	/evidencias/eventos/50/evidencia_AUTO-000047.jpg	image/jpeg	2025-12-06 16:36:44.915455
51	51	evidencia_AUTO-000048.jpg	/evidencias/eventos/51/evidencia_AUTO-000048.jpg	image/jpeg	2026-07-22 02:19:45.469035
52	52	evidencia_AUTO-000049.jpg	/evidencias/eventos/52/evidencia_AUTO-000049.jpg	image/jpeg	2026-04-06 08:22:15.520052
53	53	evidencia_AUTO-000050.jpg	/evidencias/eventos/53/evidencia_AUTO-000050.jpg	image/jpeg	2026-02-19 09:57:41.124236
54	54	evidencia_AUTO-000051.jpg	/evidencias/eventos/54/evidencia_AUTO-000051.jpg	image/jpeg	2025-11-29 08:39:02.116259
55	55	evidencia_AUTO-000052.jpg	/evidencias/eventos/55/evidencia_AUTO-000052.jpg	image/jpeg	2026-01-05 09:54:39.992955
56	56	evidencia_AUTO-000053.jpg	/evidencias/eventos/56/evidencia_AUTO-000053.jpg	image/jpeg	2026-09-24 20:33:10.506352
57	57	evidencia_AUTO-000054.jpg	/evidencias/eventos/57/evidencia_AUTO-000054.jpg	image/jpeg	2025-10-30 23:08:08.936149
58	58	evidencia_AUTO-000055.jpg	/evidencias/eventos/58/evidencia_AUTO-000055.jpg	image/jpeg	2025-12-06 16:18:28.078367
59	59	evidencia_AUTO-000056.jpg	/evidencias/eventos/59/evidencia_AUTO-000056.jpg	image/jpeg	2026-03-25 02:17:40.655268
60	60	evidencia_AUTO-000057.jpg	/evidencias/eventos/60/evidencia_AUTO-000057.jpg	image/jpeg	2026-02-12 06:31:06.815674
61	61	evidencia_AUTO-000058.jpg	/evidencias/eventos/61/evidencia_AUTO-000058.jpg	image/jpeg	2026-04-07 03:21:04.102206
62	62	evidencia_AUTO-000059.jpg	/evidencias/eventos/62/evidencia_AUTO-000059.jpg	image/jpeg	2026-03-01 02:34:03.735772
63	63	evidencia_AUTO-000060.jpg	/evidencias/eventos/63/evidencia_AUTO-000060.jpg	image/jpeg	2026-09-27 07:32:59.700363
64	64	evidencia_AUTO-000061.jpg	/evidencias/eventos/64/evidencia_AUTO-000061.jpg	image/jpeg	2026-03-17 16:12:44.267443
65	65	evidencia_AUTO-000062.jpg	/evidencias/eventos/65/evidencia_AUTO-000062.jpg	image/jpeg	2025-10-30 14:53:09.32944
66	66	evidencia_AUTO-000063.jpg	/evidencias/eventos/66/evidencia_AUTO-000063.jpg	image/jpeg	2026-08-30 19:29:16.219289
67	67	evidencia_AUTO-000064.jpg	/evidencias/eventos/67/evidencia_AUTO-000064.jpg	image/jpeg	2026-07-20 10:18:13.008675
68	68	evidencia_AUTO-000065.jpg	/evidencias/eventos/68/evidencia_AUTO-000065.jpg	image/jpeg	2026-08-22 04:05:06.15506
69	69	evidencia_AUTO-000066.jpg	/evidencias/eventos/69/evidencia_AUTO-000066.jpg	image/jpeg	2025-12-07 17:55:27.211503
70	70	evidencia_AUTO-000067.jpg	/evidencias/eventos/70/evidencia_AUTO-000067.jpg	image/jpeg	2026-09-25 07:46:17.311921
71	71	evidencia_AUTO-000068.jpg	/evidencias/eventos/71/evidencia_AUTO-000068.jpg	image/jpeg	2025-10-10 04:25:10.839755
72	72	evidencia_AUTO-000069.jpg	/evidencias/eventos/72/evidencia_AUTO-000069.jpg	image/jpeg	2026-02-03 08:31:39.354177
73	73	evidencia_AUTO-000070.jpg	/evidencias/eventos/73/evidencia_AUTO-000070.jpg	image/jpeg	2026-03-04 04:31:15.710191
74	74	evidencia_AUTO-000071.jpg	/evidencias/eventos/74/evidencia_AUTO-000071.jpg	image/jpeg	2026-02-08 10:11:57.547444
75	75	evidencia_AUTO-000072.jpg	/evidencias/eventos/75/evidencia_AUTO-000072.jpg	image/jpeg	2026-05-08 23:16:08.732051
76	76	evidencia_AUTO-000073.jpg	/evidencias/eventos/76/evidencia_AUTO-000073.jpg	image/jpeg	2026-03-10 06:27:20.529178
77	77	evidencia_AUTO-000074.jpg	/evidencias/eventos/77/evidencia_AUTO-000074.jpg	image/jpeg	2026-03-03 06:21:55.912913
78	78	evidencia_AUTO-000075.jpg	/evidencias/eventos/78/evidencia_AUTO-000075.jpg	image/jpeg	2026-01-11 09:47:22.609456
79	79	evidencia_AUTO-000076.jpg	/evidencias/eventos/79/evidencia_AUTO-000076.jpg	image/jpeg	2026-09-26 13:29:08.621366
80	80	evidencia_AUTO-000077.jpg	/evidencias/eventos/80/evidencia_AUTO-000077.jpg	image/jpeg	2026-05-24 00:34:37.037651
81	81	evidencia_AUTO-000078.jpg	/evidencias/eventos/81/evidencia_AUTO-000078.jpg	image/jpeg	2026-04-21 16:41:28.774492
82	82	evidencia_AUTO-000079.jpg	/evidencias/eventos/82/evidencia_AUTO-000079.jpg	image/jpeg	2025-12-13 07:13:22.487199
83	83	evidencia_AUTO-000080.jpg	/evidencias/eventos/83/evidencia_AUTO-000080.jpg	image/jpeg	2025-11-03 20:23:15.11271
84	84	evidencia_AUTO-000081.jpg	/evidencias/eventos/84/evidencia_AUTO-000081.jpg	image/jpeg	2026-08-25 13:30:36.882996
85	85	evidencia_AUTO-000082.jpg	/evidencias/eventos/85/evidencia_AUTO-000082.jpg	image/jpeg	2026-05-11 11:39:05.496464
86	86	evidencia_AUTO-000083.jpg	/evidencias/eventos/86/evidencia_AUTO-000083.jpg	image/jpeg	2025-12-09 09:55:43.158077
87	87	evidencia_AUTO-000084.jpg	/evidencias/eventos/87/evidencia_AUTO-000084.jpg	image/jpeg	2025-10-07 02:36:24.580161
88	88	evidencia_AUTO-000085.jpg	/evidencias/eventos/88/evidencia_AUTO-000085.jpg	image/jpeg	2026-02-12 14:03:51.265433
89	89	evidencia_AUTO-000086.jpg	/evidencias/eventos/89/evidencia_AUTO-000086.jpg	image/jpeg	2026-09-09 23:49:49.057879
90	90	evidencia_AUTO-000087.jpg	/evidencias/eventos/90/evidencia_AUTO-000087.jpg	image/jpeg	2026-02-19 18:14:30.194058
91	91	evidencia_AUTO-000088.jpg	/evidencias/eventos/91/evidencia_AUTO-000088.jpg	image/jpeg	2026-03-30 20:47:56.995683
92	92	evidencia_AUTO-000089.jpg	/evidencias/eventos/92/evidencia_AUTO-000089.jpg	image/jpeg	2026-06-01 01:32:37.330415
93	93	evidencia_AUTO-000090.jpg	/evidencias/eventos/93/evidencia_AUTO-000090.jpg	image/jpeg	2026-07-22 15:23:57.654692
94	94	evidencia_AUTO-000091.jpg	/evidencias/eventos/94/evidencia_AUTO-000091.jpg	image/jpeg	2026-01-15 06:40:08.242629
95	95	evidencia_AUTO-000092.jpg	/evidencias/eventos/95/evidencia_AUTO-000092.jpg	image/jpeg	2026-07-16 22:56:39.950566
96	96	evidencia_AUTO-000093.jpg	/evidencias/eventos/96/evidencia_AUTO-000093.jpg	image/jpeg	2025-12-20 00:19:40.106442
97	97	evidencia_AUTO-000094.jpg	/evidencias/eventos/97/evidencia_AUTO-000094.jpg	image/jpeg	2026-09-07 16:35:34.911023
98	98	evidencia_AUTO-000095.jpg	/evidencias/eventos/98/evidencia_AUTO-000095.jpg	image/jpeg	2025-10-08 10:34:02.991256
99	99	evidencia_AUTO-000096.jpg	/evidencias/eventos/99/evidencia_AUTO-000096.jpg	image/jpeg	2026-08-31 16:09:24.263928
100	100	evidencia_AUTO-000097.jpg	/evidencias/eventos/100/evidencia_AUTO-000097.jpg	image/jpeg	2026-02-13 01:04:34.793065
101	101	evidencia_AUTO-000098.jpg	/evidencias/eventos/101/evidencia_AUTO-000098.jpg	image/jpeg	2025-10-18 00:11:16.556842
102	102	evidencia_AUTO-000099.jpg	/evidencias/eventos/102/evidencia_AUTO-000099.jpg	image/jpeg	2025-10-26 07:22:41.440805
103	103	evidencia_AUTO-000100.jpg	/evidencias/eventos/103/evidencia_AUTO-000100.jpg	image/jpeg	2026-02-12 07:12:46.544556
104	104	evidencia_AUTO-000101.jpg	/evidencias/eventos/104/evidencia_AUTO-000101.jpg	image/jpeg	2026-09-28 15:54:53.60735
105	105	evidencia_AUTO-000102.jpg	/evidencias/eventos/105/evidencia_AUTO-000102.jpg	image/jpeg	2026-03-15 13:56:58.006741
106	106	evidencia_AUTO-000103.jpg	/evidencias/eventos/106/evidencia_AUTO-000103.jpg	image/jpeg	2025-11-12 23:50:38.142543
107	107	evidencia_AUTO-000104.jpg	/evidencias/eventos/107/evidencia_AUTO-000104.jpg	image/jpeg	2026-05-01 06:22:15.60761
108	108	evidencia_AUTO-000105.jpg	/evidencias/eventos/108/evidencia_AUTO-000105.jpg	image/jpeg	2026-04-27 19:02:56.349956
109	109	evidencia_AUTO-000106.jpg	/evidencias/eventos/109/evidencia_AUTO-000106.jpg	image/jpeg	2025-12-29 11:02:43.695003
110	110	evidencia_AUTO-000107.jpg	/evidencias/eventos/110/evidencia_AUTO-000107.jpg	image/jpeg	2026-01-05 09:45:05.31629
111	111	evidencia_AUTO-000108.jpg	/evidencias/eventos/111/evidencia_AUTO-000108.jpg	image/jpeg	2026-01-21 03:47:09.432239
112	112	evidencia_AUTO-000109.jpg	/evidencias/eventos/112/evidencia_AUTO-000109.jpg	image/jpeg	2026-08-29 16:02:31.7833
113	113	evidencia_AUTO-000110.jpg	/evidencias/eventos/113/evidencia_AUTO-000110.jpg	image/jpeg	2025-10-16 05:10:34.090975
114	114	evidencia_AUTO-000111.jpg	/evidencias/eventos/114/evidencia_AUTO-000111.jpg	image/jpeg	2025-11-21 20:08:56.031233
115	115	evidencia_AUTO-000112.jpg	/evidencias/eventos/115/evidencia_AUTO-000112.jpg	image/jpeg	2026-04-16 23:32:27.870158
116	116	evidencia_AUTO-000113.jpg	/evidencias/eventos/116/evidencia_AUTO-000113.jpg	image/jpeg	2026-08-04 17:59:14.518503
117	117	evidencia_AUTO-000114.jpg	/evidencias/eventos/117/evidencia_AUTO-000114.jpg	image/jpeg	2026-03-23 14:18:27.944702
118	118	evidencia_AUTO-000115.jpg	/evidencias/eventos/118/evidencia_AUTO-000115.jpg	image/jpeg	2025-12-29 08:17:39.061498
119	119	evidencia_AUTO-000116.jpg	/evidencias/eventos/119/evidencia_AUTO-000116.jpg	image/jpeg	2026-02-05 05:00:09.36384
120	120	evidencia_AUTO-000117.jpg	/evidencias/eventos/120/evidencia_AUTO-000117.jpg	image/jpeg	2026-02-15 10:06:27.640647
121	121	evidencia_AUTO-000118.jpg	/evidencias/eventos/121/evidencia_AUTO-000118.jpg	image/jpeg	2026-06-04 05:48:28.715181
122	122	evidencia_AUTO-000119.jpg	/evidencias/eventos/122/evidencia_AUTO-000119.jpg	image/jpeg	2026-01-30 02:04:04.140166
123	123	evidencia_AUTO-000120.jpg	/evidencias/eventos/123/evidencia_AUTO-000120.jpg	image/jpeg	2025-11-20 12:15:31.391101
124	124	evidencia_AUTO-000121.jpg	/evidencias/eventos/124/evidencia_AUTO-000121.jpg	image/jpeg	2026-03-05 20:56:42.7183
125	125	evidencia_AUTO-000122.jpg	/evidencias/eventos/125/evidencia_AUTO-000122.jpg	image/jpeg	2026-06-08 18:45:47.541116
126	126	evidencia_AUTO-000123.jpg	/evidencias/eventos/126/evidencia_AUTO-000123.jpg	image/jpeg	2026-03-09 07:44:41.11328
127	127	evidencia_AUTO-000124.jpg	/evidencias/eventos/127/evidencia_AUTO-000124.jpg	image/jpeg	2026-05-18 01:42:50.053177
128	128	evidencia_AUTO-000125.jpg	/evidencias/eventos/128/evidencia_AUTO-000125.jpg	image/jpeg	2026-08-28 20:01:43.830757
129	129	evidencia_AUTO-000126.jpg	/evidencias/eventos/129/evidencia_AUTO-000126.jpg	image/jpeg	2025-12-02 17:52:11.73856
130	130	evidencia_AUTO-000127.jpg	/evidencias/eventos/130/evidencia_AUTO-000127.jpg	image/jpeg	2026-07-08 03:26:58.902053
131	131	evidencia_AUTO-000128.jpg	/evidencias/eventos/131/evidencia_AUTO-000128.jpg	image/jpeg	2026-02-13 00:06:27.323275
132	132	evidencia_AUTO-000129.jpg	/evidencias/eventos/132/evidencia_AUTO-000129.jpg	image/jpeg	2026-03-30 04:45:09.834343
133	133	evidencia_AUTO-000130.jpg	/evidencias/eventos/133/evidencia_AUTO-000130.jpg	image/jpeg	2026-04-11 22:43:35.627596
134	134	evidencia_AUTO-000131.jpg	/evidencias/eventos/134/evidencia_AUTO-000131.jpg	image/jpeg	2026-04-17 13:36:34.184044
135	135	evidencia_AUTO-000132.jpg	/evidencias/eventos/135/evidencia_AUTO-000132.jpg	image/jpeg	2025-10-15 10:48:33.802889
136	136	evidencia_AUTO-000133.jpg	/evidencias/eventos/136/evidencia_AUTO-000133.jpg	image/jpeg	2026-01-10 00:08:46.192149
137	137	evidencia_AUTO-000134.jpg	/evidencias/eventos/137/evidencia_AUTO-000134.jpg	image/jpeg	2026-01-05 08:51:06.606764
138	138	evidencia_AUTO-000135.jpg	/evidencias/eventos/138/evidencia_AUTO-000135.jpg	image/jpeg	2026-05-13 01:14:09.988369
139	139	evidencia_AUTO-000136.jpg	/evidencias/eventos/139/evidencia_AUTO-000136.jpg	image/jpeg	2025-12-01 07:55:05.990085
140	140	evidencia_AUTO-000137.jpg	/evidencias/eventos/140/evidencia_AUTO-000137.jpg	image/jpeg	2026-03-27 23:01:29.180883
141	141	evidencia_AUTO-000138.jpg	/evidencias/eventos/141/evidencia_AUTO-000138.jpg	image/jpeg	2026-01-23 11:27:55.415216
142	142	evidencia_AUTO-000139.jpg	/evidencias/eventos/142/evidencia_AUTO-000139.jpg	image/jpeg	2025-12-16 04:06:23.685442
143	143	evidencia_AUTO-000140.jpg	/evidencias/eventos/143/evidencia_AUTO-000140.jpg	image/jpeg	2025-11-10 09:10:53.585387
144	144	evidencia_AUTO-000141.jpg	/evidencias/eventos/144/evidencia_AUTO-000141.jpg	image/jpeg	2026-07-27 17:36:11.540018
145	145	evidencia_AUTO-000142.jpg	/evidencias/eventos/145/evidencia_AUTO-000142.jpg	image/jpeg	2026-03-07 15:33:52.821567
146	146	evidencia_AUTO-000143.jpg	/evidencias/eventos/146/evidencia_AUTO-000143.jpg	image/jpeg	2025-12-05 11:36:36.925437
147	147	evidencia_AUTO-000144.jpg	/evidencias/eventos/147/evidencia_AUTO-000144.jpg	image/jpeg	2025-12-15 15:34:18.297917
148	148	evidencia_AUTO-000145.jpg	/evidencias/eventos/148/evidencia_AUTO-000145.jpg	image/jpeg	2026-02-24 01:08:57.467134
149	149	evidencia_AUTO-000146.jpg	/evidencias/eventos/149/evidencia_AUTO-000146.jpg	image/jpeg	2026-06-28 00:23:31.687363
150	150	evidencia_AUTO-000147.jpg	/evidencias/eventos/150/evidencia_AUTO-000147.jpg	image/jpeg	2026-09-29 16:44:47.563036
151	151	evidencia_AUTO-000148.jpg	/evidencias/eventos/151/evidencia_AUTO-000148.jpg	image/jpeg	2026-08-24 05:37:05.497632
152	152	evidencia_AUTO-000149.jpg	/evidencias/eventos/152/evidencia_AUTO-000149.jpg	image/jpeg	2026-04-28 20:19:44.65767
153	153	evidencia_AUTO-000150.jpg	/evidencias/eventos/153/evidencia_AUTO-000150.jpg	image/jpeg	2026-05-23 02:26:05.068189
154	154	evidencia_AUTO-000151.jpg	/evidencias/eventos/154/evidencia_AUTO-000151.jpg	image/jpeg	2026-04-16 13:54:57.951533
155	155	evidencia_AUTO-000152.jpg	/evidencias/eventos/155/evidencia_AUTO-000152.jpg	image/jpeg	2026-08-06 23:34:23.405426
156	156	evidencia_AUTO-000153.jpg	/evidencias/eventos/156/evidencia_AUTO-000153.jpg	image/jpeg	2025-11-27 11:23:55.931876
157	157	evidencia_AUTO-000154.jpg	/evidencias/eventos/157/evidencia_AUTO-000154.jpg	image/jpeg	2026-01-03 05:41:59.394054
158	158	evidencia_AUTO-000155.jpg	/evidencias/eventos/158/evidencia_AUTO-000155.jpg	image/jpeg	2026-05-02 16:44:03.600996
159	159	evidencia_AUTO-000156.jpg	/evidencias/eventos/159/evidencia_AUTO-000156.jpg	image/jpeg	2026-04-14 06:03:33.147004
160	160	evidencia_AUTO-000157.jpg	/evidencias/eventos/160/evidencia_AUTO-000157.jpg	image/jpeg	2026-09-19 23:04:48.501328
161	161	evidencia_AUTO-000158.jpg	/evidencias/eventos/161/evidencia_AUTO-000158.jpg	image/jpeg	2025-11-06 10:08:53.839255
162	162	evidencia_AUTO-000159.jpg	/evidencias/eventos/162/evidencia_AUTO-000159.jpg	image/jpeg	2026-03-04 08:21:34.971982
163	163	evidencia_AUTO-000160.jpg	/evidencias/eventos/163/evidencia_AUTO-000160.jpg	image/jpeg	2026-03-30 05:55:40.396944
164	164	evidencia_AUTO-000161.jpg	/evidencias/eventos/164/evidencia_AUTO-000161.jpg	image/jpeg	2026-02-25 23:33:14.924117
165	165	evidencia_AUTO-000162.jpg	/evidencias/eventos/165/evidencia_AUTO-000162.jpg	image/jpeg	2025-11-26 21:06:23.474007
166	166	evidencia_AUTO-000163.jpg	/evidencias/eventos/166/evidencia_AUTO-000163.jpg	image/jpeg	2026-02-27 15:23:23.959659
167	167	evidencia_AUTO-000164.jpg	/evidencias/eventos/167/evidencia_AUTO-000164.jpg	image/jpeg	2026-08-07 17:38:02.27464
168	168	evidencia_AUTO-000165.jpg	/evidencias/eventos/168/evidencia_AUTO-000165.jpg	image/jpeg	2026-09-07 06:03:45.009899
169	169	evidencia_AUTO-000166.jpg	/evidencias/eventos/169/evidencia_AUTO-000166.jpg	image/jpeg	2026-02-08 22:21:29.638778
170	170	evidencia_AUTO-000167.jpg	/evidencias/eventos/170/evidencia_AUTO-000167.jpg	image/jpeg	2026-05-03 19:41:44.249397
171	171	evidencia_AUTO-000168.jpg	/evidencias/eventos/171/evidencia_AUTO-000168.jpg	image/jpeg	2026-07-22 16:46:01.679544
172	172	evidencia_AUTO-000169.jpg	/evidencias/eventos/172/evidencia_AUTO-000169.jpg	image/jpeg	2026-08-23 08:40:14.705791
173	173	evidencia_AUTO-000170.jpg	/evidencias/eventos/173/evidencia_AUTO-000170.jpg	image/jpeg	2025-12-18 19:15:27.677145
174	174	evidencia_AUTO-000171.jpg	/evidencias/eventos/174/evidencia_AUTO-000171.jpg	image/jpeg	2026-03-25 23:59:10.576471
175	175	evidencia_AUTO-000172.jpg	/evidencias/eventos/175/evidencia_AUTO-000172.jpg	image/jpeg	2026-04-25 15:09:27.088853
176	176	evidencia_AUTO-000173.jpg	/evidencias/eventos/176/evidencia_AUTO-000173.jpg	image/jpeg	2026-09-05 13:44:40.515772
177	177	evidencia_AUTO-000174.jpg	/evidencias/eventos/177/evidencia_AUTO-000174.jpg	image/jpeg	2026-03-01 07:22:42.933938
178	178	evidencia_AUTO-000175.jpg	/evidencias/eventos/178/evidencia_AUTO-000175.jpg	image/jpeg	2025-11-20 14:34:01.933311
179	179	evidencia_AUTO-000176.jpg	/evidencias/eventos/179/evidencia_AUTO-000176.jpg	image/jpeg	2025-11-14 13:45:14.497277
180	180	evidencia_AUTO-000177.jpg	/evidencias/eventos/180/evidencia_AUTO-000177.jpg	image/jpeg	2026-08-13 04:50:49.883472
181	181	evidencia_AUTO-000178.jpg	/evidencias/eventos/181/evidencia_AUTO-000178.jpg	image/jpeg	2026-09-13 06:56:34.052416
182	182	evidencia_AUTO-000179.jpg	/evidencias/eventos/182/evidencia_AUTO-000179.jpg	image/jpeg	2026-06-18 13:33:12.974393
183	183	evidencia_AUTO-000180.jpg	/evidencias/eventos/183/evidencia_AUTO-000180.jpg	image/jpeg	2026-04-08 09:51:34.727727
184	184	evidencia_AUTO-000181.jpg	/evidencias/eventos/184/evidencia_AUTO-000181.jpg	image/jpeg	2026-03-29 04:01:52.179618
185	185	evidencia_AUTO-000182.jpg	/evidencias/eventos/185/evidencia_AUTO-000182.jpg	image/jpeg	2026-02-05 22:38:23.497919
186	186	evidencia_AUTO-000183.jpg	/evidencias/eventos/186/evidencia_AUTO-000183.jpg	image/jpeg	2026-03-13 19:44:49.038363
187	187	evidencia_AUTO-000184.jpg	/evidencias/eventos/187/evidencia_AUTO-000184.jpg	image/jpeg	2026-09-01 03:30:43.040916
188	188	evidencia_AUTO-000185.jpg	/evidencias/eventos/188/evidencia_AUTO-000185.jpg	image/jpeg	2026-07-19 21:50:41.772794
189	189	evidencia_AUTO-000186.jpg	/evidencias/eventos/189/evidencia_AUTO-000186.jpg	image/jpeg	2026-08-09 19:20:46.623027
190	190	evidencia_AUTO-000187.jpg	/evidencias/eventos/190/evidencia_AUTO-000187.jpg	image/jpeg	2026-09-13 03:59:00.362381
191	191	evidencia_AUTO-000188.jpg	/evidencias/eventos/191/evidencia_AUTO-000188.jpg	image/jpeg	2026-01-10 12:15:23.22205
192	192	evidencia_AUTO-000189.jpg	/evidencias/eventos/192/evidencia_AUTO-000189.jpg	image/jpeg	2026-05-27 03:15:20.32834
193	193	evidencia_AUTO-000190.jpg	/evidencias/eventos/193/evidencia_AUTO-000190.jpg	image/jpeg	2026-06-10 20:01:53.271857
194	194	evidencia_AUTO-000191.jpg	/evidencias/eventos/194/evidencia_AUTO-000191.jpg	image/jpeg	2025-12-06 07:47:33.939775
195	195	evidencia_AUTO-000192.jpg	/evidencias/eventos/195/evidencia_AUTO-000192.jpg	image/jpeg	2026-05-02 09:09:04.161184
196	196	evidencia_AUTO-000193.jpg	/evidencias/eventos/196/evidencia_AUTO-000193.jpg	image/jpeg	2026-07-23 19:40:51.844722
197	197	evidencia_AUTO-000194.jpg	/evidencias/eventos/197/evidencia_AUTO-000194.jpg	image/jpeg	2026-04-12 13:09:21.832089
198	198	evidencia_AUTO-000195.jpg	/evidencias/eventos/198/evidencia_AUTO-000195.jpg	image/jpeg	2026-04-01 04:51:56.024588
199	199	evidencia_AUTO-000196.jpg	/evidencias/eventos/199/evidencia_AUTO-000196.jpg	image/jpeg	2026-04-18 13:42:25.229063
200	200	evidencia_AUTO-000197.jpg	/evidencias/eventos/200/evidencia_AUTO-000197.jpg	image/jpeg	2025-12-12 20:33:25.448019
201	201	evidencia_AUTO-000198.jpg	/evidencias/eventos/201/evidencia_AUTO-000198.jpg	image/jpeg	2026-04-06 17:48:47.368226
202	202	evidencia_AUTO-000199.jpg	/evidencias/eventos/202/evidencia_AUTO-000199.jpg	image/jpeg	2026-02-12 18:56:14.890732
203	203	evidencia_AUTO-000200.jpg	/evidencias/eventos/203/evidencia_AUTO-000200.jpg	image/jpeg	2025-10-11 13:33:01.509968
204	204	evidencia_AUTO-000201.jpg	/evidencias/eventos/204/evidencia_AUTO-000201.jpg	image/jpeg	2026-08-01 02:17:12.582218
205	205	evidencia_AUTO-000202.jpg	/evidencias/eventos/205/evidencia_AUTO-000202.jpg	image/jpeg	2025-10-31 01:26:33.08806
206	206	evidencia_AUTO-000203.jpg	/evidencias/eventos/206/evidencia_AUTO-000203.jpg	image/jpeg	2025-10-11 04:43:50.773508
207	207	evidencia_AUTO-000204.jpg	/evidencias/eventos/207/evidencia_AUTO-000204.jpg	image/jpeg	2026-02-26 10:23:14.762287
208	208	evidencia_AUTO-000205.jpg	/evidencias/eventos/208/evidencia_AUTO-000205.jpg	image/jpeg	2026-06-25 20:25:06.837117
209	209	evidencia_AUTO-000206.jpg	/evidencias/eventos/209/evidencia_AUTO-000206.jpg	image/jpeg	2026-03-15 06:49:27.359391
210	210	evidencia_AUTO-000207.jpg	/evidencias/eventos/210/evidencia_AUTO-000207.jpg	image/jpeg	2026-02-03 20:16:29.244221
211	211	evidencia_AUTO-000208.jpg	/evidencias/eventos/211/evidencia_AUTO-000208.jpg	image/jpeg	2026-02-09 13:06:05.768349
212	212	evidencia_AUTO-000209.jpg	/evidencias/eventos/212/evidencia_AUTO-000209.jpg	image/jpeg	2026-02-20 08:10:09.518042
213	213	evidencia_AUTO-000210.jpg	/evidencias/eventos/213/evidencia_AUTO-000210.jpg	image/jpeg	2026-02-16 12:56:44.074819
214	214	evidencia_AUTO-000211.jpg	/evidencias/eventos/214/evidencia_AUTO-000211.jpg	image/jpeg	2025-11-06 18:37:09.324642
215	215	evidencia_AUTO-000212.jpg	/evidencias/eventos/215/evidencia_AUTO-000212.jpg	image/jpeg	2026-05-08 12:20:04.02066
216	216	evidencia_AUTO-000213.jpg	/evidencias/eventos/216/evidencia_AUTO-000213.jpg	image/jpeg	2026-03-31 22:14:42.237805
217	217	evidencia_AUTO-000214.jpg	/evidencias/eventos/217/evidencia_AUTO-000214.jpg	image/jpeg	2026-06-16 10:43:13.124881
218	218	evidencia_AUTO-000215.jpg	/evidencias/eventos/218/evidencia_AUTO-000215.jpg	image/jpeg	2025-12-05 03:27:30.026779
219	219	evidencia_AUTO-000216.jpg	/evidencias/eventos/219/evidencia_AUTO-000216.jpg	image/jpeg	2026-02-24 06:56:47.21386
220	220	evidencia_AUTO-000217.jpg	/evidencias/eventos/220/evidencia_AUTO-000217.jpg	image/jpeg	2026-04-28 20:26:22.442211
221	221	evidencia_AUTO-000218.jpg	/evidencias/eventos/221/evidencia_AUTO-000218.jpg	image/jpeg	2026-01-22 02:38:18.571824
222	222	evidencia_AUTO-000219.jpg	/evidencias/eventos/222/evidencia_AUTO-000219.jpg	image/jpeg	2026-04-07 13:00:47.1102
223	223	evidencia_AUTO-000220.jpg	/evidencias/eventos/223/evidencia_AUTO-000220.jpg	image/jpeg	2026-01-20 20:15:22.102378
224	224	evidencia_AUTO-000221.jpg	/evidencias/eventos/224/evidencia_AUTO-000221.jpg	image/jpeg	2026-07-25 07:03:12.170374
225	225	evidencia_AUTO-000222.jpg	/evidencias/eventos/225/evidencia_AUTO-000222.jpg	image/jpeg	2026-01-13 16:50:02.011606
226	226	evidencia_AUTO-000223.jpg	/evidencias/eventos/226/evidencia_AUTO-000223.jpg	image/jpeg	2026-07-05 03:59:57.495573
227	227	evidencia_AUTO-000224.jpg	/evidencias/eventos/227/evidencia_AUTO-000224.jpg	image/jpeg	2026-05-04 18:28:09.279378
228	228	evidencia_AUTO-000225.jpg	/evidencias/eventos/228/evidencia_AUTO-000225.jpg	image/jpeg	2026-07-03 11:19:37.751897
229	229	evidencia_AUTO-000226.jpg	/evidencias/eventos/229/evidencia_AUTO-000226.jpg	image/jpeg	2025-11-22 00:15:49.102296
230	230	evidencia_AUTO-000227.jpg	/evidencias/eventos/230/evidencia_AUTO-000227.jpg	image/jpeg	2026-03-11 01:08:13.990029
231	231	evidencia_AUTO-000228.jpg	/evidencias/eventos/231/evidencia_AUTO-000228.jpg	image/jpeg	2026-08-05 06:03:32.520827
232	232	evidencia_AUTO-000229.jpg	/evidencias/eventos/232/evidencia_AUTO-000229.jpg	image/jpeg	2026-01-06 13:47:20.517201
233	233	evidencia_AUTO-000230.jpg	/evidencias/eventos/233/evidencia_AUTO-000230.jpg	image/jpeg	2026-05-08 04:52:02.622637
234	234	evidencia_AUTO-000231.jpg	/evidencias/eventos/234/evidencia_AUTO-000231.jpg	image/jpeg	2026-02-01 10:32:06.908562
235	235	evidencia_AUTO-000232.jpg	/evidencias/eventos/235/evidencia_AUTO-000232.jpg	image/jpeg	2026-01-04 09:12:03.330563
236	236	evidencia_AUTO-000233.jpg	/evidencias/eventos/236/evidencia_AUTO-000233.jpg	image/jpeg	2026-05-08 16:17:48.450904
237	237	evidencia_AUTO-000234.jpg	/evidencias/eventos/237/evidencia_AUTO-000234.jpg	image/jpeg	2026-01-31 11:51:07.820758
238	238	evidencia_AUTO-000235.jpg	/evidencias/eventos/238/evidencia_AUTO-000235.jpg	image/jpeg	2025-11-29 17:58:50.326587
239	239	evidencia_AUTO-000236.jpg	/evidencias/eventos/239/evidencia_AUTO-000236.jpg	image/jpeg	2026-09-14 19:28:19.739277
240	240	evidencia_AUTO-000237.jpg	/evidencias/eventos/240/evidencia_AUTO-000237.jpg	image/jpeg	2025-12-03 04:42:27.256401
241	241	evidencia_AUTO-000238.jpg	/evidencias/eventos/241/evidencia_AUTO-000238.jpg	image/jpeg	2026-06-16 02:49:21.950477
242	242	evidencia_AUTO-000239.jpg	/evidencias/eventos/242/evidencia_AUTO-000239.jpg	image/jpeg	2026-06-17 13:17:37.505935
243	243	evidencia_AUTO-000240.jpg	/evidencias/eventos/243/evidencia_AUTO-000240.jpg	image/jpeg	2026-03-18 17:08:05.259211
244	244	evidencia_AUTO-000241.jpg	/evidencias/eventos/244/evidencia_AUTO-000241.jpg	image/jpeg	2026-03-17 00:41:53.128517
245	245	evidencia_AUTO-000242.jpg	/evidencias/eventos/245/evidencia_AUTO-000242.jpg	image/jpeg	2026-05-02 10:37:42.904191
246	246	evidencia_AUTO-000243.jpg	/evidencias/eventos/246/evidencia_AUTO-000243.jpg	image/jpeg	2025-11-26 15:39:44.969918
247	247	evidencia_AUTO-000244.jpg	/evidencias/eventos/247/evidencia_AUTO-000244.jpg	image/jpeg	2026-02-10 08:23:24.2502
248	248	evidencia_AUTO-000245.jpg	/evidencias/eventos/248/evidencia_AUTO-000245.jpg	image/jpeg	2026-01-09 03:49:12.743714
249	249	evidencia_AUTO-000246.jpg	/evidencias/eventos/249/evidencia_AUTO-000246.jpg	image/jpeg	2026-04-08 12:50:53.124618
250	250	evidencia_AUTO-000247.jpg	/evidencias/eventos/250/evidencia_AUTO-000247.jpg	image/jpeg	2026-06-12 16:08:49.479681
251	251	evidencia_AUTO-000248.jpg	/evidencias/eventos/251/evidencia_AUTO-000248.jpg	image/jpeg	2026-09-05 20:20:35.59447
252	252	evidencia_AUTO-000249.jpg	/evidencias/eventos/252/evidencia_AUTO-000249.jpg	image/jpeg	2026-09-17 12:44:50.102495
253	253	evidencia_AUTO-000250.jpg	/evidencias/eventos/253/evidencia_AUTO-000250.jpg	image/jpeg	2026-09-28 19:17:47.926982
254	254	evidencia_AUTO-000251.jpg	/evidencias/eventos/254/evidencia_AUTO-000251.jpg	image/jpeg	2026-03-21 12:35:55.236357
255	255	evidencia_AUTO-000252.jpg	/evidencias/eventos/255/evidencia_AUTO-000252.jpg	image/jpeg	2026-06-11 22:29:09.382751
256	256	evidencia_AUTO-000253.jpg	/evidencias/eventos/256/evidencia_AUTO-000253.jpg	image/jpeg	2025-11-26 05:27:30.620013
257	257	evidencia_AUTO-000254.jpg	/evidencias/eventos/257/evidencia_AUTO-000254.jpg	image/jpeg	2026-03-03 16:01:20.456381
258	258	evidencia_AUTO-000255.jpg	/evidencias/eventos/258/evidencia_AUTO-000255.jpg	image/jpeg	2026-03-17 08:35:31.874298
259	259	evidencia_AUTO-000256.jpg	/evidencias/eventos/259/evidencia_AUTO-000256.jpg	image/jpeg	2025-11-24 11:27:34.545068
260	260	evidencia_AUTO-000257.jpg	/evidencias/eventos/260/evidencia_AUTO-000257.jpg	image/jpeg	2026-04-29 00:42:41.005774
261	261	evidencia_AUTO-000258.jpg	/evidencias/eventos/261/evidencia_AUTO-000258.jpg	image/jpeg	2026-07-28 06:11:27.238245
262	262	evidencia_AUTO-000259.jpg	/evidencias/eventos/262/evidencia_AUTO-000259.jpg	image/jpeg	2026-01-23 07:58:46.54903
263	263	evidencia_AUTO-000260.jpg	/evidencias/eventos/263/evidencia_AUTO-000260.jpg	image/jpeg	2026-07-21 01:21:53.525867
264	264	evidencia_AUTO-000261.jpg	/evidencias/eventos/264/evidencia_AUTO-000261.jpg	image/jpeg	2026-05-20 14:35:20.235181
265	265	evidencia_AUTO-000262.jpg	/evidencias/eventos/265/evidencia_AUTO-000262.jpg	image/jpeg	2026-05-15 01:58:22.488828
266	266	evidencia_AUTO-000263.jpg	/evidencias/eventos/266/evidencia_AUTO-000263.jpg	image/jpeg	2026-07-28 05:15:00.636704
267	267	evidencia_AUTO-000264.jpg	/evidencias/eventos/267/evidencia_AUTO-000264.jpg	image/jpeg	2026-02-08 17:20:28.208548
268	268	evidencia_AUTO-000265.jpg	/evidencias/eventos/268/evidencia_AUTO-000265.jpg	image/jpeg	2025-10-14 05:48:30.502071
269	269	evidencia_AUTO-000266.jpg	/evidencias/eventos/269/evidencia_AUTO-000266.jpg	image/jpeg	2025-10-26 01:42:46.332045
270	270	evidencia_AUTO-000267.jpg	/evidencias/eventos/270/evidencia_AUTO-000267.jpg	image/jpeg	2025-12-15 09:54:35.13521
271	271	evidencia_AUTO-000268.jpg	/evidencias/eventos/271/evidencia_AUTO-000268.jpg	image/jpeg	2026-09-27 15:58:54.767109
272	272	evidencia_AUTO-000269.jpg	/evidencias/eventos/272/evidencia_AUTO-000269.jpg	image/jpeg	2026-01-03 23:41:55.571548
273	273	evidencia_AUTO-000270.jpg	/evidencias/eventos/273/evidencia_AUTO-000270.jpg	image/jpeg	2025-12-01 01:30:22.811906
274	274	evidencia_AUTO-000271.jpg	/evidencias/eventos/274/evidencia_AUTO-000271.jpg	image/jpeg	2025-11-03 19:14:46.803128
275	275	evidencia_AUTO-000272.jpg	/evidencias/eventos/275/evidencia_AUTO-000272.jpg	image/jpeg	2026-03-04 20:38:03.67327
276	276	evidencia_AUTO-000273.jpg	/evidencias/eventos/276/evidencia_AUTO-000273.jpg	image/jpeg	2025-11-30 05:21:42.389211
277	277	evidencia_AUTO-000274.jpg	/evidencias/eventos/277/evidencia_AUTO-000274.jpg	image/jpeg	2026-01-15 21:14:03.602509
278	278	evidencia_AUTO-000275.jpg	/evidencias/eventos/278/evidencia_AUTO-000275.jpg	image/jpeg	2026-08-10 19:59:34.312391
279	279	evidencia_AUTO-000276.jpg	/evidencias/eventos/279/evidencia_AUTO-000276.jpg	image/jpeg	2026-03-25 18:35:10.323159
280	280	evidencia_AUTO-000277.jpg	/evidencias/eventos/280/evidencia_AUTO-000277.jpg	image/jpeg	2026-01-21 21:55:00.112836
281	281	evidencia_AUTO-000278.jpg	/evidencias/eventos/281/evidencia_AUTO-000278.jpg	image/jpeg	2026-05-03 17:02:31.302165
282	282	evidencia_AUTO-000279.jpg	/evidencias/eventos/282/evidencia_AUTO-000279.jpg	image/jpeg	2026-09-29 08:57:38.767043
283	283	evidencia_AUTO-000280.jpg	/evidencias/eventos/283/evidencia_AUTO-000280.jpg	image/jpeg	2026-04-30 18:19:13.441936
284	284	evidencia_AUTO-000281.jpg	/evidencias/eventos/284/evidencia_AUTO-000281.jpg	image/jpeg	2026-08-30 16:23:37.701198
285	285	evidencia_AUTO-000282.jpg	/evidencias/eventos/285/evidencia_AUTO-000282.jpg	image/jpeg	2026-07-21 17:47:02.85148
286	286	evidencia_AUTO-000283.jpg	/evidencias/eventos/286/evidencia_AUTO-000283.jpg	image/jpeg	2026-08-02 13:46:59.963665
287	287	evidencia_AUTO-000284.jpg	/evidencias/eventos/287/evidencia_AUTO-000284.jpg	image/jpeg	2025-10-19 16:02:45.680382
288	288	evidencia_AUTO-000285.jpg	/evidencias/eventos/288/evidencia_AUTO-000285.jpg	image/jpeg	2025-12-03 20:13:45.916479
289	289	evidencia_AUTO-000286.jpg	/evidencias/eventos/289/evidencia_AUTO-000286.jpg	image/jpeg	2026-07-23 20:36:47.143914
290	290	evidencia_AUTO-000287.jpg	/evidencias/eventos/290/evidencia_AUTO-000287.jpg	image/jpeg	2025-12-30 22:06:56.128701
291	291	evidencia_AUTO-000288.jpg	/evidencias/eventos/291/evidencia_AUTO-000288.jpg	image/jpeg	2026-09-09 22:15:29.240578
292	292	evidencia_AUTO-000289.jpg	/evidencias/eventos/292/evidencia_AUTO-000289.jpg	image/jpeg	2026-04-09 00:35:24.342845
293	293	evidencia_AUTO-000290.jpg	/evidencias/eventos/293/evidencia_AUTO-000290.jpg	image/jpeg	2025-12-09 12:41:50.409746
294	294	evidencia_AUTO-000291.jpg	/evidencias/eventos/294/evidencia_AUTO-000291.jpg	image/jpeg	2025-11-08 20:12:20.834828
295	295	evidencia_AUTO-000292.jpg	/evidencias/eventos/295/evidencia_AUTO-000292.jpg	image/jpeg	2026-01-01 07:16:51.361973
296	296	evidencia_AUTO-000293.jpg	/evidencias/eventos/296/evidencia_AUTO-000293.jpg	image/jpeg	2025-10-11 13:13:19.896524
297	297	evidencia_AUTO-000294.jpg	/evidencias/eventos/297/evidencia_AUTO-000294.jpg	image/jpeg	2026-01-20 00:16:34.716082
298	298	evidencia_AUTO-000295.jpg	/evidencias/eventos/298/evidencia_AUTO-000295.jpg	image/jpeg	2026-07-31 14:17:24.93823
299	299	evidencia_AUTO-000296.jpg	/evidencias/eventos/299/evidencia_AUTO-000296.jpg	image/jpeg	2025-12-23 10:52:43.331173
300	300	evidencia_AUTO-000297.jpg	/evidencias/eventos/300/evidencia_AUTO-000297.jpg	image/jpeg	2025-12-23 15:29:10.798214
301	301	evidencia_AUTO-000298.jpg	/evidencias/eventos/301/evidencia_AUTO-000298.jpg	image/jpeg	2026-01-28 17:38:15.695466
302	302	evidencia_AUTO-000299.jpg	/evidencias/eventos/302/evidencia_AUTO-000299.jpg	image/jpeg	2026-01-27 04:57:35.87811
303	303	evidencia_AUTO-000300.jpg	/evidencias/eventos/303/evidencia_AUTO-000300.jpg	image/jpeg	2026-04-29 11:18:48.321828
304	304	evidencia_AUTO-000301.jpg	/evidencias/eventos/304/evidencia_AUTO-000301.jpg	image/jpeg	2026-03-21 15:40:30.968349
305	305	evidencia_AUTO-000302.jpg	/evidencias/eventos/305/evidencia_AUTO-000302.jpg	image/jpeg	2026-05-22 23:40:45.785876
306	306	evidencia_AUTO-000303.jpg	/evidencias/eventos/306/evidencia_AUTO-000303.jpg	image/jpeg	2026-08-07 02:42:46.516643
307	307	evidencia_AUTO-000304.jpg	/evidencias/eventos/307/evidencia_AUTO-000304.jpg	image/jpeg	2025-12-19 09:49:17.316922
308	308	evidencia_AUTO-000305.jpg	/evidencias/eventos/308/evidencia_AUTO-000305.jpg	image/jpeg	2026-05-18 02:30:45.813151
309	309	evidencia_AUTO-000306.jpg	/evidencias/eventos/309/evidencia_AUTO-000306.jpg	image/jpeg	2025-11-27 17:28:25.106852
310	310	evidencia_AUTO-000307.jpg	/evidencias/eventos/310/evidencia_AUTO-000307.jpg	image/jpeg	2026-09-05 06:13:04.625574
311	311	evidencia_AUTO-000308.jpg	/evidencias/eventos/311/evidencia_AUTO-000308.jpg	image/jpeg	2025-10-21 05:11:05.569651
312	312	evidencia_AUTO-000309.jpg	/evidencias/eventos/312/evidencia_AUTO-000309.jpg	image/jpeg	2026-07-29 08:47:11.696942
313	313	evidencia_AUTO-000310.jpg	/evidencias/eventos/313/evidencia_AUTO-000310.jpg	image/jpeg	2026-05-13 00:41:50.640805
314	314	evidencia_AUTO-000311.jpg	/evidencias/eventos/314/evidencia_AUTO-000311.jpg	image/jpeg	2026-01-26 04:42:15.490999
315	315	evidencia_AUTO-000312.jpg	/evidencias/eventos/315/evidencia_AUTO-000312.jpg	image/jpeg	2026-07-02 21:50:54.573059
316	316	evidencia_AUTO-000313.jpg	/evidencias/eventos/316/evidencia_AUTO-000313.jpg	image/jpeg	2026-05-07 15:03:21.463736
317	317	evidencia_AUTO-000314.jpg	/evidencias/eventos/317/evidencia_AUTO-000314.jpg	image/jpeg	2026-05-17 23:48:14.206559
318	318	evidencia_AUTO-000315.jpg	/evidencias/eventos/318/evidencia_AUTO-000315.jpg	image/jpeg	2026-06-01 19:52:44.229392
319	319	evidencia_AUTO-000316.jpg	/evidencias/eventos/319/evidencia_AUTO-000316.jpg	image/jpeg	2026-01-23 20:28:44.519655
320	320	evidencia_AUTO-000317.jpg	/evidencias/eventos/320/evidencia_AUTO-000317.jpg	image/jpeg	2025-11-06 19:53:55.200521
321	321	evidencia_AUTO-000318.jpg	/evidencias/eventos/321/evidencia_AUTO-000318.jpg	image/jpeg	2026-04-04 23:01:35.313493
322	322	evidencia_AUTO-000319.jpg	/evidencias/eventos/322/evidencia_AUTO-000319.jpg	image/jpeg	2026-01-02 17:30:59.076911
323	323	evidencia_AUTO-000320.jpg	/evidencias/eventos/323/evidencia_AUTO-000320.jpg	image/jpeg	2026-03-29 11:26:34.836968
324	324	evidencia_AUTO-000321.jpg	/evidencias/eventos/324/evidencia_AUTO-000321.jpg	image/jpeg	2026-09-12 16:19:12.649027
325	325	evidencia_AUTO-000322.jpg	/evidencias/eventos/325/evidencia_AUTO-000322.jpg	image/jpeg	2026-05-06 20:38:47.183722
326	326	evidencia_AUTO-000323.jpg	/evidencias/eventos/326/evidencia_AUTO-000323.jpg	image/jpeg	2026-08-17 05:12:39.218302
327	327	evidencia_AUTO-000324.jpg	/evidencias/eventos/327/evidencia_AUTO-000324.jpg	image/jpeg	2026-07-12 14:58:34.746897
328	328	evidencia_AUTO-000325.jpg	/evidencias/eventos/328/evidencia_AUTO-000325.jpg	image/jpeg	2026-01-27 14:49:10.196363
329	329	evidencia_AUTO-000326.jpg	/evidencias/eventos/329/evidencia_AUTO-000326.jpg	image/jpeg	2026-04-05 13:49:17.83056
330	330	evidencia_AUTO-000327.jpg	/evidencias/eventos/330/evidencia_AUTO-000327.jpg	image/jpeg	2026-09-25 21:00:35.523325
331	331	evidencia_AUTO-000328.jpg	/evidencias/eventos/331/evidencia_AUTO-000328.jpg	image/jpeg	2026-03-15 09:28:59.892235
332	332	evidencia_AUTO-000329.jpg	/evidencias/eventos/332/evidencia_AUTO-000329.jpg	image/jpeg	2026-06-04 18:09:32.652109
333	333	evidencia_AUTO-000330.jpg	/evidencias/eventos/333/evidencia_AUTO-000330.jpg	image/jpeg	2026-09-22 07:20:21.150339
334	334	evidencia_AUTO-000331.jpg	/evidencias/eventos/334/evidencia_AUTO-000331.jpg	image/jpeg	2026-08-21 12:39:49.927164
335	335	evidencia_AUTO-000332.jpg	/evidencias/eventos/335/evidencia_AUTO-000332.jpg	image/jpeg	2026-08-11 14:49:21.947697
336	336	evidencia_AUTO-000333.jpg	/evidencias/eventos/336/evidencia_AUTO-000333.jpg	image/jpeg	2026-02-18 07:20:16.82765
337	337	evidencia_AUTO-000334.jpg	/evidencias/eventos/337/evidencia_AUTO-000334.jpg	image/jpeg	2025-10-16 17:45:06.6553
338	338	evidencia_AUTO-000335.jpg	/evidencias/eventos/338/evidencia_AUTO-000335.jpg	image/jpeg	2026-02-27 13:45:56.247361
339	339	evidencia_AUTO-000336.jpg	/evidencias/eventos/339/evidencia_AUTO-000336.jpg	image/jpeg	2026-08-09 23:41:36.202552
340	340	evidencia_AUTO-000337.jpg	/evidencias/eventos/340/evidencia_AUTO-000337.jpg	image/jpeg	2026-02-06 07:35:06.449121
341	341	evidencia_AUTO-000338.jpg	/evidencias/eventos/341/evidencia_AUTO-000338.jpg	image/jpeg	2025-10-10 17:05:30.334625
342	342	evidencia_AUTO-000339.jpg	/evidencias/eventos/342/evidencia_AUTO-000339.jpg	image/jpeg	2026-07-12 01:52:24.161506
343	343	evidencia_AUTO-000340.jpg	/evidencias/eventos/343/evidencia_AUTO-000340.jpg	image/jpeg	2025-11-17 02:29:12.982263
344	344	evidencia_AUTO-000341.jpg	/evidencias/eventos/344/evidencia_AUTO-000341.jpg	image/jpeg	2025-12-26 02:26:56.573681
345	345	evidencia_AUTO-000342.jpg	/evidencias/eventos/345/evidencia_AUTO-000342.jpg	image/jpeg	2026-07-10 15:41:02.938619
346	346	evidencia_AUTO-000343.jpg	/evidencias/eventos/346/evidencia_AUTO-000343.jpg	image/jpeg	2026-06-17 05:04:58.244623
347	347	evidencia_AUTO-000344.jpg	/evidencias/eventos/347/evidencia_AUTO-000344.jpg	image/jpeg	2026-09-04 00:06:50.101097
348	348	evidencia_AUTO-000345.jpg	/evidencias/eventos/348/evidencia_AUTO-000345.jpg	image/jpeg	2025-10-06 13:24:04.207343
349	349	evidencia_AUTO-000346.jpg	/evidencias/eventos/349/evidencia_AUTO-000346.jpg	image/jpeg	2026-01-05 08:26:19.230004
350	350	evidencia_AUTO-000347.jpg	/evidencias/eventos/350/evidencia_AUTO-000347.jpg	image/jpeg	2026-03-27 04:18:07.94383
351	351	evidencia_AUTO-000348.jpg	/evidencias/eventos/351/evidencia_AUTO-000348.jpg	image/jpeg	2025-11-23 19:03:19.005155
352	352	evidencia_AUTO-000349.jpg	/evidencias/eventos/352/evidencia_AUTO-000349.jpg	image/jpeg	2026-06-21 14:30:39.029406
353	353	evidencia_AUTO-000350.jpg	/evidencias/eventos/353/evidencia_AUTO-000350.jpg	image/jpeg	2026-02-17 00:02:16.056457
354	354	evidencia_AUTO-000351.jpg	/evidencias/eventos/354/evidencia_AUTO-000351.jpg	image/jpeg	2026-09-01 09:56:48.607115
355	355	evidencia_AUTO-000352.jpg	/evidencias/eventos/355/evidencia_AUTO-000352.jpg	image/jpeg	2025-10-07 13:20:27.212888
356	356	evidencia_AUTO-000353.jpg	/evidencias/eventos/356/evidencia_AUTO-000353.jpg	image/jpeg	2026-01-05 11:28:09.061926
357	357	evidencia_AUTO-000354.jpg	/evidencias/eventos/357/evidencia_AUTO-000354.jpg	image/jpeg	2025-12-28 05:53:34.971365
358	358	evidencia_AUTO-000355.jpg	/evidencias/eventos/358/evidencia_AUTO-000355.jpg	image/jpeg	2026-06-03 16:07:48.969646
359	359	evidencia_AUTO-000356.jpg	/evidencias/eventos/359/evidencia_AUTO-000356.jpg	image/jpeg	2025-11-23 03:51:44.403208
360	360	evidencia_AUTO-000357.jpg	/evidencias/eventos/360/evidencia_AUTO-000357.jpg	image/jpeg	2025-10-08 20:10:38.015211
361	361	evidencia_AUTO-000358.jpg	/evidencias/eventos/361/evidencia_AUTO-000358.jpg	image/jpeg	2026-06-16 20:54:19.0091
362	362	evidencia_AUTO-000359.jpg	/evidencias/eventos/362/evidencia_AUTO-000359.jpg	image/jpeg	2026-07-03 11:27:08.520308
363	363	evidencia_AUTO-000360.jpg	/evidencias/eventos/363/evidencia_AUTO-000360.jpg	image/jpeg	2026-07-30 02:44:05.623591
364	364	evidencia_AUTO-000361.jpg	/evidencias/eventos/364/evidencia_AUTO-000361.jpg	image/jpeg	2025-10-10 17:44:04.710847
365	365	evidencia_AUTO-000362.jpg	/evidencias/eventos/365/evidencia_AUTO-000362.jpg	image/jpeg	2026-05-17 13:35:08.193246
366	366	evidencia_AUTO-000363.jpg	/evidencias/eventos/366/evidencia_AUTO-000363.jpg	image/jpeg	2026-04-05 10:25:23.092254
367	367	evidencia_AUTO-000364.jpg	/evidencias/eventos/367/evidencia_AUTO-000364.jpg	image/jpeg	2026-02-23 08:53:59.590808
368	368	evidencia_AUTO-000365.jpg	/evidencias/eventos/368/evidencia_AUTO-000365.jpg	image/jpeg	2026-03-04 17:40:17.852902
369	369	evidencia_AUTO-000366.jpg	/evidencias/eventos/369/evidencia_AUTO-000366.jpg	image/jpeg	2025-11-28 10:46:38.175577
370	370	evidencia_AUTO-000367.jpg	/evidencias/eventos/370/evidencia_AUTO-000367.jpg	image/jpeg	2026-07-18 09:59:32.872092
371	371	evidencia_AUTO-000368.jpg	/evidencias/eventos/371/evidencia_AUTO-000368.jpg	image/jpeg	2026-08-25 15:26:15.779978
372	372	evidencia_AUTO-000369.jpg	/evidencias/eventos/372/evidencia_AUTO-000369.jpg	image/jpeg	2026-05-08 00:03:30.277755
373	373	evidencia_AUTO-000370.jpg	/evidencias/eventos/373/evidencia_AUTO-000370.jpg	image/jpeg	2026-04-03 16:48:03.394799
374	374	evidencia_AUTO-000371.jpg	/evidencias/eventos/374/evidencia_AUTO-000371.jpg	image/jpeg	2026-01-08 16:00:09.00459
375	375	evidencia_AUTO-000372.jpg	/evidencias/eventos/375/evidencia_AUTO-000372.jpg	image/jpeg	2025-11-15 06:13:30.227722
376	376	evidencia_AUTO-000373.jpg	/evidencias/eventos/376/evidencia_AUTO-000373.jpg	image/jpeg	2026-04-08 00:35:20.259047
377	377	evidencia_AUTO-000374.jpg	/evidencias/eventos/377/evidencia_AUTO-000374.jpg	image/jpeg	2026-08-04 21:46:20.404187
378	378	evidencia_AUTO-000375.jpg	/evidencias/eventos/378/evidencia_AUTO-000375.jpg	image/jpeg	2026-06-11 11:49:06.620243
379	379	evidencia_AUTO-000376.jpg	/evidencias/eventos/379/evidencia_AUTO-000376.jpg	image/jpeg	2025-12-01 22:58:07.437869
380	380	evidencia_AUTO-000377.jpg	/evidencias/eventos/380/evidencia_AUTO-000377.jpg	image/jpeg	2026-05-27 09:54:49.541054
381	381	evidencia_AUTO-000378.jpg	/evidencias/eventos/381/evidencia_AUTO-000378.jpg	image/jpeg	2026-04-15 20:55:36.972726
382	382	evidencia_AUTO-000379.jpg	/evidencias/eventos/382/evidencia_AUTO-000379.jpg	image/jpeg	2025-10-14 00:25:36.087978
383	383	evidencia_AUTO-000380.jpg	/evidencias/eventos/383/evidencia_AUTO-000380.jpg	image/jpeg	2025-11-18 23:42:48.149286
384	384	evidencia_AUTO-000381.jpg	/evidencias/eventos/384/evidencia_AUTO-000381.jpg	image/jpeg	2026-06-29 12:38:51.281293
385	385	evidencia_AUTO-000382.jpg	/evidencias/eventos/385/evidencia_AUTO-000382.jpg	image/jpeg	2025-11-18 01:28:07.201789
386	386	evidencia_AUTO-000383.jpg	/evidencias/eventos/386/evidencia_AUTO-000383.jpg	image/jpeg	2025-11-23 04:39:32.905278
387	387	evidencia_AUTO-000384.jpg	/evidencias/eventos/387/evidencia_AUTO-000384.jpg	image/jpeg	2026-04-25 12:42:41.600538
388	388	evidencia_AUTO-000385.jpg	/evidencias/eventos/388/evidencia_AUTO-000385.jpg	image/jpeg	2026-08-15 03:10:43.344007
389	389	evidencia_AUTO-000386.jpg	/evidencias/eventos/389/evidencia_AUTO-000386.jpg	image/jpeg	2026-09-01 01:11:38.695194
390	390	evidencia_AUTO-000387.jpg	/evidencias/eventos/390/evidencia_AUTO-000387.jpg	image/jpeg	2025-11-18 16:03:38.296747
391	391	evidencia_AUTO-000388.jpg	/evidencias/eventos/391/evidencia_AUTO-000388.jpg	image/jpeg	2026-03-28 00:55:06.74282
392	392	evidencia_AUTO-000389.jpg	/evidencias/eventos/392/evidencia_AUTO-000389.jpg	image/jpeg	2025-11-19 11:40:24.808424
393	393	evidencia_AUTO-000390.jpg	/evidencias/eventos/393/evidencia_AUTO-000390.jpg	image/jpeg	2026-01-06 00:17:20.080416
394	394	evidencia_AUTO-000391.jpg	/evidencias/eventos/394/evidencia_AUTO-000391.jpg	image/jpeg	2026-03-26 18:56:45.064643
395	395	evidencia_AUTO-000392.jpg	/evidencias/eventos/395/evidencia_AUTO-000392.jpg	image/jpeg	2026-04-18 14:19:49.232013
396	396	evidencia_AUTO-000393.jpg	/evidencias/eventos/396/evidencia_AUTO-000393.jpg	image/jpeg	2026-02-16 23:02:58.383348
397	397	evidencia_AUTO-000394.jpg	/evidencias/eventos/397/evidencia_AUTO-000394.jpg	image/jpeg	2026-03-06 02:39:01.645572
398	398	evidencia_AUTO-000395.jpg	/evidencias/eventos/398/evidencia_AUTO-000395.jpg	image/jpeg	2026-09-23 13:34:38.257156
399	399	evidencia_AUTO-000396.jpg	/evidencias/eventos/399/evidencia_AUTO-000396.jpg	image/jpeg	2026-07-09 00:51:23.022956
400	400	evidencia_AUTO-000397.jpg	/evidencias/eventos/400/evidencia_AUTO-000397.jpg	image/jpeg	2026-05-14 20:09:07.556881
401	401	evidencia_AUTO-000398.jpg	/evidencias/eventos/401/evidencia_AUTO-000398.jpg	image/jpeg	2026-01-03 11:32:06.730085
402	402	evidencia_AUTO-000399.jpg	/evidencias/eventos/402/evidencia_AUTO-000399.jpg	image/jpeg	2026-02-05 16:52:10.574641
403	403	evidencia_AUTO-000400.jpg	/evidencias/eventos/403/evidencia_AUTO-000400.jpg	image/jpeg	2026-03-23 00:31:03.297164
404	404	evidencia_AUTO-000401.jpg	/evidencias/eventos/404/evidencia_AUTO-000401.jpg	image/jpeg	2026-09-10 19:54:54.865357
405	405	evidencia_AUTO-000402.jpg	/evidencias/eventos/405/evidencia_AUTO-000402.jpg	image/jpeg	2025-12-01 17:03:35.488113
406	406	evidencia_AUTO-000403.jpg	/evidencias/eventos/406/evidencia_AUTO-000403.jpg	image/jpeg	2026-09-22 06:35:24.296467
407	407	evidencia_AUTO-000404.jpg	/evidencias/eventos/407/evidencia_AUTO-000404.jpg	image/jpeg	2026-09-12 03:43:02.697206
408	408	evidencia_AUTO-000405.jpg	/evidencias/eventos/408/evidencia_AUTO-000405.jpg	image/jpeg	2026-06-23 10:34:32.804677
409	409	evidencia_AUTO-000406.jpg	/evidencias/eventos/409/evidencia_AUTO-000406.jpg	image/jpeg	2025-12-31 07:11:07.653272
410	410	evidencia_AUTO-000407.jpg	/evidencias/eventos/410/evidencia_AUTO-000407.jpg	image/jpeg	2026-08-08 14:42:32.999099
411	411	evidencia_AUTO-000408.jpg	/evidencias/eventos/411/evidencia_AUTO-000408.jpg	image/jpeg	2026-09-11 03:53:37.825928
412	412	evidencia_AUTO-000409.jpg	/evidencias/eventos/412/evidencia_AUTO-000409.jpg	image/jpeg	2026-04-23 19:06:56.409779
413	413	evidencia_AUTO-000410.jpg	/evidencias/eventos/413/evidencia_AUTO-000410.jpg	image/jpeg	2026-05-10 00:33:13.154677
414	414	evidencia_AUTO-000411.jpg	/evidencias/eventos/414/evidencia_AUTO-000411.jpg	image/jpeg	2025-10-09 17:16:51.053141
415	415	evidencia_AUTO-000412.jpg	/evidencias/eventos/415/evidencia_AUTO-000412.jpg	image/jpeg	2025-12-02 12:29:33.285873
416	416	evidencia_AUTO-000413.jpg	/evidencias/eventos/416/evidencia_AUTO-000413.jpg	image/jpeg	2026-02-05 09:46:58.209042
417	417	evidencia_AUTO-000414.jpg	/evidencias/eventos/417/evidencia_AUTO-000414.jpg	image/jpeg	2025-10-31 13:33:14.898073
418	418	evidencia_AUTO-000415.jpg	/evidencias/eventos/418/evidencia_AUTO-000415.jpg	image/jpeg	2026-07-28 11:50:46.015755
419	419	evidencia_AUTO-000416.jpg	/evidencias/eventos/419/evidencia_AUTO-000416.jpg	image/jpeg	2026-05-15 05:50:53.263469
420	420	evidencia_AUTO-000417.jpg	/evidencias/eventos/420/evidencia_AUTO-000417.jpg	image/jpeg	2026-08-24 22:29:34.591057
421	421	evidencia_AUTO-000418.jpg	/evidencias/eventos/421/evidencia_AUTO-000418.jpg	image/jpeg	2026-01-27 02:35:35.637322
422	422	evidencia_AUTO-000419.jpg	/evidencias/eventos/422/evidencia_AUTO-000419.jpg	image/jpeg	2026-02-06 00:23:16.909733
423	423	evidencia_AUTO-000420.jpg	/evidencias/eventos/423/evidencia_AUTO-000420.jpg	image/jpeg	2026-08-25 08:39:19.234181
424	424	evidencia_AUTO-000421.jpg	/evidencias/eventos/424/evidencia_AUTO-000421.jpg	image/jpeg	2026-04-26 11:02:38.788575
425	425	evidencia_AUTO-000422.jpg	/evidencias/eventos/425/evidencia_AUTO-000422.jpg	image/jpeg	2026-05-14 08:21:09.845648
426	426	evidencia_AUTO-000423.jpg	/evidencias/eventos/426/evidencia_AUTO-000423.jpg	image/jpeg	2026-02-24 20:22:44.943463
427	427	evidencia_AUTO-000424.jpg	/evidencias/eventos/427/evidencia_AUTO-000424.jpg	image/jpeg	2025-10-29 11:11:56.330208
428	428	evidencia_AUTO-000425.jpg	/evidencias/eventos/428/evidencia_AUTO-000425.jpg	image/jpeg	2026-01-08 06:03:08.550487
429	429	evidencia_AUTO-000426.jpg	/evidencias/eventos/429/evidencia_AUTO-000426.jpg	image/jpeg	2026-07-20 12:10:59.492899
430	430	evidencia_AUTO-000427.jpg	/evidencias/eventos/430/evidencia_AUTO-000427.jpg	image/jpeg	2025-12-03 21:38:31.944229
431	431	evidencia_AUTO-000428.jpg	/evidencias/eventos/431/evidencia_AUTO-000428.jpg	image/jpeg	2026-09-16 17:37:59.249426
432	432	evidencia_AUTO-000429.jpg	/evidencias/eventos/432/evidencia_AUTO-000429.jpg	image/jpeg	2026-04-27 00:19:44.215114
433	433	evidencia_AUTO-000430.jpg	/evidencias/eventos/433/evidencia_AUTO-000430.jpg	image/jpeg	2025-10-08 10:05:51.309968
434	434	evidencia_AUTO-000431.jpg	/evidencias/eventos/434/evidencia_AUTO-000431.jpg	image/jpeg	2026-09-01 17:49:11.607319
435	435	evidencia_AUTO-000432.jpg	/evidencias/eventos/435/evidencia_AUTO-000432.jpg	image/jpeg	2026-05-11 05:31:05.535635
436	436	evidencia_AUTO-000433.jpg	/evidencias/eventos/436/evidencia_AUTO-000433.jpg	image/jpeg	2025-12-12 18:00:54.929961
437	437	evidencia_AUTO-000434.jpg	/evidencias/eventos/437/evidencia_AUTO-000434.jpg	image/jpeg	2026-08-27 03:26:43.435717
438	438	evidencia_AUTO-000435.jpg	/evidencias/eventos/438/evidencia_AUTO-000435.jpg	image/jpeg	2026-02-07 14:22:44.745599
439	439	evidencia_AUTO-000436.jpg	/evidencias/eventos/439/evidencia_AUTO-000436.jpg	image/jpeg	2026-01-31 06:07:56.078554
440	440	evidencia_AUTO-000437.jpg	/evidencias/eventos/440/evidencia_AUTO-000437.jpg	image/jpeg	2026-06-02 09:14:06.759766
441	441	evidencia_AUTO-000438.jpg	/evidencias/eventos/441/evidencia_AUTO-000438.jpg	image/jpeg	2025-11-20 01:30:26.191596
442	442	evidencia_AUTO-000439.jpg	/evidencias/eventos/442/evidencia_AUTO-000439.jpg	image/jpeg	2026-09-08 07:29:01.355028
443	443	evidencia_AUTO-000440.jpg	/evidencias/eventos/443/evidencia_AUTO-000440.jpg	image/jpeg	2026-05-15 15:25:02.604259
444	444	evidencia_AUTO-000441.jpg	/evidencias/eventos/444/evidencia_AUTO-000441.jpg	image/jpeg	2026-08-28 20:16:31.050729
445	445	evidencia_AUTO-000442.jpg	/evidencias/eventos/445/evidencia_AUTO-000442.jpg	image/jpeg	2026-04-18 15:31:10.021908
446	446	evidencia_AUTO-000443.jpg	/evidencias/eventos/446/evidencia_AUTO-000443.jpg	image/jpeg	2026-08-17 16:05:28.824082
447	447	evidencia_AUTO-000444.jpg	/evidencias/eventos/447/evidencia_AUTO-000444.jpg	image/jpeg	2026-09-26 11:26:19.258425
448	448	evidencia_AUTO-000445.jpg	/evidencias/eventos/448/evidencia_AUTO-000445.jpg	image/jpeg	2026-07-16 09:55:28.264002
449	449	evidencia_AUTO-000446.jpg	/evidencias/eventos/449/evidencia_AUTO-000446.jpg	image/jpeg	2025-11-21 18:52:22.13593
450	450	evidencia_AUTO-000447.jpg	/evidencias/eventos/450/evidencia_AUTO-000447.jpg	image/jpeg	2026-05-09 12:16:44.221453
451	451	evidencia_AUTO-000448.jpg	/evidencias/eventos/451/evidencia_AUTO-000448.jpg	image/jpeg	2026-05-29 01:50:13.161474
452	452	evidencia_AUTO-000449.jpg	/evidencias/eventos/452/evidencia_AUTO-000449.jpg	image/jpeg	2026-02-23 02:30:35.136949
453	453	evidencia_AUTO-000450.jpg	/evidencias/eventos/453/evidencia_AUTO-000450.jpg	image/jpeg	2025-12-29 19:18:46.893178
454	454	evidencia_AUTO-000451.jpg	/evidencias/eventos/454/evidencia_AUTO-000451.jpg	image/jpeg	2025-12-26 01:21:42.479242
455	455	evidencia_AUTO-000452.jpg	/evidencias/eventos/455/evidencia_AUTO-000452.jpg	image/jpeg	2025-11-12 10:16:35.409719
456	456	evidencia_AUTO-000453.jpg	/evidencias/eventos/456/evidencia_AUTO-000453.jpg	image/jpeg	2026-02-27 04:39:51.125167
457	457	evidencia_AUTO-000454.jpg	/evidencias/eventos/457/evidencia_AUTO-000454.jpg	image/jpeg	2026-06-10 01:58:33.857615
458	458	evidencia_AUTO-000455.jpg	/evidencias/eventos/458/evidencia_AUTO-000455.jpg	image/jpeg	2026-06-21 01:02:54.036955
459	459	evidencia_AUTO-000456.jpg	/evidencias/eventos/459/evidencia_AUTO-000456.jpg	image/jpeg	2026-05-12 02:38:55.316386
460	460	evidencia_AUTO-000457.jpg	/evidencias/eventos/460/evidencia_AUTO-000457.jpg	image/jpeg	2025-12-28 02:00:55.337456
461	461	evidencia_AUTO-000458.jpg	/evidencias/eventos/461/evidencia_AUTO-000458.jpg	image/jpeg	2025-11-19 11:59:15.192191
462	462	evidencia_AUTO-000459.jpg	/evidencias/eventos/462/evidencia_AUTO-000459.jpg	image/jpeg	2026-04-25 18:12:22.423174
463	463	evidencia_AUTO-000460.jpg	/evidencias/eventos/463/evidencia_AUTO-000460.jpg	image/jpeg	2025-11-21 16:31:07.641837
464	464	evidencia_AUTO-000461.jpg	/evidencias/eventos/464/evidencia_AUTO-000461.jpg	image/jpeg	2026-01-01 08:20:22.60969
465	465	evidencia_AUTO-000462.jpg	/evidencias/eventos/465/evidencia_AUTO-000462.jpg	image/jpeg	2026-01-18 03:30:03.751987
466	466	evidencia_AUTO-000463.jpg	/evidencias/eventos/466/evidencia_AUTO-000463.jpg	image/jpeg	2026-07-06 04:15:43.667334
467	467	evidencia_AUTO-000464.jpg	/evidencias/eventos/467/evidencia_AUTO-000464.jpg	image/jpeg	2026-01-24 18:53:17.821027
468	468	evidencia_AUTO-000465.jpg	/evidencias/eventos/468/evidencia_AUTO-000465.jpg	image/jpeg	2026-05-03 12:55:44.191509
469	469	evidencia_AUTO-000466.jpg	/evidencias/eventos/469/evidencia_AUTO-000466.jpg	image/jpeg	2026-01-29 19:49:43.36092
470	470	evidencia_AUTO-000467.jpg	/evidencias/eventos/470/evidencia_AUTO-000467.jpg	image/jpeg	2026-01-25 03:17:05.287578
471	471	evidencia_AUTO-000468.jpg	/evidencias/eventos/471/evidencia_AUTO-000468.jpg	image/jpeg	2026-01-02 13:51:22.110362
472	472	evidencia_AUTO-000469.jpg	/evidencias/eventos/472/evidencia_AUTO-000469.jpg	image/jpeg	2025-10-12 11:08:43.390806
473	473	evidencia_AUTO-000470.jpg	/evidencias/eventos/473/evidencia_AUTO-000470.jpg	image/jpeg	2026-01-29 12:50:50.634338
474	474	evidencia_AUTO-000471.jpg	/evidencias/eventos/474/evidencia_AUTO-000471.jpg	image/jpeg	2025-12-20 01:20:40.324429
475	475	evidencia_AUTO-000472.jpg	/evidencias/eventos/475/evidencia_AUTO-000472.jpg	image/jpeg	2026-08-03 12:00:33.058296
476	476	evidencia_AUTO-000473.jpg	/evidencias/eventos/476/evidencia_AUTO-000473.jpg	image/jpeg	2026-04-25 09:25:00.574785
477	477	evidencia_AUTO-000474.jpg	/evidencias/eventos/477/evidencia_AUTO-000474.jpg	image/jpeg	2026-08-06 19:42:07.252367
478	478	evidencia_AUTO-000475.jpg	/evidencias/eventos/478/evidencia_AUTO-000475.jpg	image/jpeg	2026-02-26 13:32:58.300066
479	479	evidencia_AUTO-000476.jpg	/evidencias/eventos/479/evidencia_AUTO-000476.jpg	image/jpeg	2026-08-23 19:36:09.497331
480	480	evidencia_AUTO-000477.jpg	/evidencias/eventos/480/evidencia_AUTO-000477.jpg	image/jpeg	2026-05-23 16:32:45.627779
481	481	evidencia_AUTO-000478.jpg	/evidencias/eventos/481/evidencia_AUTO-000478.jpg	image/jpeg	2025-10-11 05:17:11.736348
482	482	evidencia_AUTO-000479.jpg	/evidencias/eventos/482/evidencia_AUTO-000479.jpg	image/jpeg	2025-12-20 01:37:17.489972
483	483	evidencia_AUTO-000480.jpg	/evidencias/eventos/483/evidencia_AUTO-000480.jpg	image/jpeg	2026-09-21 20:45:12.500544
484	484	evidencia_AUTO-000481.jpg	/evidencias/eventos/484/evidencia_AUTO-000481.jpg	image/jpeg	2026-09-29 06:49:54.945921
485	485	evidencia_AUTO-000482.jpg	/evidencias/eventos/485/evidencia_AUTO-000482.jpg	image/jpeg	2025-10-17 06:00:11.604157
486	486	evidencia_AUTO-000483.jpg	/evidencias/eventos/486/evidencia_AUTO-000483.jpg	image/jpeg	2026-02-06 07:11:20.597618
487	487	evidencia_AUTO-000484.jpg	/evidencias/eventos/487/evidencia_AUTO-000484.jpg	image/jpeg	2025-11-26 08:38:24.632726
488	488	evidencia_AUTO-000485.jpg	/evidencias/eventos/488/evidencia_AUTO-000485.jpg	image/jpeg	2026-09-12 22:01:19.694871
489	489	evidencia_AUTO-000486.jpg	/evidencias/eventos/489/evidencia_AUTO-000486.jpg	image/jpeg	2026-09-21 01:49:42.372846
490	490	evidencia_AUTO-000487.jpg	/evidencias/eventos/490/evidencia_AUTO-000487.jpg	image/jpeg	2025-10-07 13:48:49.721672
491	491	evidencia_AUTO-000488.jpg	/evidencias/eventos/491/evidencia_AUTO-000488.jpg	image/jpeg	2026-06-13 22:34:08.867779
492	492	evidencia_AUTO-000489.jpg	/evidencias/eventos/492/evidencia_AUTO-000489.jpg	image/jpeg	2026-04-04 05:19:08.475022
493	493	evidencia_AUTO-000490.jpg	/evidencias/eventos/493/evidencia_AUTO-000490.jpg	image/jpeg	2025-11-07 15:29:33.748882
494	494	evidencia_AUTO-000491.jpg	/evidencias/eventos/494/evidencia_AUTO-000491.jpg	image/jpeg	2026-02-13 19:21:46.067251
495	495	evidencia_AUTO-000492.jpg	/evidencias/eventos/495/evidencia_AUTO-000492.jpg	image/jpeg	2026-03-20 11:07:15.352536
496	496	evidencia_AUTO-000493.jpg	/evidencias/eventos/496/evidencia_AUTO-000493.jpg	image/jpeg	2025-10-10 23:41:19.050936
497	497	evidencia_AUTO-000494.jpg	/evidencias/eventos/497/evidencia_AUTO-000494.jpg	image/jpeg	2025-12-23 14:54:45.069398
498	498	evidencia_AUTO-000495.jpg	/evidencias/eventos/498/evidencia_AUTO-000495.jpg	image/jpeg	2026-05-30 04:25:23.485482
499	499	evidencia_AUTO-000496.jpg	/evidencias/eventos/499/evidencia_AUTO-000496.jpg	image/jpeg	2026-06-28 19:16:40.599911
500	500	evidencia_AUTO-000497.jpg	/evidencias/eventos/500/evidencia_AUTO-000497.jpg	image/jpeg	2025-12-26 11:10:12.47404
\.


--
-- Data for Name: faenas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.faenas (id_faena, codigo_faena, nombre) FROM stdin;
1	FAE-001	Faena Minera Norte
2	FAE-002	Planta Industrial Pacifico
\.


--
-- Data for Name: hallazgos_intrava; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hallazgos_intrava (id_intrava, id_proyecto, id_proyecto_intrava, id_subproceso_intrava, id_responsable_intrava, id_segundo_responsable_intrava, id_creador_intrava, id_administrador_intrava, correlativo, correlativo_corporativo, tipo, origen, requisito_incumplido, fecha_creacion, fecha_deteccion, fecha_cierre, estado, estado_inmediata, estado_analisis, estado_correctiva, estado_recursos, estado_evidencia, estado_resultado, estado_riesgos, tratamiento_completo, razon_no_tratamiento, prioridad, url, proyecto, datos, causa_raiz, payload, sincronizado_en) FROM stdin;
\.


--
-- Data for Name: informes_investigacion_intrava; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.informes_investigacion_intrava (id_local, id_intrava, uuid_intrava, id_reporte_flash_intrava, id_proyecto, id_proyecto_intrava, proyecto_alias, general, analisis_causal, causa_raiz, accidentado, payload, sincronizado_en) FROM stdin;
\.


--
-- Data for Name: obreros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.obreros (id_trabajador, id_tipo_obrero, id_cuadrilla) FROM stdin;
3	1	1
4	2	1
5	3	2
6	1	2
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permisos (id_permiso, nombre, descripcion) FROM stdin;
1	gestionar_usuarios	Crear, modificar y desactivar usuarios
2	gestionar_eventos	Crear y modificar eventos
3	ver_eventos	Consultar eventos registrados
4	gestionar_asignaciones	Administrar asignaciones de cuadrillas
5	ver_reportes	Consultar reportes del sistema
6	gestionar_proyectos	Crear y modificar proyectos
7	proyectos.ver	Consultar proyectos registrados
8	eventos.crear	Permite registrar eventos y Tarjetas PARE
9	eventos.ver	\N
10	eventos.mis-reportes	\N
11	eventos.cerrar	\N
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
1	App\\Models\\User	1	flutter_desarrollo	44b99b27ec9f7e8e0fcd88e9e4e77b9fa42459e7d195cfbba50ed91f57fa587a	["*"]	\N	\N	2026-10-29 23:13:10	2026-10-29 23:13:10
2	App\\Models\\User	1	prueba_proyectos	4122dd259ade8c2d2f3835cb5da6bf059ef0f88ee003940f0afaa2dbae647d12	["*"]	2026-10-29 23:14:37	\N	2026-10-29 23:14:25	2026-10-29 23:14:37
3	App\\Models\\User	1	prueba_proyectos	02dc61ca51a32ff20c1e1e285da59a0ce5ae7cfc78458d8b28831a38b1141f2e	["*"]	2026-10-29 23:29:54	\N	2026-10-29 23:29:41	2026-10-29 23:29:54
4	App\\Models\\User	1	ava_movil	a61a6b0a136229507b4ecb8386f9750aabb5cc8b403a4ebb70b1ac6105dd00c6	["*"]	\N	\N	2026-10-30 21:11:56	2026-10-30 21:11:56
5	App\\Models\\User	1	ava_movil	4d09c91477442fdc30a0e3c298260bfd07d3e55d7a7f70ae2652cb7df7aaa2d9	["*"]	2026-10-30 21:34:31	\N	2026-10-30 21:34:28	2026-10-30 21:34:31
6	App\\Models\\User	1	prueba_tarjetas_pare	0fbc04a999945525e2bf70732ccd58939bbd7aebf6bd64bc595126ad87a604d0	["*"]	2026-10-31 00:19:03	\N	2026-10-30 22:54:40	2026-10-31 00:19:03
7	App\\Models\\User	1	ava_movil	a92a2ee4b55a6c93f88779a95d6517a410777591f47fcffc427de958d22bc26a	["*"]	2026-10-31 23:05:56	\N	2026-10-31 23:05:52	2026-10-31 23:05:56
8	App\\Models\\User	1	ava_movil	855a60a4c0cf2b34b9c671e31d11c934127997f984e5b425b468046425f96050	["*"]	2026-11-01 16:52:48	\N	2026-11-01 16:51:56	2026-11-01 16:52:48
13	App\\Models\\User	1	ava_movil	8d67708b8c0cedb2b53dba4691275a33c4570767a9d051e06b0dede993fcbc8b	["*"]	2026-11-01 21:09:02	\N	2026-11-01 21:04:33	2026-11-01 21:09:02
9	App\\Models\\User	1	ava_movil	446dd26eda980a9301dfcb340a9bc3a2380a456ebfc43d62570c15fa1fb1679b	["*"]	2026-11-01 18:06:06	\N	2026-11-01 18:05:46	2026-11-01 18:06:06
10	App\\Models\\User	1	ava_movil	39963802fdc2a9bb70a53e73f56476662f80e937868101b8c52e6b494f6c4eda	["*"]	2026-11-01 18:48:26	\N	2026-11-01 18:47:59	2026-11-01 18:48:26
11	App\\Models\\User	1	ava_movil	e605375c8df6c028c311f66497b4aa191e815ebbf21dcb0e7a48d15c54878b48	["*"]	2026-11-01 19:06:23	\N	2026-11-01 19:06:13	2026-11-01 19:06:23
14	App\\Models\\User	1	ava_movil	7297752075d7376f41e9e21e28e23760143724573831b06c24116d6244f158dd	["*"]	2026-11-01 21:26:29	\N	2026-11-01 21:26:10	2026-11-01 21:26:29
12	App\\Models\\User	1	ava_movil	fa6574e88a9e580e4963d96046d400385aeb136ddaa4fdf1d0a24b28f388ca67	["*"]	2026-11-01 20:27:43	\N	2026-11-01 20:26:44	2026-11-01 20:27:43
15	App\\Models\\User	1	ava_movil	2ffe4953fa56a0d7c84756a72cd70611569ebd0468cf249b1d53ef55ce9a62ae	["*"]	2026-11-01 21:33:38	\N	2026-11-01 21:33:25	2026-11-01 21:33:38
\.


--
-- Data for Name: personas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personas (id_persona, rut, nombre_1, nombre_2, apellido_1, apellido_2) FROM stdin;
1	11111111-1	Carlos	Andres	Perez	Soto
2	12222222-2	Maria	Jose	Gonzalez	Rojas
3	13333333-3	Pedro	\N	Muñoz	Silva
4	14444444-4	Juan	Pablo	Ramirez	Diaz
5	15555555-5	Luis	Alberto	Contreras	Vera
6	16666666-6	Daniel	\N	Sepulveda	Torres
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proyectos (id_proyecto, id_faena, id_cliente, nombre, descripcion, ubicacion, fecha_inicio, fecha_termino, estado) FROM stdin;
1	1	1	Montaje Planta Norte	Proyecto de montaje y mantenimiento industrial	Antofagasta	2026-09-01	2027-03-31	activo
2	2	2	Mantenimiento Planta Pacifico	Mantenimiento preventivo y correctivo	Concepcion	2026-10-01	2027-02-28	activo
\.


--
-- Data for Name: reportes_flash_intrava; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_flash_intrava (id_local, id_intrava, id_proyecto, id_proyecto_intrava, proyecto_alias, area, fecha, hora, turno, clasificacion, casuistica, descripcion, reportado_por, cargo, hora_reporte, payload, sincronizado_en) FROM stdin;
\.


--
-- Data for Name: reportes_previene_intrava; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reportes_previene_intrava (id_local, id_intrava, id_proyecto, id_proyecto_intrava, identificador, proyecto_alias, fecha, hora, area, descripcion, acciones_inmediatas, urgencia, aviso_jefatura, estado, evidencias_creacion, cierre_comentario, cierre_fecha, cierre_hora, cerrado_por, evidencias_cierre, payload, sincronizado_en) FROM stdin;
\.


--
-- Data for Name: rol_permiso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rol_permiso (id_rol, id_permiso) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
2	2
2	3
2	4
2	5
3	3
1	7
1	8
1	9
1	10
1	11
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id_rol, nombre, descripcion, estado) FROM stdin;
1	Administrador	Administrador general del sistema	activo
2	Supervisor	Supervisor de cuadrillas y eventos	activo
3	Trabajador	Usuario trabajador del sistema	activo
\.


--
-- Data for Name: supervisores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supervisores (id_trabajador) FROM stdin;
2
\.


--
-- Data for Name: tipo_eventos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipo_eventos (id_tipo_evento, nombre) FROM stdin;
1	Incidente
2	Hallazgo
3	No conformidad
4	Accidente
5	Observacion preventiva
\.


--
-- Data for Name: tipo_obreros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipo_obreros (id_tipo_obrero, nombre, descripcion, estado) FROM stdin;
1	Electricista	Trabajador especializado en instalaciones electricas	activo
2	Mecanico	Trabajador especializado en labores mecanicas	activo
3	Soldador	Trabajador especializado en soldadura	activo
\.


--
-- Data for Name: trabajador_departamento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajador_departamento (id_trabajador, id_departamento) FROM stdin;
1	1
2	2
\.


--
-- Data for Name: trabajadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores (id_trabajador, id_persona, cargo, estado, fecha_creacion, ultima_actualizacion) FROM stdin;
1	1	Administrador SGI	activo	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097
2	2	Supervisor	activo	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097
3	3	Electricista	activo	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097
4	4	Mecanico	activo	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097
5	5	Soldador	activo	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097
6	6	Electricista	activo	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097
\.


--
-- Data for Name: trabajadores_cuadrillas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trabajadores_cuadrillas (id_trabajador, id_cuadrilla, fecha_inicio, fecha_fin, fecha_creacion) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id_user, id_trabajador, email, email_verified_at, password, fecha_creacion, remember_token, created_at, updated_at) FROM stdin;
1	1	admin@empresa.cl	\N	$2y$12$cBuB1NiuDloDZENw7HlbP.eHhRCpUWIoumNNGkGAp9qIajn5wa1.e	2026-09-23 19:07:40.327097	\N	2026-09-23 19:07:40.327097	2026-09-23 23:58:20
2	2	supervisor@empresa.cl	\N	$2y$12$PDManN.w3MwBCnF/kr4POe.d0fiZPSx4Pja3xor/abslAM5OsuHvS	2026-09-23 19:07:40.327097	\N	2026-09-23 19:07:40.327097	2026-09-24 18:42:21
3	3	trabajador@empresa.cl	\N	$2y$12$g3HltkQqCn42/Q/c7hczo.wKvSakRxtouoBU9lBCk53.h.m5aBWpm	2026-09-23 19:07:40.327097	\N	2026-09-23 19:07:40.327097	2026-09-23 19:07:40.327097
\.


--
-- Data for Name: usuario_rol; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuario_rol (id_user, id_rol) FROM stdin;
1	1
2	2
3	3
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: laravel; Owner: -
--

SELECT pg_catalog.setval('laravel.migrations_id_seq', 25, true);


--
-- Name: actividades_id_actividad_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actividades_id_actividad_seq', 1, false);


--
-- Name: areas_id_area_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.areas_id_area_seq', 3, true);


--
-- Name: asignaciones_id_asignacion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asignaciones_id_asignacion_seq', 2, true);


--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clientes_id_cliente_seq', 2, true);


--
-- Name: cuadrillas_id_cuadrilla_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuadrillas_id_cuadrilla_seq', 2, true);


--
-- Name: departamentos_id_departamento_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departamentos_id_departamento_seq', 2, true);


--
-- Name: eventos_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.eventos_id_evento_seq', 502, true);


--
-- Name: evidencias_id_evidencia_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evidencias_id_evidencia_seq', 500, true);


--
-- Name: faenas_id_faena_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.faenas_id_faena_seq', 2, true);


--
-- Name: informes_investigacion_intrava_id_local_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.informes_investigacion_intrava_id_local_seq', 1, false);


--
-- Name: permisos_id_permiso_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permisos_id_permiso_seq', 11, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 15, true);


--
-- Name: personas_id_persona_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personas_id_persona_seq', 6, true);


--
-- Name: proyectos_id_proyecto_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proyectos_id_proyecto_seq', 2, true);


--
-- Name: reportes_flash_intrava_id_local_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reportes_flash_intrava_id_local_seq', 1, false);


--
-- Name: reportes_previene_intrava_id_local_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reportes_previene_intrava_id_local_seq', 1, false);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 3, true);


--
-- Name: tipo_eventos_id_tipo_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipo_eventos_id_tipo_evento_seq', 5, true);


--
-- Name: tipo_obreros_id_tipo_obrero_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipo_obreros_id_tipo_obrero_seq', 3, true);


--
-- Name: trabajadores_id_trabajador_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trabajadores_id_trabajador_seq', 6, true);


--
-- Name: users_id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_user_seq', 3, true);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: laravel; Owner: -
--

ALTER TABLE ONLY laravel.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id_actividad);


--
-- Name: administrativos administrativos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administrativos
    ADD CONSTRAINT administrativos_pkey PRIMARY KEY (id_trabajador);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id_area);


--
-- Name: asignaciones asignaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT asignaciones_pkey PRIMARY KEY (id_asignacion);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente);


--
-- Name: clientes clientes_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_rut_key UNIQUE (rut);


--
-- Name: cuadrillas cuadrillas_numero_cuadrilla_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuadrillas
    ADD CONSTRAINT cuadrillas_numero_cuadrilla_key UNIQUE (numero_cuadrilla);


--
-- Name: cuadrillas cuadrillas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuadrillas
    ADD CONSTRAINT cuadrillas_pkey PRIMARY KEY (id_cuadrilla);


--
-- Name: departamentos departamentos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_nombre_key UNIQUE (nombre);


--
-- Name: departamentos departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (id_departamento);


--
-- Name: evento_trabajador evento_trabajador_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evento_trabajador
    ADD CONSTRAINT evento_trabajador_pkey PRIMARY KEY (id_evento, id_trabajador);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id_evento);


--
-- Name: evidencias evidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidencias
    ADD CONSTRAINT evidencias_pkey PRIMARY KEY (id_evidencia);


--
-- Name: faenas faenas_codigo_faena_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faenas
    ADD CONSTRAINT faenas_codigo_faena_key UNIQUE (codigo_faena);


--
-- Name: faenas faenas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faenas
    ADD CONSTRAINT faenas_pkey PRIMARY KEY (id_faena);


--
-- Name: hallazgos_intrava hallazgos_intrava_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hallazgos_intrava
    ADD CONSTRAINT hallazgos_intrava_pkey PRIMARY KEY (id_intrava);


--
-- Name: informes_investigacion_intrava informes_investigacion_intrava_id_intrava_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_id_intrava_key UNIQUE (id_intrava);


--
-- Name: informes_investigacion_intrava informes_investigacion_intrava_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_pkey PRIMARY KEY (id_local);


--
-- Name: informes_investigacion_intrava informes_investigacion_intrava_uuid_intrava_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_uuid_intrava_key UNIQUE (uuid_intrava);


--
-- Name: obreros obreros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT obreros_pkey PRIMARY KEY (id_trabajador);


--
-- Name: permisos permisos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_nombre_key UNIQUE (nombre);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id_permiso);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: personas personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id_persona);


--
-- Name: personas personas_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_rut_key UNIQUE (rut);


--
-- Name: trabajadores_cuadrillas pk_trabajadores_cuadrillas; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_cuadrillas
    ADD CONSTRAINT pk_trabajadores_cuadrillas PRIMARY KEY (id_trabajador, id_cuadrilla, fecha_inicio);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id_proyecto);


--
-- Name: reportes_flash_intrava reportes_flash_intrava_id_intrava_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_flash_intrava
    ADD CONSTRAINT reportes_flash_intrava_id_intrava_key UNIQUE (id_intrava);


--
-- Name: reportes_flash_intrava reportes_flash_intrava_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_flash_intrava
    ADD CONSTRAINT reportes_flash_intrava_pkey PRIMARY KEY (id_local);


--
-- Name: reportes_previene_intrava reportes_previene_intrava_id_intrava_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_previene_intrava
    ADD CONSTRAINT reportes_previene_intrava_id_intrava_key UNIQUE (id_intrava);


--
-- Name: reportes_previene_intrava reportes_previene_intrava_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_previene_intrava
    ADD CONSTRAINT reportes_previene_intrava_pkey PRIMARY KEY (id_local);


--
-- Name: rol_permiso rol_permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_pkey PRIMARY KEY (id_rol, id_permiso);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: supervisores supervisores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supervisores
    ADD CONSTRAINT supervisores_pkey PRIMARY KEY (id_trabajador);


--
-- Name: tipo_eventos tipo_eventos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_eventos
    ADD CONSTRAINT tipo_eventos_nombre_key UNIQUE (nombre);


--
-- Name: tipo_eventos tipo_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_eventos
    ADD CONSTRAINT tipo_eventos_pkey PRIMARY KEY (id_tipo_evento);


--
-- Name: tipo_obreros tipo_obreros_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_obreros
    ADD CONSTRAINT tipo_obreros_nombre_key UNIQUE (nombre);


--
-- Name: tipo_obreros tipo_obreros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_obreros
    ADD CONSTRAINT tipo_obreros_pkey PRIMARY KEY (id_tipo_obrero);


--
-- Name: trabajador_departamento trabajador_departamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_departamento
    ADD CONSTRAINT trabajador_departamento_pkey PRIMARY KEY (id_trabajador, id_departamento);


--
-- Name: trabajadores trabajadores_id_persona_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT trabajadores_id_persona_key UNIQUE (id_persona);


--
-- Name: trabajadores trabajadores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT trabajadores_pkey PRIMARY KEY (id_trabajador);


--
-- Name: areas uq_area_faena_codigo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT uq_area_faena_codigo UNIQUE (id_faena, codigo_area);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_id_trabajador_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_trabajador_key UNIQUE (id_trabajador);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_user);


--
-- Name: usuario_rol usuario_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT usuario_rol_pkey PRIMARY KEY (id_user, id_rol);


--
-- Name: idx_actividades_asignacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_actividades_asignacion ON public.actividades USING btree (id_asignacion);


--
-- Name: idx_areas_faena; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_areas_faena ON public.areas USING btree (id_faena);


--
-- Name: idx_asignaciones_administrador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asignaciones_administrador ON public.asignaciones USING btree (id_administrador);


--
-- Name: idx_asignaciones_cuadrilla; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asignaciones_cuadrilla ON public.asignaciones USING btree (id_cuadrilla);


--
-- Name: idx_asignaciones_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asignaciones_proyecto ON public.asignaciones USING btree (id_proyecto);


--
-- Name: idx_cuadrillas_supervisor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuadrillas_supervisor ON public.cuadrillas USING btree (id_supervisor);


--
-- Name: idx_eventos_administrador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_administrador ON public.eventos USING btree (id_administrador);


--
-- Name: idx_eventos_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_area ON public.eventos USING btree (id_area);


--
-- Name: idx_eventos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_estado ON public.eventos USING btree (estado);


--
-- Name: idx_eventos_fecha_creacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_fecha_creacion ON public.eventos USING btree (fecha_creacion);


--
-- Name: idx_eventos_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_proyecto ON public.eventos USING btree (id_proyecto);


--
-- Name: idx_eventos_referencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_referencia ON public.eventos USING btree (referencia);


--
-- Name: idx_eventos_supervisor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_supervisor ON public.eventos USING btree (id_supervisor);


--
-- Name: idx_eventos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_tipo ON public.eventos USING btree (id_tipo_evento);


--
-- Name: idx_eventos_trabajador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_trabajador ON public.eventos USING btree (id_trabajador);


--
-- Name: idx_evidencias_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidencias_evento ON public.evidencias USING btree (id_evento);


--
-- Name: idx_flash_intrava_proyecto_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flash_intrava_proyecto_fecha ON public.reportes_flash_intrava USING btree (id_proyecto_intrava, fecha);


--
-- Name: idx_hallazgo_intrava_proyecto_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hallazgo_intrava_proyecto_fecha ON public.hallazgos_intrava USING btree (id_proyecto_intrava, fecha_creacion);


--
-- Name: idx_investigacion_intrava_flash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investigacion_intrava_flash ON public.informes_investigacion_intrava USING btree (id_reporte_flash_intrava);


--
-- Name: idx_investigacion_intrava_proyecto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investigacion_intrava_proyecto ON public.informes_investigacion_intrava USING btree (id_proyecto_intrava);


--
-- Name: idx_obreros_cuadrilla; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obreros_cuadrilla ON public.obreros USING btree (id_cuadrilla);


--
-- Name: idx_obreros_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obreros_tipo ON public.obreros USING btree (id_tipo_obrero);


--
-- Name: idx_previene_intrava_proyecto_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_previene_intrava_proyecto_fecha ON public.reportes_previene_intrava USING btree (id_proyecto_intrava, fecha);


--
-- Name: idx_proyectos_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proyectos_cliente ON public.proyectos USING btree (id_cliente);


--
-- Name: idx_proyectos_faena; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proyectos_faena ON public.proyectos USING btree (id_faena);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: actividades fk_actividad_asignacion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT fk_actividad_asignacion FOREIGN KEY (id_asignacion) REFERENCES public.asignaciones(id_asignacion) ON DELETE CASCADE;


--
-- Name: administrativos fk_administrativo_trabajador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administrativos
    ADD CONSTRAINT fk_administrativo_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;


--
-- Name: areas fk_area_faena; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT fk_area_faena FOREIGN KEY (id_faena) REFERENCES public.faenas(id_faena) ON DELETE CASCADE;


--
-- Name: asignaciones fk_asignacion_administrador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT fk_asignacion_administrador FOREIGN KEY (id_administrador) REFERENCES public.administrativos(id_trabajador) ON DELETE RESTRICT;


--
-- Name: asignaciones fk_asignacion_cuadrilla; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT fk_asignacion_cuadrilla FOREIGN KEY (id_cuadrilla) REFERENCES public.cuadrillas(id_cuadrilla) ON DELETE RESTRICT;


--
-- Name: asignaciones fk_asignacion_proyecto; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones
    ADD CONSTRAINT fk_asignacion_proyecto FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE;


--
-- Name: cuadrillas fk_cuadrilla_supervisor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuadrillas
    ADD CONSTRAINT fk_cuadrilla_supervisor FOREIGN KEY (id_supervisor) REFERENCES public.supervisores(id_trabajador) ON DELETE RESTRICT;


--
-- Name: evento_trabajador fk_et_evento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evento_trabajador
    ADD CONSTRAINT fk_et_evento FOREIGN KEY (id_evento) REFERENCES public.eventos(id_evento) ON DELETE CASCADE;


--
-- Name: evento_trabajador fk_et_trabajador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evento_trabajador
    ADD CONSTRAINT fk_et_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;


--
-- Name: eventos fk_evento_administrador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_administrador FOREIGN KEY (id_administrador) REFERENCES public.administrativos(id_trabajador) ON DELETE RESTRICT;


--
-- Name: eventos fk_evento_area; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_area FOREIGN KEY (id_area) REFERENCES public.areas(id_area) ON DELETE RESTRICT;


--
-- Name: eventos fk_evento_proyecto; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_proyecto FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE;


--
-- Name: eventos fk_evento_tipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_evento_tipo FOREIGN KEY (id_tipo_evento) REFERENCES public.tipo_eventos(id_tipo_evento) ON DELETE RESTRICT;


--
-- Name: evidencias fk_evidencia_evento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidencias
    ADD CONSTRAINT fk_evidencia_evento FOREIGN KEY (id_evento) REFERENCES public.eventos(id_evento) ON DELETE CASCADE;


--
-- Name: obreros fk_obrero_cuadrilla; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT fk_obrero_cuadrilla FOREIGN KEY (id_cuadrilla) REFERENCES public.cuadrillas(id_cuadrilla) ON DELETE SET NULL;


--
-- Name: obreros fk_obrero_tipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT fk_obrero_tipo FOREIGN KEY (id_tipo_obrero) REFERENCES public.tipo_obreros(id_tipo_obrero) ON DELETE RESTRICT;


--
-- Name: obreros fk_obrero_trabajador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obreros
    ADD CONSTRAINT fk_obrero_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;


--
-- Name: proyectos fk_proyecto_cliente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_cliente FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE RESTRICT;


--
-- Name: proyectos fk_proyecto_faena; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT fk_proyecto_faena FOREIGN KEY (id_faena) REFERENCES public.faenas(id_faena) ON DELETE RESTRICT;


--
-- Name: rol_permiso fk_rol_permiso_permiso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso) REFERENCES public.permisos(id_permiso) ON DELETE CASCADE;


--
-- Name: rol_permiso fk_rol_permiso_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON DELETE CASCADE;


--
-- Name: supervisores fk_supervisor_trabajador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supervisores
    ADD CONSTRAINT fk_supervisor_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;


--
-- Name: trabajadores_cuadrillas fk_tc_cuadrilla; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_cuadrillas
    ADD CONSTRAINT fk_tc_cuadrilla FOREIGN KEY (id_cuadrilla) REFERENCES public.cuadrillas(id_cuadrilla);


--
-- Name: trabajadores_cuadrillas fk_tc_trabajador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores_cuadrillas
    ADD CONSTRAINT fk_tc_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador);


--
-- Name: trabajador_departamento fk_td_departamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_departamento
    ADD CONSTRAINT fk_td_departamento FOREIGN KEY (id_departamento) REFERENCES public.departamentos(id_departamento) ON DELETE CASCADE;


--
-- Name: trabajador_departamento fk_td_trabajador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajador_departamento
    ADD CONSTRAINT fk_td_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;


--
-- Name: trabajadores fk_trabajador_persona; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trabajadores
    ADD CONSTRAINT fk_trabajador_persona FOREIGN KEY (id_persona) REFERENCES public.personas(id_persona) ON DELETE CASCADE;


--
-- Name: users fk_user_trabajador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_trabajador FOREIGN KEY (id_trabajador) REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE;


--
-- Name: usuario_rol fk_usuario_rol_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON DELETE CASCADE;


--
-- Name: usuario_rol fk_usuario_rol_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT fk_usuario_rol_user FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON DELETE CASCADE;


--
-- Name: hallazgos_intrava hallazgos_intrava_id_proyecto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hallazgos_intrava
    ADD CONSTRAINT hallazgos_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;


--
-- Name: informes_investigacion_intrava informes_investigacion_intrava_id_proyecto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes_investigacion_intrava
    ADD CONSTRAINT informes_investigacion_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;


--
-- Name: reportes_flash_intrava reportes_flash_intrava_id_proyecto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_flash_intrava
    ADD CONSTRAINT reportes_flash_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;


--
-- Name: reportes_previene_intrava reportes_previene_intrava_id_proyecto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes_previene_intrava
    ADD CONSTRAINT reportes_previene_intrava_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id_proyecto) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ngqMcCRHKu6Dv41DbqS0y5kxjufd0KoomAoUsxmBaevvsqzga4Z7hYUWl4W2d1m

