-- Extiende empresa con mínimo operativo + 16.744 (sin historial) y migra desde empresa_ley_16744.
-- Nota: esta migración asume una sola empresa operativa o uso por id_empresa.

set search_path = public;

-- 1) Columnas mínimas operativas en empresa
alter table if exists public.empresa
  add column if not exists nombre_fantasia text,
  add column if not exists giro text,
  add column if not exists actividad_economica text,
  add column if not exists representante_legal_nombre text,
  add column if not exists representante_legal_rut text,
  add column if not exists representante_legal_dv text,
  add column if not exists representante_legal_email text,
  add column if not exists representante_legal_telefono text,
  add column if not exists email_contacto text,
  add column if not exists telefono_contacto text,
  add column if not exists direccion_linea_1 text,
  add column if not exists direccion_linea_2 text,
  add column if not exists comuna text,
  add column if not exists ciudad text,
  add column if not exists region text,
  add column if not exists codigo_postal text,
  add column if not exists id_organismo_administrador_ley_16744 int,
  add column if not exists tasa_adicional_diferenciada numeric,
  add column if not exists fuente_resolucion_o_certificado text,
  add column if not exists vigencia_inicio date,
  add column if not exists vigencia_fin date,
  add column if not exists updated_at timestamptz not null default now();

-- 2) FK (si no existe ya)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'empresa_id_organismo_administrador_ley_16744_fkey'
  ) then
    alter table public.empresa
      add constraint empresa_id_organismo_administrador_ley_16744_fkey
      foreign key (id_organismo_administrador_ley_16744)
      references public.organismo_administrador_ley_16744(id_organismo_administrador_ley_16744);
  end if;
end $$;

-- 3) Migración desde tabla legacy empresa_ley_16744 (tomar vigente preferente, o última vigencia)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'empresa_ley_16744'
  ) then
    with ranked as (
      select
        el.id_empresa,
        el.id_organismo_administrador_ley_16744,
        el.tasa_adicional_diferenciada,
        el.actividad_economica,
        el.fuente_resolucion_o_certificado,
        el.vigencia_inicio,
        el.vigencia_fin,
        row_number() over (
          partition by el.id_empresa
          order by (el.vigencia_fin is null) desc, el.vigencia_inicio desc
        ) as rn
      from public.empresa_ley_16744 el
    )
    update public.empresa e
      set
        id_organismo_administrador_ley_16744 = r.id_organismo_administrador_ley_16744,
        tasa_adicional_diferenciada = r.tasa_adicional_diferenciada,
        actividad_economica = coalesce(e.actividad_economica, r.actividad_economica),
        fuente_resolucion_o_certificado = r.fuente_resolucion_o_certificado,
        vigencia_inicio = r.vigencia_inicio,
        vigencia_fin = r.vigencia_fin,
        updated_at = now()
    from ranked r
    where e.id_empresa = r.id_empresa
      and r.rn = 1;

    -- 4) Retirar tabla legacy
    drop table public.empresa_ley_16744;
  end if;
end $$;

