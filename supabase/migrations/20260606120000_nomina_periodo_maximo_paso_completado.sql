set search_path = public;

-- =============================================================================
-- nomina_periodo: maximo_paso_completado + maximo_paso_completado_at
-- =============================================================================
--
-- Acompaña a `ultimo_paso_visitado` (introducido en
-- 20260605130000_nomina_periodo_paso_visitado.sql).
--
-- Diferencia clave:
--  - `ultimo_paso_visitado` refleja DÓNDE está visualmente el usuario en el
--    Generador. Cambia con cada click; puede ir hacia atrás.
--  - `maximo_paso_completado` refleja CUÁNTO ha avanzado realmente — el paso
--    más alto que el usuario completó según el criterio UI ("poblado
--    correctamente"). Es MONÓTONO CRECIENTE: nunca retrocede por sí solo.
--    Es lo que muestra la bandeja del Administrador como "Avance: X" y lo
--    que el container usa para bloquear el stepper hacia adelante.
--
-- IMPORTANTE: no participa de la máquina de estados. Pueden ser nulos.
-- =============================================================================

alter table public.nomina_periodo
  add column if not exists maximo_paso_completado text null
    check (maximo_paso_completado is null or maximo_paso_completado in (
      'parameters', 'dotacion', 'movements', 'calculation', 'validation', 'closure'
    )),
  add column if not exists maximo_paso_completado_at timestamptz null;

comment on column public.nomina_periodo.maximo_paso_completado is
  'Metadata UX: máximo paso del Generador que el usuario completó (criterio UI: paso poblado correctamente). Monótono creciente — no participa de la máquina de estados. Se actualiza vía RPC actualizar_maximo_paso_completado_nomina.';

comment on column public.nomina_periodo.maximo_paso_completado_at is
  'Timestamp de la última actualización de maximo_paso_completado. Auxiliar para auditoría/ordenamiento por progreso real.';

-- RPC monótona dedicada: comparamos posiciones en el orden canónico de pasos
-- y SOLO escribimos si el nuevo paso avanza. Si el actual es nulo o el nuevo
-- es estrictamente mayor, guardamos. Si el nuevo es igual o menor, devolvemos
-- la fila sin tocar — no es un error, es un no-op idempotente.
--
-- NO toca updated_at (igual que actualizar_paso_visitado_nomina): el orden
-- por "Actualizada" debe seguir reflejando cambios productivos, no progreso
-- humano por pasos.
create or replace function public.actualizar_maximo_paso_completado_nomina(
  p_nomina_id uuid,
  p_paso text
)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_orden text[] := array['parameters', 'dotacion', 'movements', 'calculation', 'validation', 'closure'];
  v_actual public.nomina_periodo;
  v_indice_nuevo int;
  v_indice_actual int;
begin
  if p_paso is null or p_paso not in (
    'parameters', 'dotacion', 'movements', 'calculation', 'validation', 'closure'
  ) then
    raise exception 'Paso completado inválido: %', p_paso;
  end if;

  select * into v_actual
  from public.nomina_periodo
  where id = p_nomina_id;

  if not found then
    raise exception 'Nómina no encontrada';
  end if;

  v_indice_nuevo := array_position(v_orden, p_paso);
  v_indice_actual := case
    when v_actual.maximo_paso_completado is null then 0
    else array_position(v_orden, v_actual.maximo_paso_completado)
  end;

  -- No-op si no avanza: la fila vuelve tal cual.
  if v_actual.maximo_paso_completado is not null
     and v_indice_nuevo <= v_indice_actual then
    return v_actual;
  end if;

  update public.nomina_periodo
  set
    maximo_paso_completado = p_paso,
    maximo_paso_completado_at = now()
  where id = p_nomina_id
  returning * into v_actual;

  return v_actual;
end;
$$;
