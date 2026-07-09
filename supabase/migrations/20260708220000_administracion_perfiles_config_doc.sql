-- ADMIN-01: módulo Administrador — perfiles de acceso y configuración del documento de liquidación.

SET search_path = public;

-- ---------------------------------------------------------------------------
-- Helper: el usuario actual es administrador del sistema (solo app_metadata)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_es_admin_sistema()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT lower(replace(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')), '-', '_'))
    IN ('admin', 'admin_sistema', 'administrador', 'administrator');
$$;

-- ---------------------------------------------------------------------------
-- Tabla: perfiles de acceso por empresa
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfil_acceso (
    id_perfil SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES public.empresa(id_empresa) ON DELETE RESTRICT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    rol_base VARCHAR(40) NOT NULL
        CHECK (rol_base IN (
            'admin_sistema',
            'admin_remuneraciones',
            'operador_remuneraciones',
            'consulta_remuneraciones'
        )),
    -- Permisos finos por módulo: { "empleados": { "ver": true, "editar": true }, ... }.
    -- Vacío = hereda los permisos del rol base.
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_perfil_acceso_empresa_nombre
    ON public.perfil_acceso (id_empresa, lower(nombre));

CREATE INDEX IF NOT EXISTS idx_perfil_acceso_empresa_activo
    ON public.perfil_acceso (id_empresa, activo);

-- Seed: perfiles base equivalentes a los roles actuales, por empresa existente.
INSERT INTO public.perfil_acceso (id_empresa, nombre, descripcion, rol_base)
SELECT e.id_empresa, s.nombre, s.descripcion, s.rol_base
FROM public.empresa e
CROSS JOIN (
    VALUES
        ('Administrador del sistema', 'Acceso total, incluida la administración de usuarios y seguridad.', 'admin_sistema'),
        ('Administrador de remuneraciones', 'Gestión completa de nóminas, cierres y parámetros operativos.', 'admin_remuneraciones'),
        ('Operador de remuneraciones', 'Operación diaria: empleados, movimientos y validaciones.', 'operador_remuneraciones'),
        ('Consulta', 'Solo lectura de la información autorizada.', 'consulta_remuneraciones')
) AS s(nombre, descripcion, rol_base)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.perfil_acceso p
    WHERE p.id_empresa = e.id_empresa
      AND lower(p.nombre) = lower(s.nombre)
);

-- ---------------------------------------------------------------------------
-- Tabla: configuración del documento de liquidación por empresa
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.empresa_config_documento (
    id_empresa INTEGER PRIMARY KEY REFERENCES public.empresa(id_empresa) ON DELETE CASCADE,
    logo_url TEXT,
    mostrar_rut BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_direccion BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_representante BOOLEAN NOT NULL DEFAULT FALSE,
    texto_pie TEXT,
    nombre_firma_empleador TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.perfil_acceso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_config_documento ENABLE ROW LEVEL SECURITY;

CREATE POLICY perfil_acceso_select_empresa ON public.perfil_acceso
    FOR SELECT TO authenticated
    USING (id_empresa = public.current_user_empresa_id());

CREATE POLICY empresa_config_documento_select_empresa ON public.empresa_config_documento
    FOR SELECT TO authenticated
    USING (id_empresa = public.current_user_empresa_id());

-- Escritura solo vía RPC SECURITY DEFINER (sin grants de INSERT/UPDATE directos).
GRANT SELECT ON public.perfil_acceso TO authenticated;
GRANT SELECT ON public.empresa_config_documento TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: listar perfiles de acceso
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listar_perfiles_acceso(p_incluir_inactivos BOOLEAN DEFAULT FALSE)
RETURNS SETOF public.perfil_acceso
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'listar_perfiles_acceso: empresa no identificada' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT p.*
    FROM public.perfil_acceso p
    WHERE p.id_empresa = v_id_empresa
      AND (p_incluir_inactivos OR p.activo)
    ORDER BY p.nombre;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: guardar perfil de acceso (solo admin sistema)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guardar_perfil_acceso(
    p_id_perfil INT DEFAULT NULL,
    p_nombre TEXT DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_rol_base TEXT DEFAULT NULL,
    p_permisos JSONB DEFAULT NULL,
    p_activo BOOLEAN DEFAULT NULL
)
RETURNS public.perfil_acceso
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
    v_row public.perfil_acceso;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'guardar_perfil_acceso: empresa no identificada' USING ERRCODE = '42501';
    END IF;
    IF NOT public.erp_es_admin_sistema() THEN
        RAISE EXCEPTION 'guardar_perfil_acceso: requiere administrador del sistema' USING ERRCODE = '42501';
    END IF;

    IF p_rol_base IS NOT NULL AND p_rol_base NOT IN (
        'admin_sistema', 'admin_remuneraciones', 'operador_remuneraciones', 'consulta_remuneraciones'
    ) THEN
        RAISE EXCEPTION 'guardar_perfil_acceso: rol base no válido' USING ERRCODE = '23514';
    END IF;

    IF p_id_perfil IS NOT NULL THEN
        UPDATE public.perfil_acceso
        SET
            nombre = COALESCE(NULLIF(btrim(p_nombre), ''), nombre),
            descripcion = COALESCE(p_descripcion, descripcion),
            rol_base = COALESCE(p_rol_base, rol_base),
            permisos = COALESCE(p_permisos, permisos),
            activo = COALESCE(p_activo, activo),
            updated_at = NOW()
        WHERE id_perfil = p_id_perfil
          AND id_empresa = v_id_empresa
        RETURNING * INTO v_row;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'guardar_perfil_acceso: perfil no encontrado' USING ERRCODE = 'P0002';
        END IF;
    ELSE
        IF p_nombre IS NULL OR btrim(p_nombre) = '' THEN
            RAISE EXCEPTION 'guardar_perfil_acceso: debe indicar nombre' USING ERRCODE = '23514';
        END IF;
        IF p_rol_base IS NULL THEN
            RAISE EXCEPTION 'guardar_perfil_acceso: debe indicar rol base' USING ERRCODE = '23514';
        END IF;

        INSERT INTO public.perfil_acceso (id_empresa, nombre, descripcion, rol_base, permisos, activo)
        VALUES (
            v_id_empresa,
            btrim(p_nombre),
            p_descripcion,
            p_rol_base,
            COALESCE(p_permisos, '{}'::jsonb),
            COALESCE(p_activo, TRUE)
        )
        RETURNING * INTO v_row;
    END IF;

    RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: perfil de acceso del usuario actual (según id_perfil del JWT)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_perfil_acceso_actual()
RETURNS SETOF public.perfil_acceso
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
    v_id_perfil INTEGER;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RETURN;
    END IF;

    v_id_perfil := NULLIF(auth.jwt() -> 'app_metadata' ->> 'id_perfil', '')::INTEGER;
    IF v_id_perfil IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT p.*
    FROM public.perfil_acceso p
    WHERE p.id_perfil = v_id_perfil
      AND p.id_empresa = v_id_empresa
      AND p.activo;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: configuración del documento de liquidación
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_config_documento_liquidacion()
RETURNS SETOF public.empresa_config_documento
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'obtener_config_documento_liquidacion: empresa no identificada' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT c.*
    FROM public.empresa_config_documento c
    WHERE c.id_empresa = v_id_empresa;
END;
$$;

CREATE OR REPLACE FUNCTION public.guardar_config_documento_liquidacion(
    p_logo_url TEXT DEFAULT NULL,
    p_mostrar_rut BOOLEAN DEFAULT NULL,
    p_mostrar_direccion BOOLEAN DEFAULT NULL,
    p_mostrar_representante BOOLEAN DEFAULT NULL,
    p_texto_pie TEXT DEFAULT NULL,
    p_nombre_firma_empleador TEXT DEFAULT NULL
)
RETURNS public.empresa_config_documento
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
    v_row public.empresa_config_documento;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'guardar_config_documento_liquidacion: empresa no identificada' USING ERRCODE = '42501';
    END IF;
    IF NOT public.erp_es_admin_sistema() THEN
        RAISE EXCEPTION 'guardar_config_documento_liquidacion: requiere administrador del sistema' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.empresa_config_documento (
        id_empresa,
        logo_url,
        mostrar_rut,
        mostrar_direccion,
        mostrar_representante,
        texto_pie,
        nombre_firma_empleador
    ) VALUES (
        v_id_empresa,
        NULLIF(btrim(COALESCE(p_logo_url, '')), ''),
        COALESCE(p_mostrar_rut, TRUE),
        COALESCE(p_mostrar_direccion, TRUE),
        COALESCE(p_mostrar_representante, FALSE),
        NULLIF(btrim(COALESCE(p_texto_pie, '')), ''),
        NULLIF(btrim(COALESCE(p_nombre_firma_empleador, '')), '')
    )
    ON CONFLICT (id_empresa) DO UPDATE
    SET
        logo_url = CASE WHEN p_logo_url IS NULL THEN empresa_config_documento.logo_url
                        ELSE NULLIF(btrim(p_logo_url), '') END,
        mostrar_rut = COALESCE(p_mostrar_rut, empresa_config_documento.mostrar_rut),
        mostrar_direccion = COALESCE(p_mostrar_direccion, empresa_config_documento.mostrar_direccion),
        mostrar_representante = COALESCE(p_mostrar_representante, empresa_config_documento.mostrar_representante),
        texto_pie = CASE WHEN p_texto_pie IS NULL THEN empresa_config_documento.texto_pie
                         ELSE NULLIF(btrim(p_texto_pie), '') END,
        nombre_firma_empleador = CASE WHEN p_nombre_firma_empleador IS NULL THEN empresa_config_documento.nombre_firma_empleador
                                      ELSE NULLIF(btrim(p_nombre_firma_empleador), '') END,
        updated_at = NOW()
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- Storage: bucket público de lectura para logos de empresa
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-empresa', 'logos-empresa', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS logos_empresa_select_public ON storage.objects;
CREATE POLICY logos_empresa_select_public ON storage.objects
    FOR SELECT
    USING (bucket_id = 'logos-empresa');

DROP POLICY IF EXISTS logos_empresa_insert_admin ON storage.objects;
CREATE POLICY logos_empresa_insert_admin ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'logos-empresa'
        AND public.erp_es_admin_sistema()
        AND (storage.foldername(name))[1] = public.current_user_empresa_id()::text
    );

DROP POLICY IF EXISTS logos_empresa_update_admin ON storage.objects;
CREATE POLICY logos_empresa_update_admin ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'logos-empresa'
        AND public.erp_es_admin_sistema()
        AND (storage.foldername(name))[1] = public.current_user_empresa_id()::text
    )
    WITH CHECK (
        bucket_id = 'logos-empresa'
        AND public.erp_es_admin_sistema()
        AND (storage.foldername(name))[1] = public.current_user_empresa_id()::text
    );

DROP POLICY IF EXISTS logos_empresa_delete_admin ON storage.objects;
CREATE POLICY logos_empresa_delete_admin ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'logos-empresa'
        AND public.erp_es_admin_sistema()
        AND (storage.foldername(name))[1] = public.current_user_empresa_id()::text
    );

-- ---------------------------------------------------------------------------
-- Grants de funciones
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.erp_es_admin_sistema() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_perfiles_acceso(BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guardar_perfil_acceso(INT, TEXT, TEXT, TEXT, JSONB, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obtener_perfil_acceso_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obtener_config_documento_liquidacion() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guardar_config_documento_liquidacion(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.erp_es_admin_sistema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_perfiles_acceso(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_perfil_acceso(INT, TEXT, TEXT, TEXT, JSONB, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_perfil_acceso_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_config_documento_liquidacion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_config_documento_liquidacion(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT) TO authenticated;

COMMENT ON TABLE public.perfil_acceso IS
  'ADMIN-01: perfiles de acceso configurables por empresa. rol_base alimenta guards/RLS existentes; permisos jsonb afina por módulo.';
COMMENT ON TABLE public.empresa_config_documento IS
  'ADMIN-01: configuración visual del documento de liquidación (logo, datos de empresa visibles y textos de pie).';
