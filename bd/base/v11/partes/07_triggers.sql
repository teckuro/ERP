-- ============================================================
-- TRIGGERS
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

-- ============================================
-- PRUEBA DE LA FUNCION
-- ============================================
--
-- Validaciones nuevas de v5:
-- 1. Contrato vigente para el periodo consultado.
-- 2. Remuneracion, AFP y salud vigentes para el periodo.
-- 3. Sueldo base no inferior al sueldo minimo legal vigente.
-- 4. Tasa AFP total dentro de rango 10% a 15%.
-- 5. Cotizacion de salud no inferior a 7%.
-- 6. Tope imponible 2026 cargado en parametros_legales segun el md base.
-- Reglas nuevas de v6:
-- 7. Art. 50: gratificacion mensual con tope legal y proporcionalidad opcional.
-- 8. Art. 47: requiere utilidades de empresa; no se autoconsume en este modelo.
-- 9. Voluntaria: no se autoconsume; debe venir por concepto manual si corresponde.
-- 10. valor_plan de salud puede resolverse desde salud_plan cuando usar_plan_parametrizado = TRUE.
-- 11. AFP puede resolverse desde afp_vigencia; afp mantiene columnas legacy de compatibilidad.
--
-- Ejecuta esto despues de correr todo el script:
-- SELECT * FROM fn_generar_liquidacion(1, '2024-01-01'::DATE, 1, FALSE);
--
-- Consultas utiles para revisar el resultado:
-- SELECT * FROM liquidacion ORDER BY id_liquidacion DESC;
-- SELECT * FROM liquidacion_detalle WHERE id_liquidacion = 1 ORDER BY orden, id_detalle;

-- ============================================
-- TRIGGERS PARA ACTUALIZAR fecha_actualizacion
-- Estas funciones y triggers actualizan automáticamente la columna
-- fecha_actualizacion cada vez que se actualiza un registro.  La
-- función fn_set_timestamp establece el valor a NOW() y se asocia
-- mediante triggers BEFORE UPDATE en las tablas que poseen la
-- columna fecha_actualizacion.  Esta práctica evita depender
-- de la aplicación para actualizar el timestamp de modificación y
-- sigue las recomendaciones de la comunidad para automatizar este
-- campo.
-- ============================================

CREATE OR REPLACE FUNCTION fn_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tablas con fecha_actualizacion

CREATE TRIGGER trg_pais_update_timestamp
BEFORE UPDATE ON pais
FOR EACH ROW
EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER trg_parametros_generales_update_timestamp
BEFORE UPDATE ON parametros_generales
FOR EACH ROW
EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER trg_parametros_generales_cliente_update_timestamp
BEFORE UPDATE ON parametros_generales_cliente
FOR EACH ROW
EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER trg_persona_update_timestamp
BEFORE UPDATE ON persona
FOR EACH ROW
EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER trg_vacacion_saldo_update_timestamp
BEFORE UPDATE ON vacacion_saldo
FOR EACH ROW
EXECUTE FUNCTION fn_set_timestamp();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_banco_updated_at ON banco;
CREATE TRIGGER trg_banco_updated_at
BEFORE UPDATE ON banco
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tipo_cuenta_bancaria_updated_at ON tipo_cuenta_bancaria;
CREATE TRIGGER trg_tipo_cuenta_bancaria_updated_at
BEFORE UPDATE ON tipo_cuenta_bancaria
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cuenta_bancaria_updated_at ON cuenta_bancaria;
CREATE TRIGGER trg_cuenta_bancaria_updated_at
BEFORE UPDATE ON cuenta_bancaria
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
