-- ============================================================
-- RESET / DROP PARA RE-EJECUCION
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

-- crear_sql_v6_6.sql
--
-- Version v6.11 integrada basada en v6.10.
-- Integra regiones, provincias y comunas de Chile,
-- corrige dependencias de creacion y deja el script re-ejecutable.
-- Normaliza persona.id_pais, elimina redundancias de ciudad y tipo_cuenta,
-- y en v6.11 parametriza AFP por vigencia, planes de salud,
-- AFC por tipo de contrato, catalogos de movimientos,
-- zona extrema territorial, tramo de carga historico y faltantes normativos v6.11.

SET search_path = public;

-- ============================================
-- DROP PARA RE-EJECUCION
-- ============================================

DROP VIEW IF EXISTS vw_persona_factores CASCADE;
DROP FUNCTION IF EXISTS fn_validar_liquidacion(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS fn_generar_liquidacion(INTEGER, DATE, INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS fn_calcular_impuesto_unico(NUMERIC, DATE) CASCADE;
DROP FUNCTION IF EXISTS fn_formato_decimales(NUMERIC, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS dblink_dteconfiguracion() CASCADE;
DROP FUNCTION IF EXISTS fn_obtener_remuneracion(INTEGER, DATE) CASCADE;
DROP FUNCTION IF EXISTS fn_obtener_salud(INTEGER, DATE) CASCADE;
DROP FUNCTION IF EXISTS fn_obtener_afp(INTEGER, DATE) CASCADE;
DROP FUNCTION IF EXISTS fn_obtener_parametro(TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS fn_calcular_dias_trabajados(INTEGER, DATE, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS empleado_historial_registrar_cambio() CASCADE;
DROP FUNCTION IF EXISTS empleado_historial_changed_fields(JSONB, JSONB) CASCADE;
DROP FUNCTION IF EXISTS empleado_historial_tabla_pk(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS empleado_historial_tabla_seccion(TEXT) CASCADE;

DROP TABLE IF EXISTS empleado_historial CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS ficha_validacion_detalle CASCADE;
DROP TABLE IF EXISTS ficha_validacion_resumen CASCADE;
DROP TABLE IF EXISTS nomina_preparacion_evento CASCADE;
DROP TABLE IF EXISTS nomina_preparacion_trabajador CASCADE;
DROP TABLE IF EXISTS nomina_preparacion CASCADE;
DROP TABLE IF EXISTS nomina_liquidacion_concepto CASCADE;
DROP TABLE IF EXISTS nomina_liquidacion_trabajador CASCADE;
DROP TABLE IF EXISTS nomina_liquidacion_periodo CASCADE;
DROP TABLE IF EXISTS nomina_calculo_trazabilidad CASCADE;
DROP TABLE IF EXISTS nomina_calculo_issue CASCADE;
DROP TABLE IF EXISTS nomina_calculo_concepto CASCADE;
DROP TABLE IF EXISTS nomina_calculo_trabajador CASCADE;
DROP TABLE IF EXISTS nomina_calculo_periodo CASCADE;
DROP TABLE IF EXISTS novedad_remuneracion_periodo CASCADE;
DROP TABLE IF EXISTS valores_flexibles CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;
DROP TABLE IF EXISTS finiquito CASCADE;
DROP TABLE IF EXISTS vacacion_movimiento CASCADE;
DROP TABLE IF EXISTS vacacion_saldo CASCADE;
DROP TABLE IF EXISTS persona_tramo_carga CASCADE;
DROP TABLE IF EXISTS zona_extrema_catalogo CASCADE;
DROP TABLE IF EXISTS regla_concepto_calculo CASCADE;
DROP TABLE IF EXISTS motivo_inasistencia CASCADE;
DROP TABLE IF EXISTS tipo_movimiento CASCADE;
DROP TABLE IF EXISTS afc_parametro CASCADE;
DROP TABLE IF EXISTS salud_plan CASCADE;
DROP TABLE IF EXISTS afp_vigencia CASCADE;
DROP TABLE IF EXISTS ips_ex_caja_tasa_basica CASCADE;
DROP TABLE IF EXISTS regimen_ex_caja CASCADE;
DROP TABLE IF EXISTS ex_caja_previsional CASCADE;
DROP TABLE IF EXISTS entidad_previsional_ips CASCADE;
DROP TABLE IF EXISTS periodo_remuneracion CASCADE;
DROP TABLE IF EXISTS contrato_centro_costo CASCADE;
DROP TABLE IF EXISTS zona_extrema CASCADE;
DROP TABLE IF EXISTS semana_corrida CASCADE;
DROP TABLE IF EXISTS remuneracion CASCADE;
DROP TABLE IF EXISTS cuenta2_afp CASCADE;
DROP TABLE IF EXISTS apv CASCADE;
DROP TABLE IF EXISTS salud_trabajador CASCADE;
DROP TABLE IF EXISTS prevision CASCADE;
DROP TABLE IF EXISTS haberdescuento_persona CASCADE;
DROP TABLE IF EXISTS prestamo CASCADE;
DROP TABLE IF EXISTS movimiento_variable_mensual CASCADE;
DROP TABLE IF EXISTS movimiento CASCADE;
DROP TABLE IF EXISTS liquidacion_detalle CASCADE;
DROP TABLE IF EXISTS liquidacion CASCADE;
DROP TABLE IF EXISTS concepto CASCADE;
DROP TABLE IF EXISTS catalogo_lre CASCADE;
DROP TABLE IF EXISTS anexo_contrato CASCADE;
DROP TABLE IF EXISTS contrato CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria CASCADE;
DROP TABLE IF EXISTS persona CASCADE;
DROP TABLE IF EXISTS departamento_empresa CASCADE;
DROP TABLE IF EXISTS sucursal CASCADE;
DROP TABLE IF EXISTS empresa_ley_16744 CASCADE;
DROP TABLE IF EXISTS empresa CASCADE;
DROP TABLE IF EXISTS centro_costo CASCADE;
DROP TABLE IF EXISTS forma_pago_apv CASCADE;
DROP TABLE IF EXISTS institucion_apv CASCADE;
DROP TABLE IF EXISTS ccaf_entidad CASCADE;
DROP TABLE IF EXISTS organismo_administrador_ley_16744 CASCADE;
DROP TABLE IF EXISTS ley_16744_parametros CASCADE;
DROP TABLE IF EXISTS reforma_previsional_parametro CASCADE;
DROP TABLE IF EXISTS trabajo_pesado_parametro CASCADE;
DROP TABLE IF EXISTS tipo_cuenta_bancaria CASCADE;
DROP TABLE IF EXISTS moneda CASCADE;
DROP TABLE IF EXISTS tipo_jornada CASCADE;
DROP TABLE IF EXISTS tipo_trabajador CASCADE;
DROP TABLE IF EXISTS regimen_previsional CASCADE;
DROP TABLE IF EXISTS tabla_impuesto_unico CASCADE;
DROP TABLE IF EXISTS parametros_legales CASCADE;
DROP TABLE IF EXISTS tramo_impuesto CASCADE;
DROP TABLE IF EXISTS tramo_carga CASCADE;
DROP TABLE IF EXISTS parametros_generales_cliente CASCADE;
DROP TABLE IF EXISTS parametros_generales CASCADE;
DROP TABLE IF EXISTS salud CASCADE;
DROP TABLE IF EXISTS afp CASCADE;
DROP TABLE IF EXISTS public.pais CASCADE;
DROP TABLE IF EXISTS banco CASCADE;
DROP TABLE IF EXISTS ciudad CASCADE;
DROP TABLE IF EXISTS comuna CASCADE;
DROP TABLE IF EXISTS provincia CASCADE;
DROP TABLE IF EXISTS region CASCADE;

DROP TYPE IF EXISTS tipo_concepto_enum CASCADE;
DROP TYPE IF EXISTS tipo_estado_liquidacion_enum CASCADE;
DROP TYPE IF EXISTS tipo_mov_vacaciones_enum CASCADE;
DROP TYPE IF EXISTS tipo_gratificacion_enum CASCADE;
DROP TYPE IF EXISTS tipo_contrato_enum CASCADE;
DROP TYPE IF EXISTS tipo_estado_ficha_enum CASCADE;
DROP TYPE IF EXISTS tipo_severidad_validacion_enum CASCADE;
DROP TYPE IF EXISTS tipo_dominio_ficha_enum CASCADE;
DROP TYPE IF EXISTS tipo_estado_civil_enum CASCADE;
DROP TYPE IF EXISTS tipo_estado_persona_enum CASCADE;
DROP TYPE IF EXISTS tipo_prevision_enum CASCADE;
DROP TYPE IF EXISTS tipo_salud_enum CASCADE;
