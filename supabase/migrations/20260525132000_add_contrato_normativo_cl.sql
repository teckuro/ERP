-- v11 parte 28: exclusion jornada y datos casa particular en contrato
alter table public.contrato
  add column if not exists excluido_limite_jornada boolean not null default false,
  add column if not exists causal_exclusion_jornada text,
  add column if not exists justificacion_exclusion_jornada text,
  add column if not exists casa_particular_modalidad text,
  add column if not exists casa_particular_labores text,
  add column if not exists casa_particular_domicilio_especifico text,
  add column if not exists casa_particular_asistencia_cuidado boolean not null default false,
  add column if not exists casa_particular_registro_dt_estado text,
  add column if not exists casa_particular_registro_dt_fecha date,
  add column if not exists casa_particular_registro_dt_folio text;

alter table public.contrato
  drop constraint if exists chk_contrato_exclusion_jornada_causal;

alter table public.contrato
  add constraint chk_contrato_exclusion_jornada_causal
    check (
      causal_exclusion_jornada is null
      or causal_exclusion_jornada in (
        'ALTA_RESPONSABILIDAD',
        'SIN_FISCALIZACION_SUPERIOR_INMEDIATA'
      )
    );

alter table public.contrato
  drop constraint if exists chk_contrato_exclusion_jornada_datos;

alter table public.contrato
  drop constraint if exists chk_contrato_casa_particular_modalidad;

alter table public.contrato
  add constraint chk_contrato_casa_particular_modalidad
    check (
      casa_particular_modalidad is null
      or casa_particular_modalidad in ('PUERTAS_AFUERA', 'PUERTAS_ADENTRO')
    );

alter table public.contrato
  drop constraint if exists chk_contrato_casa_particular_registro_dt_estado;

alter table public.contrato
  add constraint chk_contrato_casa_particular_registro_dt_estado
    check (
      casa_particular_registro_dt_estado is null
      or casa_particular_registro_dt_estado in ('PENDIENTE', 'REGISTRADO', 'NO_APLICA')
    );

alter table public.contrato
  drop constraint if exists chk_contrato_casa_particular_registro_dt_datos;

comment on column public.contrato.excluido_limite_jornada is
  'Marca contratos dependientes excluidos del limite de jornada ordinaria, por ejemplo art. 22.';
comment on column public.contrato.causal_exclusion_jornada is
  'Causal operacional para exclusion de limite de jornada: ALTA_RESPONSABILIDAD o SIN_FISCALIZACION_SUPERIOR_INMEDIATA.';
comment on column public.contrato.justificacion_exclusion_jornada is
  'Justificacion contractual/documental de la exclusion de limite de jornada.';
comment on column public.contrato.casa_particular_modalidad is
  'Modalidad de contrato de trabajador de casa particular: PUERTAS_AFUERA o PUERTAS_ADENTRO.';
comment on column public.contrato.casa_particular_labores is
  'Labores especificas pactadas para contrato de casa particular.';
comment on column public.contrato.casa_particular_domicilio_especifico is
  'Domicilio contractual especifico donde se prestan labores de casa particular.';
comment on column public.contrato.casa_particular_asistencia_cuidado is
  'Indica si las labores incluyen asistencia o cuidado de personas.';
comment on column public.contrato.casa_particular_registro_dt_estado is
  'Estado administrativo del registro DT del contrato de casa particular.';
comment on column public.contrato.casa_particular_registro_dt_fecha is
  'Fecha de registro DT del contrato de casa particular cuando esta registrado.';
comment on column public.contrato.casa_particular_registro_dt_folio is
  'Folio o comprobante del registro DT del contrato de casa particular.';
