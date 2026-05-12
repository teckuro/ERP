-- crear_sql_v6_6.sql
--
-- NOTA: Para instalación y mantenimiento se prefiere bd/base/v11/run_all.sql (partes/*.sql).
-- Este archivo es el monolito equivalente; si editas el esquema, hazlo en partes/ y regenera aquí si lo usas.
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

-- ============================================
-- TABLAS MAESTRAS
-- ============================================


CREATE TABLE IF NOT EXISTS public.pais (
    id_pais              BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    codigo_iso2          CHAR(2)      NOT NULL,
    codigo_iso3          CHAR(3)      NOT NULL,
    codigo_numerico      CHAR(3)      NOT NULL,
    nombre               VARCHAR(150) NOT NULL,
    nombre_iso           VARCHAR(150) NOT NULL,
    activo               BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion       TIMESTAMP    NOT NULL DEFAULT NOW(),
    fecha_actualizacion  TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_pais_codigo_iso2 UNIQUE (codigo_iso2),
    CONSTRAINT uq_pais_codigo_iso3 UNIQUE (codigo_iso3),
    CONSTRAINT uq_pais_codigo_numerico UNIQUE (codigo_numerico)
);


CREATE TABLE region (
    id_region       INTEGER PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL UNIQUE,
    ordinal         VARCHAR(10)  NOT NULL UNIQUE,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE provincia (
    id_provincia    INTEGER PRIMARY KEY,
    id_region       INTEGER      NOT NULL REFERENCES region(id_region),
    nombre          VARCHAR(150) NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_provincia_region_nombre UNIQUE (id_region, nombre)
);

CREATE TABLE comuna (
    id_comuna       INTEGER PRIMARY KEY,
    id_provincia    INTEGER      NOT NULL REFERENCES provincia(id_provincia),
    nombre          VARCHAR(150) NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comuna_provincia_nombre UNIQUE (id_provincia, nombre)
);

CREATE INDEX idx_provincia_id_region ON provincia (id_region);
CREATE INDEX idx_comuna_id_provincia ON comuna (id_provincia);
CREATE INDEX idx_comuna_nombre ON comuna (nombre);

CREATE TABLE ciudad (
    id_ciudad INT PRIMARY KEY,
    id_comuna INT NOT NULL REFERENCES comuna(id_comuna),
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT uq_ciudad_comuna UNIQUE (id_comuna, nombre)
);

CREATE INDEX idx_ciudad_id_comuna ON ciudad (id_comuna);
CREATE INDEX idx_ciudad_nombre ON ciudad (nombre);

CREATE TABLE banco (
    id_banco SERIAL PRIMARY KEY,
    codigo_sbif VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL UNIQUE,
    nombre_corto VARCHAR(60) NOT NULL,
    es_banco_estado BOOLEAN NOT NULL DEFAULT FALSE,
    es_banco_extranjero BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE parametros_generales (
    periodo VARCHAR(7) PRIMARY KEY,
    uf NUMERIC(14,4),
    utm NUMERIC(12,0),
    uta NUMERIC(12,0),
    sueldo_minimo NUMERIC(12,0),
    sueldo_minimo18_65 NUMERIC(12,0),
    sueldo_minimo_menor18_mayor65 NUMERIC(12,0),
    sueldo_minimo_casa_particular NUMERIC(12,0),
    ingreso_minimo_no_remuneracional NUMERIC(12,0),
    gratificacion BOOLEAN DEFAULT TRUE,
    imm_gratificacion NUMERIC(8,4) DEFAULT 4.75,
    tope_afp_uf NUMERIC(10,4),
    tope_afp NUMERIC(12,0),
    tope_ips_uf NUMERIC(10,4),
    tope_ips NUMERIC(12,0),
    tope_cesantia_uf NUMERIC(10,4),
    tope_cesantia NUMERIC(12,0),
    tope_apv_mensual_uf NUMERIC(10,4),
    tope_apv_mensual NUMERIC(12,0),
    tope_apv_anual_uf NUMERIC(10,4),
    tope_apv_anual NUMERIC(12,0),
    tope_deposito_convenido_anual_uf NUMERIC(10,4),
    tope_deposito_convenido_anual NUMERIC(12,0),
    tope_afpvoluntario NUMERIC(12,0),
    sis NUMERIC(7,4),
    sanna NUMERIC(7,4),
    salud_obligatoria NUMERIC(7,4),
    salud_ccaf NUMERIC(7,4),
    salud_fonasa_con_ccaf NUMERIC(7,4),
    dsctosbpordia BOOLEAN DEFAULT TRUE,
    afc_trabajador_indefinido NUMERIC(7,4) DEFAULT 0.6,
    afc_empleador_indefinido NUMERIC(7,4) DEFAULT 2.4,
    afc_empleador_plazo NUMERIC(7,4) DEFAULT 3.0,
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_parametros_periodo CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
-- Snapshot denormalizado consumido por la app (database.types / repositorio).
-- Detalle normativo sigue en parametros_legales y tabla_impuesto_unico.

CREATE TABLE tramo_carga (
    id_tramo SERIAL PRIMARY KEY,
    periodo VARCHAR(7) NOT NULL,
    desde NUMERIC(12,0),
    hasta NUMERIC(12,0),
    valor NUMERIC(12,0),
    tramo VARCHAR(10),
    CONSTRAINT chk_tramo_carga_periodo CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT chk_tramo_carga_rango CHECK (hasta IS NULL OR desde IS NULL OR hasta >= desde)
);

CREATE TABLE tramo_impuesto (
    id_tramo SERIAL PRIMARY KEY,
    periodo VARCHAR(7) NOT NULL,
    desde NUMERIC(12,0),
    hasta NUMERIC(12,0),
    factor NUMERIC(5,2),
    rebaja NUMERIC(12,0),
    CONSTRAINT chk_tramo_impuesto_periodo CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT chk_tramo_impuesto_rango CHECK (hasta IS NULL OR desde IS NULL OR hasta >= desde)
);

CREATE TABLE afp (
    id_afp SERIAL PRIMARY KEY,
    codigo VARCHAR(30),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tasa_obligatoria NUMERIC(7,4) DEFAULT 10.0000,
    comision NUMERIC(7,4) DEFAULT 0,
    sis NUMERIC(7,4) DEFAULT 0,
    tasa_empleador NUMERIC(7,4) DEFAULT 0,
    vigente BOOLEAN DEFAULT TRUE,
    forma_pago_apvi INT,
    vigencia_inicio DATE,
    vigencia_fin DATE,
    CONSTRAINT chk_afp_tasa_obligatoria CHECK (tasa_obligatoria BETWEEN 10.0000 AND 15.0000),
    CONSTRAINT chk_afp_comision CHECK (comision >= 0),
    CONSTRAINT chk_afp_sis CHECK (sis >= 0),
    CONSTRAINT chk_afp_tasa_empleador CHECK (tasa_empleador >= 0),
    CONSTRAINT chk_afp_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);


CREATE TABLE afp_vigencia (
    id_afp_vigencia SERIAL PRIMARY KEY,
    id_afp INT NOT NULL REFERENCES afp(id_afp) ON DELETE CASCADE,
    tasa_obligatoria NUMERIC(7,4) NOT NULL DEFAULT 10.0000,
    comision NUMERIC(7,4) NOT NULL DEFAULT 0,
    sis NUMERIC(7,4) NOT NULL DEFAULT 0,
    tasa_empleador NUMERIC(7,4) NOT NULL DEFAULT 0,
    tope_imponible_uf NUMERIC(10,4),
    forma_pago_apvi INT,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT uq_afp_vigencia UNIQUE (id_afp, vigencia_inicio),
    CONSTRAINT chk_afp_vigencia_tasa_obligatoria CHECK (tasa_obligatoria BETWEEN 10.0000 AND 15.0000),
    CONSTRAINT chk_afp_vigencia_comision CHECK (comision >= 0),
    CONSTRAINT chk_afp_vigencia_sis CHECK (sis >= 0),
    CONSTRAINT chk_afp_vigencia_tasa_empleador CHECK (tasa_empleador >= 0),
    CONSTRAINT chk_afp_vigencia_rango CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE salud (
    id_salud SERIAL PRIMARY KEY,
    codigo VARCHAR(30),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo tipo_salud_enum,
    porcentaje_cotizacion NUMERIC(7,4) DEFAULT 7.0000,
    vigente BOOLEAN DEFAULT TRUE,
    vigencia_inicio DATE,
    vigencia_fin DATE,
    CONSTRAINT chk_salud_porcentaje CHECK (porcentaje_cotizacion >= 7.0000),
    CONSTRAINT chk_salud_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);


CREATE TABLE salud_plan (
    id_salud_plan SERIAL PRIMARY KEY,
    id_salud INT NOT NULL REFERENCES salud(id_salud) ON DELETE CASCADE,
    codigo VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    id_moneda INT,
    valor_referencia NUMERIC(12,0) NOT NULL DEFAULT 0,
    adicional_ges_referencia NUMERIC(12,0) NOT NULL DEFAULT 0,
    porcentaje_legal NUMERIC(7,4),
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT uq_salud_plan UNIQUE (id_salud, nombre, vigencia_inicio),
    CONSTRAINT chk_salud_plan_valores CHECK (valor_referencia >= 0 AND adicional_ges_referencia >= 0),
    CONSTRAINT chk_salud_plan_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE afc_parametro (
    id_afc_parametro SERIAL PRIMARY KEY,
    codigo_tipo_contrato tipo_contrato_enum NOT NULL,
    aplica_seguro BOOLEAN NOT NULL DEFAULT TRUE,
    aplica_trabajador BOOLEAN NOT NULL DEFAULT TRUE,
    tasa_trabajador NUMERIC(7,4) NOT NULL DEFAULT 0,
    tasa_empleador NUMERIC(7,4) NOT NULL DEFAULT 0,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    observacion TEXT,
    CONSTRAINT uq_afc_parametro UNIQUE (codigo_tipo_contrato, vigencia_inicio),
    CONSTRAINT chk_afc_parametro_tasas CHECK (tasa_trabajador >= 0 AND tasa_empleador >= 0),
    CONSTRAINT chk_afc_parametro_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE tipo_movimiento (
    id_tipo_movimiento INTEGER PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    afecta_dias_trabajados BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_horas BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE motivo_inasistencia (
    id_motivo_inasistencia INTEGER PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descuenta_dias BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE regimen_previsional (
    id_regimen SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tipo_trabajador (
    id_tipo_trabajador SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tipo_jornada (
    id_tipo_jornada SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE moneda (
    id_moneda SERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    simbolo VARCHAR(10) NOT NULL
);

CREATE TABLE tipo_cuenta_bancaria (
    id_tipo_cuenta_bancaria SERIAL PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE institucion_apv (
    id_institucion_apv SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE forma_pago_apv (
    id_forma_pago_apv SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE centro_costo (
    id_centro_costo SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL
);


CREATE TABLE periodo_remuneracion (
    id_periodo SERIAL PRIMARY KEY,
    codigo VARCHAR(7) NOT NULL UNIQUE,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_periodo_remuneracion_codigo CHECK (codigo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT chk_periodo_remuneracion_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_periodo_remuneracion_estado CHECK (estado IN ('pendiente', 'parcial', 'cargado', 'corregido', 'cerrado', 'error')),
    CONSTRAINT uq_periodo_remuneracion_rango UNIQUE (fecha_inicio, fecha_fin)
);

CREATE TABLE entidad_previsional_ips (
    id_entidad_previsional_ips SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ex_caja_previsional (
    id_ex_caja_previsional SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE regimen_ex_caja (
    id_regimen_ex_caja SERIAL PRIMARY KEY,
    id_ex_caja_previsional INT NOT NULL REFERENCES ex_caja_previsional(id_ex_caja_previsional),
    nombre VARCHAR(150) NOT NULL,
    tasa_cotizacion_referencia NUMERIC(7,4),
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_regimen_ex_caja UNIQUE (id_ex_caja_previsional, nombre)
);

CREATE TABLE parametros_legales (
    id_parametro SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    valor_decimal NUMERIC(18,6),
    valor_entero INTEGER,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT uq_parametros_legales UNIQUE (nombre, vigencia_inicio)
);

CREATE TABLE trabajo_pesado_parametro (
    id_trabajo_pesado_parametro SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    tasa_trabajador NUMERIC(7,4) NOT NULL,
    tasa_empleador NUMERIC(7,4) NOT NULL,
    tasa_total NUMERIC(7,4) NOT NULL,
    requiere_dictamen_cen BOOLEAN NOT NULL DEFAULT TRUE,
    fuente TEXT,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL DEFAULT DATE '2025-08-01',
    vigencia_fin DATE,
    CONSTRAINT chk_trabajo_pesado_tasas CHECK (tasa_trabajador >= 0 AND tasa_empleador >= 0 AND tasa_total >= 0),
    CONSTRAINT chk_trabajo_pesado_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE reforma_previsional_parametro (
    id_reforma_previsional_parametro SERIAL PRIMARY KEY,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    aporte_empleador_total NUMERIC(7,4) NOT NULL,
    cuenta_capitalizacion_individual NUMERIC(7,4) NOT NULL,
    fapp_seguro_social NUMERIC(7,4) NOT NULL,
    fuente TEXT,
    CONSTRAINT uq_reforma_previsional_parametro UNIQUE (vigencia_inicio),
    CONSTRAINT chk_reforma_previsional_tasas CHECK (
        aporte_empleador_total >= 0
        AND cuenta_capitalizacion_individual >= 0
        AND fapp_seguro_social >= 0
    ),
    CONSTRAINT chk_reforma_previsional_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE ley_16744_parametros (
    id_ley_16744_parametro SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    cotizacion_basica_empleador NUMERIC(7,4) NOT NULL,
    descripcion_tasa_adicional TEXT,
    fuente_financiamiento TEXT,
    fuente_organismos TEXT,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL DEFAULT DATE '2026-04-01',
    vigencia_fin DATE,
    CONSTRAINT chk_ley_16744_parametros_tasa CHECK (cotizacion_basica_empleador >= 0),
    CONSTRAINT chk_ley_16744_parametros_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE organismo_administrador_ley_16744 (
    id_organismo_administrador_ley_16744 SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ccaf_entidad (
    id_ccaf_entidad SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    fuente TEXT
);

CREATE TABLE tabla_impuesto_unico (
    id SERIAL PRIMARY KEY,
    tramo INTEGER NOT NULL,
    desde NUMERIC(18,2) NOT NULL,
    hasta NUMERIC(18,2),
    factor NUMERIC(8,6) NOT NULL,
    rebaja NUMERIC(18,2) NOT NULL,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT uq_tabla_impuesto_unico UNIQUE (tramo, vigencia_inicio)
);

-- ============================================
-- CORE Y PERSONAS
-- ============================================

CREATE TABLE empresa (
    id_empresa SERIAL PRIMARY KEY,
    rut VARCHAR(9) UNIQUE NOT NULL,
    dv CHAR(1) NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_empresa_rut CHECK (rut ~ '^[0-9]{7,9}$')
);

CREATE TABLE empresa_ley_16744 (
    id_empresa_ley_16744 SERIAL PRIMARY KEY,
    id_empresa INT NOT NULL REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    id_organismo_administrador_ley_16744 INT REFERENCES organismo_administrador_ley_16744(id_organismo_administrador_ley_16744),
    tasa_adicional_diferenciada NUMERIC(7,4) NOT NULL DEFAULT 0,
    actividad_economica VARCHAR(200),
    fuente_resolucion_o_certificado TEXT,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT uq_empresa_ley_16744 UNIQUE (id_empresa, vigencia_inicio),
    CONSTRAINT chk_empresa_ley_16744_tasa CHECK (tasa_adicional_diferenciada >= 0),
    CONSTRAINT chk_empresa_ley_16744_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE sucursal (
    id_sucursal SERIAL PRIMARY KEY,
    id_empresa INT NOT NULL REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    CONSTRAINT uq_sucursal_empresa UNIQUE (id_empresa, codigo)
);

CREATE TABLE departamento_empresa (
    id_departamento_empresa SERIAL PRIMARY KEY,
    id_empresa INT NOT NULL REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    id_sucursal INT REFERENCES sucursal(id_sucursal) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    CONSTRAINT uq_departamento_empresa UNIQUE (id_empresa, id_sucursal, codigo)
);

CREATE TABLE persona (
    id_persona SERIAL PRIMARY KEY,
    rut VARCHAR(9) UNIQUE NOT NULL,
    dv CHAR(1) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'O')),
    id_pais BIGINT REFERENCES public.pais(id_pais),
    -- uso de enumeración para restringir valores permitidos de estado civil
    estado_civil tipo_estado_civil_enum,
    email VARCHAR(100),
    telefono VARCHAR(30),
    pasaporte VARCHAR(30),
    id_comuna INT REFERENCES comuna(id_comuna),
    direccion TEXT,
    numero_direccion VARCHAR(20),
    departamento_direccion VARCHAR(50),
    id_tramo_carga INT REFERENCES tramo_carga(id_tramo),
    tramo_carga_manual BOOLEAN NOT NULL DEFAULT FALSE,
    casa VARCHAR(50),
    villa VARCHAR(100),
    poblacion VARCHAR(100),
    observaciones_direccion TEXT,
    fax VARCHAR(30),
    cargas INT DEFAULT 0,
    estado_ficha tipo_estado_ficha_enum NOT NULL DEFAULT 'BORRADOR',
    estado tipo_estado_persona_enum NOT NULL DEFAULT 'BORRADOR',
    apto_para_remuneraciones BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_activacion TIMESTAMPTZ,
    id_usuario_activacion INT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_persona_rut CHECK (rut ~ '^[0-9]{7,9}$'),
    CONSTRAINT chk_persona_cargas CHECK (cargas >= 0),
    CONSTRAINT chk_persona_activacion CHECK (
        (estado_ficha <> 'VALIDO') OR (fecha_activacion IS NOT NULL)
    )
);


CREATE TABLE cuenta_bancaria (
    id_cuenta SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    id_banco INT NOT NULL REFERENCES banco(id_banco),
    id_tipo_cuenta_bancaria INT NOT NULL REFERENCES tipo_cuenta_bancaria(id_tipo_cuenta_bancaria),
    numero_cuenta VARCHAR(50) NOT NULL,
    titular_nombre VARCHAR(150),
    titular_rut VARCHAR(12),
    es_principal BOOLEAN NOT NULL DEFAULT TRUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_fin DATE,
    observacion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    -- asegura que no existan números de cuenta duplicados por banco
    CONSTRAINT uq_cuenta_bancaria_numero UNIQUE (id_banco, numero_cuenta),
    CONSTRAINT chk_cuenta_bancaria_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT chk_cuenta_bancaria_numero_no_vacio CHECK (length(trim(numero_cuenta)) > 0)
);

-- ============================================
-- RELACION LABORAL
-- ============================================

CREATE TABLE contrato (
    id_contrato SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona),
    id_empresa INT NOT NULL REFERENCES empresa(id_empresa),
    id_sucursal INT REFERENCES sucursal(id_sucursal),
    id_departamento_empresa INT REFERENCES departamento_empresa(id_departamento_empresa),
    id_tipo_trabajador INT REFERENCES tipo_trabajador(id_tipo_trabajador),
    id_tipo_jornada INT REFERENCES tipo_jornada(id_tipo_jornada),
    codigo_tipo_contrato tipo_contrato_enum,
    cargo VARCHAR(100),
    seguro_cesantia BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_contrato DATE,
    fecha_inicio DATE NOT NULL,
    fecha_termino DATE,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    CONSTRAINT chk_contrato_estado CHECK (estado IN ('ACTIVO', 'TERMINADO', 'SUSPENDIDO', 'PENDIENTE')),
    CONSTRAINT chk_contrato_fechas CHECK (fecha_termino IS NULL OR fecha_termino >= fecha_inicio)
);

CREATE TABLE anexo_contrato (
    id_anexo SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    fecha_cambio DATE NOT NULL,
    sueldo_base_nuevo NUMERIC(12,0),
    observacion TEXT
);

CREATE TABLE prevision (
    id_prevision SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    tipo_prevision tipo_prevision_enum NOT NULL,
    id_afp INT REFERENCES afp(id_afp),
    id_regimen_previsional INT REFERENCES regimen_previsional(id_regimen),
    id_entidad_previsional_ips INT REFERENCES entidad_previsional_ips(id_entidad_previsional_ips),
    id_ex_caja_previsional INT REFERENCES ex_caja_previsional(id_ex_caja_previsional),
    id_regimen_ex_caja INT REFERENCES regimen_ex_caja(id_regimen_ex_caja),
    nombre_entidad_ips VARCHAR(150),
    monto_ips NUMERIC(12,0),
    nombre_ex_caja VARCHAR(150),
    regimen_ex_caja VARCHAR(150),
    tasa_ex_caja NUMERIC(7,4),
    observacion_prevision TEXT,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT chk_prevision_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT uq_prevision UNIQUE (id_contrato, vigencia_inicio),
    CONSTRAINT chk_prevision_valores CHECK (
        (monto_ips IS NULL OR monto_ips >= 0) AND
        (tasa_ex_caja IS NULL OR tasa_ex_caja >= 0)
    ),
    CONSTRAINT chk_prevision_regimen CHECK (
        (tipo_prevision IN ('AFP', 'IPS') AND id_regimen_previsional IS NOT NULL) OR
        (tipo_prevision = 'NINGUNA' AND id_regimen_previsional IS NULL)
    ),
    CONSTRAINT chk_prevision_reglas CHECK (
        (
            tipo_prevision = 'AFP' AND
            id_afp IS NOT NULL AND
            id_ex_caja_previsional IS NULL AND
            id_regimen_ex_caja IS NULL AND
            nombre_ex_caja IS NULL AND
            regimen_ex_caja IS NULL AND
            tasa_ex_caja IS NULL
        ) OR
        (
            tipo_prevision = 'IPS' AND
            id_afp IS NULL AND
            (
                (id_ex_caja_previsional IS NOT NULL AND id_regimen_ex_caja IS NOT NULL) OR
                (nombre_ex_caja IS NOT NULL AND regimen_ex_caja IS NOT NULL AND tasa_ex_caja IS NOT NULL)
            )
        ) OR
        (
            tipo_prevision = 'NINGUNA' AND
            id_afp IS NULL AND
            id_ex_caja_previsional IS NULL AND
            id_regimen_ex_caja IS NULL AND
            nombre_ex_caja IS NULL AND
            regimen_ex_caja IS NULL AND
            tasa_ex_caja IS NULL
        )
    )
);

CREATE TABLE salud_trabajador (
    id_salud_trabajador SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    id_salud INT NOT NULL REFERENCES salud(id_salud),
    id_salud_plan INT REFERENCES salud_plan(id_salud_plan),
    usar_plan_parametrizado BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_plan_externo VARCHAR(50),
    plan_salud VARCHAR(150),
    -- Nota v6.1: reglas.txt sugiere que el plan puede expresarse en UF.
    -- En este modelo se mantiene como monto nominal del periodo; si luego se
    -- requiere UF, conviene agregar unidad o normalizar a moneda/UF.
    id_moneda_plan INT REFERENCES moneda(id_moneda),
    valor_plan NUMERIC(12,0) NOT NULL DEFAULT 0,
    adicional_auge_ges NUMERIC(12,0) NOT NULL DEFAULT 0,
    observaciones_salud TEXT,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT chk_salud_trabajador_valores CHECK (valor_plan >= 0 AND adicional_auge_ges >= 0),
    CONSTRAINT chk_salud_trabajador_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT uq_salud_trabajador UNIQUE (id_contrato, vigencia_inicio)
);

CREATE TABLE apv (
    id_apv SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    id_institucion_apv INT NOT NULL REFERENCES institucion_apv(id_institucion_apv),
    id_moneda INT NOT NULL REFERENCES moneda(id_moneda),
    monto NUMERIC(12,0) NOT NULL,
    deposito_convenido_apvi NUMERIC(12,0) NOT NULL DEFAULT 0,
    id_forma_pago_apv INT NOT NULL REFERENCES forma_pago_apv(id_forma_pago_apv),
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT chk_apv_valores CHECK (monto >= 0 AND deposito_convenido_apvi >= 0),
    CONSTRAINT chk_apv_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT uq_apv UNIQUE (id_contrato, id_institucion_apv, vigencia_inicio)
);

CREATE TABLE cuenta2_afp (
    id_cuenta2_afp SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    id_moneda INT NOT NULL REFERENCES moneda(id_moneda),
    monto NUMERIC(12,0) NOT NULL DEFAULT 0,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    observacion TEXT,
    CONSTRAINT chk_cuenta2_afp_monto CHECK (monto >= 0),
    CONSTRAINT chk_cuenta2_afp_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT uq_cuenta2_afp UNIQUE (id_contrato, vigencia_inicio)
);

CREATE TABLE remuneracion (
    id_remuneracion SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    sueldo_base NUMERIC(12,0) NOT NULL,
    sueldo_variable BOOLEAN NOT NULL DEFAULT FALSE,
    id_moneda INT REFERENCES moneda(id_moneda),
    tipo_gratificacion tipo_gratificacion_enum NOT NULL DEFAULT 'LEGAL_ART_50',
    horas_semanales NUMERIC(5,2) NOT NULL DEFAULT 45,
    dias_semanales NUMERIC(5,2) NOT NULL DEFAULT 5,
    distribucion_jornada TEXT,
    tiempo_colacion_minutos INTEGER,
    semana_corrida_activa BOOLEAN NOT NULL DEFAULT FALSE,
    zona_extrema_activa BOOLEAN NOT NULL DEFAULT FALSE,
    gratificacion_proporcional BOOLEAN NOT NULL DEFAULT FALSE,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT chk_remuneracion_sueldo_base CHECK (sueldo_base >= 0),
    CONSTRAINT chk_remuneracion_horas CHECK (horas_semanales >= 0 AND horas_semanales <= 168),
    CONSTRAINT chk_remuneracion_dias CHECK (dias_semanales >= 0 AND dias_semanales <= 7),
    CONSTRAINT chk_remuneracion_colacion CHECK (tiempo_colacion_minutos IS NULL OR tiempo_colacion_minutos BETWEEN 0 AND 600),
    CONSTRAINT chk_remuneracion_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT uq_remuneracion UNIQUE (id_contrato, vigencia_inicio)
);

CREATE TABLE semana_corrida (
    id_semana_corrida SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    dias_laborables INTEGER[] NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT chk_semana_corrida_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT uq_semana_corrida UNIQUE (id_contrato, vigencia_inicio)
);


CREATE TABLE zona_extrema_catalogo (
    id_zona_extrema_catalogo SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    id_region INTEGER REFERENCES region(id_region),
    id_provincia INTEGER REFERENCES provincia(id_provincia),
    id_comuna INTEGER REFERENCES comuna(id_comuna),
    porcentaje NUMERIC(7,4) NOT NULL CHECK (porcentaje >= 0),
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT chk_zona_extrema_catalogo_ubicacion CHECK (
        id_region IS NOT NULL OR id_provincia IS NOT NULL OR id_comuna IS NOT NULL
    ),
    CONSTRAINT chk_zona_extrema_catalogo_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE zona_extrema (
    id_zona_extrema SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    id_zona_extrema_catalogo INT REFERENCES zona_extrema_catalogo(id_zona_extrema_catalogo),
    porcentaje NUMERIC(7,4) NOT NULL CHECK (porcentaje >= 0),
    territorio VARCHAR(150),
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT chk_zona_extrema_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT uq_zona_extrema UNIQUE (id_contrato, vigencia_inicio)
);

CREATE TABLE contrato_centro_costo (
    id_contrato_centro_costo SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    id_centro_costo INT NOT NULL REFERENCES centro_costo(id_centro_costo),
    porcentaje NUMERIC(5,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100)
);

CREATE TABLE IF NOT EXISTS catalogo_lre (
    id_catalogo_lre SERIAL PRIMARY KEY,
    codigo_lre VARCHAR(10) NOT NULL UNIQUE,
    nombre_lre VARCHAR(200) NOT NULL,
    modulo_lre VARCHAR(40) NOT NULL,
    grupo_lre VARCHAR(50),
    clasificacion_lre VARCHAR(60),
    imponible BOOLEAN,
    tributable BOOLEAN,
    afecta_liquido BOOLEAN,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE,
    vigencia_fin DATE,
    observacion TEXT,
    CONSTRAINT chk_catalogo_lre_vigencia CHECK (
        vigencia_fin IS NULL
        OR vigencia_inicio IS NULL
        OR vigencia_fin >= vigencia_inicio
    )
);

CREATE INDEX IF NOT EXISTS idx_catalogo_lre_codigo ON catalogo_lre (codigo_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_modulo ON catalogo_lre (modulo_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_grupo ON catalogo_lre (grupo_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_clasificacion ON catalogo_lre (clasificacion_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_vigente ON catalogo_lre (vigente);

CREATE TABLE concepto (
    id_concepto SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    codigo_motor VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('HABER', 'DESCUENTO', 'APORTE_EMPLEADOR')),
    naturaleza VARCHAR(20) CHECK (naturaleza IN ('IMPONIBLE', 'NO_IMPONIBLE')),
    imponible BOOLEAN NOT NULL DEFAULT FALSE,
    tributable BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_afp BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_salud BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_afc BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_sis BOOLEAN NOT NULL DEFAULT FALSE,
    orden_impresion INT NOT NULL DEFAULT 0,
    calculo_automatico BOOLEAN NOT NULL DEFAULT FALSE,
    formula_json JSONB,
    id_catalogo_lre INT REFERENCES catalogo_lre (id_catalogo_lre) ON DELETE SET NULL,
    estrategia_lre VARCHAR(40) NOT NULL DEFAULT 'DIRECTO',
    requiere_exportacion_lre BOOLEAN NOT NULL DEFAULT TRUE,
    observacion_normativa_lre TEXT,
    afecta_liquido BOOLEAN NOT NULL DEFAULT TRUE,
    es_sistema BOOLEAN NOT NULL DEFAULT FALSE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE,
    vigencia_fin DATE,
    CONSTRAINT chk_concepto_vigencia CHECK (
        vigencia_fin IS NULL
        OR vigencia_inicio IS NULL
        OR vigencia_fin >= vigencia_inicio
    ),
    CONSTRAINT chk_concepto_estrategia_lre CHECK (
        estrategia_lre IN (
            'DIRECTO',
            'DERIVA_DIAS_TRABAJADOS',
            'DERIVA_REBAJA_TRIBUTARIA',
            'DESCOMPONER_CONCEPTO',
            'PENDIENTE_NORMATIVO',
            'NO_EXPORTABLE'
        )
    )
);

CREATE INDEX idx_concepto_catalogo_lre ON concepto (id_catalogo_lre);
CREATE INDEX idx_concepto_estrategia_lre ON concepto (estrategia_lre);
CREATE INDEX idx_concepto_requiere_exportacion_lre ON concepto (requiere_exportacion_lre);
CREATE INDEX idx_concepto_vigente ON concepto (vigente);
CREATE INDEX idx_concepto_es_sistema ON concepto (es_sistema);

CREATE TABLE regla_concepto_calculo (
    id_regla_concepto_calculo SERIAL PRIMARY KEY,
    id_concepto INT NOT NULL REFERENCES concepto(id_concepto) ON DELETE CASCADE,
    codigo_regla VARCHAR(60) NOT NULL,
    orden_calculo INT NOT NULL DEFAULT 0,
    base_calculo VARCHAR(60),
    formula_sql TEXT,
    usa_tope_imponible BOOLEAN NOT NULL DEFAULT FALSE,
    usa_tabla_impuesto BOOLEAN NOT NULL DEFAULT FALSE,
    calculo_automatico BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_fin DATE,
    CONSTRAINT uq_regla_concepto_calculo UNIQUE (id_concepto, codigo_regla, vigencia_inicio),
    CONSTRAINT chk_regla_concepto_calculo_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE movimiento (
    id_movimiento SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    id_contrato INT REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    id_concepto INT REFERENCES concepto(id_concepto),
    fecha DATE NOT NULL,
    id_tipo_movimiento INT REFERENCES tipo_movimiento(id_tipo_movimiento),
    id_motivo_inasistencia INT REFERENCES motivo_inasistencia(id_motivo_inasistencia),
    tipomovimiento INT,
    motivoinasist INT,
    diainasist NUMERIC(5,2),
    hrs_pactadas NUMERIC(5,2),
    monto NUMERIC(12,0),
    cantidad NUMERIC(10,2),
    observacion TEXT
);

CREATE TABLE prestamo (
    id_prestamo SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    descripcion VARCHAR(200),
    monto_total NUMERIC(12,0),
    valor_cuota NUMERIC(12,0),
    cuotas_total INT,
    cuotas_pagadas INT DEFAULT 0,
    saldo_pendiente NUMERIC(12,0),
    fecha_otorgamiento DATE,
    caja VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    CONSTRAINT chk_prestamo_cuotas CHECK (cuotas_total IS NULL OR cuotas_total >= 0),
    CONSTRAINT chk_prestamo_pagadas CHECK (cuotas_pagadas >= 0)
);

CREATE TABLE vacacion_saldo (
    id_vacacion_saldo SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    saldo_dias NUMERIC(6,2) NOT NULL DEFAULT 0,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vacacion_saldo UNIQUE (id_contrato)
);

CREATE TABLE vacacion_movimiento (
    id_vacacion_movimiento SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo tipo_mov_vacaciones_enum NOT NULL,
    dias NUMERIC(6,2) NOT NULL,
    observacion TEXT
);

CREATE TABLE finiquito (
    id_finiquito SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    causal TEXT NOT NULL,
    anios_servicio NUMERIC(6,2) NOT NULL,
    indemnizacion_anios NUMERIC(18,2) NOT NULL DEFAULT 0,
    indemnizacion_aviso_previo NUMERIC(18,2) NOT NULL DEFAULT 0,
    vacaciones_proporcionales NUMERIC(18,2) NOT NULL DEFAULT 0,
    gratificacion_proporcional NUMERIC(18,2) NOT NULL DEFAULT 0,
    otros NUMERIC(18,2) NOT NULL DEFAULT 0,
    total NUMERIC(18,2) NOT NULL
);

-- ============================================
-- REMUNERACIONES
-- ============================================
-- Nota v6.10: concepto se crea antes de movimiento para evitar
-- dependencias adelantadas en la FK id_concepto.

CREATE TABLE haberdescuento_persona (
    id_asignacion SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    id_concepto INT NOT NULL REFERENCES concepto(id_concepto),
    monto NUMERIC(12,0),
    porcentaje NUMERIC(5,2),
    tipo VARCHAR(20),
    tipohaber VARCHAR(20),
    estado BOOLEAN DEFAULT TRUE
);

-- Fase 9.4C: movimientos variables mensuales (haber/descuento puntual por periodo YYYY-MM).
-- No reemplaza haberdescuento_persona. Ver docs/codex/modulos/movimientos-variables/persistencia-9-4C.md
CREATE TABLE IF NOT EXISTS movimiento_variable_mensual (
    id_movimiento_variable SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    id_concepto INT NOT NULL REFERENCES concepto(id_concepto),
    periodo CHAR(7) NOT NULL,
    monto NUMERIC(14, 2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR',
    origen VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    observacion TEXT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_anulacion TIMESTAMPTZ NULL,
    motivo_anulacion TEXT NULL,
    CONSTRAINT chk_movvar_periodo_formato CHECK (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT chk_movvar_periodo_mes CHECK (substring(periodo FROM 6 FOR 2)::int BETWEEN 1 AND 12),
    CONSTRAINT chk_movvar_monto_positivo CHECK (monto > 0),
    CONSTRAINT chk_movvar_estado CHECK (
        estado IN (
            'BORRADOR',
            'VALIDADO',
            'OBSERVADO',
            'ANULADO',
            'BLOQUEADO',
            'INCLUIDO_EN_PROCESO'
        )
    ),
    CONSTRAINT chk_movvar_origen CHECK (origen IN ('MANUAL', 'IMPORTADO', 'SISTEMA'))
);

CREATE INDEX IF NOT EXISTS idx_movvar_periodo ON movimiento_variable_mensual (periodo);
CREATE INDEX IF NOT EXISTS idx_movvar_persona_periodo ON movimiento_variable_mensual (id_persona, periodo);
CREATE INDEX IF NOT EXISTS idx_movvar_concepto_periodo ON movimiento_variable_mensual (id_concepto, periodo);
CREATE INDEX IF NOT EXISTS idx_movvar_estado_periodo ON movimiento_variable_mensual (estado, periodo);

CREATE UNIQUE INDEX IF NOT EXISTS uq_movvar_operativo_persona_concepto_periodo
    ON movimiento_variable_mensual (id_persona, id_concepto, periodo)
    WHERE estado <> 'ANULADO';

CREATE TABLE persona_tramo_carga (
    id_persona_tramo_carga SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    id_tramo INT NOT NULL REFERENCES tramo_carga(id_tramo),
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    observacion TEXT,
    CONSTRAINT uq_persona_tramo_carga UNIQUE (id_persona, vigencia_inicio),
    CONSTRAINT chk_persona_tramo_carga_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE liquidacion (
    id_liquidacion SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL REFERENCES contrato(id_contrato),
    id_persona INT REFERENCES persona(id_persona),
    periodo DATE NOT NULL,
    id_periodo INT REFERENCES periodo_remuneracion(id_periodo),
    fecha_proceso TIMESTAMP DEFAULT NOW(),
    dias_trabajados INT DEFAULT 30,
    total_haberes NUMERIC(12,0),
    total_descuentos NUMERIC(12,0),
    total_aportes_empleador NUMERIC(12,0) DEFAULT 0,
    monto_liquido NUMERIC(12,0),
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    estado_v4 tipo_estado_liquidacion_enum DEFAULT 'BORRADOR',
    idusuario INT,
    valoruf NUMERIC(14,4),
    valorutm NUMERIC(12,0),
    renta_imponible NUMERIC(12,0),
    haberes_imponibles NUMERIC(12,0),
    haberes_noimponibles NUMERIC(12,0),
    descuentos_legales NUMERIC(12,0),
    descuentos_nolegales NUMERIC(12,0),
    imponible_100sc NUMERIC(12,0),
    total_tributable NUMERIC(12,0) DEFAULT 0,
    impuesto_unico NUMERIC(12,0) DEFAULT 0,
    afp_trabajador NUMERIC(12,0) DEFAULT 0,
    salud_trabajador NUMERIC(12,0) DEFAULT 0,
    afc_trabajador NUMERIC(12,0) DEFAULT 0,
    afc_empleador NUMERIC(12,0) DEFAULT 0,
    sis_empleador NUMERIC(12,0) DEFAULT 0,
    zona_extrema NUMERIC(12,0) DEFAULT 0,
    CONSTRAINT uq_liquidacion_periodo UNIQUE (id_contrato, periodo)
);

CREATE TABLE liquidacion_detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_liquidacion INT NOT NULL REFERENCES liquidacion(id_liquidacion) ON DELETE CASCADE,
    id_concepto INT NOT NULL REFERENCES concepto(id_concepto),
    monto NUMERIC(12,0) NOT NULL,
    cantidad NUMERIC(10,2),
    descripcion VARCHAR(200),
    tipo VARCHAR(20),
    tipo_haber VARCHAR(20),
    imponible BOOLEAN NOT NULL DEFAULT FALSE,
    tributable BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_afp BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_salud BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_afc BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_sis BOOLEAN NOT NULL DEFAULT FALSE,
    orden INT,
    CONSTRAINT uq_liquidacion_detalle UNIQUE NULLS NOT DISTINCT (id_liquidacion, id_concepto, descripcion)
);

-- ============================================
-- CONFIGURACION Y SOPORTE
-- ============================================

CREATE TABLE configuracion (
    id_config SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato VARCHAR(20) DEFAULT 'STRING',
    descripcion TEXT,
    modulo VARCHAR(50)
);

CREATE TABLE valores_flexibles (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(50),
    valor TEXT,
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0
);

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    esquema_tabla VARCHAR(150),
    id_registro INT,
    operacion VARCHAR(10),
    usuario VARCHAR(50),
    fecha TIMESTAMP DEFAULT NOW(),
    datos_json JSONB
);

CREATE TABLE ficha_validacion_resumen (
    id_ficha_validacion SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    estado_ficha_calculado tipo_estado_ficha_enum NOT NULL,
    apto_para_activacion BOOLEAN NOT NULL DEFAULT FALSE,
    apto_para_remuneraciones BOOLEAN NOT NULL DEFAULT FALSE,
    total_bloqueantes INTEGER NOT NULL DEFAULT 0,
    total_criticos INTEGER NOT NULL DEFAULT 0,
    total_advertencias INTEGER NOT NULL DEFAULT 0,
    validado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validado_por INT,
    observaciones TEXT
);

CREATE TABLE ficha_validacion_detalle (
    id_ficha_validacion_detalle SERIAL PRIMARY KEY,
    id_ficha_validacion INT NOT NULL REFERENCES ficha_validacion_resumen(id_ficha_validacion) ON DELETE CASCADE,
    dominio tipo_dominio_ficha_enum NOT NULL,
    severidad tipo_severidad_validacion_enum NOT NULL,
    codigo VARCHAR(100) NOT NULL,
    campo VARCHAR(100),
    mensaje TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    resuelto BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    CONSTRAINT uq_ficha_validacion_detalle UNIQUE (id_ficha_validacion, codigo, campo)
);

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

-- ============================================
-- OBJETOS MINIMOS DE COMPATIBILIDAD EN PUBLIC
-- ============================================

CREATE OR REPLACE FUNCTION fn_calcular_dias_trabajados(
    p_id_contrato INTEGER,
    p_periodo DATE,
    p_fecha_ingreso DATE,
    p_fecha_retiro DATE
) RETURNS NUMERIC
LANGUAGE sql
AS $$
WITH limites AS (
    SELECT
        GREATEST(
            p_periodo,
            COALESCE(p_fecha_ingreso, p_periodo)
        )::DATE AS fecha_inicio,
        LEAST(
            (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
            COALESCE(p_fecha_retiro, (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE)
        )::DATE AS fecha_fin
),
dias_base AS (
    SELECT
        fecha_inicio,
        fecha_fin,
        CASE
            WHEN fecha_fin < fecha_inicio THEN 0::NUMERIC
            ELSE (fecha_fin - fecha_inicio + 1)::NUMERIC
        END AS dias_trabajados
    FROM limites
),
dias_licencia AS (
    SELECT
        COALESCE(SUM(m.diainasist), 0)::NUMERIC AS dias_licencia
    FROM dias_base d
    JOIN contrato c ON c.id_contrato = p_id_contrato
    JOIN movimiento m ON m.id_persona = c.id_persona
    LEFT JOIN tipo_movimiento tm
        ON tm.id_tipo_movimiento = COALESCE(m.id_tipo_movimiento, m.tipomovimiento)
    LEFT JOIN motivo_inasistencia mi
        ON mi.id_motivo_inasistencia = COALESCE(m.id_motivo_inasistencia, m.motivoinasist)
    WHERE d.fecha_fin >= d.fecha_inicio
      AND m.fecha BETWEEN d.fecha_inicio AND d.fecha_fin
      AND (
            COALESCE(m.id_tipo_movimiento, m.tipomovimiento) = 3
            OR tm.codigo = 'INASISTENCIA'
          )
      AND (
            COALESCE(m.id_motivo_inasistencia, m.motivoinasist) = 101
            OR mi.codigo = 'LICENCIA_MEDICA'
          )
)
SELECT GREATEST(
    d.dias_trabajados - COALESCE(l.dias_licencia, 0),
    0
)
FROM dias_base d
LEFT JOIN dias_licencia l ON TRUE;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_parametro(
    p_nombre TEXT,
    p_fecha DATE
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(pl.valor_decimal, pl.valor_entero::NUMERIC)
    FROM parametros_legales pl
    WHERE pl.nombre = ANY (
        CASE p_nombre
            WHEN 'TOPE_IMPONIBLE_UF' THEN ARRAY['TOPE_IMPONIBLE_UF', 'TOPE_AFP_UF']
            WHEN 'TOPE_IMPONIBLE_PESOS' THEN ARRAY['TOPE_IMPONIBLE_PESOS', 'TOPE_AFP_PESOS']
            WHEN 'TOPE_IPS_UF' THEN ARRAY['TOPE_IPS_UF', 'TOPE_INP_UF']
            WHEN 'TOPE_IPS_PESOS' THEN ARRAY['TOPE_IPS_PESOS', 'TOPE_INP_PESOS']
            ELSE ARRAY[p_nombre]
        END
    )
      AND pl.vigencia_inicio <= p_fecha
      AND (pl.vigencia_fin IS NULL OR pl.vigencia_fin >= p_fecha)
    ORDER BY
        pl.vigencia_inicio DESC,
        CASE WHEN pl.nombre = p_nombre THEN 0 ELSE 1 END
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_afp(
    p_id_contrato INTEGER,
    p_fecha DATE
) RETURNS TABLE (
    id_afp INTEGER,
    nombre VARCHAR,
    tasa_trabajador NUMERIC,
    comision NUMERIC,
    sis NUMERIC,
    tasa_empleador NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        a.id_afp,
        a.nombre,
        COALESCE(av.tasa_obligatoria, a.tasa_obligatoria) AS tasa_trabajador,
        COALESCE(av.comision, a.comision) AS comision,
        COALESCE(av.sis, a.sis) AS sis,
        COALESCE(av.tasa_empleador, a.tasa_empleador) AS tasa_empleador
    FROM prevision pr
    JOIN afp a
        ON a.id_afp = pr.id_afp
    LEFT JOIN LATERAL (
        SELECT av1.*
        FROM afp_vigencia av1
        WHERE av1.id_afp = a.id_afp
          AND av1.vigencia_inicio <= p_fecha
          AND (av1.vigencia_fin IS NULL OR av1.vigencia_fin >= p_fecha)
        ORDER BY av1.vigencia_inicio DESC
        LIMIT 1
    ) av ON TRUE
    WHERE pr.id_contrato = p_id_contrato
      AND pr.tipo_prevision = 'AFP'
      AND pr.vigencia_inicio <= p_fecha
      AND (pr.vigencia_fin IS NULL OR pr.vigencia_fin >= p_fecha)
    ORDER BY pr.vigencia_inicio DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_salud(
    p_id_contrato INTEGER,
    p_fecha DATE
) RETURNS TABLE (
    id_salud INTEGER,
    nombre VARCHAR,
    tipo VARCHAR,
    porcentaje_cotizacion NUMERIC,
    valor_plan NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        s.id_salud,
        s.nombre,
        s.tipo::VARCHAR,
        COALESCE(sp.porcentaje_legal, s.porcentaje_cotizacion) AS porcentaje_cotizacion,
        CASE
            WHEN COALESCE(st.usar_plan_parametrizado, FALSE)
                THEN COALESCE(NULLIF(st.valor_plan, 0), sp.valor_referencia, 0)
            ELSE COALESCE(st.valor_plan, 0)
        END AS valor_plan
    FROM salud_trabajador st
    JOIN salud s
        ON s.id_salud = st.id_salud
    LEFT JOIN LATERAL (
        SELECT sp1.*
        FROM salud_plan sp1
        WHERE sp1.id_salud_plan = st.id_salud_plan
          AND sp1.vigencia_inicio <= p_fecha
          AND (sp1.vigencia_fin IS NULL OR sp1.vigencia_fin >= p_fecha)
        ORDER BY sp1.vigencia_inicio DESC
        LIMIT 1
    ) sp ON TRUE
    WHERE st.id_contrato = p_id_contrato
      AND st.vigencia_inicio <= p_fecha
      AND (st.vigencia_fin IS NULL OR st.vigencia_fin >= p_fecha)
    ORDER BY st.vigencia_inicio DESC
    LIMIT 1;
$$;


CREATE OR REPLACE FUNCTION fn_obtener_afc_parametro(
    p_codigo_tipo_contrato tipo_contrato_enum,
    p_fecha DATE
) RETURNS TABLE (
    aplica_seguro BOOLEAN,
    aplica_trabajador BOOLEAN,
    tasa_trabajador NUMERIC,
    tasa_empleador NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        ap.aplica_seguro,
        ap.aplica_trabajador,
        ap.tasa_trabajador,
        ap.tasa_empleador
    FROM afc_parametro ap
    WHERE ap.codigo_tipo_contrato = p_codigo_tipo_contrato
      AND ap.vigencia_inicio <= p_fecha
      AND (ap.vigencia_fin IS NULL OR ap.vigencia_fin >= p_fecha)
    ORDER BY ap.vigencia_inicio DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_remuneracion(
    p_id_contrato INTEGER,
    p_fecha DATE
) RETURNS TABLE (
    sueldo_base NUMERIC,
    horas_semanales NUMERIC,
    dias_semanales NUMERIC,
    tipo_gratificacion tipo_gratificacion_enum,
    semana_corrida_activa BOOLEAN,
    zona_extrema_activa BOOLEAN,
    gratificacion_proporcional BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT r.sueldo_base,
           r.horas_semanales,
           r.dias_semanales,
           r.tipo_gratificacion,
           r.semana_corrida_activa,
           r.zona_extrema_activa,
           r.gratificacion_proporcional
    FROM remuneracion r
    WHERE r.id_contrato = p_id_contrato
      AND r.vigencia_inicio <= p_fecha
      AND (r.vigencia_fin IS NULL OR r.vigencia_fin >= p_fecha)
    ORDER BY r.vigencia_inicio DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_calcular_impuesto_unico(
    p_base NUMERIC,
    p_fecha DATE
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN COALESCE(p_base, 0) <= 0 THEN 0::NUMERIC
        ELSE GREATEST(
            ROUND(
                COALESCE((
                    SELECT p_base * tiu.factor - tiu.rebaja
                    FROM tabla_impuesto_unico tiu
                    WHERE tiu.vigencia_inicio <= p_fecha
                      AND (tiu.vigencia_fin IS NULL OR tiu.vigencia_fin >= p_fecha)
                      AND p_base >= tiu.desde
                      AND (tiu.hasta IS NULL OR p_base <= tiu.hasta)
                    ORDER BY tiu.tramo
                    LIMIT 1
                ), 0),
                0
            ),
            0
        )
    END;
$$;

CREATE OR REPLACE FUNCTION fn_formato_decimales(
    p_valor NUMERIC,
    p_decimales INTEGER DEFAULT 0
) RETURNS VARCHAR
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT TO_CHAR(
        p_valor,
        'FM999G999G999G999' ||
        CASE
            WHEN p_decimales > 0 THEN 'D' || REPEAT('9', p_decimales)
            ELSE ''
        END
    );
$$;

CREATE OR REPLACE FUNCTION dblink_dteconfiguracion()
RETURNS TEXT AS $$
DECLARE
    v_connection TEXT;
BEGIN
    v_connection := current_setting('app.dblink_dteconfiguracion', TRUE);

    IF NULLIF(v_connection, '') IS NULL THEN
        RAISE EXCEPTION 'No esta configurado app.dblink_dteconfiguracion';
    END IF;

    RETURN v_connection;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE VIEW vw_persona_factores AS
SELECT
    p.id_persona,
    p.rut,
    p.dv,
    p.nombres,
    p.apellido_paterno,
    p.apellido_materno,
    p.fecha_nacimiento,
    p.sexo,
    p.email,
    p.telefono,
    p.id_pais,
    pa.nombre AS pais,
    p.id_comuna,
    p.estado,
    p.estado_ficha,
    p.apto_para_remuneraciones,
    com.nombre AS comuna,
    prv.id_provincia,
    prv.nombre AS provincia,
    reg.id_region,
    reg.nombre AS region,
    p.direccion,
    p.cargas,
    c.id_contrato,
    c.id_empresa,
    c.cargo,
    c.seguro_cesantia,
    c.codigo_tipo_contrato,
    tt.nombre AS tipo_trabajador_nombre,
    tj.nombre AS tipo_jornada_nombre,
    r.sueldo_base AS base,
    CASE
        WHEN COALESCE(r.dias_semanales, 0) > 0 THEN ROUND(r.sueldo_base / 30.0, 0)
        ELSE NULL
    END AS monto_dia,
    r.horas_semanales,
    r.dias_semanales,
    r.tipo_gratificacion AS gratificacion_tipo,
    r.semana_corrida_activa,
    r.zona_extrema_activa,
    pr.tipo_prevision,
    pr.id_regimen_previsional,
    rp.nombre AS regimen_previsional_nombre,
    pr.id_afp,
    a.nombre AS afp_nombre,
    COALESCE(av.tasa_obligatoria, a.tasa_obligatoria) AS tasa_obligatoria,
    COALESCE(av.comision, a.comision) AS comision,
    COALESCE(av.sis, a.sis) AS sis,
    COALESCE(av.tasa_empleador, a.tasa_empleador) AS tasa_empleador,
    st.id_salud,
    s.nombre AS salud_nombre_full,
    s.tipo AS salud_tipo,
    s.porcentaje_cotizacion,
    st.valor_plan,
    c.fecha_inicio AS fingreso,
    c.fecha_termino AS fretiro,
    c.estado AS estado_contrato
FROM persona p
LEFT JOIN public.pais pa
    ON pa.id_pais = p.id_pais
LEFT JOIN comuna com
    ON com.id_comuna = p.id_comuna
LEFT JOIN provincia prv
    ON prv.id_provincia = com.id_provincia
LEFT JOIN region reg
    ON reg.id_region = prv.id_region
LEFT JOIN contrato c
    ON p.id_persona = c.id_persona
LEFT JOIN tipo_trabajador tt
    ON tt.id_tipo_trabajador = c.id_tipo_trabajador
LEFT JOIN tipo_jornada tj
    ON tj.id_tipo_jornada = c.id_tipo_jornada
LEFT JOIN LATERAL (
    SELECT pr1.*
    FROM prevision pr1
    WHERE pr1.id_contrato = c.id_contrato
      AND pr1.vigencia_inicio <= CURRENT_DATE
      AND (pr1.vigencia_fin IS NULL OR pr1.vigencia_fin >= CURRENT_DATE)
    ORDER BY pr1.vigencia_inicio DESC
    LIMIT 1
) pr ON TRUE
LEFT JOIN regimen_previsional rp
    ON rp.id_regimen = pr.id_regimen_previsional
LEFT JOIN afp a
    ON a.id_afp = pr.id_afp
LEFT JOIN LATERAL (
    SELECT av1.*
    FROM afp_vigencia av1
    WHERE av1.id_afp = a.id_afp
      AND av1.vigencia_inicio <= CURRENT_DATE
      AND (av1.vigencia_fin IS NULL OR av1.vigencia_fin >= CURRENT_DATE)
    ORDER BY av1.vigencia_inicio DESC
    LIMIT 1
) av ON TRUE
LEFT JOIN LATERAL (
    SELECT st1.*
    FROM salud_trabajador st1
    WHERE st1.id_contrato = c.id_contrato
      AND st1.vigencia_inicio <= CURRENT_DATE
      AND (st1.vigencia_fin IS NULL OR st1.vigencia_fin >= CURRENT_DATE)
    ORDER BY st1.vigencia_inicio DESC
    LIMIT 1
) st ON TRUE
LEFT JOIN salud s
    ON s.id_salud = st.id_salud
LEFT JOIN LATERAL (
    SELECT r1.*
    FROM remuneracion r1
    WHERE r1.id_contrato = c.id_contrato
      AND r1.vigencia_inicio <= CURRENT_DATE
      AND (r1.vigencia_fin IS NULL OR r1.vigencia_fin >= CURRENT_DATE)
    ORDER BY r1.vigencia_inicio DESC
    LIMIT 1
) r ON TRUE;

CREATE OR REPLACE FUNCTION fn_generar_liquidacion(
    p_id_contrato INTEGER,
    p_periodo DATE,
    p_id_usuario INTEGER,
    p_preview BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    id_liquidacion INTEGER,
    estado VARCHAR(20),
    total_liquido NUMERIC,
    mensaje VARCHAR
) AS $$
DECLARE
    v_persona RECORD;
    v_rem RECORD;
    v_afp_cfg RECORD;
    v_salud_cfg RECORD;
    v_afc_cfg RECORD;
    v_id_liquidacion INTEGER;
    v_estado_final VARCHAR(20);
    v_dias_trabajados NUMERIC := 0;
    v_dias_mes NUMERIC := 30;
    v_sueldo_base NUMERIC := 0;
    v_valor_dia NUMERIC := 0;
    v_gratificacion NUMERIC := 0;
    v_base_gratificacion NUMERIC := 0;
    v_factor_gratificacion NUMERIC := 1;
    v_tope_gratificacion NUMERIC := 0;
    v_descripcion_gratificacion VARCHAR(200) := NULL;
    v_haberes_imponibles NUMERIC := 0;
    v_haberes_noimponibles NUMERIC := 0;
    v_total_haberes NUMERIC := 0;
    v_descuentos_legales NUMERIC := 0;
    v_descuentos_nolegales NUMERIC := 0;
    v_total_descuentos NUMERIC := 0;
    v_total_liquido NUMERIC := 0;
    v_renta_imponible NUMERIC := 0;
    v_afp NUMERIC := 0;
    v_salud NUMERIC := 0;
    v_cesantia NUMERIC := 0;
    v_sis NUMERIC := 0;
    v_afc_empleador NUMERIC := 0;
    v_aporte_afp_empleador NUMERIC := 0;
    v_total_aportes_empleador NUMERIC := 0;
    v_impuesto NUMERIC := 0;
    v_base_afp NUMERIC := 0;
    v_base_cesantia NUMERIC := 0;
    v_zona_extrema NUMERIC := 0;
    v_tipo_contrato_base VARCHAR(50);
    v_valor_uf NUMERIC := 0;
    v_valor_utm NUMERIC := 0;
    v_sueldo_minimo NUMERIC := 0;
    v_imm_gratificacion NUMERIC := 4.75;
    v_tope_imponible_uf NUMERIC := 0;
    v_tope_afp_pesos NUMERIC := 0;
    v_tope_cesantia_pesos NUMERIC := 0;
    v_afc_trabajador_indefinido NUMERIC := 0.6;
    v_afc_empleador_indefinido NUMERIC := 2.4;
    v_afc_empleador_plazo NUMERIC := 3.0;
    v_afc_tasa_trabajador NUMERIC := 0;
    v_afc_tasa_empleador NUMERIC := 0;
    v_afc_aplica_trabajador BOOLEAN := FALSE;
BEGIN
    IF p_id_contrato IS NULL OR p_periodo IS NULL THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Parametros invalidos'::VARCHAR;
        RETURN;
    END IF;

    SELECT
        p.id_persona,
        c.codigo_tipo_contrato,
        c.seguro_cesantia,
        c.fecha_inicio AS fingreso,
        c.fecha_termino AS fretiro
    INTO v_persona
    FROM contrato c
    JOIN persona p
        ON p.id_persona = c.id_persona
    WHERE c.id_contrato = p_id_contrato
      AND c.fecha_inicio <= (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE
      AND (c.fecha_termino IS NULL OR c.fecha_termino >= p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Contrato no vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    SELECT *
    INTO v_rem
    FROM fn_obtener_remuneracion(p_id_contrato, p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe remuneracion vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    SELECT *
    INTO v_afp_cfg
    FROM fn_obtener_afp(p_id_contrato, p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe prevision AFP vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    SELECT *
    INTO v_salud_cfg
    FROM fn_obtener_salud(p_id_contrato, p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe salud vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    v_valor_uf := COALESCE(fn_obtener_parametro('UF', p_periodo), 0);
    v_valor_utm := COALESCE(fn_obtener_parametro('UTM', p_periodo), 0);
    v_sueldo_minimo := COALESCE(fn_obtener_parametro('SUELDO_MINIMO', p_periodo), 0);
    v_imm_gratificacion := COALESCE(fn_obtener_parametro('IMM_GRATIFICACION', p_periodo), 4.75);
    v_tope_imponible_uf := COALESCE(fn_obtener_parametro('TOPE_IMPONIBLE_UF', p_periodo), 0);
    v_afc_trabajador_indefinido := COALESCE(fn_obtener_parametro('AFC_TRABAJADOR_INDEFINIDO', p_periodo), 0.6);
    v_afc_empleador_indefinido := COALESCE(fn_obtener_parametro('AFC_EMPLEADOR_INDEFINIDO', p_periodo), 2.4);
    v_afc_empleador_plazo := COALESCE(fn_obtener_parametro('AFC_EMPLEADOR_PLAZO', p_periodo), 3.0);

    IF v_valor_uf <= 0 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe parametro UF vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_sueldo_minimo, 0) <= 0 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe sueldo minimo legal vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_rem.sueldo_base, 0) < v_sueldo_minimo THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Sueldo base bajo minimo legal vigente'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_afp_cfg.tasa_trabajador, 0) + COALESCE(v_afp_cfg.comision, 0) NOT BETWEEN 10 AND 15 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Tasa AFP fuera de rango permitido'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_salud_cfg.porcentaje_cotizacion, 0) < 7 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Cotizacion de salud menor al minimo legal'::VARCHAR;
        RETURN;
    END IF;

    IF v_tope_imponible_uf > 0 THEN
        v_tope_afp_pesos := ROUND(v_tope_imponible_uf * v_valor_uf, 0);
        v_tope_cesantia_pesos := v_tope_afp_pesos;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM liquidacion liq
        WHERE liq.id_contrato = p_id_contrato
          AND liq.periodo = p_periodo
          AND liq.estado <> 'BORRADOR'
    ) THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Liquidacion ya existe para el periodo'::VARCHAR;
        RETURN;
    END IF;

    DELETE FROM liquidacion_detalle
    WHERE liquidacion_detalle.id_liquidacion IN (
        SELECT liq.id_liquidacion
        FROM liquidacion liq
        WHERE liq.id_contrato = p_id_contrato
          AND liq.periodo = p_periodo
          AND liq.estado = 'BORRADOR'
    );

    DELETE FROM liquidacion
    WHERE liquidacion.id_contrato = p_id_contrato
      AND liquidacion.periodo = p_periodo
      AND liquidacion.estado = 'BORRADOR';

    v_estado_final := CASE WHEN p_preview THEN 'BORRADOR' ELSE 'PROCESADA' END;

    v_sueldo_base := COALESCE(v_rem.sueldo_base, 0);
    v_valor_dia := ROUND(v_sueldo_base / v_dias_mes, 0);
    v_tipo_contrato_base := UPPER(COALESCE(v_persona.codigo_tipo_contrato::TEXT, 'INDEFINIDO'));

    SELECT *
    INTO v_afc_cfg
    FROM fn_obtener_afc_parametro(v_persona.codigo_tipo_contrato, p_periodo);

    IF FOUND THEN
        v_afc_tasa_trabajador := COALESCE(v_afc_cfg.tasa_trabajador, 0);
        v_afc_tasa_empleador := COALESCE(v_afc_cfg.tasa_empleador, 0);
        v_afc_aplica_trabajador := COALESCE(v_afc_cfg.aplica_trabajador, FALSE);
    ELSE
        IF v_tipo_contrato_base = 'INDEFINIDO' THEN
            v_afc_tasa_trabajador := v_afc_trabajador_indefinido;
            v_afc_tasa_empleador := v_afc_empleador_indefinido;
            v_afc_aplica_trabajador := TRUE;
        ELSE
            v_afc_tasa_trabajador := 0;
            v_afc_tasa_empleador := v_afc_empleador_plazo;
            v_afc_aplica_trabajador := FALSE;
        END IF;
    END IF;

    INSERT INTO liquidacion AS liq (
        id_contrato,
        id_persona,
        periodo,
        id_periodo,
        fecha_proceso,
        dias_trabajados,
        idusuario,
        valoruf,
        valorutm,
        estado,
        estado_v4
    ) VALUES (
        p_id_contrato,
        v_persona.id_persona,
        p_periodo,
        (
            SELECT pr.id_periodo
            FROM periodo_remuneracion pr
            WHERE pr.codigo = TO_CHAR(p_periodo, 'YYYY-MM')
            LIMIT 1
        ),
        NOW(),
        30,
        p_id_usuario,
        v_valor_uf,
        v_valor_utm,
        'BORRADOR',
        'BORRADOR'
    )
    RETURNING liq.id_liquidacion INTO v_id_liquidacion;

    v_dias_trabajados := fn_calcular_dias_trabajados(
        p_id_contrato,
        p_periodo,
        v_persona.fingreso,
        v_persona.fretiro
    );

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        c.id_concepto,
        ROUND(v_dias_trabajados * COALESCE(v_valor_dia, 0), 0),
        v_dias_trabajados,
        'Sueldo Base - ' || v_dias_trabajados || ' dias',
        'H',
        'I',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        1
    FROM concepto c
    WHERE c.codigo = 'SUELDO_BASE';

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        x.id_concepto,
        x.monto,
        1,
        x.descripcion,
        x.tipo,
        x.tipo_haber,
        x.imponible,
        x.tributable,
        x.afecta_afp,
        x.afecta_salud,
        x.afecta_afc,
        x.afecta_sis,
        x.orden
    FROM (
        SELECT
            hd.id_concepto,
            SUM(CASE
                WHEN hd.tipo = 'PORCENTAJE' THEN COALESCE(hd.porcentaje, 0) * COALESCE(v_sueldo_base, 0) / 100
                ELSE COALESCE(hd.monto, 0)
            END) AS monto,
            MAX(c.nombre) AS descripcion,
            CASE WHEN MAX(c.tipo) = 'HABER' THEN 'H' WHEN MAX(c.tipo) = 'DESCUENTO' THEN 'D' ELSE 'A' END AS tipo,
            CASE
                WHEN MAX(c.tipo) = 'HABER' AND MAX(c.naturaleza) = 'IMPONIBLE' THEN 'I'
                WHEN MAX(c.tipo) = 'HABER' AND MAX(c.naturaleza) = 'NO_IMPONIBLE' THEN 'N'
                ELSE NULL
            END AS tipo_haber,
            BOOL_OR(c.imponible) AS imponible,
            BOOL_OR(c.tributable) AS tributable,
            BOOL_OR(c.afecta_afp) AS afecta_afp,
            BOOL_OR(c.afecta_salud) AS afecta_salud,
            BOOL_OR(c.afecta_afc) AS afecta_afc,
            BOOL_OR(c.afecta_sis) AS afecta_sis,
            10 + ROW_NUMBER() OVER (ORDER BY hd.id_concepto) AS orden
        FROM haberdescuento_persona hd
        JOIN concepto c
            ON c.id_concepto = hd.id_concepto
        WHERE hd.id_persona = v_persona.id_persona
          AND hd.estado = TRUE
        GROUP BY hd.id_concepto
    ) x
    WHERE x.monto <> 0;

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        x.id_concepto,
        x.monto,
        x.cantidad,
        x.descripcion,
        x.tipo,
        x.tipo_haber,
        x.imponible,
        x.tributable,
        x.afecta_afp,
        x.afecta_salud,
        x.afecta_afc,
        x.afecta_sis,
        x.orden
    FROM (
        SELECT
            CASE
                WHEN m.id_concepto IS NOT NULL THEN m.id_concepto
                WHEN m.tipomovimiento = 2 THEN (SELECT id_concepto FROM concepto WHERE codigo = 'HORAS_EXTRAS')
                WHEN m.tipomovimiento = 3 THEN (SELECT id_concepto FROM concepto WHERE codigo = 'INASISTENCIA')
                ELSE NULL
            END AS id_concepto,
            SUM(COALESCE(m.monto, 0)) AS monto,
            CASE
                WHEN m.cantidad IS NOT NULL THEN SUM(COALESCE(m.cantidad, 0))
                WHEN m.tipomovimiento = 2 THEN SUM(COALESCE(m.hrs_pactadas, 0))
                WHEN m.tipomovimiento = 3 THEN SUM(COALESCE(m.diainasist, 0))
                ELSE 0
            END AS cantidad,
            MAX(COALESCE(m.observacion, c.nombre, 'Movimiento')) AS descripcion,
            CASE
                WHEN COALESCE(c.tipo, CASE WHEN m.tipomovimiento = 2 THEN 'HABER' ELSE 'DESCUENTO' END) = 'HABER' THEN 'H'
                WHEN COALESCE(c.tipo, 'DESCUENTO') = 'DESCUENTO' THEN 'D'
                ELSE 'A'
            END AS tipo,
            CASE
                WHEN COALESCE(c.tipo, CASE WHEN m.tipomovimiento = 2 THEN 'HABER' ELSE 'DESCUENTO' END) = 'HABER'
                     AND COALESCE(c.naturaleza, 'IMPONIBLE') = 'IMPONIBLE' THEN 'I'
                WHEN COALESCE(c.tipo, CASE WHEN m.tipomovimiento = 2 THEN 'HABER' ELSE 'DESCUENTO' END) = 'HABER' THEN 'N'
                ELSE NULL
            END AS tipo_haber,
            BOOL_OR(COALESCE(c.imponible, m.tipomovimiento = 2)) AS imponible,
            BOOL_OR(COALESCE(c.tributable, m.tipomovimiento = 2)) AS tributable,
            BOOL_OR(COALESCE(c.afecta_afp, m.tipomovimiento = 2)) AS afecta_afp,
            BOOL_OR(COALESCE(c.afecta_salud, m.tipomovimiento = 2)) AS afecta_salud,
            BOOL_OR(COALESCE(c.afecta_afc, m.tipomovimiento = 2)) AS afecta_afc,
            BOOL_OR(COALESCE(c.afecta_sis, FALSE)) AS afecta_sis,
            20 + ROW_NUMBER() OVER (ORDER BY COALESCE(m.id_concepto, m.tipomovimiento)) AS orden
        FROM movimiento m
        LEFT JOIN concepto c
            ON c.id_concepto = m.id_concepto
        WHERE m.id_persona = v_persona.id_persona
          AND (m.id_contrato IS NULL OR m.id_contrato = p_id_contrato)
          AND m.fecha BETWEEN p_periodo AND (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE
          AND (m.tipomovimiento IN (2, 3) OR m.id_concepto IS NOT NULL)
        GROUP BY COALESCE(m.id_concepto, m.tipomovimiento)
    ) x
    WHERE x.id_concepto IS NOT NULL
      AND x.monto <> 0;

    v_factor_gratificacion := CASE
        WHEN COALESCE(v_rem.gratificacion_proporcional, FALSE) THEN v_dias_trabajados / v_dias_mes
        ELSE 1
    END;

    SELECT COALESCE(SUM(ld.monto), 0)
    INTO v_base_gratificacion
    FROM liquidacion_detalle ld
    WHERE ld.id_liquidacion = v_id_liquidacion
      AND ld.tipo = 'H'
      AND ld.tipo_haber = 'I';

    v_gratificacion := 0;
    v_descripcion_gratificacion := NULL;

    -- v6.1: se ajusta segun reglas.txt.
    -- Art. 50 usa la base imponible del periodo antes de gratificacion.
    -- Art. 47 depende de utilidades de la empresa, por lo que no se autoconsume.
    -- Voluntaria no se autoconsume para evitar duplicar montos definidos manualmente por concepto.
    CASE COALESCE(v_rem.tipo_gratificacion, 'LEGAL_ART_50')
        WHEN 'LEGAL_ART_50' THEN
            v_gratificacion := ROUND((v_base_gratificacion * 0.25) * v_factor_gratificacion, 0);
            v_tope_gratificacion := ROUND((v_sueldo_minimo * v_imm_gratificacion / 12) * v_factor_gratificacion, 0);
            v_gratificacion := LEAST(v_gratificacion, v_tope_gratificacion);
            v_descripcion_gratificacion := 'Gratificacion legal Art. 50';
        WHEN 'LEGAL_ART_47' THEN
            v_gratificacion := 0;
            v_descripcion_gratificacion := NULL;
        WHEN 'VOLUNTARIA' THEN
            v_gratificacion := 0;
            v_descripcion_gratificacion := NULL;
        ELSE
            v_gratificacion := 0;
            v_descripcion_gratificacion := NULL;
    END CASE;

    IF v_gratificacion > 0 AND COALESCE(v_descripcion_gratificacion, '') <> '' THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_gratificacion,
            1,
            CASE
                WHEN COALESCE(v_rem.gratificacion_proporcional, FALSE)
                    THEN v_descripcion_gratificacion || ' proporcional'
                ELSE v_descripcion_gratificacion
            END,
            'H',
            'I',
            c.imponible,
            c.tributable,
            c.afecta_afp,
            c.afecta_salud,
            c.afecta_afc,
            c.afecta_sis,
            2
        FROM concepto c
        WHERE c.codigo = 'GRATIFICACION';
    END IF;

    SELECT COALESCE(SUM(monto), 0)
    INTO v_haberes_imponibles
    FROM liquidacion_detalle ld
    WHERE ld.id_liquidacion = v_id_liquidacion
      AND ld.tipo = 'H'
      AND ld.tipo_haber = 'I';

    v_base_afp := LEAST(v_haberes_imponibles, COALESCE(NULLIF(v_tope_afp_pesos, 0), v_haberes_imponibles));
    v_base_cesantia := LEAST(v_haberes_imponibles, COALESCE(NULLIF(v_tope_cesantia_pesos, 0), v_haberes_imponibles));

    IF v_afp_cfg.id_afp IS NOT NULL THEN
        v_afp := ROUND(v_base_afp * (COALESCE(v_afp_cfg.tasa_trabajador, 0) + COALESCE(v_afp_cfg.comision, 0)) / 100, 0);
        v_sis := ROUND(v_base_afp * COALESCE(v_afp_cfg.sis, fn_obtener_parametro('SIS', p_periodo), 0) / 100, 0);
        v_aporte_afp_empleador := ROUND(v_base_afp * COALESCE(v_afp_cfg.tasa_empleador, 0) / 100, 0);

        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_afp,
            COALESCE(v_afp_cfg.tasa_trabajador, 0) + COALESCE(v_afp_cfg.comision, 0),
            'AFP ' || COALESCE(v_afp_cfg.nombre, ''),
            'D',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            30
        FROM concepto c
        WHERE c.codigo = 'AFP'
          AND v_afp > 0;
    END IF;

    IF v_salud_cfg.id_salud IS NOT NULL AND v_salud_cfg.tipo = 'ISAPRE' AND COALESCE(v_salud_cfg.valor_plan, 0) > 0 THEN
        v_salud := GREATEST(
            ROUND(v_base_afp * COALESCE(v_salud_cfg.porcentaje_cotizacion, 7) / 100, 0),
            COALESCE(v_salud_cfg.valor_plan, 0)
        );
    ELSE
        v_salud := ROUND(v_base_afp * COALESCE(v_salud_cfg.porcentaje_cotizacion, 7) / 100, 0);
    END IF;

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        c.id_concepto,
        v_salud,
        COALESCE(v_salud_cfg.porcentaje_cotizacion, 7),
        'Salud ' || COALESCE(v_salud_cfg.nombre, ''),
        'D',
        NULL,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        31
    FROM concepto c
    WHERE c.codigo = 'SALUD'
      AND v_salud > 0;

    IF COALESCE(v_persona.seguro_cesantia, FALSE) THEN
        IF COALESCE(v_afc_aplica_trabajador, FALSE) THEN
            v_cesantia := ROUND(v_base_cesantia * v_afc_tasa_trabajador / 100, 0);
        ELSE
            v_cesantia := 0;
        END IF;
        v_afc_empleador := ROUND(v_base_cesantia * COALESCE(v_afc_tasa_empleador, 0) / 100, 0);

        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_cesantia,
            v_afc_tasa_trabajador,
            'Seguro Cesantia',
            'D',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            32
        FROM concepto c
        WHERE c.codigo = 'CESANTIA'
          AND v_cesantia > 0;
    END IF;

    IF COALESCE(v_rem.zona_extrema_activa, FALSE) THEN
        SELECT ROUND(
                   v_haberes_imponibles
                   * COALESCE(zec.porcentaje, ze.porcentaje) / 100,
                   0
               )
        INTO v_zona_extrema
        FROM zona_extrema ze
        LEFT JOIN zona_extrema_catalogo zec
            ON zec.id_zona_extrema_catalogo = ze.id_zona_extrema_catalogo
           AND zec.vigencia_inicio <= p_periodo
           AND (zec.vigencia_fin IS NULL OR zec.vigencia_fin >= p_periodo)
        WHERE ze.id_contrato = p_id_contrato
          AND ze.vigencia_inicio <= p_periodo
          AND (ze.vigencia_fin IS NULL OR ze.vigencia_fin >= p_periodo)
        ORDER BY ze.vigencia_inicio DESC
        LIMIT 1;

        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_zona_extrema,
            1,
            'Zona extrema',
            'H',
            'N',
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            35
        FROM concepto c
        WHERE c.codigo = 'ZONA_EXTREMA'
          AND COALESCE(v_zona_extrema, 0) > 0;
    END IF;

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        c.id_concepto,
        SUM(p.valor_cuota) AS monto,
        COUNT(*)::NUMERIC,
        'Prestamos activos',
        'D',
        NULL,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        40
    FROM prestamo p
    JOIN concepto c
        ON c.codigo = 'PRESTAMO'
    WHERE p.id_persona = v_persona.id_persona
      AND p.estado = 'ACTIVO'
      AND p.saldo_pendiente > 0
    GROUP BY c.id_concepto
    HAVING SUM(p.valor_cuota) > 0;

    SELECT COALESCE(SUM(monto), 0)
    INTO v_descuentos_legales
    FROM liquidacion_detalle ld
    JOIN concepto c
        ON c.id_concepto = ld.id_concepto
    WHERE ld.id_liquidacion = v_id_liquidacion
      AND ld.tipo = 'D'
      AND c.codigo IN ('AFP', 'SALUD', 'CESANTIA');

    v_renta_imponible := GREATEST(v_haberes_imponibles - v_descuentos_legales, 0);
    v_impuesto := fn_calcular_impuesto_unico(v_renta_imponible, p_periodo);

    IF v_impuesto > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_impuesto,
            1,
            'Impuesto a la Renta',
            'D',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            50
        FROM concepto c
        WHERE c.codigo = 'IMPUESTO_RENTA';
    END IF;

    IF v_aporte_afp_empleador > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_aporte_afp_empleador,
            1,
            'Aporte AFP empleador',
            'A',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            120
        FROM concepto c
        WHERE c.codigo = 'AFP_EMPLEADOR';
    END IF;

    IF v_sis > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_sis,
            1,
            'SIS empleador',
            'A',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            121
        FROM concepto c
        WHERE c.codigo = 'SIS_EMPLEADOR';
    END IF;

    IF v_afc_empleador > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_afc_empleador,
            1,
            'AFC empleador',
            'A',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            122
        FROM concepto c
        WHERE c.codigo = 'AFC_EMPLEADOR';
    END IF;

    SELECT
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'I' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'N' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND c.codigo IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA') THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND (c.codigo IS NULL OR c.codigo NOT IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA')) THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'A' THEN ld.monto END), 0)
    INTO
        v_haberes_imponibles,
        v_haberes_noimponibles,
        v_total_haberes,
        v_descuentos_legales,
        v_descuentos_nolegales,
        v_total_descuentos,
        v_total_aportes_empleador
    FROM liquidacion_detalle ld
    LEFT JOIN concepto c
        ON c.id_concepto = ld.id_concepto
    WHERE ld.id_liquidacion = v_id_liquidacion;

    v_total_liquido := v_total_haberes - v_total_descuentos;

    UPDATE liquidacion liq
    SET dias_trabajados = ROUND(v_dias_trabajados)::INT,
        total_haberes = v_total_haberes,
        total_descuentos = v_total_descuentos,
        total_aportes_empleador = v_total_aportes_empleador,
        monto_liquido = v_total_liquido,
        renta_imponible = v_renta_imponible,
        haberes_imponibles = v_haberes_imponibles,
        haberes_noimponibles = v_haberes_noimponibles,
        descuentos_legales = v_descuentos_legales,
        descuentos_nolegales = v_descuentos_nolegales,
        imponible_100sc = v_haberes_imponibles,
        total_tributable = v_renta_imponible,
        impuesto_unico = v_impuesto,
        afp_trabajador = v_afp,
        salud_trabajador = v_salud,
        afc_trabajador = v_cesantia,
        afc_empleador = v_afc_empleador,
        sis_empleador = v_sis,
        zona_extrema = COALESCE(v_zona_extrema, 0),
        estado = v_estado_final,
        estado_v4 = v_estado_final::tipo_estado_liquidacion_enum
    WHERE liq.id_liquidacion = v_id_liquidacion;

    RETURN QUERY
    SELECT v_id_liquidacion, v_estado_final, v_total_liquido, 'Liquidacion generada'::VARCHAR;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_validar_liquidacion(
    p_id_liquidacion INTEGER
) RETURNS TABLE (
    validacion TEXT,
    ok BOOLEAN,
    esperado TEXT,
    actual TEXT,
    detalle TEXT
) AS $$
DECLARE
    v_liq RECORD;
    v_calc RECORD;
BEGIN
    SELECT l.*
    INTO v_liq
    FROM liquidacion l
    WHERE l.id_liquidacion = p_id_liquidacion;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            'liquidacion_existe'::TEXT,
            FALSE,
            'id_liquidacion valido'::TEXT,
            COALESCE(p_id_liquidacion::TEXT, 'NULL'),
            'No existe la liquidacion indicada'::TEXT;
        RETURN;
    END IF;

    SELECT
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'I' THEN ld.monto END), 0) AS haberes_imponibles,
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'N' THEN ld.monto END), 0) AS haberes_noimponibles,
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' THEN ld.monto END), 0) AS total_haberes,
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND c.codigo IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA') THEN ld.monto END), 0) AS descuentos_legales,
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND (c.codigo IS NULL OR c.codigo NOT IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA')) THEN ld.monto END), 0) AS descuentos_nolegales,
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' THEN ld.monto END), 0) AS total_descuentos,
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' THEN ld.monto WHEN ld.tipo = 'D' THEN -ld.monto ELSE 0 END), 0) AS monto_liquido,
        COALESCE(SUM(CASE WHEN ld.tipo = 'A' THEN ld.monto END), 0) AS total_aportes_empleador,
        COALESCE(SUM(CASE WHEN c.codigo = 'HORAS_EXTRAS' THEN ld.cantidad END), 0) AS horas_extras_cantidad,
        COALESCE(SUM(CASE WHEN c.codigo = 'INASISTENCIA' THEN ld.cantidad END), 0) AS inasistencia_cantidad
    INTO v_calc
    FROM liquidacion_detalle ld
    LEFT JOIN concepto c
        ON c.id_concepto = ld.id_concepto
    WHERE ld.id_liquidacion = p_id_liquidacion;

    RETURN QUERY
    SELECT
        'haberes_imponibles'::TEXT,
        v_liq.haberes_imponibles = v_calc.haberes_imponibles,
        COALESCE(v_calc.haberes_imponibles, 0)::TEXT,
        COALESCE(v_liq.haberes_imponibles, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'haberes_noimponibles'::TEXT,
        v_liq.haberes_noimponibles = v_calc.haberes_noimponibles,
        COALESCE(v_calc.haberes_noimponibles, 0)::TEXT,
        COALESCE(v_liq.haberes_noimponibles, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'total_haberes'::TEXT,
        v_liq.total_haberes = v_calc.total_haberes,
        COALESCE(v_calc.total_haberes, 0)::TEXT,
        COALESCE(v_liq.total_haberes, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'descuentos_legales'::TEXT,
        v_liq.descuentos_legales = v_calc.descuentos_legales,
        COALESCE(v_calc.descuentos_legales, 0)::TEXT,
        COALESCE(v_liq.descuentos_legales, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'descuentos_nolegales'::TEXT,
        v_liq.descuentos_nolegales = v_calc.descuentos_nolegales,
        COALESCE(v_calc.descuentos_nolegales, 0)::TEXT,
        COALESCE(v_liq.descuentos_nolegales, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'total_descuentos'::TEXT,
        v_liq.total_descuentos = v_calc.total_descuentos,
        COALESCE(v_calc.total_descuentos, 0)::TEXT,
        COALESCE(v_liq.total_descuentos, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'monto_liquido'::TEXT,
        v_liq.monto_liquido = v_calc.monto_liquido,
        COALESCE(v_calc.monto_liquido, 0)::TEXT,
        COALESCE(v_liq.monto_liquido, 0)::TEXT,
        'Total haberes - total descuentos'::TEXT;

    RETURN QUERY
    SELECT
        'aportes_empleador'::TEXT,
        COALESCE(v_liq.total_aportes_empleador, 0) = COALESCE(v_calc.total_aportes_empleador, 0),
        COALESCE(v_calc.total_aportes_empleador, 0)::TEXT,
        COALESCE(v_liq.total_aportes_empleador, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'renta_imponible'::TEXT,
        v_liq.renta_imponible = GREATEST(v_calc.haberes_imponibles - v_calc.descuentos_legales, 0),
        GREATEST(v_calc.haberes_imponibles - v_calc.descuentos_legales, 0)::TEXT,
        COALESCE(v_liq.renta_imponible, 0)::TEXT,
        'Haberes imponibles - descuentos legales'::TEXT;

    RETURN QUERY
    SELECT
        'dias_trabajados_rango'::TEXT,
        v_liq.dias_trabajados BETWEEN 0 AND 31,
        '0..31'::TEXT,
        COALESCE(v_liq.dias_trabajados, 0)::TEXT,
        'Validacion basica de dias trabajados'::TEXT;

    RETURN QUERY
    SELECT
        'horas_extras_cantidad'::TEXT,
        TRUE,
        COALESCE(v_calc.horas_extras_cantidad, 0)::TEXT,
        COALESCE(v_calc.horas_extras_cantidad, 0)::TEXT,
        'Cantidad registrada para HORAS_EXTRAS en detalle'::TEXT;

    RETURN QUERY
    SELECT
        'inasistencia_cantidad'::TEXT,
        TRUE,
        COALESCE(v_calc.inasistencia_cantidad, 0)::TEXT,
        COALESCE(v_calc.inasistencia_cantidad, 0)::TEXT,
        'Cantidad registrada para INASISTENCIA en detalle'::TEXT;

    RETURN QUERY
    SELECT
        'detalle_existe'::TEXT,
        EXISTS (
            SELECT 1
            FROM liquidacion_detalle ld
            WHERE ld.id_liquidacion = p_id_liquidacion
        ),
        'al menos un item'::TEXT,
        (
            SELECT COUNT(*)::TEXT
            FROM liquidacion_detalle ld
            WHERE ld.id_liquidacion = p_id_liquidacion
        ),
        'La liquidacion debe tener detalle'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTA
-- ============================================
--
-- Este script deja el modelo principal listo para Supabase en `public`.
-- Si todavia existen funciones o consultas antiguas con referencias a
-- `rrhh.*`, `laboral.*`, `remu.*`, `param.*` o `prev.*`, deben migrarse
-- para usar estas tablas en `public`.

-- ============================================
-- DATOS MINIMOS DE PRUEBA
-- ============================================

INSERT INTO region (id_region, nombre, ordinal) VALUES
    (1,  'Región de Arica y Parinacota', 'XV'),
    (2,  'Región de Tarapacá', 'I'),
    (3,  'Región de Antofagasta', 'II'),
    (4,  'Región de Atacama', 'III'),
    (5,  'Región de Coquimbo', 'IV'),
    (6,  'Región de Valparaíso', 'V'),
    (7,  'Región del Libertador General Bernardo O''Higgins', 'VI'),
    (8,  'Región del Maule', 'VII'),
    (9,  'Región de Ñuble', 'XVI'),
    (10, 'Región del Biobío', 'VIII'),
    (11, 'Región de la Araucanía', 'IX'),
    (12, 'Región de Los Ríos', 'XIV'),
    (13, 'Región de Los Lagos', 'X'),
    (14, 'Región de Aysén del General Carlos Ibáñez del Campo', 'XI'),
    (15, 'Región de Magallanes y de la Antártica Chilena', 'XII'),
    (16, 'Región Metropolitana de Santiago', 'RM');

INSERT INTO provincia (id_provincia, id_region, nombre) VALUES
    (1,  1,  'Provincia de Arica'),
    (2,  1,  'Provincia de Parinacota'),
    (3,  2,  'Provincia de Iquique'),
    (4,  2,  'Provincia de Tamarugal'),
    (5,  3,  'Provincia de Antofagasta'),
    (6,  3,  'Provincia de Tocopilla'),
    (7,  3,  'Provincia de El Loa'),
    (8,  4,  'Provincia de Copiapó'),
    (9,  4,  'Provincia de Huasco'),
    (10, 4,  'Provincia de Chañaral'),
    (11, 5,  'Provincia de Choapa'),
    (12, 5,  'Provincia de Elqui'),
    (13, 5,  'Provincia de Limarí'),
    (14, 6,  'Provincia de Isla de Pascua'),
    (15, 6,  'Provincia de Los Andes'),
    (16, 6,  'Provincia de Quillota'),
    (17, 6,  'Provincia de Valparaíso'),
    (18, 6,  'Provincia de Petorca'),
    (19, 6,  'Provincia de San Antonio'),
    (20, 6,  'Provincia de San Felipe de Aconcagua'),
    (21, 6,  'Provincia de Marga Marga'),
    (22, 7,  'Provincia de Cachapoal'),
    (23, 7,  'Provincia de Cardenal Caro'),
    (24, 7,  'Provincia de Colchagua'),
    (25, 8,  'Provincia de Linares'),
    (26, 8,  'Provincia de Curicó'),
    (27, 8,  'Provincia de Cauquenes'),
    (28, 8,  'Provincia de Talca'),
    (29, 9,  'Provincia de Itata'),
    (30, 9,  'Provincia de Punilla'),
    (31, 9,  'Provincia de Diguillín'),
    (32, 10, 'Provincia de Concepción'),
    (33, 10, 'Provincia de Arauco'),
    (34, 10, 'Provincia de Biobío'),
    (35, 11, 'Provincia de Malleco'),
    (36, 11, 'Provincia de Cautín'),
    (37, 12, 'Provincia de Valdivia'),
    (38, 12, 'Provincia de Ranco'),
    (39, 13, 'Provincia de Chiloé'),
    (40, 13, 'Provincia de Osorno'),
    (41, 13, 'Provincia de Llanquihue'),
    (42, 13, 'Provincia de Palena'),
    (43, 14, 'Provincia de Aysén'),
    (44, 14, 'Provincia de Coyhaique'),
    (45, 14, 'Provincia de Capitán Prat'),
    (46, 14, 'Provincia de General Carrera'),
    (47, 15, 'Provincia de Tierra del Fuego'),
    (48, 15, 'Provincia de Magallanes'),
    (49, 15, 'Provincia de Última Esperanza'),
    (50, 15, 'Provincia de Antártica Chilena'),
    (51, 16, 'Provincia de Talagante'),
    (52, 16, 'Provincia de Santiago'),
    (53, 16, 'Provincia de Chacabuco'),
    (54, 16, 'Provincia de Cordillera'),
    (55, 16, 'Provincia de Maipo'),
    (56, 16, 'Provincia de Melipilla');

INSERT INTO comuna (id_comuna, id_provincia, nombre) VALUES
    (1,   1,  'Arica'),
    (2,   1,  'Camarones'),
    (3,   2,  'Putre'),
    (4,   2,  'General Lagos'),
    (5,   3,  'Alto Hospicio'),
    (6,   3,  'Iquique'),
    (7,   4,  'Pica'),
    (8,   4,  'Huara'),
    (9,   4,  'Colchane'),
    (10,  4,  'Camiña'),
    (11,  4,  'Pozo Almonte'),
    (12,  5,  'Taltal'),
    (13,  5,  'Sierra Gorda'),
    (14,  5,  'Mejillones'),
    (15,  5,  'Antofagasta'),
    (16,  6,  'María Elena'),
    (17,  6,  'Tocopilla'),
    (18,  7,  'San Pedro de Atacama'),
    (19,  7,  'Ollagüe'),
    (20,  7,  'Calama'),
    (21,  8,  'Tierra Amarilla'),
    (22,  8,  'Caldera'),
    (23,  8,  'Copiapó'),
    (24,  9,  'Huasco'),
    (25,  9,  'Freirina'),
    (26,  9,  'Alto del Carmen'),
    (27,  9,  'Vallenar'),
    (28,  10, 'Chañaral'),
    (29,  10, 'Diego de Almagro'),
    (30,  11, 'Illapel'),
    (31,  11, 'Canela'),
    (32,  11, 'Los Vilos'),
    (33,  11, 'Salamanca'),
    (34,  12, 'La Serena'),
    (35,  12, 'Coquimbo'),
    (36,  12, 'Andacollo'),
    (37,  12, 'La Higuera'),
    (38,  12, 'Paihuano'),
    (39,  12, 'Vicuña'),
    (40,  13, 'Ovalle'),
    (41,  13, 'Combarbalá'),
    (42,  13, 'Monte Patria'),
    (43,  13, 'Punitaqui'),
    (44,  13, 'Río Hurtado'),
    (45,  14, 'Isla de Pascua'),
    (46,  15, 'Los Andes'),
    (47,  15, 'Calle Larga'),
    (48,  15, 'Rinconada'),
    (49,  15, 'San Esteban'),
    (50,  16, 'Quillota'),
    (51,  16, 'La Calera'),
    (52,  16, 'Hijuelas'),
    (53,  16, 'La Cruz'),
    (54,  16, 'Nogales'),
    (55,  17, 'Valparaíso'),
    (56,  17, 'Casablanca'),
    (57,  17, 'Concón'),
    (58,  17, 'Juan Fernández'),
    (59,  17, 'Puchuncaví'),
    (60,  17, 'Quintero'),
    (61,  17, 'Viña del Mar'),
    (62,  18, 'La Ligua'),
    (63,  18, 'Cabildo'),
    (64,  18, 'Papudo'),
    (65,  18, 'Petorca'),
    (66,  18, 'Zapallar'),
    (67,  19, 'San Antonio'),
    (68,  19, 'Algarrobo'),
    (69,  19, 'Cartagena'),
    (70,  19, 'El Quisco'),
    (71,  19, 'El Tabo'),
    (72,  19, 'Santo Domingo'),
    (73,  20, 'San Felipe'),
    (74,  20, 'Catemu'),
    (75,  20, 'Llaillay'),
    (76,  20, 'Panquehue'),
    (77,  20, 'Putaendo'),
    (78,  20, 'Santa María'),
    (79,  21, 'Quilpué'),
    (80,  21, 'Limache'),
    (81,  21, 'Olmué'),
    (82,  21, 'Villa Alemana'),
    (83,  22, 'Rancagua'),
    (84,  22, 'Codegua'),
    (85,  22, 'Coinco'),
    (86,  22, 'Coltauco'),
    (87,  22, 'Doñihue'),
    (88,  22, 'Graneros'),
    (89,  22, 'Las Cabras'),
    (90,  22, 'Machalí'),
    (91,  22, 'Malloa'),
    (92,  22, 'Mostazal'),
    (93,  22, 'Olivar'),
    (94,  22, 'Peumo'),
    (95,  22, 'Pichidegua'),
    (96,  22, 'Quinta de Tilcoco'),
    (97,  22, 'Rengo'),
    (98,  22, 'Requínoa'),
    (99,  22, 'San Vicente'),
    (100, 23, 'Navidad'),
    (101, 23, 'Paredones'),
    (102, 23, 'Pichilemu'),
    (103, 23, 'La Estrella'),
    (104, 23, 'Litueche'),
    (105, 23, 'Marchihue'),
    (106, 24, 'San Fernando'),
    (107, 24, 'Chépica'),
    (108, 24, 'Chimbarongo'),
    (109, 24, 'Lolol'),
    (110, 24, 'Nancagua'),
    (111, 24, 'Palmilla'),
    (112, 24, 'Peralillo'),
    (113, 24, 'Placilla'),
    (114, 24, 'Pumanque'),
    (115, 24, 'Santa Cruz'),
    (116, 25, 'Parral'),
    (117, 25, 'Linares'),
    (118, 25, 'Colbún'),
    (119, 25, 'Longaví'),
    (120, 25, 'Retiro'),
    (121, 25, 'San Javier'),
    (122, 25, 'Villa Alegre'),
    (123, 25, 'Yerbas Buenas'),
    (124, 26, 'Curicó'),
    (125, 26, 'Hualañé'),
    (126, 26, 'Licantén'),
    (127, 26, 'Molina'),
    (128, 26, 'Rauco'),
    (129, 26, 'Romeral'),
    (130, 26, 'Sagrada Familia'),
    (131, 26, 'Teno'),
    (132, 26, 'Vichuquén'),
    (133, 27, 'Cauquenes'),
    (134, 27, 'Chanco'),
    (135, 27, 'Pelluhue'),
    (136, 28, 'Talca'),
    (137, 28, 'Constitución'),
    (138, 28, 'Curepto'),
    (139, 28, 'Empedrado'),
    (140, 28, 'Maule'),
    (141, 28, 'Pelarco'),
    (142, 28, 'Pencahue'),
    (143, 28, 'Río Claro'),
    (144, 28, 'San Clemente'),
    (145, 28, 'San Rafael'),
    (146, 29, 'Quirihue'),
    (147, 29, 'Cobquecura'),
    (148, 29, 'Coelemu'),
    (149, 29, 'Ninhue'),
    (150, 29, 'Portezuelo'),
    (151, 29, 'Ránquil'),
    (152, 29, 'Treguaco'),
    (153, 30, 'San Carlos'),
    (154, 30, 'Coihueco'),
    (155, 30, 'Ñiquén'),
    (156, 30, 'San Fabián'),
    (157, 30, 'San Nicolás'),
    (158, 31, 'Chillán'),
    (159, 31, 'Bulnes'),
    (160, 31, 'Chillán Viejo'),
    (161, 31, 'El Carmen'),
    (162, 31, 'Pemuco'),
    (163, 31, 'Pinto'),
    (164, 31, 'Quillón'),
    (165, 31, 'San Ignacio'),
    (166, 31, 'Yungay'),
    (167, 32, 'Concepción'),
    (168, 32, 'Coronel'),
    (169, 32, 'Chiguayante'),
    (170, 32, 'Florida'),
    (171, 32, 'Hualqui'),
    (172, 32, 'Lota'),
    (173, 32, 'Penco'),
    (174, 32, 'San Pedro de la Paz'),
    (175, 32, 'Santa Juana'),
    (176, 32, 'Talcahuano'),
    (177, 32, 'Tomé'),
    (178, 32, 'Hualpén'),
    (179, 33, 'Lebu'),
    (180, 33, 'Arauco'),
    (181, 33, 'Cañete'),
    (182, 33, 'Contulmo'),
    (183, 33, 'Curanilahue'),
    (184, 33, 'Los Álamos'),
    (185, 33, 'Tirúa'),
    (186, 34, 'Los Ángeles'),
    (187, 34, 'Antuco'),
    (188, 34, 'Laja'),
    (189, 34, 'Mulchén'),
    (190, 34, 'Nacimiento'),
    (191, 34, 'Negrete'),
    (192, 34, 'Quilaco'),
    (193, 34, 'Quilleco'),
    (194, 34, 'San Rosendo'),
    (195, 34, 'Santa Bárbara'),
    (196, 34, 'Tucapel'),
    (197, 34, 'Alto Biobío'),
    (198, 34, 'Cabrero'),
    (199, 34, 'Yumbel'),
    (200, 35, 'Purén'),
    (201, 35, 'Ercilla'),
    (202, 35, 'Renaico'),
    (203, 35, 'Traiguén'),
    (204, 35, 'Angol'),
    (205, 35, 'Collipulli'),
    (206, 35, 'Curacautín'),
    (207, 35, 'Lonquimay'),
    (208, 35, 'Los Sauces'),
    (209, 35, 'Lumaco'),
    (210, 35, 'Victoria'),
    (211, 36, 'Gorbea'),
    (212, 36, 'Lautaro'),
    (213, 36, 'Loncoche'),
    (214, 36, 'Melipeuco'),
    (215, 36, 'Nueva Imperial'),
    (216, 36, 'Padre las Casas'),
    (217, 36, 'Perquenco'),
    (218, 36, 'Pitrufquén'),
    (219, 36, 'Pucón'),
    (220, 36, 'Saavedra'),
    (221, 36, 'Teodoro Schmidt'),
    (222, 36, 'Toltén'),
    (223, 36, 'Vilcún'),
    (224, 36, 'Villarrica'),
    (225, 36, 'Cholchol'),
    (226, 36, 'Temuco'),
    (227, 36, 'Carahue'),
    (228, 36, 'Cunco'),
    (229, 36, 'Curarrehue'),
    (230, 36, 'Freire'),
    (231, 36, 'Galvarino'),
    (232, 37, 'Valdivia'),
    (233, 37, 'Corral'),
    (234, 37, 'Lanco'),
    (235, 37, 'Los Lagos'),
    (236, 37, 'Máfil'),
    (237, 37, 'Mariquina'),
    (238, 37, 'Paillaco'),
    (239, 37, 'Panguipulli'),
    (240, 38, 'La Unión'),
    (241, 38, 'Futrono'),
    (242, 38, 'Lago Ranco'),
    (243, 38, 'Río Bueno'),
    (244, 39, 'Quinchao'),
    (245, 39, 'Castro'),
    (246, 39, 'Ancud'),
    (247, 39, 'Chonchi'),
    (248, 39, 'Curaco de Vélez'),
    (249, 39, 'Dalcahue'),
    (250, 39, 'Puqueldón'),
    (251, 39, 'Queilén'),
    (252, 39, 'Quellón'),
    (253, 39, 'Quemchi'),
    (254, 40, 'Río Negro'),
    (255, 40, 'Osorno'),
    (256, 40, 'Puerto Octay'),
    (257, 40, 'Purranque'),
    (258, 40, 'Puyehue'),
    (259, 40, 'San Juan de la Costa'),
    (260, 40, 'San Pablo'),
    (261, 41, 'Puerto Montt'),
    (262, 41, 'Calbuco'),
    (263, 41, 'Cochamó'),
    (264, 41, 'Fresia'),
    (265, 41, 'Frutillar'),
    (266, 41, 'Los Muermos'),
    (267, 41, 'Llanquihue'),
    (268, 41, 'Maullín'),
    (269, 41, 'Puerto Varas'),
    (270, 42, 'Chaitén'),
    (271, 42, 'Futaleufú'),
    (272, 42, 'Hualaihué'),
    (273, 42, 'Palena'),
    (274, 43, 'Aysén'),
    (275, 43, 'Cisnes'),
    (276, 43, 'Guaitecas'),
    (277, 44, 'Lago Verde'),
    (278, 44, 'Coyhaique'),
    (279, 45, 'Cochrane'),
    (280, 45, 'O''Higgins'),
    (281, 45, 'Tortel'),
    (282, 46, 'Chile Chico'),
    (283, 46, 'Río Ibáñez'),
    (284, 47, 'Porvenir'),
    (285, 47, 'Primavera'),
    (286, 47, 'Timaukel'),
    (287, 48, 'Punta Arenas'),
    (288, 48, 'Laguna Blanca'),
    (289, 48, 'Río Verde'),
    (290, 48, 'San Gregorio'),
    (291, 49, 'Natales'),
    (292, 49, 'Torres del Paine'),
    (293, 50, 'Cabo de Hornos'),
    (294, 50, 'Antártica'),
    (295, 51, 'Talagante'),
    (296, 51, 'El Monte'),
    (297, 51, 'Isla de Maipo'),
    (298, 51, 'Padre Hurtado'),
    (299, 51, 'Peñaflor'),
    (300, 52, 'La Pintana'),
    (301, 52, 'La Reina'),
    (302, 52, 'Las Condes'),
    (303, 52, 'Lo Barnechea'),
    (304, 52, 'Lo Espejo'),
    (305, 52, 'Lo Prado'),
    (306, 52, 'Macul'),
    (307, 52, 'Maipú'),
    (308, 52, 'Ñuñoa'),
    (309, 52, 'Pedro Aguirre Cerda'),
    (310, 52, 'Peñalolén'),
    (311, 52, 'Providencia'),
    (312, 52, 'Pudahuel'),
    (313, 52, 'Quilicura'),
    (314, 52, 'Quinta Normal'),
    (315, 52, 'Recoleta'),
    (316, 52, 'Renca'),
    (317, 52, 'San Joaquín'),
    (318, 52, 'San Miguel'),
    (319, 52, 'San Ramón'),
    (320, 52, 'Vitacura'),
    (321, 52, 'Santiago'),
    (322, 52, 'Cerrillos'),
    (323, 52, 'Cerro Navia'),
    (324, 52, 'Conchalí'),
    (325, 52, 'El Bosque'),
    (326, 52, 'Estación Central'),
    (327, 52, 'Huechuraba'),
    (328, 52, 'Independencia'),
    (329, 52, 'La Cisterna'),
    (330, 52, 'La Florida'),
    (331, 52, 'La Granja'),
    (332, 53, 'Colina'),
    (333, 53, 'Lampa'),
    (334, 53, 'Tiltil'),
    (335, 54, 'Puente Alto'),
    (336, 54, 'Pirque'),
    (337, 54, 'San José de Maipo'),
    (338, 55, 'San Bernardo'),
    (339, 55, 'Buin'),
    (340, 55, 'Calera de Tango'),
    (341, 55, 'Paine'),
    (342, 56, 'Melipilla'),
    (343, 56, 'Alhué'),
    (344, 56, 'Curacaví'),
    (345, 56, 'María Pinto'),
    (346, 56, 'San Pedro');

INSERT INTO ciudad (id_ciudad, id_comuna, nombre) VALUES
    (1, 321, 'Santiago')
ON CONFLICT (id_ciudad) DO NOTHING;

INSERT INTO banco (
    codigo_sbif,
    nombre,
    nombre_corto,
    es_banco_estado,
    es_banco_extranjero,
    activo
)
VALUES
    ('001', 'BANCO DE CHILE', 'Banco de Chile', FALSE, FALSE, TRUE),
    ('009', 'BANCO INTERNACIONAL', 'Banco Internacional', FALSE, FALSE, TRUE),
    ('012', 'BANCO DEL ESTADO DE CHILE', 'BancoEstado', TRUE, FALSE, TRUE),
    ('014', 'SCOTIABANK CHILE', 'Scotiabank', FALSE, FALSE, TRUE),
    ('016', 'BANCO DE CREDITO E INVERSIONES', 'BCI', FALSE, FALSE, TRUE),
    ('028', 'BANCO BICE', 'BICE', FALSE, FALSE, TRUE),
    ('031', 'HSBC BANK CHILE', 'HSBC', FALSE, FALSE, TRUE),
    ('037', 'BANCO SANTANDER-CHILE', 'Santander', FALSE, FALSE, TRUE),
    ('039', 'BANCO ITAÚ CHILE', 'Itaú', FALSE, FALSE, TRUE),
    ('041', 'JP MORGAN CHASE BANK N.A.', 'JP Morgan', FALSE, TRUE, TRUE),
    ('051', 'BANCO FALABELLA', 'Falabella', FALSE, FALSE, TRUE),
    ('053', 'BANCO RIPLEY', 'Ripley', FALSE, FALSE, TRUE),
    ('055', 'BANCO CONSORCIO', 'Consorcio', FALSE, FALSE, TRUE),
    ('059', 'BANCO BTG PACTUAL CHILE', 'BTG Pactual', FALSE, FALSE, TRUE),
    ('060', 'CHINA CONSTRUCTION BANK AGENCIA EN CHILE', 'China Construction Bank', FALSE, TRUE, TRUE),
    ('061', 'BANK OF CHINA AGENCIA EN CHILE', 'Bank of China', FALSE, TRUE, TRUE),
    ('062', 'TANNER BANCO DIGITAL', 'Tanner Banco Digital', FALSE, FALSE, TRUE),
    ('063', 'TENPO BANK CHILE', 'Tenpo Bank', FALSE, FALSE, TRUE)
ON CONFLICT (codigo_sbif) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    nombre_corto = EXCLUDED.nombre_corto,
    es_banco_estado = EXCLUDED.es_banco_estado,
    es_banco_extranjero = EXCLUDED.es_banco_extranjero,
    activo = EXCLUDED.activo,
    updated_at = NOW();

INSERT INTO regimen_previsional (id_regimen, nombre) VALUES
    (1, 'AFP'),
    (2, 'IPS')
ON CONFLICT (id_regimen) DO NOTHING;

INSERT INTO entidad_previsional_ips (nombre, vigente) VALUES
    ('IPS (Ex-INP)', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente) VALUES
    ('Empart', TRUE),
    ('Bancaria', TRUE),
    ('Triomar', TRUE),
    ('Hípica Nacional', TRUE),
    ('Servicios de Seguro Social', TRUE),
    ('Empleados de Emos', TRUE),
    ('Obreros de Emos', TRUE),
    ('Caja Ferro', TRUE),
    ('Canaempu: Periodistas', TRUE),
    ('Caja de Previsión Social de los EE', TRUE),
    ('OO Municipales de la Republica', TRUE),
    ('Sección Esp.Previsión Empleados', TRUE),
    ('Caja de Previsión de Gildemeister', TRUE),
    ('Mauricio, Hochschild', TRUE),
    ('Secgasco', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (
    id_ex_caja_previsional,
    nombre,
    tasa_cotizacion_referencia,
    vigente
)
SELECT
    excaja.id_ex_caja_previsional,
    seed.nombre_regimen,
    seed.tasa_cotizacion_referencia,
    TRUE
FROM (
    VALUES
        ('Empart', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Empart', 'Régimen 6', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 14', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 21', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 34', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Servicios de Seguro Social', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Servicios de Seguro Social', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Empleados de Emos', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Obreros de Emos', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 5', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 7', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 5', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 6', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 7', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 8', NULL::NUMERIC(7,4)),
        ('Caja de Previsión Social de los EE', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja de Previsión Social de los EE', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Sección Esp.Previsión Empleados', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Sección Esp.Previsión Empleados', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Caja de Previsión de Gildemeister', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja de Previsión de Gildemeister', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Mauricio, Hochschild', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Mauricio, Hochschild', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Secgasco', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Secgasco', 'Régimen 2', NULL::NUMERIC(7,4))
) AS seed(nombre_ex_caja, nombre_regimen, tasa_cotizacion_referencia)
JOIN ex_caja_previsional excaja
    ON excaja.nombre = seed.nombre_ex_caja
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO tipo_trabajador (id_tipo_trabajador, nombre) VALUES
    (1, 'DEPENDIENTE'),
    (2, 'INDEPENDIENTE')
ON CONFLICT (id_tipo_trabajador) DO NOTHING;

INSERT INTO tipo_jornada (id_tipo_jornada, nombre) VALUES
    (1, 'COMPLETA'),
    (2, 'PARCIAL')
ON CONFLICT (id_tipo_jornada) DO NOTHING;

INSERT INTO moneda (id_moneda, codigo, nombre, simbolo) VALUES
    (1, 'CLP', 'Peso Chileno', '$'),
    (2, 'UF', 'Unidad de Fomento', 'UF')
ON CONFLICT (id_moneda) DO NOTHING;

INSERT INTO tipo_cuenta_bancaria (
    codigo,
    nombre,
    activo
)
VALUES
    ('CUENTA_CORRIENTE', 'Cuenta Corriente', TRUE),
    ('CUENTA_VISTA', 'Cuenta Vista', TRUE),
    ('CUENTA_RUT', 'Cuenta RUT', TRUE),
    ('CUENTA_AHORRO', 'Cuenta de Ahorro', TRUE),
    ('CHEQUERA_ELECTRONICA', 'Chequera Electrónica', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    activo = EXCLUDED.activo,
    updated_at = NOW();

INSERT INTO institucion_apv (codigo, nombre, vigente) VALUES
    ('000', 'No Cotiza A.P.V.', TRUE),
    ('003', 'Cuprum', TRUE),
    ('005', 'Habitat', TRUE),
    ('008', 'Provida', TRUE),
    ('029', 'Planvital', TRUE),
    ('033', 'Capital', TRUE),
    ('034', 'Modelo', TRUE),
    ('035', 'Uno', TRUE),
    ('102', 'SANTANDER SEGUROS DE VIDA S.A.', TRUE),
    ('103', 'BCI SEGUROS VIDA S.A.', TRUE),
    ('106', 'BICE VIDA COMPANIA DE SEGUROS S.A.', TRUE),
    ('107', 'ZURICH CHILE SEGUROS DE VIDA.', TRUE),
    ('111', 'CIA DE SEG. DE VIDA CONSORCIO NACIONAL DE SEG S.A.', TRUE),
    ('116', 'COMPANIA DE SEGUROS CONFUTURO S.A.', TRUE),
    ('118', 'SEGUROS DE VIDA SURA S.A.', TRUE),
    ('121', 'METLIFE CHILE SEGUROS DE VIDA S.A.', TRUE),
    ('128', 'OHIO NATIONAL SEGUROS DE VIDA S.A.', TRUE),
    ('129', 'PRINCIPAL COMPANIA DE SEGUROS DE VIDA CHILE S.A.', TRUE),
    ('131', 'SEGUROS DE VIDA SECURITY PREVISION S.A.', TRUE),
    ('137', 'PRUDENTIAL AGF. (APV)', TRUE),
    ('151', 'CREDICORP CAPITAL ASSET MANAGMENT S.A AGF', TRUE),
    ('204', 'BCI ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('205', 'BICE INVERSIONES AGF S.A.', TRUE),
    ('208', 'BTG PACTUAL CHILE S.A. ADMINISTRADORA GENERAL DE FONDOS', TRUE),
    ('214', 'PRINCIPAL ASSET MANAGEMENT AGF S.A.', TRUE),
    ('215', 'SANTANDER ASSET MANAGEMENT S.A. ADM. GENERAL DE FONDOS', TRUE),
    ('217', 'SCOTIA SUDAMERICANO ADMINISTRADORA DE FONDOS MUTUOS S.A.', TRUE),
    ('218', 'ADMINISTRADORA GENERAL DE FONDOS SECURITY S.A.', TRUE),
    ('225', 'ITAU ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('229', 'BANCOESTADO S.A. ADMINISTRADORA GENERAL DE FONDOS', TRUE),
    ('237', 'FINTUAL ADMINISTRADORA GENERAL DE FONDOS S.A', TRUE),
    ('238', 'FOCUS AGF S.A.', TRUE),
    ('600', 'ZURICH CHILE ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A', TRUE),
    ('601', 'LARRAIN VIAL ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('213', 'LARRAIN VIAL S.A. CORREDORA DE BOLSA', TRUE),
    ('222', 'BANCHILE CORREDORES DE BOLSA S.A.', TRUE),
    ('227', 'CORREDORES DE BOLSA SURA S.A.', TRUE),
    ('228', 'BTG PACTUAL CHILE S.A. CORREDORES DE BOLSA', TRUE),
    ('232', 'BICE INVERSIONES CORREDORES DE BOLSA S.A.', TRUE),
    ('235', 'MBI CORREDORES DE BOLSA S.A.', TRUE),
    ('236', 'CONSORCIO CORREDORES DE BOLSA S.A.', TRUE),
    ('240', 'FINANZAS Y NEGOCIOS S.A. CORREDORES DE BOLSA', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    vigente = EXCLUDED.vigente;

INSERT INTO forma_pago_apv (codigo, nombre, vigente) VALUES
    ('1', 'Directa', TRUE),
    ('2', 'Indirecta', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    vigente = EXCLUDED.vigente;

INSERT INTO centro_costo (id_centro_costo, codigo, nombre) VALUES
    (1, 'ADM', 'Administracion')
ON CONFLICT (id_centro_costo) DO NOTHING;

INSERT INTO trabajo_pesado_parametro (
    codigo, nombre, tasa_trabajador, tasa_empleador, tasa_total,
    requiere_dictamen_cen, fuente, vigente, vigencia_inicio
) VALUES
    ('PESADO', 'Trabajo pesado', 2.0000, 2.0000, 4.0000, TRUE, 'https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4282.html', TRUE, DATE '2025-08-01'),
    ('MENOS_PESADO', 'Trabajo pesado con menor desgaste relativo', 1.0000, 1.0000, 2.0000, TRUE, 'https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4282.html', TRUE, DATE '2025-08-01')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tasa_trabajador = EXCLUDED.tasa_trabajador,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tasa_total = EXCLUDED.tasa_total,
    requiere_dictamen_cen = EXCLUDED.requiere_dictamen_cen,
    fuente = EXCLUDED.fuente,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio;

INSERT INTO reforma_previsional_parametro (
    vigencia_inicio, vigencia_fin, aporte_empleador_total,
    cuenta_capitalizacion_individual, fapp_seguro_social, fuente
) VALUES (
    DATE '2025-08-01',
    DATE '2026-07-31',
    1.0000,
    0.1000,
    0.9000,
    'https://www.spensiones.cl/portal/institucional/594/w3-article-16615.html'
)
ON CONFLICT (vigencia_inicio) DO UPDATE SET
    vigencia_fin = EXCLUDED.vigencia_fin,
    aporte_empleador_total = EXCLUDED.aporte_empleador_total,
    cuenta_capitalizacion_individual = EXCLUDED.cuenta_capitalizacion_individual,
    fapp_seguro_social = EXCLUDED.fapp_seguro_social,
    fuente = EXCLUDED.fuente;

INSERT INTO ley_16744_parametros (
    codigo, cotizacion_basica_empleador, descripcion_tasa_adicional,
    fuente_financiamiento, fuente_organismos, vigente, vigencia_inicio
) VALUES (
    'LEY_16744_BASE',
    0.9000,
    'depende de actividad/siniestralidad de la empresa',
    'https://www.suseso.cl/606/w3-article-18613.html',
    'https://www.suseso.cl/606/w3-article-19892.html',
    TRUE,
    DATE '2026-04-01'
)
ON CONFLICT (codigo) DO UPDATE SET
    cotizacion_basica_empleador = EXCLUDED.cotizacion_basica_empleador,
    descripcion_tasa_adicional = EXCLUDED.descripcion_tasa_adicional,
    fuente_financiamiento = EXCLUDED.fuente_financiamiento,
    fuente_organismos = EXCLUDED.fuente_organismos,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio;

INSERT INTO organismo_administrador_ley_16744 (codigo, nombre, tipo, vigente) VALUES
    ('ACHS', 'Asociacion Chilena de Seguridad', 'MUTUALIDAD', TRUE),
    ('MUSEG', 'Mutual de Seguridad de la Camara Chilena de la Construccion', 'MUTUALIDAD', TRUE),
    ('IST', 'Instituto de Seguridad del Trabajo', 'MUTUALIDAD', TRUE),
    ('ISL', 'Instituto de Seguridad Laboral', 'PUBLICO', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    vigente = EXCLUDED.vigente;

INSERT INTO ccaf_entidad (codigo, nombre, vigente, fuente) VALUES
    ('LOS_ANDES', 'CCAF Los Andes', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('LA_ARAUCANA', 'CCAF La Araucana', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('LOS_HEROES', 'CCAF Los Heroes', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('18_SEPTIEMBRE', 'CCAF 18 de Septiembre', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    vigente = EXCLUDED.vigente,
    fuente = EXCLUDED.fuente;

INSERT INTO empresa (id_empresa, rut, dv, razon_social) VALUES
    (1, '12345678', '9', 'Empresa Prueba')
ON CONFLICT (id_empresa) DO NOTHING;

INSERT INTO empresa_ley_16744 (
    id_empresa, id_organismo_administrador_ley_16744,
    tasa_adicional_diferenciada, actividad_economica,
    fuente_resolucion_o_certificado, vigencia_inicio
)
SELECT
    e.id_empresa,
    o.id_organismo_administrador_ley_16744,
    0.0000,
    NULL,
    NULL,
    DATE '2026-04-01'
FROM empresa e
LEFT JOIN organismo_administrador_ley_16744 o ON o.codigo = 'ISL'
WHERE e.id_empresa = 1
ON CONFLICT (id_empresa, vigencia_inicio) DO NOTHING;

INSERT INTO sucursal (id_sucursal, id_empresa, codigo, nombre, direccion) VALUES
    (1, 1, 'MAT', 'Casa Matriz', 'Av. Central 100')
ON CONFLICT (id_sucursal) DO NOTHING;

INSERT INTO departamento_empresa (id_departamento_empresa, id_empresa, id_sucursal, codigo, nombre) VALUES
    (1, 1, 1, 'ADM', 'Administracion')
ON CONFLICT (id_departamento_empresa) DO NOTHING;

INSERT INTO afp (id_afp, nombre, tasa_obligatoria, comision, sis, tasa_empleador, vigente, forma_pago_apvi, vigencia_inicio) VALUES
    (1, 'AFP Modelo', 10.00, 1.45, 1.26, 0.00, TRUE, 1, '2024-01-01')
ON CONFLICT (id_afp) DO NOTHING;

INSERT INTO salud (id_salud, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio) VALUES
    (1, 'FONASA', 'FONASA', 7.00, TRUE, '2024-01-01')
ON CONFLICT (id_salud) DO NOTHING;

INSERT INTO afp_vigencia (
    id_afp,
    tasa_obligatoria,
    comision,
    sis,
    tasa_empleador,
    forma_pago_apvi,
    vigente,
    vigencia_inicio,
    vigencia_fin
)
SELECT
    a.id_afp,
    a.tasa_obligatoria,
    a.comision,
    a.sis,
    a.tasa_empleador,
    a.forma_pago_apvi,
    a.vigente,
    COALESCE(a.vigencia_inicio, DATE '2024-01-01'),
    a.vigencia_fin
FROM afp a
WHERE NOT EXISTS (
    SELECT 1
    FROM afp_vigencia av
    WHERE av.id_afp = a.id_afp
      AND av.vigencia_inicio = COALESCE(a.vigencia_inicio, DATE '2024-01-01')
);

INSERT INTO salud_plan (
    id_salud_plan,
    id_salud,
    codigo,
    nombre,
    id_moneda,
    valor_referencia,
    adicional_ges_referencia,
    porcentaje_legal,
    vigente,
    vigencia_inicio
) VALUES
    (1, 1, 'FONASA_GENERAL', 'Fonasa general', 1, 0, 0, 7.00, TRUE, '2024-01-01')
ON CONFLICT (id_salud_plan) DO NOTHING;

INSERT INTO afc_parametro (
    codigo_tipo_contrato,
    aplica_seguro,
    aplica_trabajador,
    tasa_trabajador,
    tasa_empleador,
    vigencia_inicio,
    observacion
) VALUES
    ('INDEFINIDO', TRUE, TRUE, 0.60, 2.40, '2024-01-01', 'Seed base v6.11'),
    ('PLAZO_FIJO', TRUE, FALSE, 0.00, 3.00, '2024-01-01', 'Seed base v6.11'),
    ('OBRA_SERVICIO', TRUE, FALSE, 0.00, 3.00, '2024-01-01', 'Seed base v6.11'),
    ('CASA_PARTICULAR', TRUE, FALSE, 0.00, 3.00, '2024-01-01', 'Seed base v6.11')
ON CONFLICT (codigo_tipo_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento,
    codigo,
    nombre,
    afecta_dias_trabajados,
    afecta_horas,
    activo
) VALUES
    (1, 'MANUAL', 'Manual', FALSE, FALSE, TRUE),
    (2, 'HORAS_EXTRAS', 'Horas extras', FALSE, TRUE, TRUE),
    (3, 'INASISTENCIA', 'Inasistencia', TRUE, FALSE, TRUE)
ON CONFLICT (id_tipo_movimiento) DO NOTHING;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia,
    codigo,
    nombre,
    descuenta_dias,
    activo
) VALUES
    (101, 'LICENCIA_MEDICA', 'Licencia medica', TRUE, TRUE),
    (102, 'INASISTENCIA_INJUSTIFICADA', 'Inasistencia injustificada', TRUE, TRUE)
ON CONFLICT (id_motivo_inasistencia) DO NOTHING;

INSERT INTO tramo_carga (periodo, desde, hasta, valor, tramo)
SELECT v.periodo, v.desde, v.hasta, v.valor, v.tramo
FROM (
    VALUES
        ('2024-01', 0, 539328, 20628, 'A'),
        ('2024-01', 539329, 787746, 12667, 'B'),
        ('2024-01', 787747, 1228292, 4003, 'C')
) AS v(periodo, desde, hasta, valor, tramo)
WHERE NOT EXISTS (
    SELECT 1
    FROM tramo_carga tc
    WHERE tc.periodo = v.periodo
      AND tc.tramo = v.tramo
);

INSERT INTO persona (
    id_persona,
    rut,
    dv,
    nombres,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    sexo,
    id_pais,
    estado_civil,
    email,
    telefono,
    pasaporte,
    id_comuna,
    direccion,
    numero_direccion,
    departamento_direccion,
    id_tramo_carga,
    casa,
    villa,
    poblacion,
    observaciones_direccion,
    fax,
    cargas,
    estado_ficha,
    estado
) VALUES (
    1,
    '11222333',
    '4',
    'Juan',
    'Perez',
    'Gonzalez',
    '1980-01-01',
    'M',
    (
        SELECT id_pais
        FROM public.pais
        WHERE codigo_iso2 = 'CL'
        LIMIT 1
    ),
    'SOLTERO',
    'juan.perez@empresa.cl',
    '+56911111111',
    NULL,
    (
        SELECT c.id_comuna
        FROM comuna c
        JOIN provincia p
            ON p.id_provincia = c.id_provincia
        JOIN region r
            ON r.id_region = p.id_region
        WHERE c.nombre = 'Santiago'
          AND p.id_provincia = 52
          AND r.id_region = 16
        ORDER BY c.id_comuna
        LIMIT 1
    ),
    'Av. Prueba 123',
    '123',
    '402',
    (
        SELECT tc.id_tramo
        FROM tramo_carga tc
        WHERE tc.periodo = '2024-01'
          AND tc.tramo = 'B'
        ORDER BY tc.id_tramo
        LIMIT 1
    ),
    NULL,
    'Villa Prueba',
    'Poblacion Centro',
    'Referencia de domicilio',
    NULL,
    1,
    'INCOMPLETO',
    'EN_PROCESO'
)
ON CONFLICT (id_persona) DO NOTHING;

INSERT INTO persona_tramo_carga (
    id_persona,
    id_tramo,
    vigencia_inicio,
    observacion
)
SELECT
    p.id_persona,
    p.id_tramo_carga,
    TO_DATE(tc.periodo || '-01', 'YYYY-MM-DD'),
    'Migrado desde persona.id_tramo_carga'
FROM persona p
JOIN tramo_carga tc
    ON tc.id_tramo = p.id_tramo_carga
WHERE p.id_tramo_carga IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM persona_tramo_carga ptc
      WHERE ptc.id_persona = p.id_persona
        AND ptc.id_tramo = p.id_tramo_carga
  );

INSERT INTO ficha_validacion_resumen (
    id_ficha_validacion,
    id_persona,
    estado_ficha_calculado,
    apto_para_activacion,
    apto_para_remuneraciones,
    total_bloqueantes,
    total_criticos,
    total_advertencias,
    validado_en,
    observaciones
) VALUES (
    1,
    1,
    'INCOMPLETO',
    FALSE,
    FALSE,
    1,
    0,
    1,
    NOW(),
    'Validacion inicial de ficha demo'
)
ON CONFLICT DO NOTHING;

INSERT INTO ficha_validacion_detalle (
    id_ficha_validacion,
    dominio,
    severidad,
    codigo,
    campo,
    mensaje,
    orden,
    resuelto
) VALUES
    (1, 'PREVISION', 'BLOQUEANTE', 'AFP_REQUERIDA', 'id_afp', 'Falta confirmar AFP vigente para activacion', 1, FALSE),
    (1, 'COMPLEMENTARIOS', 'ADVERTENCIA', 'CUENTA_BANCARIA_PENDIENTE', 'id_cuenta', 'La cuenta bancaria aun no fue confirmada por el usuario', 2, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO cuenta_bancaria (
    id_cuenta,
    id_persona,
    id_banco,
    id_tipo_cuenta_bancaria,
    numero_cuenta
) VALUES (
    1,
    1,
    1,
    1,
    '1234567890'
)
ON CONFLICT (id_cuenta) DO NOTHING;

INSERT INTO contrato (
    id_contrato,
    id_persona,
    id_empresa,
    id_sucursal,
    id_departamento_empresa,
    id_tipo_trabajador,
    id_tipo_jornada,
    codigo_tipo_contrato,
    cargo,
    seguro_cesantia,
    fecha_contrato,
    fecha_inicio,
    estado
) VALUES (
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    'INDEFINIDO',
    'Analista',
    TRUE,
    '2020-01-01',
    '2020-01-01',
    'ACTIVO'
)
ON CONFLICT (id_contrato) DO NOTHING;

INSERT INTO prevision (
    id_contrato,
    tipo_prevision,
    id_afp,
    id_regimen_previsional,
    vigencia_inicio
) VALUES (
    1,
    'AFP',
    1,
    1,
    '2020-01-01'
)
ON CONFLICT (id_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO salud_trabajador (
    id_contrato,
    id_salud,
    id_salud_plan,
    usar_plan_parametrizado,
    plan_salud,
    id_moneda_plan,
    valor_plan,
    adicional_auge_ges,
    observaciones_salud,
    vigencia_inicio
) VALUES (
    1,
    1,
    1,
    TRUE,
    NULL,
    1,
    0,
    0,
    'Plan base Fonasa',
    '2020-01-01'
)
ON CONFLICT (id_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO remuneracion (
    id_contrato,
    sueldo_base,
    sueldo_variable,
    id_moneda,
    tipo_gratificacion,
    horas_semanales,
    dias_semanales,
    distribucion_jornada,
    tiempo_colacion_minutos,
    semana_corrida_activa,
    zona_extrema_activa,
    gratificacion_proporcional,
    vigencia_inicio
) VALUES (
    1,
    750000,
    FALSE,
    1,
    'LEGAL_ART_50',
    40,
    5,
    'Lunes a viernes 09:00-18:00',
    60,
    FALSE,
    FALSE,
    FALSE,
    '2020-01-01'
)
ON CONFLICT (id_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO parametros_generales (
    periodo,
    uf,
    utm,
    sueldo_minimo,
    sueldo_minimo18_65,
    gratificacion,
    imm_gratificacion,
    tope_afp,
    tope_ips,
    tope_cesantia,
    tope_afpvoluntario,
    sis,
    dsctosbpordia,
    afc_trabajador_indefinido,
    afc_empleador_indefinido,
    afc_empleador_plazo
) VALUES (
    '2024-01',
    36500.0000,
    65000,
    460000,
    460000,
    TRUE,
    4.75,
    3000000,
    3000000,
    3000000,
    3000000,
    1.26,
    TRUE,
    0.6,
    2.4,
    3.0
)
ON CONFLICT (periodo) DO NOTHING;

INSERT INTO parametros_legales (nombre, valor_decimal, vigencia_inicio) VALUES
    ('UF', 36500.0000, '2024-01-01'),
    ('UTM', 65000, '2024-01-01'),
    ('SUELDO_MINIMO', 460000, '2024-01-01'),
    ('IMM_GRATIFICACION', 4.75, '2024-01-01'),
    ('TOPE_IMPONIBLE_UF', 81.60, '2024-01-01'),
    ('TOPE_IMPONIBLE_UF', 90.00, '2026-01-01'),
    ('SIS', 1.26, '2024-01-01'),
    ('LEY_SANNA', 0.03, '2026-04-01'),
    ('AFC_TRABAJADOR_INDEFINIDO', 0.60, '2024-01-01'),
    ('AFC_EMPLEADOR_INDEFINIDO', 2.40, '2024-01-01'),
    ('AFC_EMPLEADOR_PLAZO', 3.00, '2024-01-01')
ON CONFLICT (nombre, vigencia_inicio) DO NOTHING;

INSERT INTO periodo_remuneracion (
    codigo,
    anio,
    mes,
    fecha_inicio,
    fecha_fin,
    estado
)
SELECT DISTINCT
    src.codigo,
    SUBSTRING(src.codigo, 1, 4)::INT,
    SUBSTRING(src.codigo, 6, 2)::INT,
    TO_DATE(src.codigo || '-01', 'YYYY-MM-DD'),
    (DATE_TRUNC('month', TO_DATE(src.codigo || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month - 1 day')::DATE,
    'pendiente'
FROM (
    SELECT periodo AS codigo FROM parametros_generales
    UNION
    SELECT periodo AS codigo FROM tramo_carga
    UNION
    SELECT periodo AS codigo FROM tramo_impuesto
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM parametros_legales
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM trabajo_pesado_parametro
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM reforma_previsional_parametro
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM ley_16744_parametros
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM empresa_ley_16744
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM tabla_impuesto_unico
) src
WHERE src.codigo IS NOT NULL
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tramo_impuesto (periodo, desde, hasta, factor, rebaja) VALUES
    ('2024-01', 0, 806250, 0, 0),
    ('2024-01', 806251, 1796250, 4, 32250),
    ('2024-01', 1796251, 3000000, 8, 106250)
ON CONFLICT DO NOTHING;

INSERT INTO tabla_impuesto_unico (tramo, desde, hasta, factor, rebaja, vigencia_inicio) VALUES
    (1, 0, 806250, 0.00, 0, '2024-01-01'),
    (2, 806251, 1796250, 0.04, 32250, '2024-01-01'),
    (3, 1796251, NULL, 0.08, 106250, '2024-01-01')
ON CONFLICT DO NOTHING;

INSERT INTO catalogo_lre (
    codigo_lre, nombre_lre, modulo_lre, grupo_lre, clasificacion_lre,
    imponible, tributable, afecta_liquido, vigente
) VALUES
    ('2101', 'Sueldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2102', 'Sobresueldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2106', 'Gratificación mensual', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2110', 'Aguinaldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2111', 'Bonos u otras remuneraciones fijas mensuales', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2113', 'Bonos u otras remuneraciones variables mensuales o superiores a un mes', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2301', 'Colación total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE),
    ('2302', 'Movilización total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE),
    ('2311', 'Asignación familiar legal total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE),
    ('3141', 'Cotización obligatoria previsional (AFP o IPS)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE),
    ('3143', 'Cotización obligatoria salud 7%', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE),
    ('3151', 'Cotización AFC - trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE),
    ('3161', 'Impuesto retenido por remuneraciones', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE),
    ('3183', 'Otros descuentos autorizados y solicitados por el trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE),
    ('3186', 'Pensiones de alimentos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE),
    ('3188', 'Descuentos por anticipos y préstamos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE),
    ('4151', 'Aporte AFC - empleador', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE),
    ('4155', 'Aporte empleador seguro invalidez y sobrevivencia', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE)
ON CONFLICT (codigo_lre) DO NOTHING;

INSERT INTO concepto (
    codigo, nombre, tipo, naturaleza, imponible, tributable,
    afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico,
    es_sistema, afecta_liquido, vigente
) VALUES
    ('SUELDO_BASE', 'Sueldo base', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 10, TRUE, TRUE, TRUE, TRUE),
    ('GRATIFICACION', 'Gratificacion legal', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 20, TRUE, TRUE, TRUE, TRUE),
    ('HORAS_EXTRAS', 'Horas extras', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 30, TRUE, TRUE, TRUE, TRUE),
    ('INASISTENCIA', 'Inasistencia', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 40, TRUE, TRUE, TRUE, TRUE),
    ('AFP', 'Cotizacion AFP', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 50, TRUE, TRUE, TRUE, TRUE),
    ('SALUD', 'Cotizacion salud', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 51, TRUE, TRUE, TRUE, TRUE),
    ('CESANTIA', 'Seguro cesantia', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 52, TRUE, TRUE, TRUE, TRUE),
    ('PRESTAMO', 'Descuento prestamo', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 54, FALSE, FALSE, TRUE, TRUE),
    ('IMPUESTO_RENTA', 'Impuesto a la renta', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 55, TRUE, TRUE, TRUE, TRUE),
    ('BONO_RESPONSABILIDAD', 'Bono responsabilidad', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 60, FALSE, FALSE, TRUE, TRUE),
    ('MOVILIZACION', 'Movilizacion', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 70, FALSE, FALSE, TRUE, TRUE),
    ('ZONA_EXTREMA', 'Zona extrema', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 80, TRUE, TRUE, TRUE, TRUE),
    ('AFP_EMPLEADOR', 'AFP empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 120, TRUE, TRUE, FALSE, TRUE),
    ('SIS_EMPLEADOR', 'SIS empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 121, TRUE, TRUE, FALSE, TRUE),
    ('AFC_EMPLEADOR', 'AFC empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 122, TRUE, TRUE, FALSE, TRUE),
    ('COLACION', 'Colación (Art. 41)', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 90, FALSE, TRUE, TRUE, TRUE),
    ('ASIGNACION_FAMILIAR', 'Asignación familiar legal', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 91, TRUE, TRUE, TRUE, TRUE),
    ('AGUINALDO', 'Aguinaldo', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 92, FALSE, TRUE, TRUE, TRUE),
    ('DESCUENTO_CONVENIO', 'Descuento por convenio o autorización', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 93, FALSE, FALSE, TRUE, TRUE),
    ('PENSION_ALIMENTOS', 'Pensión de alimentos', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 94, FALSE, FALSE, TRUE, TRUE),
    ('ANTICIPO', 'Anticipo o descuento por cuenta', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 95, FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'SUELDO_BASE' AND l.codigo_lre = '2101';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'GRATIFICACION' AND l.codigo_lre = '2106';

-- LRE-CATALOG-01: HORAS_EXTRAS se mapea a 2102 Sobresueldo.
-- 2113 queda reservado para bonos u otras remuneraciones variables.
UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'HORAS_EXTRAS' AND l.codigo_lre = '2102';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'BONO_RESPONSABILIDAD' AND l.codigo_lre = '2111';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'MOVILIZACION' AND l.codigo_lre = '2302';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'AFP' AND l.codigo_lre = '3141';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'SALUD' AND l.codigo_lre = '3143';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'PRESTAMO' AND l.codigo_lre = '3188';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'CESANTIA' AND l.codigo_lre = '3151';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'IMPUESTO_RENTA' AND l.codigo_lre = '3161';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'AFC_EMPLEADOR' AND l.codigo_lre = '4151';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'SIS_EMPLEADOR' AND l.codigo_lre = '4155';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'AGUINALDO' AND l.codigo_lre = '2110';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'COLACION' AND l.codigo_lre = '2301';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'ASIGNACION_FAMILIAR' AND l.codigo_lre = '2311';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'DESCUENTO_CONVENIO' AND l.codigo_lre = '3183';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'PENSION_ALIMENTOS' AND l.codigo_lre = '3186';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'ANTICIPO' AND l.codigo_lre = '3188';

INSERT INTO regla_concepto_calculo (
    id_concepto,
    codigo_regla,
    orden_calculo,
    base_calculo,
    formula_sql,
    usa_tope_imponible,
    usa_tabla_impuesto,
    calculo_automatico,
    activo,
    vigencia_inicio
)
SELECT
    c.id_concepto,
    r.codigo_regla,
    r.orden_calculo,
    r.base_calculo,
    r.formula_sql,
    r.usa_tope_imponible,
    r.usa_tabla_impuesto,
    r.calculo_automatico,
    TRUE,
    DATE '2024-01-01'
FROM concepto c
JOIN (
    VALUES
        ('SUELDO_BASE', 'BASE_REMUNERACION', 10, 'SUELDO_BASE', 'sueldo_base_proporcional', TRUE, FALSE, TRUE),
        ('GRATIFICACION', 'GRATIFICACION_LEGAL', 20, 'HABERES_IMPONIBLES', 'gratificacion_según_tipo', TRUE, FALSE, TRUE),
        ('HORAS_EXTRAS', 'HORAS_EXTRAS', 30, 'VALOR_HORA', 'cantidad * valor_hora_recargado', FALSE, FALSE, TRUE),
        ('AFP', 'DESCUENTO_AFP', 50, 'RENTA_IMPONIBLE_TOPE', '(tasa_afp + comision_afp) * base', TRUE, FALSE, TRUE),
        ('SALUD', 'DESCUENTO_SALUD', 51, 'RENTA_IMPONIBLE_TOPE', 'max(7_por_ciento, plan_salud)', TRUE, FALSE, TRUE),
        ('CESANTIA', 'DESCUENTO_AFC', 52, 'RENTA_IMPONIBLE_TOPE', 'tasa_afc_trabajador * base', TRUE, FALSE, TRUE),
        ('IMPUESTO_RENTA', 'IMPUESTO_UNICO', 55, 'TOTAL_TRIBUTABLE', 'tabla_impuesto_unico(periodo)', FALSE, TRUE, TRUE),
        ('ZONA_EXTREMA', 'ASIGNACION_ZONA_EXTREMA', 80, 'HABERES_IMPONIBLES', 'porcentaje_zona_extrema * base', FALSE, FALSE, TRUE),
        ('AFP_EMPLEADOR', 'APORTE_AFP_EMPLEADOR', 120, 'RENTA_IMPONIBLE_TOPE', 'tasa_empleador_afp * base', TRUE, FALSE, TRUE),
        ('ASIGNACION_FAMILIAR', 'ASIGNACION_FAMILIAR_LEGAL', 91, 'TRAMO_ASIGNACION_FAMILIAR', 'monto_legal_segun_tramo_y_cargas', FALSE, FALSE, TRUE)
) AS r(codigo_concepto, codigo_regla, orden_calculo, base_calculo, formula_sql, usa_tope_imponible, usa_tabla_impuesto, calculo_automatico)
    ON r.codigo_concepto = c.codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM regla_concepto_calculo rc
    WHERE rc.id_concepto = c.id_concepto
      AND rc.codigo_regla = r.codigo_regla
      AND rc.vigencia_inicio = DATE '2024-01-01'
);


INSERT INTO haberdescuento_persona (
    id_asignacion,
    id_persona,
    id_contrato,
    id_concepto,
    monto,
    porcentaje,
    tipo,
    tipohaber,
    estado,
    vigencia_inicio,
    vigencia_fin,
    observacion,
    periodicidad
)
SELECT
    1,
    1,
    1,
    c.id_concepto,
    50000,
    NULL,
    'FIJO',
    'IMPONIBLE',
    TRUE,
    DATE '2024-01-01',
    NULL,
    'Seed demo: asignación recurrente',
    'MENSUAL'
FROM concepto c
WHERE c.codigo = 'BONO_RESPONSABILIDAD'
ON CONFLICT (id_asignacion) DO NOTHING;

INSERT INTO haberdescuento_persona (
    id_asignacion,
    id_persona,
    id_contrato,
    id_concepto,
    monto,
    porcentaje,
    tipo,
    tipohaber,
    estado,
    vigencia_inicio,
    vigencia_fin,
    observacion,
    periodicidad
)
SELECT
    2,
    1,
    1,
    c.id_concepto,
    30000,
    NULL,
    'FIJO',
    'NOIMPONIBLE',
    TRUE,
    DATE '2024-01-01',
    NULL,
    'Seed demo: asignación recurrente',
    'MENSUAL'
FROM concepto c
WHERE c.codigo = 'MOVILIZACION'
ON CONFLICT (id_asignacion) DO NOTHING;

INSERT INTO movimiento (
    id_movimiento,
    id_persona,
    id_contrato,
    id_concepto,
    fecha,
    id_tipo_movimiento,
    id_motivo_inasistencia,
    tipomovimiento,
    motivoinasist,
    diainasist,
    hrs_pactadas,
    monto,
    cantidad,
    observacion
)
SELECT
    1,
    1,
    1,
    c.id_concepto,
    DATE '2024-01-10',
    2,
    NULL,
    2,
    NULL,
    0,
    2,
    45000,
    2,
    'Horas extras enero (seed demo)'
FROM concepto c
WHERE c.codigo = 'HORAS_EXTRAS'
ON CONFLICT (id_movimiento) DO NOTHING;

INSERT INTO movimiento (
    id_movimiento,
    id_persona,
    id_contrato,
    id_concepto,
    fecha,
    id_tipo_movimiento,
    id_motivo_inasistencia,
    tipomovimiento,
    motivoinasist,
    diainasist,
    hrs_pactadas,
    monto,
    cantidad,
    observacion
)
SELECT
    2,
    1,
    1,
    c.id_concepto,
    DATE '2024-01-18',
    3,
    102,
    3,
    102,
    1,
    NULL,
    25000,
    1,
    'Inasistencia injustificada (seed demo)'
FROM concepto c
WHERE c.codigo = 'INASISTENCIA'
ON CONFLICT (id_movimiento) DO NOTHING;

INSERT INTO prestamo (
    id_prestamo,
    id_persona,
    descripcion,
    monto_total,
    valor_cuota,
    cuotas_total,
    cuotas_pagadas,
    saldo_pendiente,
    fecha_otorgamiento,
    caja,
    estado
) VALUES (
    1,
    1,
    'Prestamo interno',
    300000,
    50000,
    6,
    1,
    250000,
    '2023-12-15',
    'prestamointerno',
    'ACTIVO'
)
ON CONFLICT (id_prestamo) DO NOTHING;

INSERT INTO public.pais (
    codigo_iso2,
    codigo_iso3,
    codigo_numerico,
    nombre,
    nombre_iso,
    activo
)
VALUES
    ('AD', 'AND', '020', 'Andorra', 'Andorra', TRUE),
    ('AE', 'ARE', '784', 'Emiratos Árabes Unidos', 'United Arab Emirates', TRUE),
    ('AF', 'AFG', '004', 'Afganistán', 'Afghanistan', TRUE),
    ('AG', 'ATG', '028', 'Antigua y Barbuda', 'Antigua and Barbuda', TRUE),
    ('AI', 'AIA', '660', 'Anguila', 'Anguilla', TRUE),
    ('AL', 'ALB', '008', 'Albania', 'Albania', TRUE),
    ('AM', 'ARM', '051', 'Armenia', 'Armenia', TRUE),
    ('AO', 'AGO', '024', 'Angola', 'Angola', TRUE),
    ('AQ', 'ATA', '010', 'Antártida', 'Antarctica', TRUE),
    ('AR', 'ARG', '032', 'Argentina', 'Argentina', TRUE),
    ('AS', 'ASM', '016', 'Samoa Americana', 'American Samoa', TRUE),
    ('AT', 'AUT', '040', 'Austria', 'Austria', TRUE),
    ('AU', 'AUS', '036', 'Australia', 'Australia', TRUE),
    ('AW', 'ABW', '533', 'Aruba', 'Aruba', TRUE),
    ('AX', 'ALA', '248', 'Islas Aland', 'Åland Islands', TRUE),
    ('AZ', 'AZE', '031', 'Azerbaiyán', 'Azerbaijan', TRUE),
    ('BA', 'BIH', '070', 'Bosnia y Herzegovina', 'Bosnia and Herzegovina', TRUE),
    ('BB', 'BRB', '052', 'Barbados', 'Barbados', TRUE),
    ('BD', 'BGD', '050', 'Bangladés', 'Bangladesh', TRUE),
    ('BE', 'BEL', '056', 'Bélgica', 'Belgium', TRUE),
    ('BF', 'BFA', '854', 'Burkina Faso', 'Burkina Faso', TRUE),
    ('BG', 'BGR', '100', 'Bulgaria', 'Bulgaria', TRUE),
    ('BH', 'BHR', '048', 'Baréin', 'Bahrain', TRUE),
    ('BI', 'BDI', '108', 'Burundi', 'Burundi', TRUE),
    ('BJ', 'BEN', '204', 'Benín', 'Benin', TRUE),
    ('BL', 'BLM', '652', 'San Bartolomé', 'Saint Barthélemy', TRUE),
    ('BM', 'BMU', '060', 'Bermudas', 'Bermuda', TRUE),
    ('BN', 'BRN', '096', 'Brunéi', 'Brunei Darussalam', TRUE),
    ('BO', 'BOL', '068', 'Bolivia', 'Bolivia, Plurinational State of', TRUE),
    ('BQ', 'BES', '535', 'Caribe neerlandés', 'Bonaire, Sint Eustatius and Saba', TRUE),
    ('BR', 'BRA', '076', 'Brasil', 'Brazil', TRUE),
    ('BS', 'BHS', '044', 'Bahamas', 'Bahamas', TRUE),
    ('BT', 'BTN', '064', 'Bután', 'Bhutan', TRUE),
    ('BV', 'BVT', '074', 'Isla Bouvet', 'Bouvet Island', TRUE),
    ('BW', 'BWA', '072', 'Botsuana', 'Botswana', TRUE),
    ('BY', 'BLR', '112', 'Bielorrusia', 'Belarus', TRUE),
    ('BZ', 'BLZ', '084', 'Belice', 'Belize', TRUE),
    ('CA', 'CAN', '124', 'Canadá', 'Canada', TRUE),
    ('CC', 'CCK', '166', 'Islas Cocos', 'Cocos (Keeling) Islands', TRUE),
    ('CD', 'COD', '180', 'República Democrática del Congo', 'Congo, The Democratic Republic of the', TRUE),
    ('CF', 'CAF', '140', 'República Centroafricana', 'Central African Republic', TRUE),
    ('CG', 'COG', '178', 'Congo', 'Congo', TRUE),
    ('CH', 'CHE', '756', 'Suiza', 'Switzerland', TRUE),
    ('CI', 'CIV', '384', 'Côte d’Ivoire', 'Côte d''Ivoire', TRUE),
    ('CK', 'COK', '184', 'Islas Cook', 'Cook Islands', TRUE),
    ('CL', 'CHL', '152', 'Chile', 'Chile', TRUE),
    ('CM', 'CMR', '120', 'Camerún', 'Cameroon', TRUE),
    ('CN', 'CHN', '156', 'China', 'China', TRUE),
    ('CO', 'COL', '170', 'Colombia', 'Colombia', TRUE),
    ('CR', 'CRI', '188', 'Costa Rica', 'Costa Rica', TRUE),
    ('CU', 'CUB', '192', 'Cuba', 'Cuba', TRUE),
    ('CV', 'CPV', '132', 'Cabo Verde', 'Cabo Verde', TRUE),
    ('CW', 'CUW', '531', 'Curazao', 'Curaçao', TRUE),
    ('CX', 'CXR', '162', 'Isla de Navidad', 'Christmas Island', TRUE),
    ('CY', 'CYP', '196', 'Chipre', 'Cyprus', TRUE),
    ('CZ', 'CZE', '203', 'Chequia', 'Czechia', TRUE),
    ('DE', 'DEU', '276', 'Alemania', 'Germany', TRUE),
    ('DJ', 'DJI', '262', 'Yibuti', 'Djibouti', TRUE),
    ('DK', 'DNK', '208', 'Dinamarca', 'Denmark', TRUE),
    ('DM', 'DMA', '212', 'Dominica', 'Dominica', TRUE),
    ('DO', 'DOM', '214', 'República Dominicana', 'Dominican Republic', TRUE),
    ('DZ', 'DZA', '012', 'Argelia', 'Algeria', TRUE),
    ('EC', 'ECU', '218', 'Ecuador', 'Ecuador', TRUE),
    ('EE', 'EST', '233', 'Estonia', 'Estonia', TRUE),
    ('EG', 'EGY', '818', 'Egipto', 'Egypt', TRUE),
    ('EH', 'ESH', '732', 'Sáhara Occidental', 'Western Sahara', TRUE),
    ('ER', 'ERI', '232', 'Eritrea', 'Eritrea', TRUE),
    ('ES', 'ESP', '724', 'España', 'Spain', TRUE),
    ('ET', 'ETH', '231', 'Etiopía', 'Ethiopia', TRUE),
    ('FI', 'FIN', '246', 'Finlandia', 'Finland', TRUE),
    ('FJ', 'FJI', '242', 'Fiyi', 'Fiji', TRUE),
    ('FK', 'FLK', '238', 'Islas Malvinas', 'Falkland Islands (Malvinas)', TRUE),
    ('FM', 'FSM', '583', 'Micronesia', 'Micronesia, Federated States of', TRUE),
    ('FO', 'FRO', '234', 'Islas Feroe', 'Faroe Islands', TRUE),
    ('FR', 'FRA', '250', 'Francia', 'France', TRUE),
    ('GA', 'GAB', '266', 'Gabón', 'Gabon', TRUE),
    ('GB', 'GBR', '826', 'Reino Unido', 'United Kingdom', TRUE),
    ('GD', 'GRD', '308', 'Granada', 'Grenada', TRUE),
    ('GE', 'GEO', '268', 'Georgia', 'Georgia', TRUE),
    ('GF', 'GUF', '254', 'Guayana Francesa', 'French Guiana', TRUE),
    ('GG', 'GGY', '831', 'Guernesey', 'Guernsey', TRUE),
    ('GH', 'GHA', '288', 'Ghana', 'Ghana', TRUE),
    ('GI', 'GIB', '292', 'Gibraltar', 'Gibraltar', TRUE),
    ('GL', 'GRL', '304', 'Groenlandia', 'Greenland', TRUE),
    ('GM', 'GMB', '270', 'Gambia', 'Gambia', TRUE),
    ('GN', 'GIN', '324', 'Guinea', 'Guinea', TRUE),
    ('GP', 'GLP', '312', 'Guadalupe', 'Guadeloupe', TRUE),
    ('GQ', 'GNQ', '226', 'Guinea Ecuatorial', 'Equatorial Guinea', TRUE),
    ('GR', 'GRC', '300', 'Grecia', 'Greece', TRUE),
    ('GS', 'SGS', '239', 'Islas Georgia del Sur y Sandwich del Sur', 'South Georgia and the South Sandwich Islands', TRUE),
    ('GT', 'GTM', '320', 'Guatemala', 'Guatemala', TRUE),
    ('GU', 'GUM', '316', 'Guam', 'Guam', TRUE),
    ('GW', 'GNB', '624', 'Guinea-Bisáu', 'Guinea-Bissau', TRUE),
    ('GY', 'GUY', '328', 'Guyana', 'Guyana', TRUE),
    ('HK', 'HKG', '344', 'RAE de Hong Kong (China)', 'Hong Kong', TRUE),
    ('HM', 'HMD', '334', 'Islas Heard y McDonald', 'Heard Island and McDonald Islands', TRUE),
    ('HN', 'HND', '340', 'Honduras', 'Honduras', TRUE),
    ('HR', 'HRV', '191', 'Croacia', 'Croatia', TRUE),
    ('HT', 'HTI', '332', 'Haití', 'Haiti', TRUE),
    ('HU', 'HUN', '348', 'Hungría', 'Hungary', TRUE),
    ('ID', 'IDN', '360', 'Indonesia', 'Indonesia', TRUE),
    ('IE', 'IRL', '372', 'Irlanda', 'Ireland', TRUE),
    ('IL', 'ISR', '376', 'Israel', 'Israel', TRUE),
    ('IM', 'IMN', '833', 'Isla de Man', 'Isle of Man', TRUE),
    ('IN', 'IND', '356', 'India', 'India', TRUE),
    ('IO', 'IOT', '086', 'Territorio Británico del Océano Índico', 'British Indian Ocean Territory', TRUE),
    ('IQ', 'IRQ', '368', 'Irak', 'Iraq', TRUE),
    ('IR', 'IRN', '364', 'Irán', 'Iran, Islamic Republic of', TRUE),
    ('IS', 'ISL', '352', 'Islandia', 'Iceland', TRUE),
    ('IT', 'ITA', '380', 'Italia', 'Italy', TRUE),
    ('JE', 'JEY', '832', 'Jersey', 'Jersey', TRUE),
    ('JM', 'JAM', '388', 'Jamaica', 'Jamaica', TRUE),
    ('JO', 'JOR', '400', 'Jordania', 'Jordan', TRUE),
    ('JP', 'JPN', '392', 'Japón', 'Japan', TRUE),
    ('KE', 'KEN', '404', 'Kenia', 'Kenya', TRUE),
    ('KG', 'KGZ', '417', 'Kirguistán', 'Kyrgyzstan', TRUE),
    ('KH', 'KHM', '116', 'Camboya', 'Cambodia', TRUE),
    ('KI', 'KIR', '296', 'Kiribati', 'Kiribati', TRUE),
    ('KM', 'COM', '174', 'Comoras', 'Comoros', TRUE),
    ('KN', 'KNA', '659', 'San Cristóbal y Nieves', 'Saint Kitts and Nevis', TRUE),
    ('KP', 'PRK', '408', 'Corea del Norte', 'Korea, Democratic People''s Republic of', TRUE),
    ('KR', 'KOR', '410', 'Corea del Sur', 'Korea, Republic of', TRUE),
    ('KW', 'KWT', '414', 'Kuwait', 'Kuwait', TRUE),
    ('KY', 'CYM', '136', 'Islas Caimán', 'Cayman Islands', TRUE),
    ('KZ', 'KAZ', '398', 'Kazajistán', 'Kazakhstan', TRUE),
    ('LA', 'LAO', '418', 'Laos', 'Lao People''s Democratic Republic', TRUE),
    ('LB', 'LBN', '422', 'Líbano', 'Lebanon', TRUE),
    ('LC', 'LCA', '662', 'Santa Lucía', 'Saint Lucia', TRUE),
    ('LI', 'LIE', '438', 'Liechtenstein', 'Liechtenstein', TRUE),
    ('LK', 'LKA', '144', 'Sri Lanka', 'Sri Lanka', TRUE),
    ('LR', 'LBR', '430', 'Liberia', 'Liberia', TRUE),
    ('LS', 'LSO', '426', 'Lesoto', 'Lesotho', TRUE),
    ('LT', 'LTU', '440', 'Lituania', 'Lithuania', TRUE),
    ('LU', 'LUX', '442', 'Luxemburgo', 'Luxembourg', TRUE),
    ('LV', 'LVA', '428', 'Letonia', 'Latvia', TRUE),
    ('LY', 'LBY', '434', 'Libia', 'Libya', TRUE),
    ('MA', 'MAR', '504', 'Marruecos', 'Morocco', TRUE),
    ('MC', 'MCO', '492', 'Mónaco', 'Monaco', TRUE),
    ('MD', 'MDA', '498', 'Moldavia', 'Moldova, Republic of', TRUE),
    ('ME', 'MNE', '499', 'Montenegro', 'Montenegro', TRUE),
    ('MF', 'MAF', '663', 'San Martín', 'Saint Martin (French part)', TRUE),
    ('MG', 'MDG', '450', 'Madagascar', 'Madagascar', TRUE),
    ('MH', 'MHL', '584', 'Islas Marshall', 'Marshall Islands', TRUE),
    ('MK', 'MKD', '807', 'Macedonia del Norte', 'North Macedonia', TRUE),
    ('ML', 'MLI', '466', 'Mali', 'Mali', TRUE),
    ('MM', 'MMR', '104', 'Myanmar (Birmania)', 'Myanmar', TRUE),
    ('MN', 'MNG', '496', 'Mongolia', 'Mongolia', TRUE),
    ('MO', 'MAC', '446', 'RAE de Macao (China)', 'Macao', TRUE),
    ('MP', 'MNP', '580', 'Islas Marianas del Norte', 'Northern Mariana Islands', TRUE),
    ('MQ', 'MTQ', '474', 'Martinica', 'Martinique', TRUE),
    ('MR', 'MRT', '478', 'Mauritania', 'Mauritania', TRUE),
    ('MS', 'MSR', '500', 'Montserrat', 'Montserrat', TRUE),
    ('MT', 'MLT', '470', 'Malta', 'Malta', TRUE),
    ('MU', 'MUS', '480', 'Mauricio', 'Mauritius', TRUE),
    ('MV', 'MDV', '462', 'Maldivas', 'Maldives', TRUE),
    ('MW', 'MWI', '454', 'Malaui', 'Malawi', TRUE),
    ('MX', 'MEX', '484', 'México', 'Mexico', TRUE),
    ('MY', 'MYS', '458', 'Malasia', 'Malaysia', TRUE),
    ('MZ', 'MOZ', '508', 'Mozambique', 'Mozambique', TRUE),
    ('NA', 'NAM', '516', 'Namibia', 'Namibia', TRUE),
    ('NC', 'NCL', '540', 'Nueva Caledonia', 'New Caledonia', TRUE),
    ('NE', 'NER', '562', 'Níger', 'Niger', TRUE),
    ('NF', 'NFK', '574', 'Isla Norfolk', 'Norfolk Island', TRUE),
    ('NG', 'NGA', '566', 'Nigeria', 'Nigeria', TRUE),
    ('NI', 'NIC', '558', 'Nicaragua', 'Nicaragua', TRUE),
    ('NL', 'NLD', '528', 'Países Bajos', 'Netherlands', TRUE),
    ('NO', 'NOR', '578', 'Noruega', 'Norway', TRUE),
    ('NP', 'NPL', '524', 'Nepal', 'Nepal', TRUE),
    ('NR', 'NRU', '520', 'Nauru', 'Nauru', TRUE),
    ('NU', 'NIU', '570', 'Niue', 'Niue', TRUE),
    ('NZ', 'NZL', '554', 'Nueva Zelanda', 'New Zealand', TRUE),
    ('OM', 'OMN', '512', 'Omán', 'Oman', TRUE),
    ('PA', 'PAN', '591', 'Panamá', 'Panama', TRUE),
    ('PE', 'PER', '604', 'Perú', 'Peru', TRUE),
    ('PF', 'PYF', '258', 'Polinesia Francesa', 'French Polynesia', TRUE),
    ('PG', 'PNG', '598', 'Papúa Nueva Guinea', 'Papua New Guinea', TRUE),
    ('PH', 'PHL', '608', 'Filipinas', 'Philippines', TRUE),
    ('PK', 'PAK', '586', 'Pakistán', 'Pakistan', TRUE),
    ('PL', 'POL', '616', 'Polonia', 'Poland', TRUE),
    ('PM', 'SPM', '666', 'San Pedro y Miquelón', 'Saint Pierre and Miquelon', TRUE),
    ('PN', 'PCN', '612', 'Islas Pitcairn', 'Pitcairn', TRUE),
    ('PR', 'PRI', '630', 'Puerto Rico', 'Puerto Rico', TRUE),
    ('PS', 'PSE', '275', 'Territorios Palestinos', 'Palestine, State of', TRUE),
    ('PT', 'PRT', '620', 'Portugal', 'Portugal', TRUE),
    ('PW', 'PLW', '585', 'Palaos', 'Palau', TRUE),
    ('PY', 'PRY', '600', 'Paraguay', 'Paraguay', TRUE),
    ('QA', 'QAT', '634', 'Catar', 'Qatar', TRUE),
    ('RE', 'REU', '638', 'Reunión', 'Réunion', TRUE),
    ('RO', 'ROU', '642', 'Rumanía', 'Romania', TRUE),
    ('RS', 'SRB', '688', 'Serbia', 'Serbia', TRUE),
    ('RU', 'RUS', '643', 'Rusia', 'Russian Federation', TRUE),
    ('RW', 'RWA', '646', 'Ruanda', 'Rwanda', TRUE),
    ('SA', 'SAU', '682', 'Arabia Saudí', 'Saudi Arabia', TRUE),
    ('SB', 'SLB', '090', 'Islas Salomón', 'Solomon Islands', TRUE),
    ('SC', 'SYC', '690', 'Seychelles', 'Seychelles', TRUE),
    ('SD', 'SDN', '729', 'Sudán', 'Sudan', TRUE),
    ('SE', 'SWE', '752', 'Suecia', 'Sweden', TRUE),
    ('SG', 'SGP', '702', 'Singapur', 'Singapore', TRUE),
    ('SH', 'SHN', '654', 'Santa Elena', 'Saint Helena, Ascension and Tristan da Cunha', TRUE),
    ('SI', 'SVN', '705', 'Eslovenia', 'Slovenia', TRUE),
    ('SJ', 'SJM', '744', 'Svalbard y Jan Mayen', 'Svalbard and Jan Mayen', TRUE),
    ('SK', 'SVK', '703', 'Eslovaquia', 'Slovakia', TRUE),
    ('SL', 'SLE', '694', 'Sierra Leona', 'Sierra Leone', TRUE),
    ('SM', 'SMR', '674', 'San Marino', 'San Marino', TRUE),
    ('SN', 'SEN', '686', 'Senegal', 'Senegal', TRUE),
    ('SO', 'SOM', '706', 'Somalia', 'Somalia', TRUE),
    ('SR', 'SUR', '740', 'Surinam', 'Suriname', TRUE),
    ('SS', 'SSD', '728', 'Sudán del Sur', 'South Sudan', TRUE),
    ('ST', 'STP', '678', 'Santo Tomé y Príncipe', 'Sao Tome and Principe', TRUE),
    ('SV', 'SLV', '222', 'El Salvador', 'El Salvador', TRUE),
    ('SX', 'SXM', '534', 'Sint Maarten', 'Sint Maarten (Dutch part)', TRUE),
    ('SY', 'SYR', '760', 'Siria', 'Syrian Arab Republic', TRUE),
    ('SZ', 'SWZ', '748', 'Esuatini', 'Eswatini', TRUE),
    ('TC', 'TCA', '796', 'Islas Turcas y Caicos', 'Turks and Caicos Islands', TRUE),
    ('TD', 'TCD', '148', 'Chad', 'Chad', TRUE),
    ('TF', 'ATF', '260', 'Territorios Australes Franceses', 'French Southern Territories', TRUE),
    ('TG', 'TGO', '768', 'Togo', 'Togo', TRUE),
    ('TH', 'THA', '764', 'Tailandia', 'Thailand', TRUE),
    ('TJ', 'TJK', '762', 'Tayikistán', 'Tajikistan', TRUE),
    ('TK', 'TKL', '772', 'Tokelau', 'Tokelau', TRUE),
    ('TL', 'TLS', '626', 'Timor-Leste', 'Timor-Leste', TRUE),
    ('TM', 'TKM', '795', 'Turkmenistán', 'Turkmenistan', TRUE),
    ('TN', 'TUN', '788', 'Túnez', 'Tunisia', TRUE),
    ('TO', 'TON', '776', 'Tonga', 'Tonga', TRUE),
    ('TR', 'TUR', '792', 'Turquía', 'Türkiye', TRUE),
    ('TT', 'TTO', '780', 'Trinidad y Tobago', 'Trinidad and Tobago', TRUE),
    ('TV', 'TUV', '798', 'Tuvalu', 'Tuvalu', TRUE),
    ('TW', 'TWN', '158', 'Taiwán', 'Taiwan, Province of China', TRUE),
    ('TZ', 'TZA', '834', 'Tanzania', 'Tanzania, United Republic of', TRUE),
    ('UA', 'UKR', '804', 'Ucrania', 'Ukraine', TRUE),
    ('UG', 'UGA', '800', 'Uganda', 'Uganda', TRUE),
    ('UM', 'UMI', '581', 'Islas menores alejadas de EE. UU.', 'United States Minor Outlying Islands', TRUE),
    ('US', 'USA', '840', 'Estados Unidos', 'United States', TRUE),
    ('UY', 'URY', '858', 'Uruguay', 'Uruguay', TRUE),
    ('UZ', 'UZB', '860', 'Uzbekistán', 'Uzbekistan', TRUE),
    ('VA', 'VAT', '336', 'Ciudad del Vaticano', 'Holy See (Vatican City State)', TRUE),
    ('VC', 'VCT', '670', 'San Vicente y las Granadinas', 'Saint Vincent and the Grenadines', TRUE),
    ('VE', 'VEN', '862', 'Venezuela', 'Venezuela, Bolivarian Republic of', TRUE),
    ('VG', 'VGB', '092', 'Islas Vírgenes Británicas', 'Virgin Islands, British', TRUE),
    ('VI', 'VIR', '850', 'Islas Vírgenes de EE. UU.', 'Virgin Islands, U.S.', TRUE),
    ('VN', 'VNM', '704', 'Vietnam', 'Viet Nam', TRUE),
    ('VU', 'VUT', '548', 'Vanuatu', 'Vanuatu', TRUE),
    ('WF', 'WLF', '876', 'Wallis y Futuna', 'Wallis and Futuna', TRUE),
    ('WS', 'WSM', '882', 'Samoa', 'Samoa', TRUE),
    ('YE', 'YEM', '887', 'Yemen', 'Yemen', TRUE),
    ('YT', 'MYT', '175', 'Mayotte', 'Mayotte', TRUE),
    ('ZA', 'ZAF', '710', 'Sudáfrica', 'South Africa', TRUE),
    ('ZM', 'ZMB', '894', 'Zambia', 'Zambia', TRUE),
    ('ZW', 'ZWE', '716', 'Zimbabue', 'Zimbabwe', TRUE)
ON CONFLICT (codigo_iso2)
DO UPDATE SET
    codigo_iso3         = EXCLUDED.codigo_iso3,
    codigo_numerico     = EXCLUDED.codigo_numerico,
    nombre              = EXCLUDED.nombre,
    nombre_iso          = EXCLUDED.nombre_iso,
    activo              = EXCLUDED.activo,
    fecha_actualizacion = NOW();

DO $$
DECLARE
    v_col RECORD;
    v_max BIGINT;
BEGIN
    FOR v_col IN
        SELECT
            c.table_schema,
            c.table_name,
            c.column_name,
            pg_get_serial_sequence(
                format('%I.%I', c.table_schema, c.table_name),
                c.column_name
            ) AS sequence_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND pg_get_serial_sequence(
                format('%I.%I', c.table_schema, c.table_name),
                c.column_name
              ) IS NOT NULL
    LOOP
        EXECUTE format(
            'SELECT COALESCE(MAX(%I), 0) FROM %I.%I',
            v_col.column_name,
            v_col.table_schema,
            v_col.table_name
        )
        INTO v_max;

        IF v_max > 0 THEN
            EXECUTE format(
                'SELECT setval(%L::regclass, %s, true)',
                v_col.sequence_name,
                v_max
            );
        END IF;
    END LOOP;
END;
$$;

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

-- ============================================
-- POST-INTEGRACION SUPABASE: RLS, PERMISOS E HISTORIAL
-- Integra:
-- - scripts/fix_catalogos_lectura_supabase.sql
-- - scripts/fix_empleados_alta_rls_supabase.sql
-- - scripts/empleados_historial_ficha.sql
-- (Ver tambien partes/08_seguridad_rls.sql; ejecutar bloques completos.)
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DO $$
DECLARE
    parametro_table TEXT;
    parametro_tables TEXT[] := ARRAY[
        'parametros_generales',
        'parametros_legales',
        'afc_parametro',
        'trabajo_pesado_parametro',
        'reforma_previsional_parametro'
    ];
BEGIN
    FOREACH parametro_table IN ARRAY parametro_tables LOOP
        IF to_regclass(format('public.%I', parametro_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated',
            parametro_table
        );

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', parametro_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_select_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_select_anon_authenticated ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                parametro_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_insert_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_insert_anon_authenticated ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
                parametro_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_update_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_update_anon_authenticated ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)',
                parametro_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_delete_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_delete_anon_authenticated ON public.%I FOR DELETE TO anon, authenticated USING (true)',
                parametro_table
            );
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    catalog_table TEXT;
    catalog_tables TEXT[] := ARRAY[
        'pais',
        'region',
        'provincia',
        'comuna',
        'ciudad',
        'empresa',
        'centro_costo',
        'sucursal',
        'departamento_empresa',
        'tipo_trabajador',
        'tipo_jornada',
        'regimen_previsional',
        'entidad_previsional_ips',
        'ex_caja_previsional',
        'regimen_ex_caja',
        'afp',
        'afp_vigencia',
        'salud',
        'salud_plan',
        'moneda',
        'tramo_carga',
        'tramo_impuesto',
        'tabla_impuesto_unico',
        'institucion_apv',
        'forma_pago_apv',
        'ley_16744_parametros',
        'organismo_administrador_ley_16744',
        'ccaf_entidad',
        'catalogo_lre',
        'empresa_ley_16744',
        'banco',
        'tipo_cuenta_bancaria',
        'zona_extrema_catalogo'
    ];
BEGIN
    FOREACH catalog_table IN ARRAY catalog_tables LOOP
        IF to_regclass(format('public.%I', catalog_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', catalog_table);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', catalog_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = catalog_table
              AND policyname = 'catalogos_select_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY catalogos_select_anon_authenticated ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                catalog_table
            );
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    write_table TEXT;
    write_tables TEXT[] := ARRAY[
        'persona',
        'contrato',
        'remuneracion',
        'prevision',
        'salud_trabajador',
        'cuenta2_afp',
        'semana_corrida',
        'zona_extrema',
        'apv',
        'cuenta_bancaria',
        'contrato_centro_costo'
    ];
BEGIN
    FOREACH write_table IN ARRAY write_tables LOOP
        IF to_regclass(format('public.%I', write_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated',
            write_table
        );

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', write_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = write_table
              AND policyname = 'empleados_alta_select'
        ) THEN
            EXECUTE format(
                'CREATE POLICY empleados_alta_select ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                write_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = write_table
              AND policyname = 'empleados_alta_insert'
        ) THEN
            EXECUTE format(
                'CREATE POLICY empleados_alta_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
                write_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = write_table
              AND policyname = 'empleados_alta_update'
        ) THEN
            EXECUTE format(
                'CREATE POLICY empleados_alta_update ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)',
                write_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = write_table
              AND policyname = 'empleados_alta_delete'
        ) THEN
            EXECUTE format(
                'CREATE POLICY empleados_alta_delete ON public.%I FOR DELETE TO anon, authenticated USING (true)',
                write_table
            );
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    hd_table TEXT;
    hd_tables TEXT[] := ARRAY[
        'concepto',
        'haberdescuento_persona'
    ];
BEGIN
    FOREACH hd_table IN ARRAY hd_tables LOOP
        IF to_regclass(format('public.%I', hd_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated',
            hd_table
        );

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', hd_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_select'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_select ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                hd_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_insert'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
                hd_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_update'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_update ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)',
                hd_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_delete'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_delete ON public.%I FOR DELETE TO anon, authenticated USING (true)',
                hd_table
            );
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    regla_table TEXT := 'regla_concepto_calculo';
BEGIN
    IF to_regclass(format('public.%I', regla_table)) IS NOT NULL THEN
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', regla_table);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', regla_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = regla_table
              AND policyname = 'regla_concepto_calculo_select'
        ) THEN
            EXECUTE format(
                'CREATE POLICY regla_concepto_calculo_select ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                regla_table
            );
        END IF;
    END IF;
END $$;

DO $$
DECLARE
    catalog_view TEXT;
    catalog_views TEXT[] := ARRAY[
        'vw_persona_factores'
    ];
BEGIN
    FOREACH catalog_view IN ARRAY catalog_views LOOP
        IF to_regclass(format('public.%I', catalog_view)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', catalog_view);
    END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.empleado_historial (
    id_historial BIGSERIAL PRIMARY KEY,
    id_persona INTEGER NOT NULL REFERENCES public.persona(id_persona) ON DELETE CASCADE,
    id_contrato INTEGER NULL REFERENCES public.contrato(id_contrato) ON DELETE SET NULL,
    seccion TEXT NOT NULL,
    evento TEXT NOT NULL,
    tabla_origen TEXT NOT NULL,
    id_registro INTEGER NULL,
    operacion TEXT NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    campos_modificados TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    datos_antes JSONB NULL,
    datos_despues JSONB NULL,
    usuario TEXT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS empleado_historial_persona_fecha_idx
    ON public.empleado_historial (id_persona, fecha DESC);

CREATE INDEX IF NOT EXISTS empleado_historial_contrato_fecha_idx
    ON public.empleado_historial (id_contrato, fecha DESC)
    WHERE id_contrato IS NOT NULL;

CREATE INDEX IF NOT EXISTS empleado_historial_seccion_fecha_idx
    ON public.empleado_historial (seccion, fecha DESC);

COMMENT ON TABLE public.empleado_historial IS
    'Auditoria funcional de cambios realizados sobre la ficha de empleado.';

COMMENT ON COLUMN public.empleado_historial.campos_modificados IS
    'Columnas que cambiaron entre el registro anterior y el nuevo.';

COMMENT ON COLUMN public.empleado_historial.datos_antes IS
    'Snapshot JSON del registro antes del cambio. Null para INSERT.';

COMMENT ON COLUMN public.empleado_historial.datos_despues IS
    'Snapshot JSON del registro despues del cambio. Null para DELETE.';

CREATE OR REPLACE FUNCTION public.empleado_historial_changed_fields(
    p_old JSONB,
    p_new JSONB
)
RETURNS TEXT[]
LANGUAGE SQL
IMMUTABLE
AS $$
    WITH keys AS (
        SELECT jsonb_object_keys(COALESCE(p_old, '{}'::JSONB) || COALESCE(p_new, '{}'::JSONB)) AS key
    )
    SELECT COALESCE(array_agg(key ORDER BY key), ARRAY[]::TEXT[])
    FROM keys
    WHERE COALESCE(p_old -> key, 'null'::JSONB) IS DISTINCT FROM COALESCE(p_new -> key, 'null'::JSONB);
$$;

CREATE OR REPLACE FUNCTION public.empleado_historial_tabla_seccion(p_tabla TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT CASE p_tabla
        WHEN 'persona' THEN 'General'
        WHEN 'contrato' THEN 'Laboral'
        WHEN 'contrato_centro_costo' THEN 'Laboral'
        WHEN 'remuneracion' THEN 'Remuneracion'
        WHEN 'semana_corrida' THEN 'Remuneracion'
        WHEN 'zona_extrema' THEN 'Remuneracion'
        WHEN 'prevision' THEN 'Prevision y Salud'
        WHEN 'salud_trabajador' THEN 'Prevision y Salud'
        WHEN 'cuenta2_afp' THEN 'Prevision y Salud'
        WHEN 'apv' THEN 'Prevision y Salud'
        WHEN 'cuenta_bancaria' THEN 'Pago'
        ELSE 'Ficha'
    END;
$$;

CREATE OR REPLACE FUNCTION public.empleado_historial_tabla_pk(
    p_tabla TEXT,
    p_row JSONB
)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT CASE p_tabla
        WHEN 'persona' THEN NULLIF(p_row ->> 'id_persona', '')::INTEGER
        WHEN 'contrato' THEN NULLIF(p_row ->> 'id_contrato', '')::INTEGER
        WHEN 'contrato_centro_costo' THEN NULLIF(p_row ->> 'id_contrato_centro_costo', '')::INTEGER
        WHEN 'remuneracion' THEN NULLIF(p_row ->> 'id_remuneracion', '')::INTEGER
        WHEN 'semana_corrida' THEN NULLIF(p_row ->> 'id_semana_corrida', '')::INTEGER
        WHEN 'zona_extrema' THEN NULLIF(p_row ->> 'id_zona_extrema', '')::INTEGER
        WHEN 'prevision' THEN NULLIF(p_row ->> 'id_prevision', '')::INTEGER
        WHEN 'salud_trabajador' THEN NULLIF(p_row ->> 'id_salud_trabajador', '')::INTEGER
        WHEN 'cuenta2_afp' THEN NULLIF(p_row ->> 'id_cuenta2_afp', '')::INTEGER
        WHEN 'apv' THEN NULLIF(p_row ->> 'id_apv', '')::INTEGER
        WHEN 'cuenta_bancaria' THEN NULLIF(p_row ->> 'id_cuenta', '')::INTEGER
        ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.empleado_historial_registrar_cambio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    old_data JSONB := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END;
    new_data JSONB := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
    row_data JSONB := COALESCE(new_data, old_data);
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    resolved_persona_id INTEGER;
    resolved_contrato_id INTEGER;
    resolved_record_id INTEGER;
    resolved_seccion TEXT;
    resolved_usuario TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        changed_fields := public.empleado_historial_changed_fields(old_data, new_data);

        IF cardinality(changed_fields) = 0 THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        changed_fields := public.empleado_historial_changed_fields('{}'::JSONB, new_data);
    ELSE
        changed_fields := public.empleado_historial_changed_fields(old_data, '{}'::JSONB);
    END IF;

    resolved_contrato_id := NULLIF(row_data ->> 'id_contrato', '')::INTEGER;
    resolved_persona_id := NULLIF(row_data ->> 'id_persona', '')::INTEGER;

    IF resolved_persona_id IS NULL AND resolved_contrato_id IS NOT NULL THEN
        SELECT c.id_persona
        INTO resolved_persona_id
        FROM public.contrato c
        WHERE c.id_contrato = resolved_contrato_id
        LIMIT 1;
    END IF;

    IF resolved_persona_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;

        RETURN NEW;
    END IF;

    IF resolved_contrato_id IS NULL AND TG_TABLE_NAME = 'contrato' THEN
        resolved_contrato_id := NULLIF(row_data ->> 'id_contrato', '')::INTEGER;
    END IF;

    resolved_record_id := public.empleado_historial_tabla_pk(TG_TABLE_NAME, row_data);
    resolved_seccion := public.empleado_historial_tabla_seccion(TG_TABLE_NAME);
    resolved_usuario := COALESCE(
        NULLIF(current_setting('request.jwt.claim.email', TRUE), ''),
        NULLIF(current_setting('request.jwt.claim.sub', TRUE), ''),
        current_user
    );

    INSERT INTO public.empleado_historial (
        id_persona,
        id_contrato,
        seccion,
        evento,
        tabla_origen,
        id_registro,
        operacion,
        campos_modificados,
        datos_antes,
        datos_despues,
        usuario
    )
    VALUES (
        resolved_persona_id,
        resolved_contrato_id,
        resolved_seccion,
        CASE TG_OP
            WHEN 'INSERT' THEN 'Registro creado'
            WHEN 'UPDATE' THEN 'Registro actualizado'
            WHEN 'DELETE' THEN 'Registro eliminado'
        END,
        TG_TABLE_NAME,
        resolved_record_id,
        TG_OP,
        changed_fields,
        old_data,
        new_data,
        resolved_usuario
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

DO $$
DECLARE
    audit_table TEXT;
    audit_tables TEXT[] := ARRAY[
        'persona',
        'contrato',
        'contrato_centro_costo',
        'remuneracion',
        'semana_corrida',
        'zona_extrema',
        'prevision',
        'salud_trabajador',
        'cuenta2_afp',
        'apv',
        'cuenta_bancaria'
    ];
BEGIN
    FOREACH audit_table IN ARRAY audit_tables LOOP
        IF to_regclass(format('public.%I', audit_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'DROP TRIGGER IF EXISTS empleado_historial_%I_trg ON public.%I',
            audit_table,
            audit_table
        );

        EXECUTE format(
            'CREATE TRIGGER empleado_historial_%I_trg
             AFTER INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.empleado_historial_registrar_cambio()',
            audit_table,
            audit_table
        );
    END LOOP;
END $$;

GRANT SELECT, INSERT ON TABLE public.empleado_historial TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.empleado_historial_id_historial_seq TO anon, authenticated;

ALTER TABLE public.empleado_historial ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'empleado_historial'
          AND policyname = 'empleado_historial_select'
    ) THEN
        CREATE POLICY empleado_historial_select
            ON public.empleado_historial
            FOR SELECT
            TO anon, authenticated
            USING (TRUE);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'empleado_historial'
          AND policyname = 'empleado_historial_insert'
    ) THEN
        CREATE POLICY empleado_historial_insert
            ON public.empleado_historial
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (TRUE);
    END IF;
END $$;


-- =============================================================================
-- BLOQUE SINCRONIZADO DESDE partes/24_lre_catalogo_oficial.sql
-- =============================================================================
-- =============================================================================
-- LRE-CATALOG-01 - Catálogo oficial LRE y mapeo base de conceptos
-- Fuente normativa: Dirección del Trabajo, Suplemento Manual Libro de
-- Remuneraciones Electrónico, enero 2022.
--
-- Alcance:
-- - Completa catalogo_lre con campos 11xx, 21xx, 22xx, 23xx, 24xx,
--   31xx, 41xx y totales 5xxx del suplemento.
-- - Mapea conceptos internos base contra códigos LRE operativos.
-- - No crea exportador LRE, no recalcula nómina y no cambia fórmulas legales.
-- - Idempotente para BD existente y para base nueva.
-- =============================================================================
SET search_path = public;

INSERT INTO catalogo_lre (
    codigo_lre,
    nombre_lre,
    modulo_lre,
    grupo_lre,
    clasificacion_lre,
    imponible,
    tributable,
    afecta_liquido,
    vigente,
    vigencia_inicio,
    observacion
) VALUES
    ('1101', 'Rut trabajador', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1102', 'Fecha inicio contrato', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1103', 'Fecha de término de contrato', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1104', 'Causal de término del contrato', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1105', 'Región de prestación de los servicios', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1106', 'Comuna de prestación de los servicios', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1170', 'Tipo de impuesto a la renta', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1146', 'Técnico extranjero exención de cotizaciones previsionales (Ley 18.156)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1107', 'Código tipo de jornada', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1108', 'Persona con discapacidad/pensionado por invalidez', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1109', 'Pensionado por vejez', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1141', 'AFP', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1142', 'IPS (ExINP)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1143', 'FONASA / ISAPRE', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1151', 'AFC', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1110', 'CCAF', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1152', 'Org. Administrador Ley 16.744', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1111', 'Número cargas familiares legales autorizadas', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1112', 'Número de cargas familiares maternales', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1113', 'Número de cargas familiares invalidez', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1114', 'Tramo asignación familiar', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1171', 'Rut organización sindical 1', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1172', 'Rut organización sindical 2', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1173', 'Rut organización sindical 3', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1174', 'Rut organización sindical 4', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1175', 'Rut organización sindical 5', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1176', 'Rut organización sindical 6', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1177', 'Rut organización sindical 7', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1178', 'Rut organización sindical 8', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1179', 'Rut organización sindical 9', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1180', 'Rut organización sindical 10', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1115', 'Número de días trabajados en el mes', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1116', 'Número días de licencia médica en el mes', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1117', 'Número días de vacaciones en el mes', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1118', 'Subsidio trabajador Joven', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1154', 'Puesto trabajo pesado', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1155', 'Ahorro previsional voluntario individual', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1157', 'Ahorro previsional voluntario colectivo', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1131', 'Indemnización a todo evento (Art. 164)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1132', 'Tasa indemnización a todo evento (Art. 164)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2101', 'Sueldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2102', 'Sobresueldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2103', 'Comisiones (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2104', 'Semana corrida mensual (Art. 45)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2105', 'Participación (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2106', 'Gratificación (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2107', 'Recargo 30% día domingo (Art. 38)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2108', 'Remuneración variable pagada en vacaciones (Art. 71)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2109', 'Remuneración variable pagada en clausura (Art. 38 DFL 2)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2110', 'Aguinaldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2111', 'Bonos u otras remuneraciones fijas mensuales', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2112', 'Tratos (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2113', 'Bonos u otras remuneraciones variables mensuales o superiores a un mes', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2114', 'Ejercicio opción no pactada en contrato (Art. 17 N°8 LIR)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2115', 'Beneficios en especie constitutivos de remuneración', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2116', 'Remuneraciones bimestrales (devengo en dos meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2117', 'Remuneraciones trimestrales (devengo en tres meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2118', 'Remuneraciones cuatrimestrales (devengo en cuatro meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2119', 'Remuneraciones semestrales (devengo en seis meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2120', 'Remuneraciones anuales (devengo en doce meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2121', 'Participación anual (devengo en doce meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2122', 'Gratificación anual (devengo en doce meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2123', 'Otras remuneraciones superiores a un mes', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2124', 'Pago por horas de trabajo sindical', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2161', 'Sueldo empresarial', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2201', 'Subsidio por incapacidad laboral por licencia médica - total mensual', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2202', 'Beca de estudio (Art. 17 N°18 LIR)', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2203', 'Gratificaciones de zona (Art. 17 N°27 LIR)', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2204', 'Otros ingresos no constitutivos de renta (Art. 17 N°29 LIR)', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2301', 'Colación total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2302', 'Movilización total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2303', 'Viáticos total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2304', 'Asignación de pérdida de caja total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2305', 'Asignación de desgaste herramientas total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2311', 'Asignación familiar legal total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2306', 'Gastos por causa del trabajo (Art. 41 CdT) y gastos de representación (Art. 42 N°1 LIR)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2307', 'Gastos por cambio de residencia (Art. 53)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2308', 'Sala cuna (Art. 203)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2309', 'Asignación trabajo a distancia o teletrabajo', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2347', 'Depósito convenido hasta UF 900', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2310', 'Alojamiento por razones de trabajo (Art. 17 N°14 LIR)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2312', 'Asignación de traslación (Art. 17 N°15 LIR)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2313', 'Indemnización por feriado legal', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2314', 'Indemnización años de servicio', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2315', 'Indemnización sustitutiva del aviso previo', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2316', 'Indemnización fuero maternal (Art. 163 bis)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2331', 'Indemnización a todo evento (Art. 164)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2417', 'Indemnizaciones voluntarias tributables', 'HABERES', 'HABERES_24XX', 'HABER_NO_IMPONIBLE_TRIBUTABLE', FALSE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2418', 'Indemnizaciones contractuales tributables', 'HABERES', 'HABERES_24XX', 'HABER_NO_IMPONIBLE_TRIBUTABLE', FALSE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3141', 'Cotización obligatoria previsional (AFP o IPS)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3143', 'Cotización obligatoria salud 7%', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3144', 'Cotización voluntaria para salud', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3151', 'Cotización AFC - trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3146', 'Cotizaciones técnico extranjero para seguridad social fuera de Chile', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3147', 'Descuento depósito convenido hasta UF 900 anual', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3155', 'Cotización ahorro previsional voluntario individual modalidad A', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3156', 'Cotización ahorro previsional voluntario individual modalidad B hasta UF 50', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3157', 'Cotización ahorro previsional voluntario colectivo modalidad A', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3158', 'Cotización ahorro previsional voluntario colectivo modalidad B hasta UF 50', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3161', 'Impuesto retenido por remuneraciones', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3162', 'Impuesto retenido por indemnizaciones', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3163', 'Mayor retención de impuesto solicitada por el trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3164', 'Impuesto retenido por reliquidación de remuneraciones devengadas en otros períodos mensuales', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO_INFORMATIVO', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3165', 'Diferencia de impuesto por reliquidación de remuneraciones devengadas en este período', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3166', 'Retención préstamo clase media 2020 (Ley 21.252)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3167', 'Rebaja zona extrema DL 889', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3171', 'Cuota sindical 1', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3172', 'Cuota sindical 2', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3173', 'Cuota sindical 3', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3174', 'Cuota sindical 4', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3175', 'Cuota sindical 5', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3176', 'Cuota sindical 6', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3177', 'Cuota sindical 7', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3178', 'Cuota sindical 8', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3179', 'Cuota sindical 9', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3180', 'Cuota sindical 10', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3110', 'Crédito social CCAF', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3181', 'Cuota vivienda o educación Art. 58', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3182', 'Crédito cooperativas de ahorro (Art. 54 Ley Coop.)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3183', 'Otros descuentos autorizados y solicitados por el trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3154', 'Cotización adicional trabajo pesado - trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3184', 'Donaciones culturales y de reconstrucción', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3185', 'Otros descuentos (Art. 58)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3186', 'Pensiones de alimentos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3187', 'Descuento mujer casada (Art. 59)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3188', 'Descuento por anticipos o préstamos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4151', 'Aporte AFC - empleador', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4152', 'Aporte empleador seguro accidentes del trabajo y Ley SANNA (Ley 16.744)', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4131', 'Aporte empleador indemnización a todo evento (Art. 164)', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4154', 'Aporte adicional trabajo pesado - empleador', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4155', 'Aporte empleador seguro invalidez y sobrevivencia', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4157', 'Aporte empleador ahorro previsional voluntario colectivo', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5201', 'Total haberes', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5210', 'Total haberes imponibles y tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5220', 'Total haberes imponibles y no tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5230', 'Total haberes no imponibles y no tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5240', 'Total haberes no imponibles y tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5301', 'Total descuentos', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5361', 'Total descuentos impuestos a las remuneraciones', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5362', 'Total descuentos impuestos por indemnizaciones', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5341', 'Total descuentos por cotizaciones del trabajador', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5302', 'Total otros descuentos', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5410', 'Total aportes empleador', 'TOTALES', 'TOTALES_54XX', 'TOTAL_APORTES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5501', 'Total líquido', 'TOTALES', 'TOTALES_55XX', 'TOTAL_LIQUIDO', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5502', 'Total indemnizaciones', 'TOTALES', 'TOTALES_55XX', 'TOTAL_INDEMNIZACIONES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5564', 'Total indemnizaciones tributables', 'TOTALES', 'TOTALES_55XX', 'TOTAL_INDEMNIZACIONES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5565', 'Total indemnizaciones no tributables', 'TOTALES', 'TOTALES_55XX', 'TOTAL_INDEMNIZACIONES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.')
ON CONFLICT (codigo_lre) DO UPDATE
SET nombre_lre = EXCLUDED.nombre_lre,
    modulo_lre = EXCLUDED.modulo_lre,
    grupo_lre = EXCLUDED.grupo_lre,
    clasificacion_lre = EXCLUDED.clasificacion_lre,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_liquido = EXCLUDED.afecta_liquido,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = COALESCE(catalogo_lre.vigencia_inicio, EXCLUDED.vigencia_inicio),
    observacion = EXCLUDED.observacion;

-- Mapeos normativos base. Mantener en una sola tabla derivada para evitar
-- bloques UPDATE duplicados y dejar el motivo auditable en SQL.
WITH mapping(codigo_concepto, codigo_lre, criterio) AS (
    VALUES
        ('SUELDO_BASE', '2101', 'Sueldo base -> Sueldo.'),
        ('GRATIFICACION', '2106', 'Gratificación legal mensual -> Gratificación mensual.'),
        ('HORAS_EXTRAS', '2102', 'Horas extras -> Sobresueldo.'),
        ('BONO_RESPONSABILIDAD', '2111', 'Bono fijo mensual de responsabilidad.'),
        ('AGUINALDO', '2110', 'Aguinaldo.'),
        ('COLACION', '2301', 'Colación.'),
        ('MOVILIZACION', '2302', 'Movilización.'),
        ('ASIGNACION_FAMILIAR', '2311', 'Asignación familiar legal.'),
        ('AFP', '3141', 'Cotización obligatoria previsional AFP/IPS.'),
        ('SALUD', '3143', 'Cotización obligatoria salud 7%.'),
        ('CESANTIA', '3151', 'Cotización AFC trabajador.'),
        ('IMPUESTO_RENTA', '3161', 'Impuesto retenido por remuneraciones.'),
        ('PRESTAMO', '3188', 'Préstamo o anticipo.'),
        ('ANTICIPO', '3188', 'Préstamo o anticipo.'),
        ('DESCUENTO_CONVENIO', '3183', 'Descuento autorizado o solicitado por trabajador.'),
        ('PENSION_ALIMENTOS', '3186', 'Pensión de alimentos.'),
        ('AFC_EMPLEADOR', '4151', 'Aporte AFC empleador.'),
        ('SIS_EMPLEADOR', '4155', 'Aporte empleador SIS.')
)
UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM mapping m
JOIN catalogo_lre l ON l.codigo_lre = m.codigo_lre
WHERE c.codigo = m.codigo_concepto;

-- Pendientes explícitos: no limpiar ni forzar todos los conceptos sin decisión.
-- Solo se dejan sin mapeo los conceptos base cuyo código LRE puede inducir error.
WITH pendientes(codigo_concepto, motivo) AS (
    VALUES
        ('INASISTENCIA', 'La ausencia se informa por días/estado operativo del trabajador; no se fuerza a un código LRE de descuento editable.'),
        ('ZONA_EXTREMA', 'No se fuerza mapeo: 3167 corresponde a rebaja DL 889 y 2203 a gratificaciones de zona; requiere decisión normativa según política de empresa.'),
        ('AFP_EMPLEADOR', 'No existe mapeo LRE base equivalente en el suplemento enero 2022 para un aporte AFP empleador genérico; mantener pendiente hasta definir reforma/aporte específico.')
)
UPDATE concepto c
SET id_catalogo_lre = NULL
FROM pendientes p
WHERE c.codigo = p.codigo_concepto;

-- Validación operativa embebida: esta consulta debe retornar 0 filas en base sana
-- para los conceptos que sí tienen mapeo definido en esta fase.
-- SELECT m.codigo_concepto, m.codigo_lre
-- FROM mapping m
-- WHERE NOT EXISTS (
--     SELECT 1
--     FROM concepto c
--     JOIN catalogo_lre l ON l.id_catalogo_lre = c.id_catalogo_lre
--     WHERE c.codigo = m.codigo_concepto
--       AND l.codigo_lre = m.codigo_lre
-- );


-- =============================================================================
-- BLOQUE SINCRONIZADO DESDE partes/25_lre_concept_rules.sql
-- =============================================================================
-- =============================================================================
-- LRE-CONCEPT-RULES-01 - Estrategia LRE para conceptos no directos
--
-- Alcance:
-- - Complementa id_catalogo_lre con una estrategia explicita frente al LRE.
-- - Evita forzar codigos LRE incorrectos para conceptos derivados o ambiguos.
-- - Resuelve INASISTENCIA, ZONA_EXTREMA y AFP_EMPLEADOR como conceptos no directos.
-- - No crea exportador LRE, no recalcula nomina y no cambia formulas legales.
-- =============================================================================
SET search_path = public;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS estrategia_lre VARCHAR(40) NOT NULL DEFAULT 'DIRECTO';

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS requiere_exportacion_lre BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS observacion_normativa_lre TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_concepto_estrategia_lre'
    ) THEN
        ALTER TABLE concepto
            ADD CONSTRAINT chk_concepto_estrategia_lre CHECK (
                estrategia_lre IN (
                    'DIRECTO',
                    'DERIVA_DIAS_TRABAJADOS',
                    'DERIVA_REBAJA_TRIBUTARIA',
                    'DESCOMPONER_CONCEPTO',
                    'PENDIENTE_NORMATIVO',
                    'NO_EXPORTABLE'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_concepto_estrategia_lre
    ON concepto (estrategia_lre);

CREATE INDEX IF NOT EXISTS idx_concepto_requiere_exportacion_lre
    ON concepto (requiere_exportacion_lre);

-- Los conceptos que ya tienen codigo directo quedan como DIRECTO por defecto.
UPDATE concepto
SET
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = NULL
WHERE id_catalogo_lre IS NOT NULL
  AND estrategia_lre IS DISTINCT FROM 'DIRECTO';

-- Concepto interno: la ausencia no se declara como linea LRE directa; deriva datos
-- de dias trabajados/dias ausentes que debera resolver el exportador futuro.
UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'DERIVA_DIAS_TRABAJADOS',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto interno: deriva dias trabajados/dias ausentes para LRE; no se declara como linea de descuento directa.'
WHERE codigo = 'INASISTENCIA';

-- Concepto ambiguo: puede ser gratificacion de zona, rebaja tributaria DL 889 o
-- bono empresa. No se fuerza un codigo unico hasta separar la naturaleza.
UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'DESCOMPONER_CONCEPTO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto ambiguo: separar en gratificacion zona legal, rebaja zona extrema DL 889 o bono zona empresa segun naturaleza.'
WHERE codigo = 'ZONA_EXTREMA';

-- Concepto generico: no representa un aporte LRE final. Debe separarse en SIS,
-- AFC, Ley 16.744/SANNA, trabajo pesado, APVC o reforma previsional empleador.
UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'PENDIENTE_NORMATIVO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto generico de aporte empleador. Separar en SIS, AFC, Ley 16.744/SANNA, trabajo pesado, APVC o reforma previsional segun corresponda.'
WHERE codigo = 'AFP_EMPLEADOR';

-- Nota de diseno:
-- Concepto sin id_catalogo_lre no siempre es error. Es error solo si
-- estrategia_lre = DIRECTO y requiere_exportacion_lre = TRUE.
