-- Vistas para el modelo predictivo, unidad: proyecto por semana (lunes).
-- PostgreSQL. No modifica tablas ni datos.

CREATE OR REPLACE VIEW public.v_eventos_unificados AS
SELECT e.id_proyecto,
       e.fecha_creacion::date AS fecha,
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
SELECT i.id_proyecto, COALESCE(f.fecha, i.sincronizado_en::date),
       'informe_investigacion', NULL,
       'informes_investigacion_intrava', i.id_local::text
FROM public.informes_investigacion_intrava i
LEFT JOIN public.reportes_flash_intrava f
       ON f.id_intrava = i.id_reporte_flash_intrava
WHERE i.id_proyecto IS NOT NULL
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
