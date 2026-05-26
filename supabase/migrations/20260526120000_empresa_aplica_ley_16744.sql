-- Agrega boolean aplica_ley_16744 en empresa (mutual por empresa, sin historial).

set search_path = public;

alter table if exists public.empresa
  add column if not exists aplica_ley_16744 boolean not null default false;

update public.empresa e
set aplica_ley_16744 = true
where
  e.id_organismo_administrador_ley_16744 is not null
  or e.tasa_adicional_diferenciada is not null
  or e.vigencia_inicio is not null;
