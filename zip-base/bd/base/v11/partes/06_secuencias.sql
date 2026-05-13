-- ============================================================
-- AJUSTE DE SECUENCIAS
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

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
