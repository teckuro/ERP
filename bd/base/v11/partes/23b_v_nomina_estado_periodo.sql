-- PRENOMINA-ESTADO-01: vista de solo lectura que deriva el estado del flujo por periodo.
-- Estados: BORRADOR, CALCULADA, APROBADA, EMITIDA, CERRADA, REABIERTA, RELIQUIDADA, ANULADA.
-- Deriva del snapshot activo vigente y de la existencia de liquidaciones oficiales activas.

DROP VIEW IF EXISTS public.v_nomina_estado_periodo;

CREATE VIEW public.v_nomina_estado_periodo AS
SELECT
    p.id_calculo_periodo,
    p.periodo,
    p.id_empresa,
    p.estado AS estado_snapshot,
    p.activo,
    p.reemplazado_por,
    p.hash_snapshot,
    p.hash_parametros,
    p.hash_entradas,
    p.aprobacion_operativa_estado,
    p.aprobacion_operativa_fecha,
    p.cierre_operativo_estado,
    p.cierre_operativo_fecha,
    p.reapertura_operativa_fecha,
    liq.total_liquidaciones,
    CASE
        WHEN p.activo = FALSE OR p.estado = 'anulado' THEN 'ANULADA'
        WHEN p.cierre_operativo_estado = 'cerrado_operativamente' THEN 'CERRADA'
        WHEN COALESCE(liq.total_liquidaciones, 0) > 0 THEN 'EMITIDA'
        WHEN p.reapertura_operativa_fecha IS NOT NULL THEN 'REABIERTA'
        WHEN p.aprobacion_operativa_estado = 'aprobado_operativamente' THEN 'APROBADA'
        WHEN p.estado IN ('preliminar', 'recalculado', 'observado', 'listo_para_revision', 'aprobado_para_liquidacion') THEN 'CALCULADA'
        ELSE 'BORRADOR'
    END AS estado_flujo
FROM public.nomina_calculo_periodo p
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS total_liquidaciones
    FROM public.nomina_liquidacion_periodo l
    WHERE l.id_calculo_periodo = p.id_calculo_periodo
      AND l.activo = TRUE
) liq ON TRUE
WHERE p.activo = TRUE
  AND p.reemplazado_por IS NULL;

GRANT SELECT ON public.v_nomina_estado_periodo TO authenticated;
