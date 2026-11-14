<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Corrige fallas críticas detectadas al auditar el respaldo de la base:
 *
 * 1. Lesiones invisibles para el modelo: v_eventos_unificados tomaba con_lesion
 *    solo de id_clasificacion_incidente, que puede venir vacío aunque el evento
 *    tenga filas en evento_lesion. Se completa la clasificación desde las
 *    lesiones y la vista también mira evento_lesion.
 * 2. El trigger de severidad dejaba id_severidad y severidad en NULL cuando el
 *    texto no estaba en el catálogo, e ignoraba un cambio solo del texto. Ahora
 *    respeta el campo que cambió y rechaza severidades desconocidas.
 * 3. v_proyecto_semanas generaba semanas hasta hoy aunque no hubiera datos
 *    sincronizados, y el modelo las aprendía como semanas sin incidentes. Ahora
 *    termina en la última fecha con datos.
 * 4. situacion_criticas.condicion no tenía clave foránea a cat_condicion_pare.
 * 5. Borrar un proyecto o un trabajador eliminaba en cascada eventos, lesiones y
 *    situaciones críticas. Ahora se impide (RESTRICT): el historial de seguridad
 *    se conserva y el registro se da de baja cambiando su estado.
 *
 * El relleno de id_clasificacion_incidente (punto 1) no se deshace en down().
 */
return new class extends Migration
{
    /** Claves que pasan de CASCADE a RESTRICT: [tabla, columna, tabla referida, columna referida]. */
    private const HISTORIAL_PROTEGIDO = [
        ['eventos', 'id_proyecto', 'proyectos', 'id_proyecto'],
        ['evento_lesion', 'id_trabajador', 'trabajadores', 'id_trabajador'],
        ['evento_trabajador', 'id_trabajador', 'trabajadores', 'id_trabajador'],
        ['situacion_criticas', 'id_trabajador', 'trabajadores', 'id_trabajador'],
    ];

    private const FK_CONDICION = 'situacion_criticas_condicion_fkey';

    public function up(): void
    {
        $this->completarClasificacionDesdeLesiones();
        DB::unprepared(self::TRIGGER_NUEVO);
        DB::unprepared(self::vistaEventosUnificados(nueva: true));
        DB::unprepared(self::vistaProyectoSemanas(nueva: true));
        $this->agregarFkCondicion();

        foreach (self::HISTORIAL_PROTEGIDO as [$tabla, $columna, $refTabla, $refColumna]) {
            $this->reemplazarFk($tabla, $columna, $refTabla, $refColumna, 'RESTRICT');
        }
    }

    public function down(): void
    {
        foreach (self::HISTORIAL_PROTEGIDO as [$tabla, $columna, $refTabla, $refColumna]) {
            $this->reemplazarFk($tabla, $columna, $refTabla, $refColumna, 'CASCADE');
        }

        DB::statement('ALTER TABLE public.situacion_criticas DROP CONSTRAINT IF EXISTS '.self::FK_CONDICION);
        DB::unprepared(self::vistaProyectoSemanas(nueva: false));
        DB::unprepared(self::vistaEventosUnificados(nueva: false));
        DB::unprepared(self::TRIGGER_ANTERIOR);
    }

    /** Fatal > con tiempo perdido > sin tiempo perdido, según las lesiones del evento. */
    private function completarClasificacionDesdeLesiones(): void
    {
        DB::statement(<<<'SQL'
            UPDATE public.eventos e
            SET id_clasificacion_incidente = c.id_clasificacion_incidente
            FROM (
                SELECT id_evento,
                       CASE WHEN bool_or(fatal) THEN 'FATAL'
                            WHEN bool_or(con_tiempo_perdido) THEN 'CTP'
                            ELSE 'STP' END AS codigo
                FROM public.evento_lesion
                GROUP BY id_evento
            ) l
            JOIN public.cat_clasificacion_incidente c ON c.codigo = l.codigo
            WHERE e.id_evento = l.id_evento
              AND e.id_clasificacion_incidente IS NULL
        SQL);
    }

    private function agregarFkCondicion(): void
    {
        $invalidas = DB::table('situacion_criticas')
            ->whereNotIn('condicion', DB::table('cat_condicion_pare')->select('id_condicion'))
            ->pluck('id');

        if ($invalidas->isNotEmpty()) {
            throw new RuntimeException(
                'Hay Situaciones Críticas con una condición fuera de cat_condicion_pare; corríjalas antes de migrar: '
                .$invalidas->join(', ')
            );
        }

        DB::statement('ALTER TABLE public.situacion_criticas DROP CONSTRAINT IF EXISTS '.self::FK_CONDICION);
        DB::statement('ALTER TABLE public.situacion_criticas ADD CONSTRAINT '.self::FK_CONDICION
            .' FOREIGN KEY (condicion) REFERENCES public.cat_condicion_pare (id_condicion)');
    }

    /** Reemplaza la FK de una columna, sea cual sea su nombre actual, por una con la acción indicada. */
    private function reemplazarFk(string $tabla, string $columna, string $refTabla, string $refColumna, string $accion): void
    {
        $actuales = DB::select(<<<'SQL'
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
            WHERE c.contype = 'f'
              AND c.conrelid = ?::regclass
              AND cardinality(c.conkey) = 1
              AND a.attname = ?
        SQL, ["public.$tabla", $columna]);

        foreach ($actuales as $fk) {
            DB::statement(sprintf('ALTER TABLE public.%s DROP CONSTRAINT "%s"', $tabla, $fk->conname));
        }

        DB::statement(sprintf(
            'ALTER TABLE public.%1$s ADD CONSTRAINT %1$s_%2$s_fkey FOREIGN KEY (%2$s) REFERENCES public.%3$s (%4$s) ON DELETE %5$s',
            $tabla, $columna, $refTabla, $refColumna, $accion
        ));
    }

    /**
     * Si en un UPDATE solo cambió el texto, manda el texto; en otro caso manda
     * id_severidad. Un texto que no está en el catálogo se rechaza en vez de
     * borrar la severidad.
     */
    private const TRIGGER_NUEVO = <<<'SQL'
        CREATE OR REPLACE FUNCTION public.sincronizar_severidad_evento() RETURNS trigger
        LANGUAGE plpgsql AS $$
        DECLARE
            solo_texto boolean := TG_OP = 'UPDATE'
                AND NEW.severidad IS DISTINCT FROM OLD.severidad
                AND NEW.id_severidad IS NOT DISTINCT FROM OLD.id_severidad;
            texto text := trim(NEW.severidad);
        BEGIN
            IF NEW.id_severidad IS NOT NULL AND NOT solo_texto THEN
                SELECT nombre INTO NEW.severidad FROM public.cat_severidad WHERE id_severidad = NEW.id_severidad;
                RETURN NEW;
            END IF;

            IF texto IS NULL OR texto = '' THEN
                NEW.id_severidad := NULL;
                NEW.severidad := NULL;
                RETURN NEW;
            END IF;

            SELECT id_severidad, nombre INTO NEW.id_severidad, NEW.severidad
            FROM public.cat_severidad
            WHERE lower(nombre) = lower(texto)
               OR nivel = CASE
                    WHEN texto ILIKE 'leve%' THEN 1 WHEN texto ILIKE 'baja%' THEN 2
                    WHEN texto ILIKE 'media%' THEN 3 WHEN texto ILIKE 'alta%' THEN 4
                    WHEN texto ILIKE ANY (ARRAY['cr_tic%', 'grave%']) THEN 5 END
            ORDER BY lower(nombre) = lower(texto) DESC
            LIMIT 1;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Severidad desconocida: "%". Use un nombre de cat_severidad.', texto
                    USING ERRCODE = 'check_violation';
            END IF;

            RETURN NEW;
        END $$;
    SQL;

    private const TRIGGER_ANTERIOR = <<<'SQL'
        CREATE OR REPLACE FUNCTION public.sincronizar_severidad_evento() RETURNS trigger
        LANGUAGE plpgsql AS $$
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
        END $$;
    SQL;

    private static function vistaEventosUnificados(bool $nueva): string
    {
        // La versión nueva también cuenta como lesión un evento con filas en
        // evento_lesion, y usa la clasificación propia del informe de investigación.
        $lesionEvento = $nueva
            ? 'COALESCE(ci.con_lesion, FALSE) OR EXISTS (SELECT 1 FROM public.evento_lesion l WHERE l.id_evento = e.id_evento)'
            : 'COALESCE(ci.con_lesion, FALSE)';
        [$joinInforme, $lesionInforme, $laboralInforme] = $nueva
            ? ['LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = i.id_clasificacion_incidente',
                'COALESCE(ci.con_lesion, FALSE)', 'COALESCE(ci.laboral, TRUE)']
            : ['', 'FALSE', 'TRUE'];

        return <<<SQL
            CREATE OR REPLACE VIEW public.v_eventos_unificados AS
            SELECT e.id_proyecto,
                   COALESCE(e.fecha_ocurrencia, e.fecha_creacion)::date AS fecha,
                   COALESCE(te.codigo, lower(regexp_replace(trim(te.nombre), '\\s+', '_', 'g')))::text AS tipo,
                   s.nivel::numeric AS severidad,
                   'eventos'::text AS origen,
                   e.id_evento::text AS id_origen,
                   e.id_area,
                   $lesionEvento AS con_lesion,
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
                   'informes_investigacion_intrava', i.id_local::text, f.id_area, $lesionInforme, $laboralInforme
            FROM public.informes_investigacion_intrava i
            JOIN public.reportes_flash_intrava f ON f.id_intrava = i.id_reporte_flash_intrava
            $joinInforme
            WHERE i.id_proyecto IS NOT NULL AND f.fecha IS NOT NULL
            UNION ALL
            SELECT id_proyecto, COALESCE(fecha_deteccion, fecha_creacion), 'hallazgo', NULL,
                   'hallazgos_intrava', id_intrava::text, id_area, FALSE, TRUE
            FROM public.hallazgos_intrava
            WHERE id_proyecto IS NOT NULL AND COALESCE(fecha_deteccion, fecha_creacion) IS NOT NULL;
        SQL;
    }

    private static function vistaProyectoSemanas(bool $nueva): string
    {
        // La versión nueva corta en la última fecha con datos de cualquier fuente,
        // para no generar semanas vacías cuando la sincronización está atrasada.
        $ultima = $nueva
            ? ",\n                (SELECT max(u.fecha) FROM public.v_eventos_unificados u WHERE u.fecha <= CURRENT_DATE)"
            : '';

        return <<<SQL
            CREATE OR REPLACE VIEW public.v_proyecto_semanas AS
            WITH rango AS (
                SELECT p.id_proyecto,
                       date_trunc('week', LEAST(
                           p.fecha_inicio,
                           (SELECT min(u.fecha) FROM public.v_eventos_unificados u
                            WHERE u.id_proyecto = p.id_proyecto)
                       ))::date AS ini,
                       date_trunc('week', LEAST(COALESCE(p.fecha_termino, CURRENT_DATE),
                                                CURRENT_DATE$ultima))::date AS fin
                FROM public.proyectos p
            )
            SELECT r.id_proyecto, s::date AS semana
            FROM rango r,
                 LATERAL generate_series(r.ini, r.fin, interval '1 week') s
            WHERE r.ini IS NOT NULL AND r.ini <= r.fin;
        SQL;
    }
};
