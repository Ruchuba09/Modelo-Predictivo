--
-- PostgreSQL database dump
--

\restrict IjGDbqufIUpzKKZl2aYeVfHIa31ghtejvTKyHiZDlPWfcd6q1IomG03bI41pTPR

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

\unrestrict IjGDbqufIUpzKKZl2aYeVfHIa31ghtejvTKyHiZDlPWfcd6q1IomG03bI41pTPR

