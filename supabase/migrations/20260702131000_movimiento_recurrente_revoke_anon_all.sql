-- BKL-04 fix: la migración 20260702130000 revocó solo DML; el GRANT ALL por
-- defecto de Supabase dejaba a anon con REFERENCES/TRIGGER/TRUNCATE.
set search_path = public;

revoke all on public.movimiento_recurrente from anon;

notify pgrst, 'reload schema';
