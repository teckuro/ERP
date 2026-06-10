-- Fuerza recarga del schema cache de PostgREST.
-- Se ejecuta como migración no-op estructural tras las DDL del 2026-06-10
-- (`20260610170000_nomina_periodo_delete_policy_estados_eliminables.sql`
-- y `20260610180000_eliminar_nomina_completa_rpc.sql`) por si el cache
-- quedó inconsistente y empezó a devolver PGRST200 ("Could not find a
-- relationship between …") en embeds que ya existían (por ejemplo
-- `contrato_centro_costo?select=centro_costo(nombre)`).
--
-- NOTIFY es idempotente y barato: solo envía la señal a PostgREST. No
-- modifica el esquema. Puede re-ejecutarse sin efectos secundarios.

notify pgrst, 'reload schema';
