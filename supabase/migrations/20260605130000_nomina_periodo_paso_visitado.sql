set search_path = public;

-- =============================================================================
-- nomina_periodo: ultimo_paso_visitado + paso_visitado_at
-- =============================================================================
--
-- Metadata UX para que el Generador rehidrate el paso en el que estaba el
-- usuario y la bandeja del Administrador muestre "En curso: X" sin tener que
-- inferirlo del estado de la nómina.
--
-- IMPORTANTE: estos campos NO participan de la máquina de estados ni de la
-- evidencia productiva del cálculo. Pueden ser nulos. Sobrescribirlos no
-- requiere transición.
-- =============================================================================

alter table public.nomina_periodo
  add column if not exists ultimo_paso_visitado text null
    check (ultimo_paso_visitado is null or ultimo_paso_visitado in (
      'parameters', 'dotacion', 'movements', 'calculation', 'validation', 'closure'
    )),
  add column if not exists paso_visitado_at timestamptz null;

comment on column public.nomina_periodo.ultimo_paso_visitado is
  'Metadata UX: último paso del Generador visitado por el usuario. No es parte de la máquina de estados; se actualiza vía RPC actualizar_paso_visitado_nomina.';

comment on column public.nomina_periodo.paso_visitado_at is
  'Timestamp de la última actualización de ultimo_paso_visitado. Auxiliar para auditoría/ordenamiento por progreso humano.';

-- RPC dedicada: NO toca updated_at para no contaminar el orden por
-- "Actualizada" (esa columna debe seguir reflejando cambios de negocio, no
-- navegación interna). Se ejecuta como security invoker: si la RLS de
-- nomina_periodo deja al usuario actualizar la fila, la RPC lo permite.
-- Si más adelante la RLS se endurece, este RPC se ajusta sin tocar la columna.
create or replace function public.actualizar_paso_visitado_nomina(
  p_nomina_id uuid,
  p_paso text
)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actual public.nomina_periodo;
begin
  if p_paso is null or p_paso not in (
    'parameters', 'dotacion', 'movements', 'calculation', 'validation', 'closure'
  ) then
    raise exception 'Paso visitado inválido: %', p_paso;
  end if;

  update public.nomina_periodo
  set
    ultimo_paso_visitado = p_paso,
    paso_visitado_at = now()
  where id = p_nomina_id
  returning * into v_actual;

  if not found then
    raise exception 'Nómina no encontrada';
  end if;

  return v_actual;
end;
$$;
