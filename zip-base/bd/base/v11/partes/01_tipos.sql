-- ============================================================
-- TIPOS ENUM
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

-- ============================================
-- TIPOS ENUM
-- ============================================

CREATE TYPE tipo_contrato_enum AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'OBRA_SERVICIO', 'CASA_PARTICULAR');
CREATE TYPE tipo_gratificacion_enum AS ENUM ('LEGAL_ART_47', 'LEGAL_ART_50', 'VOLUNTARIA');
CREATE TYPE tipo_mov_vacaciones_enum AS ENUM ('ACUMULADO', 'USADO', 'BONIFICADO', 'CORREGIDO');
CREATE TYPE tipo_estado_liquidacion_enum AS ENUM ('BORRADOR', 'PROCESADA', 'APROBADA', 'PAGADA', 'ANULADA');
CREATE TYPE tipo_concepto_enum AS ENUM ('HABER', 'DESCUENTO', 'APORTE_EMPLEADOR');
CREATE TYPE tipo_estado_ficha_enum AS ENUM ('BORRADOR', 'INCOMPLETO', 'VALIDO');
CREATE TYPE tipo_severidad_validacion_enum AS ENUM ('BLOQUEANTE', 'ADVERTENCIA', 'CRITICO');
CREATE TYPE tipo_dominio_ficha_enum AS ENUM ('GENERAL', 'LABORAL', 'REMUNERACION', 'PREVISION', 'SALUD', 'COMPLEMENTARIOS');
CREATE TYPE tipo_estado_civil_enum AS ENUM ('SOLTERO','CASADO','CONVIVIENTE_CIVIL','SEPARADO','DIVORCIADO','VIUDO');
CREATE TYPE tipo_estado_persona_enum AS ENUM ('BORRADOR', 'EN_PROCESO', 'ACTIVO', 'SUSPENDIDO', 'INACTIVO', 'DESVINCULADO', 'BLOQUEADO');
CREATE TYPE tipo_prevision_enum AS ENUM ('AFP', 'IPS', 'NINGUNA');
CREATE TYPE tipo_salud_enum AS ENUM ('FONASA', 'ISAPRE');
