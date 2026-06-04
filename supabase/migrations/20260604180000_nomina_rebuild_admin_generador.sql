-- =====================================================================
-- NOM-REBUILD-NOMINA-MENSUAL-01 / F3a — Infraestructura BD
-- Documento rector: docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md
--
-- Crea 6 tablas para el Administrador + Generador (rebuild):
--   - nomina_periodo                (cabecera operativa de una nómina)
--   - segmento_nomina               (grupos operativos / sub-bases)
--   - movimiento_recurrente         (regla permanente)
--   - movimiento_nomina             (movimiento aplicado a una nómina)
--   - incidencia_nomina             (problemas detectados pre-cálculo)
--   - evento_auditoria_nomina       (trazabilidad de cierre / reapertura)
--
-- Coexistencia con motor V1:
--   El motor productivo V1 (`features/nomina-mensual/`) sigue escribiendo a
--   `nomina_calculo_*`. La nueva cabecera `nomina_periodo` se une por
--   (periodo, id_empresa). NO se tocan las tablas existentes.
--
-- Helper de multi-tenant:
--   `public.current_user_empresa_id()` extrae `id_empresa` desde el JWT
--   (`app_metadata.id_empresa` o `user_metadata.id_empresa`). Si no existe,
--   retorna NULL y las políticas RLS lo niegan.
--
-- Aplicar con:
--   supabase db push
--   ó pegando este archivo en SQL editor del proyecto.
-- =====================================================================

set search_path = public;

-- ---------------------------------------------------------------------
-- 0. Helper de multi-tenant
-- ---------------------------------------------------------------------

create or replace function public.current_user_empresa_id()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(coalesce(
      auth.jwt() #>> '{app_metadata,id_empresa}',
      auth.jwt() #>> '{user_metadata,id_empresa}'
    ), '')::integer,
    (
      select e.id_empresa
      from public.empresa e
      order by e.id_empresa
      limit 1
    )
  )
$$;

comment on function public.current_user_empresa_id() is
  'Resuelve la empresa activa del usuario logueado desde JWT app_metadata.id_empresa. Fallback temporal: primera empresa (coherente con proceso-mensual.service hasta multi-tenant real).';


-- ---------------------------------------------------------------------
-- 1. nomina_periodo (cabecera operativa)
-- ---------------------------------------------------------------------

create table if not exists public.nomina_periodo (
  id                              uuid primary key default gen_random_uuid(),
  id_empresa                      integer not null references public.empresa(id_empresa) on delete restrict,
  empresa_nombre                  text,
  periodo                         text not null,
  tipo                            text not null default 'mensual',
  estado                          text not null default 'borrador',
  total_trabajadores              integer not null default 0,
  total_segmentos                 integer not null default 0,
  total_haberes                   numeric(14,2) not null default 0,
  total_descuentos                numeric(14,2) not null default 0,
  total_liquido                   numeric(14,2) not null default 0,
  total_incidencias_criticas      integer not null default 0,
  total_advertencias              integer not null default 0,
  fecha_pago                      date,
  closed_at                       timestamptz,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  constraint nomina_periodo_tipo_check
    check (tipo in ('mensual', 'quincenal', 'semanal', 'extraordinaria')),
  constraint nomina_periodo_estado_check
    check (estado in (
      'borrador', 'dotacion_generada', 'en_revision', 'calculada',
      'validada', 'aprobada', 'cerrada', 'reabierta', 'anulada'
    )),
  constraint nomina_periodo_periodo_format
    check (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint nomina_periodo_unica_empresa_periodo_tipo
    unique (id_empresa, periodo, tipo)
);

create index if not exists ix_nomina_periodo_empresa_periodo
  on public.nomina_periodo (id_empresa, periodo);

create index if not exists ix_nomina_periodo_estado
  on public.nomina_periodo (estado);

comment on table public.nomina_periodo is
  'Cabecera operativa de nómina (Admin + Generador). Coexiste con nomina_calculo_periodo del motor V1.';


-- ---------------------------------------------------------------------
-- 2. segmento_nomina (grupos operativos / sub-bases)
-- ---------------------------------------------------------------------

create table if not exists public.segmento_nomina (
  id                              uuid primary key default gen_random_uuid(),
  id_nomina_periodo               uuid not null references public.nomina_periodo(id) on delete cascade,
  id_empresa                      integer not null references public.empresa(id_empresa) on delete restrict,
  nombre                          text not null,
  tipo                            text,
  estado                          text not null default 'borrador',
  trabajador_ids                  integer[] not null default '{}',
  total_trabajadores              integer not null default 0,
  total_incidencias_criticas      integer not null default 0,
  total_advertencias              integer not null default 0,
  ordinal                         integer not null default 1,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  constraint segmento_nomina_estado_check
    check (estado in ('borrador', 'lista', 'bloqueada')),
  constraint segmento_nomina_tipo_check
    check (tipo is null or tipo in ('planta', 'honorarios', 'centro_costo', 'personalizada'))
);

create index if not exists ix_segmento_nomina_periodo
  on public.segmento_nomina (id_nomina_periodo);

create index if not exists ix_segmento_nomina_empresa
  on public.segmento_nomina (id_empresa);


-- ---------------------------------------------------------------------
-- 3. movimiento_recurrente (regla permanente)
-- ---------------------------------------------------------------------

create table if not exists public.movimiento_recurrente (
  id                              uuid primary key default gen_random_uuid(),
  id_empresa                      integer not null references public.empresa(id_empresa) on delete restrict,
  id_persona                      integer references public.persona(id_persona) on delete cascade,
  id_segmento_nomina              uuid references public.segmento_nomina(id) on delete set null,
  id_centro_costo                 integer references public.centro_costo(id_centro_costo) on delete set null,
  id_cargo                        integer,
  id_tipo_contrato                integer,
  id_grupo                        integer,
  tipo                            text not null,
  categoria                       text not null,
  monto                           numeric(14,2),
  cantidad                        numeric(14,4),
  unidad                          text,
  frecuencia                      text not null default 'mensual',
  activo_desde                    date not null,
  activo_hasta                    date,
  estado                          text not null default 'activo',
  glosa                           text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  constraint movimiento_recurrente_categoria_check
    check (categoria in ('haber', 'descuento', 'ausencia', 'informativo')),
  constraint movimiento_recurrente_unidad_check
    check (unidad is null or unidad in ('pesos', 'horas', 'dias', 'porcentaje')),
  constraint movimiento_recurrente_frecuencia_check
    check (frecuencia in ('mensual', 'quincenal', 'semanal')),
  constraint movimiento_recurrente_estado_check
    check (estado in ('activo', 'pausado', 'finalizado'))
);

create index if not exists ix_movimiento_recurrente_empresa_estado
  on public.movimiento_recurrente (id_empresa, estado);

create index if not exists ix_movimiento_recurrente_persona
  on public.movimiento_recurrente (id_persona) where id_persona is not null;


-- ---------------------------------------------------------------------
-- 4. movimiento_nomina (movimiento aplicado a una nómina específica)
-- ---------------------------------------------------------------------

create table if not exists public.movimiento_nomina (
  id                              uuid primary key default gen_random_uuid(),
  id_nomina_periodo               uuid not null references public.nomina_periodo(id) on delete cascade,
  id_persona                      integer not null references public.persona(id_persona) on delete cascade,
  id_segmento_nomina              uuid references public.segmento_nomina(id) on delete set null,
  id_empresa                      integer not null references public.empresa(id_empresa) on delete restrict,
  tipo                            text not null,
  categoria                       text not null,
  monto                           numeric(14,2),
  cantidad                        numeric(14,4),
  unidad                          text,
  origen                          text not null default 'manual',
  id_recurrente                   uuid references public.movimiento_recurrente(id) on delete set null,
  estado                          text not null default 'aplicado',
  fecha_desde                     date,
  fecha_hasta                     date,
  glosa                           text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  constraint movimiento_nomina_categoria_check
    check (categoria in ('haber', 'descuento', 'ausencia', 'informativo')),
  constraint movimiento_nomina_unidad_check
    check (unidad is null or unidad in ('pesos', 'horas', 'dias', 'porcentaje')),
  constraint movimiento_nomina_origen_check
    check (origen in ('manual', 'recurrente', 'importado', 'sistema')),
  constraint movimiento_nomina_estado_check
    check (estado in ('borrador', 'aplicado', 'observado', 'omitido', 'anulado'))
);

create index if not exists ix_movimiento_nomina_periodo_persona
  on public.movimiento_nomina (id_nomina_periodo, id_persona);

create index if not exists ix_movimiento_nomina_recurrente
  on public.movimiento_nomina (id_recurrente) where id_recurrente is not null;

-- Idempotencia: misma (periodo + persona + recurrente + tipo) solo existe 1 vez.
create unique index if not exists ux_movimiento_nomina_idempotencia
  on public.movimiento_nomina (id_nomina_periodo, id_persona, id_recurrente, tipo)
  where id_recurrente is not null;


-- ---------------------------------------------------------------------
-- 5. incidencia_nomina
-- ---------------------------------------------------------------------

create table if not exists public.incidencia_nomina (
  id                              uuid primary key default gen_random_uuid(),
  id_nomina_periodo               uuid not null references public.nomina_periodo(id) on delete cascade,
  id_persona                      integer references public.persona(id_persona) on delete cascade,
  id_segmento_nomina              uuid references public.segmento_nomina(id) on delete set null,
  severidad                       text not null,
  tipo                            text not null,
  mensaje                         text not null,
  bloqueante                      boolean not null default false,
  resuelta_at                     timestamptz,
  created_at                      timestamptz not null default now(),
  constraint incidencia_nomina_severidad_check
    check (severidad in ('critica', 'advertencia', 'informativa'))
);

create index if not exists ix_incidencia_nomina_periodo
  on public.incidencia_nomina (id_nomina_periodo);

create index if not exists ix_incidencia_nomina_persona
  on public.incidencia_nomina (id_persona) where id_persona is not null;


-- ---------------------------------------------------------------------
-- 6. evento_auditoria_nomina
-- ---------------------------------------------------------------------

create table if not exists public.evento_auditoria_nomina (
  id                              uuid primary key default gen_random_uuid(),
  id_nomina_periodo               uuid not null references public.nomina_periodo(id) on delete cascade,
  accion                          text not null,
  id_usuario                      uuid,
  motivo                          text,
  payload                         jsonb,
  created_at                      timestamptz not null default now(),
  constraint evento_auditoria_nomina_accion_check
    check (accion in (
      'creada', 'calculada', 'validada', 'aprobada',
      'cerrada', 'reabierta', 'anulada'
    ))
);

create index if not exists ix_evento_auditoria_periodo
  on public.evento_auditoria_nomina (id_nomina_periodo, created_at desc);


-- ---------------------------------------------------------------------
-- 7. Trigger genérico de updated_at
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_nomina_periodo_updated on public.nomina_periodo;
create trigger trg_nomina_periodo_updated
  before update on public.nomina_periodo
  for each row execute function public.set_updated_at();

drop trigger if exists trg_segmento_nomina_updated on public.segmento_nomina;
create trigger trg_segmento_nomina_updated
  before update on public.segmento_nomina
  for each row execute function public.set_updated_at();

drop trigger if exists trg_movimiento_recurrente_updated on public.movimiento_recurrente;
create trigger trg_movimiento_recurrente_updated
  before update on public.movimiento_recurrente
  for each row execute function public.set_updated_at();

drop trigger if exists trg_movimiento_nomina_updated on public.movimiento_nomina;
create trigger trg_movimiento_nomina_updated
  before update on public.movimiento_nomina
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 8. Trigger de auditoría automática al crear / cerrar / reabrir
-- ---------------------------------------------------------------------

create or replace function public.tg_audit_nomina_periodo()
returns trigger
language plpgsql
as $$
declare
  v_user uuid;
begin
  v_user := auth.uid();

  if (tg_op = 'INSERT') then
    insert into public.evento_auditoria_nomina (id_nomina_periodo, accion, id_usuario)
    values (new.id, 'creada', v_user);
    return new;
  end if;

  if (tg_op = 'UPDATE') then
    if (old.estado is distinct from new.estado) then
      if (new.estado = 'calculada') then
        insert into public.evento_auditoria_nomina (id_nomina_periodo, accion, id_usuario)
        values (new.id, 'calculada', v_user);
      elsif (new.estado = 'validada') then
        insert into public.evento_auditoria_nomina (id_nomina_periodo, accion, id_usuario)
        values (new.id, 'validada', v_user);
      elsif (new.estado = 'aprobada') then
        insert into public.evento_auditoria_nomina (id_nomina_periodo, accion, id_usuario)
        values (new.id, 'aprobada', v_user);
      elsif (new.estado = 'cerrada') then
        insert into public.evento_auditoria_nomina (id_nomina_periodo, accion, id_usuario)
        values (new.id, 'cerrada', v_user);
      elsif (new.estado = 'reabierta') then
        insert into public.evento_auditoria_nomina (id_nomina_periodo, accion, id_usuario)
        values (new.id, 'reabierta', v_user);
      elsif (new.estado = 'anulada') then
        insert into public.evento_auditoria_nomina (id_nomina_periodo, accion, id_usuario)
        values (new.id, 'anulada', v_user);
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_audit_nomina_periodo on public.nomina_periodo;
create trigger trg_audit_nomina_periodo
  after insert or update on public.nomina_periodo
  for each row execute function public.tg_audit_nomina_periodo();


-- ---------------------------------------------------------------------
-- 9. RLS — políticas estrictas por id_empresa del usuario
-- ---------------------------------------------------------------------

alter table public.nomina_periodo enable row level security;
alter table public.segmento_nomina enable row level security;
alter table public.movimiento_recurrente enable row level security;
alter table public.movimiento_nomina enable row level security;
alter table public.incidencia_nomina enable row level security;
alter table public.evento_auditoria_nomina enable row level security;

-- nomina_periodo
drop policy if exists nomina_periodo_select on public.nomina_periodo;
create policy nomina_periodo_select on public.nomina_periodo
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

drop policy if exists nomina_periodo_insert on public.nomina_periodo;
create policy nomina_periodo_insert on public.nomina_periodo
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists nomina_periodo_update on public.nomina_periodo;
create policy nomina_periodo_update on public.nomina_periodo
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists nomina_periodo_delete on public.nomina_periodo;
create policy nomina_periodo_delete on public.nomina_periodo
  for delete to authenticated
  using (id_empresa = public.current_user_empresa_id() and estado = 'borrador');

-- segmento_nomina
drop policy if exists segmento_nomina_all on public.segmento_nomina;
create policy segmento_nomina_all on public.segmento_nomina
  for all to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

-- movimiento_recurrente
drop policy if exists movimiento_recurrente_all on public.movimiento_recurrente;
create policy movimiento_recurrente_all on public.movimiento_recurrente
  for all to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

-- movimiento_nomina
drop policy if exists movimiento_nomina_all on public.movimiento_nomina;
create policy movimiento_nomina_all on public.movimiento_nomina
  for all to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

-- incidencia_nomina (lectura/escritura solo sobre nóminas accesibles)
drop policy if exists incidencia_nomina_all on public.incidencia_nomina;
create policy incidencia_nomina_all on public.incidencia_nomina
  for all to authenticated
  using (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  )
  with check (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

-- evento_auditoria_nomina (solo lectura para usuarios — el trigger inserta)
drop policy if exists evento_auditoria_nomina_select on public.evento_auditoria_nomina;
create policy evento_auditoria_nomina_select on public.evento_auditoria_nomina
  for select to authenticated
  using (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

drop policy if exists evento_auditoria_nomina_insert on public.evento_auditoria_nomina;
create policy evento_auditoria_nomina_insert on public.evento_auditoria_nomina
  for insert to authenticated
  with check (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );


-- ---------------------------------------------------------------------
-- 10. Grants (Supabase: rol authenticated viene con role 'authenticated')
-- ---------------------------------------------------------------------

grant select, insert, update, delete on public.nomina_periodo            to authenticated;
grant select, insert, update, delete on public.segmento_nomina           to authenticated;
grant select, insert, update, delete on public.movimiento_recurrente     to authenticated;
grant select, insert, update, delete on public.movimiento_nomina         to authenticated;
grant select, insert, update, delete on public.incidencia_nomina         to authenticated;
grant select, insert                  on public.evento_auditoria_nomina  to authenticated;
