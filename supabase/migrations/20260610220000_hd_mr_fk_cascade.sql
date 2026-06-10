-- =============================================================================
-- 20260610220000_hd_mr_fk_cascade.sql
--
-- Contexto:
--   La FK `movimiento_recurrente.id_haberdescuento_origen → haberdescuento_persona`
--   se creó originalmente con `ON DELETE SET NULL` (migración 200000).
--   Eso provoca que al borrar una fila en HD:
--     1. PostgreSQL primero setea `id_haberdescuento_origen = NULL` en MR
--        (cascada de la FK).
--     2. Luego el trigger AFTER DELETE corre y busca
--        `id_haberdescuento_origen = OLD.id_asignacion` → no encuentra fila
--        → no borra nada.
--     3. Resultado: MR queda huérfano sin traza del origen.
--
--   Test E2E (test-trigger-hd-mr.mjs) lo evidenció:
--     INSERT HD → MR creado ✓
--     UPDATE HD → MR actualizado ✓
--     DELETE HD → MR queda con id_haberdescuento_origen=NULL ✗
--
-- Solución:
--   Cambiar la FK a `ON DELETE CASCADE`. PostgreSQL borrará MR automáticamente
--   cuando se borre HD. El handler DELETE del trigger queda redundante, pero
--   se conserva por defensa-en-profundidad (no estorba y mejora claridad).
-- =============================================================================

set search_path = public;

alter table public.movimiento_recurrente
  drop constraint if exists movimiento_recurrente_id_haberdescuento_origen_fkey;

alter table public.movimiento_recurrente
  add constraint movimiento_recurrente_id_haberdescuento_origen_fkey
  foreign key (id_haberdescuento_origen)
  references public.haberdescuento_persona (id_asignacion)
  on delete cascade;

notify pgrst, 'reload schema';
