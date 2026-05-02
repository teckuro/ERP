-- ============================================================
-- INDICES
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

-- ============================================
-- INDICES
-- ============================================

CREATE INDEX idx_persona_full ON persona(rut, dv);
CREATE INDEX idx_persona_comuna ON persona(id_comuna);
CREATE INDEX IF NOT EXISTS idx_pais_nombre ON public.pais (nombre);
CREATE INDEX IF NOT EXISTS idx_pais_nombre_iso ON public.pais (nombre_iso);
CREATE INDEX idx_persona_estado_ficha ON persona(estado_ficha);
CREATE INDEX idx_persona_estado ON persona(estado);
CREATE INDEX idx_persona_pais ON persona(id_pais);
CREATE INDEX idx_persona_apto_remuneraciones ON persona(apto_para_remuneraciones);
CREATE INDEX IF NOT EXISTS idx_banco_activo ON banco(activo);
CREATE INDEX IF NOT EXISTS idx_banco_nombre_corto ON banco(nombre_corto);
CREATE INDEX IF NOT EXISTS idx_tipo_cuenta_bancaria_activo ON tipo_cuenta_bancaria(activo);
CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_persona ON cuenta_bancaria(id_persona);
CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_banco ON cuenta_bancaria(id_banco);
CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_tipo ON cuenta_bancaria(id_tipo_cuenta_bancaria);
CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_activa ON cuenta_bancaria(activa);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuenta_principal_activa_persona
ON cuenta_bancaria(id_persona)
WHERE es_principal = TRUE
  AND activa = TRUE
  AND vigencia_fin IS NULL;
CREATE INDEX idx_contrato_persona ON contrato(id_persona);
CREATE INDEX idx_contrato_empresa ON contrato(id_empresa);
CREATE INDEX idx_contrato_sucursal ON contrato(id_sucursal);
CREATE INDEX idx_contrato_departamento_empresa ON contrato(id_departamento_empresa);
CREATE INDEX idx_contrato_tipo_trabajador ON contrato(id_tipo_trabajador);
CREATE INDEX idx_contrato_tipo_jornada ON contrato(id_tipo_jornada);
CREATE INDEX idx_anexo_contrato ON anexo_contrato(id_contrato);
CREATE INDEX idx_liquidacion_periodo ON liquidacion(periodo);
CREATE INDEX idx_liquidacion_contrato ON liquidacion(id_contrato);
CREATE INDEX idx_liquidacion_detalle_liq ON liquidacion_detalle(id_liquidacion);
CREATE INDEX idx_liquidacion_detalle_concepto ON liquidacion_detalle(id_concepto);
CREATE INDEX idx_parametros_generales_periodo ON parametros_generales(periodo);
CREATE INDEX idx_tramo_carga_periodo ON tramo_carga(periodo);
CREATE INDEX idx_tramo_impuesto_periodo ON tramo_impuesto(periodo);
CREATE INDEX idx_movimiento_persona ON movimiento(id_persona);
CREATE INDEX idx_movimiento_contrato ON movimiento(id_contrato);
CREATE INDEX idx_movimiento_fecha ON movimiento(fecha);
CREATE INDEX idx_prestamo_persona ON prestamo(id_persona);
CREATE INDEX idx_haberdescuento_persona ON haberdescuento_persona(id_persona);
CREATE INDEX idx_haberdescuento_concepto ON haberdescuento_persona(id_concepto);
CREATE INDEX idx_configuracion_clave ON configuracion(clave);
CREATE INDEX idx_valores_flexibles_tipo ON valores_flexibles(tipo, activo);
CREATE INDEX idx_valores_flexibles_codigo ON valores_flexibles(codigo);
CREATE INDEX idx_ficha_validacion_resumen_persona ON ficha_validacion_resumen(id_persona, validado_en DESC);
CREATE INDEX idx_ficha_validacion_detalle_validacion ON ficha_validacion_detalle(id_ficha_validacion, dominio, severidad);
CREATE INDEX idx_prevision_contrato ON prevision(id_contrato, vigencia_inicio);
CREATE INDEX idx_salud_trabajador_contrato ON salud_trabajador(id_contrato, vigencia_inicio);
CREATE INDEX idx_remuneracion_contrato ON remuneracion(id_contrato, vigencia_inicio);
CREATE INDEX idx_zona_extrema_contrato ON zona_extrema(id_contrato, vigencia_inicio);
CREATE INDEX idx_vacacion_saldo_contrato ON vacacion_saldo(id_contrato);
-- Índices adicionales para optimizar consultas de vigencia fin
CREATE INDEX idx_prevision_contrato_fin ON prevision(id_contrato, vigencia_fin);
CREATE INDEX idx_salud_trabajador_contrato_fin ON salud_trabajador(id_contrato, vigencia_fin);
CREATE INDEX idx_remuneracion_contrato_fin ON remuneracion(id_contrato, vigencia_fin);
CREATE INDEX idx_zona_extrema_contrato_fin ON zona_extrema(id_contrato, vigencia_fin);
CREATE INDEX idx_afp_vigencia_afp_fecha ON afp_vigencia(id_afp, vigencia_inicio, vigencia_fin);
CREATE INDEX idx_salud_plan_salud_fecha ON salud_plan(id_salud, vigencia_inicio, vigencia_fin);
CREATE INDEX idx_afc_parametro_fecha ON afc_parametro(codigo_tipo_contrato, vigencia_inicio, vigencia_fin);
CREATE INDEX idx_ips_ex_caja_tasa_basica_fecha ON ips_ex_caja_tasa_basica(vigencia_inicio, vigencia_fin);
CREATE INDEX idx_trabajo_pesado_parametro_fecha ON trabajo_pesado_parametro(vigencia_inicio, vigencia_fin);
CREATE INDEX idx_reforma_previsional_parametro_fecha ON reforma_previsional_parametro(vigencia_inicio, vigencia_fin);
CREATE INDEX idx_ley_16744_parametros_fecha ON ley_16744_parametros(vigencia_inicio, vigencia_fin);
CREATE INDEX idx_empresa_ley_16744_empresa_fecha ON empresa_ley_16744(id_empresa, vigencia_inicio, vigencia_fin);
CREATE INDEX idx_prevision_ex_caja ON prevision(id_ex_caja_previsional, id_regimen_ex_caja);
CREATE INDEX idx_salud_trabajador_plan ON salud_trabajador(id_salud_plan, vigencia_inicio, vigencia_fin);
CREATE INDEX idx_movimiento_tipo_motivo ON movimiento(id_tipo_movimiento, id_motivo_inasistencia, fecha);
CREATE INDEX idx_persona_tramo_carga_persona ON persona_tramo_carga(id_persona, vigencia_inicio, vigencia_fin);
CREATE INDEX idx_regla_concepto_calculo_concepto ON regla_concepto_calculo(id_concepto, orden_calculo, vigencia_inicio, vigencia_fin);
CREATE INDEX idx_zona_extrema_catalogo_geo ON zona_extrema_catalogo(id_region, id_provincia, id_comuna, vigencia_inicio, vigencia_fin);
