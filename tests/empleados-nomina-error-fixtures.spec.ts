import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { isE2eEmpleadosNominaFixturesEnabled } from './helpers/e2e-env';

type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type CatalogosEmpleadosFixture = {
  idEmpresa: number;
  idSucursal: number;
  idDepartamento: number;
  idCentroCosto: number;
  idTipoTrabajador: number;
  idTipoJornada: number;
  idMoneda: number;
  idBanco: number;
  idTipoCuenta: number;
  idRegimenAfp: number;
  idPais: number;
  idAfp: number;
  idSalud: number;
};

type EmpleadoFixture = {
  rut: string;
  dv: string;
  nombres: string;
  apellidoPaterno: string;
  sexo: 'M' | 'F';
  fechaNacimiento: string;
  cargo: string;
  apto: boolean;
  sueldoBase: number;
  horasSemanales: number;
  sinPrevision?: boolean;
  sinSalud?: boolean;
};

const RUN_FIXTURES =
  isE2eEmpleadosNominaFixturesEnabled() &&
  Boolean(process.env['E2E_SUPABASE_AUTH_EMAIL']) &&
  Boolean(process.env['E2E_SUPABASE_AUTH_PASSWORD']);

const describeFixtures = RUN_FIXTURES ? test.describe : test.describe.skip;
const FECHA_INICIO = '2024-05-01';
const FIXTURES: EmpleadoFixture[] = [
  {
    rut: '24050001',
    dv: '9',
    nombres: 'NOMERR2405 Valido',
    apellidoPaterno: 'Calculo',
    sexo: 'M',
    fechaNacimiento: '1990-05-10',
    cargo: 'QA Nomina trabajador valido',
    apto: true,
    sueldoBase: 900000,
    horasSemanales: 44,
  },
  {
    rut: '24050002',
    dv: '7',
    nombres: 'NOMERR2405 No Apto',
    apellidoPaterno: 'Ficha',
    sexo: 'F',
    fechaNacimiento: '1988-02-12',
    cargo: 'QA Nomina ficha incompleta',
    apto: false,
    sueldoBase: 900000,
    horasSemanales: 44,
  },
  {
    rut: '24050003',
    dv: '5',
    nombres: 'NOMERR2405 Sueldo Bajo',
    apellidoPaterno: 'IMM',
    sexo: 'M',
    fechaNacimiento: '1992-08-03',
    cargo: 'QA Nomina sueldo bajo IMM',
    apto: true,
    sueldoBase: 300000,
    horasSemanales: 44,
  },
  {
    rut: '24050004',
    dv: '3',
    nombres: 'NOMERR2405 Jornada Alta',
    apellidoPaterno: 'Legal',
    sexo: 'F',
    fechaNacimiento: '1991-11-21',
    cargo: 'QA Nomina jornada sobre maximo',
    apto: true,
    sueldoBase: 850000,
    horasSemanales: 45,
  },
  {
    rut: '24050005',
    dv: '1',
    nombres: 'NOMERR2405 Sin Prevision',
    apellidoPaterno: 'Salud',
    sexo: 'M',
    fechaNacimiento: '1985-04-18',
    cargo: 'QA Nomina sin prevision salud',
    apto: true,
    sueldoBase: 850000,
    horasSemanales: 44,
    sinPrevision: true,
    sinSalud: true,
  },
];

function loadAppConfig(): AppConfig {
  const rawConfig = readFileSync(resolve(process.cwd(), 'public', 'app-config.json'), 'utf8').replace(/^\uFEFF/, '');
  const raw = JSON.parse(rawConfig) as Partial<AppConfig>;
  return {
    supabaseUrl: (process.env['E2E_SUPABASE_URL'] ?? raw.supabaseUrl ?? '').replace(/\/$/, ''),
    supabaseAnonKey: process.env['E2E_SUPABASE_ANON_KEY'] ?? raw.supabaseAnonKey ?? '',
  };
}

async function createAuthenticatedClient(): Promise<SupabaseClient> {
  const config = loadAppConfig();
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: 'angular-erp-empleados-fixtures',
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '',
    password: process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '',
  });
  expect(error, 'No se pudo iniciar sesion authenticated para fixtures de empleados.').toBeNull();
  expect(data.session, 'Supabase no devolvio sesion para fixtures de empleados.').not.toBeNull();
  return supabase;
}

async function selectOne<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  build: (query: any) => any,
  label: string,
): Promise<T> {
  const { data, error } = await build(supabase.from(table).select(select)).limit(1);
  expect(error, `No se pudo leer ${label}.`).toBeNull();
  expect(data?.[0], `No existe catalogo requerido: ${label}.`).toBeTruthy();
  return data[0] as T;
}

async function ensureByMatch<T extends Record<string, any>>(
  supabase: SupabaseClient,
  table: string,
  match: Record<string, string | number | null>,
  row: Record<string, unknown>,
  select = '*',
): Promise<T> {
  let query = supabase.from(table).select(select).limit(1);
  for (const [key, value] of Object.entries(match)) {
    query = value === null ? query.is(key, null) : query.eq(key, value);
  }

  const { data, error } = await query;
  expect(error, `No se pudo leer ${table}.`).toBeNull();
  const existing = data?.[0] as T | undefined;

  if (existing) {
    const pk = Object.keys(existing).find((key) => key.startsWith('id_') || key === 'id');
    let update = supabase.from(table).update(row);
    if (pk) {
      update = update.eq(pk, existing[pk]);
    } else {
      for (const [key, value] of Object.entries(match)) {
        update = value === null ? update.is(key, null) : update.eq(key, value);
      }
    }
    const { error: updateError } = await update;
    expect(updateError, `No se pudo actualizar ${table}.`).toBeNull();
    return existing;
  }

  const { data: inserted, error: insertError } = await supabase.from(table).insert(row).select(select).single();
  expect(insertError, `No se pudo insertar ${table}.`).toBeNull();
  return inserted as T;
}

async function cargarCatalogos(supabase: SupabaseClient): Promise<CatalogosEmpleadosFixture> {
  const [
    empresa,
    sucursal,
    departamento,
    centroCosto,
    tipoTrabajador,
    tipoJornada,
    moneda,
    banco,
    tipoCuenta,
    regimen,
    pais,
  ] = await Promise.all([
    selectOne<{ id_empresa: number }>(supabase, 'empresa', 'id_empresa', (q) => q.order('id_empresa'), 'empresa'),
    selectOne<{ id_sucursal: number }>(supabase, 'sucursal', 'id_sucursal', (q) => q.order('id_sucursal'), 'sucursal'),
    selectOne<{ id_departamento_empresa: number }>(
      supabase,
      'departamento_empresa',
      'id_departamento_empresa',
      (q) => q.order('id_departamento_empresa'),
      'departamento',
    ),
    selectOne<{ id_centro_costo: number }>(
      supabase,
      'centro_costo',
      'id_centro_costo',
      (q) => q.order('id_centro_costo'),
      'centro de costo',
    ),
    selectOne<{ id_tipo_trabajador: number }>(
      supabase,
      'tipo_trabajador',
      'id_tipo_trabajador,nombre',
      (q) => q.ilike('nombre', '%dependiente%').order('id_tipo_trabajador'),
      'tipo trabajador dependiente',
    ),
    selectOne<{ id_tipo_jornada: number }>(
      supabase,
      'tipo_jornada',
      'id_tipo_jornada,nombre',
      (q) => q.ilike('nombre', '%completa%').order('id_tipo_jornada'),
      'tipo jornada completa',
    ),
    selectOne<{ id_moneda: number }>(supabase, 'moneda', 'id_moneda,codigo', (q) => q.eq('codigo', 'CLP'), 'moneda CLP'),
    selectOne<{ id_banco: number }>(supabase, 'banco', 'id_banco', (q) => q.order('id_banco'), 'banco'),
    selectOne<{ id_tipo_cuenta_bancaria: number }>(
      supabase,
      'tipo_cuenta_bancaria',
      'id_tipo_cuenta_bancaria',
      (q) => q.order('id_tipo_cuenta_bancaria'),
      'tipo cuenta bancaria',
    ),
    selectOne<{ id_regimen: number }>(
      supabase,
      'regimen_previsional',
      'id_regimen,nombre',
      (q) => q.ilike('nombre', '%AFP%').order('id_regimen'),
      'regimen AFP',
    ),
    selectOne<{ id_pais: number }>(supabase, 'pais', 'id_pais,nombre', (q) => q.ilike('nombre', '%Chile%'), 'pais Chile'),
  ]);

  const afp = await selectOne<{ id_afp: number }>(
    supabase,
    'afp',
    'id_afp,nombre',
    (q) => q.not('tasa_obligatoria', 'is', null).order('id_afp'),
    'AFP',
  );
  const salud = await selectOne<{ id_salud: number }>(
    supabase,
    'salud',
    'id_salud,nombre,tipo',
    (q) => q.eq('tipo', 'FONASA').order('id_salud'),
    'salud Fonasa',
  );

  return {
    idEmpresa: empresa.id_empresa,
    idSucursal: sucursal.id_sucursal,
    idDepartamento: departamento.id_departamento_empresa,
    idCentroCosto: centroCosto.id_centro_costo,
    idTipoTrabajador: tipoTrabajador.id_tipo_trabajador,
    idTipoJornada: tipoJornada.id_tipo_jornada,
    idMoneda: moneda.id_moneda,
    idBanco: banco.id_banco,
    idTipoCuenta: tipoCuenta.id_tipo_cuenta_bancaria,
    idRegimenAfp: regimen.id_regimen,
    idPais: pais.id_pais,
    idAfp: afp.id_afp,
    idSalud: salud.id_salud,
  };
}

async function deleteByIn(
  supabase: SupabaseClient,
  table: string,
  column: string,
  values: readonly number[],
): Promise<void> {
  const uniqueValues = Array.from(new Set(values)).filter((value) => Number.isFinite(value));
  if (uniqueValues.length === 0) return;

  const { error } = await supabase.from(table).delete().in(column, uniqueValues);
  expect(error, `No se pudo limpiar ${table}.`).toBeNull();
}

async function limpiarFixturesActuales(supabase: SupabaseClient): Promise<void> {
  const ruts = FIXTURES.map((fixture) => fixture.rut);
  const { data: personas, error: personasError } = await supabase
    .from('persona')
    .select('id_persona')
    .in('rut', ruts);
  expect(personasError, 'No se pudieron leer personas fixture NOMERR2405.').toBeNull();

  const personaIds = (personas ?? []).map((row: any) => Number(row.id_persona)).filter(Number.isFinite);
  if (personaIds.length === 0) return;

  const { data: contratos, error: contratosError } = await supabase
    .from('contrato')
    .select('id_contrato')
    .in('id_persona', personaIds);
  expect(contratosError, 'No se pudieron leer contratos fixture NOMERR2405.').toBeNull();

  const contratoIds = (contratos ?? []).map((row: any) => Number(row.id_contrato)).filter(Number.isFinite);

  const { data: liquidaciones, error: liquidacionesError } = contratoIds.length > 0
    ? await supabase.from('liquidacion').select('id_liquidacion').in('id_contrato', contratoIds)
    : { data: [], error: null };
  expect(liquidacionesError, 'No se pudieron leer liquidaciones fixture NOMERR2405.').toBeNull();
  const liquidacionIds = (liquidaciones ?? []).map((row: any) => Number(row.id_liquidacion)).filter(Number.isFinite);

  const { data: calculosTrabajador, error: calculosTrabajadorError } = await supabase
    .from('nomina_calculo_trabajador')
    .select('id_calculo_trabajador')
    .in('id_persona', personaIds);
  expect(calculosTrabajadorError, 'No se pudieron leer calculos trabajador fixture NOMERR2405.').toBeNull();
  const calculoTrabajadorIds = (calculosTrabajador ?? [])
    .map((row: any) => Number(row.id_calculo_trabajador))
    .filter(Number.isFinite);

  await deleteByIn(supabase, 'nomina_calculo_concepto', 'id_calculo_trabajador', calculoTrabajadorIds);
  await deleteByIn(supabase, 'nomina_calculo_issue', 'id_calculo_trabajador', calculoTrabajadorIds);
  await deleteByIn(supabase, 'nomina_calculo_trazabilidad', 'id_calculo_trabajador', calculoTrabajadorIds);
  await deleteByIn(supabase, 'nomina_calculo_trabajador', 'id_calculo_trabajador', calculoTrabajadorIds);

  await deleteByIn(supabase, 'liquidacion_detalle', 'id_liquidacion', liquidacionIds);
  await deleteByIn(supabase, 'liquidacion', 'id_liquidacion', liquidacionIds);

  await deleteByIn(supabase, 'movimiento_variable_mensual', 'id_persona', personaIds);
  await deleteByIn(supabase, 'movimiento', 'id_persona', personaIds);
  await deleteByIn(supabase, 'haberdescuento_persona', 'id_persona', personaIds);
  await deleteByIn(supabase, 'cuenta_bancaria', 'id_persona', personaIds);
  await deleteByIn(supabase, 'ficha_validacion_resumen', 'id_persona', personaIds);
  await deleteByIn(supabase, 'empleado_historial', 'id_persona', personaIds);

  await deleteByIn(supabase, 'contrato_centro_costo', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'remuneracion', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'prevision', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'salud_trabajador', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'cuenta2_afp', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'apv', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'finiquito', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'anexo_contrato', 'id_contrato', contratoIds);
}

async function crearEmpleadoFixture(
  supabase: SupabaseClient,
  catalogos: CatalogosEmpleadosFixture,
  fixture: EmpleadoFixture,
): Promise<void> {
  const persona = await ensureByMatch<{ id_persona: number }>(
    supabase,
    'persona',
    { rut: fixture.rut },
    {
      rut: fixture.rut,
      dv: fixture.dv,
      nombres: fixture.nombres,
      apellido_paterno: fixture.apellidoPaterno,
      apellido_materno: 'QA',
      fecha_nacimiento: fixture.fechaNacimiento,
      sexo: fixture.sexo,
      estado_civil: 'SOLTERO',
      email: `${fixture.rut}@qa-nomina.local`,
      telefono: '999999999',
      id_pais: catalogos.idPais,
      direccion: 'Fixture empleados errores remuneraciones',
      numero_direccion: '2405',
      estado: 'ACTIVO',
      estado_ficha: fixture.apto ? 'VALIDO' : 'INCOMPLETO',
      apto_para_remuneraciones: fixture.apto,
      fecha_activacion: fixture.apto ? FECHA_INICIO : null,
      paso_alta_avanzada: 9,
      cargas: 0,
      tramo_carga_manual: false,
    },
    'id_persona,rut',
  );

  const contrato = await ensureByMatch<{ id_contrato: number }>(
    supabase,
    'contrato',
    { id_persona: persona.id_persona, fecha_inicio: FECHA_INICIO },
    {
      id_persona: persona.id_persona,
      id_empresa: catalogos.idEmpresa,
      id_sucursal: catalogos.idSucursal,
      id_departamento_empresa: catalogos.idDepartamento,
      id_tipo_trabajador: catalogos.idTipoTrabajador,
      id_tipo_jornada: catalogos.idTipoJornada,
      codigo_tipo_contrato: 'INDEFINIDO',
      fecha_inicio: FECHA_INICIO,
      fecha_contrato: FECHA_INICIO,
      fecha_termino: null,
      cargo: fixture.cargo,
      estado: 'ACTIVO',
      seguro_cesantia: true,
    },
    'id_contrato,id_persona',
  );

  await ensureByMatch(
    supabase,
    'contrato_centro_costo',
    { id_contrato: contrato.id_contrato, id_centro_costo: catalogos.idCentroCosto },
    { id_contrato: contrato.id_contrato, id_centro_costo: catalogos.idCentroCosto, porcentaje: 100 },
    'id_contrato_centro_costo,id_contrato,id_centro_costo',
  );

  await ensureByMatch(
    supabase,
    'remuneracion',
    { id_contrato: contrato.id_contrato, vigencia_inicio: FECHA_INICIO },
    {
      id_contrato: contrato.id_contrato,
      id_moneda: catalogos.idMoneda,
      sueldo_base: fixture.sueldoBase,
      horas_semanales: fixture.horasSemanales,
      dias_semanales: 5,
      tipo_gratificacion: 'LEGAL_ART_50',
      gratificacion_proporcional: false,
      sueldo_variable: false,
      semana_corrida_activa: false,
      zona_extrema_activa: false,
      tiempo_colacion_minutos: 60,
      distribucion_jornada: 'Lunes a viernes',
      vigencia_inicio: FECHA_INICIO,
      vigencia_fin: null,
    },
    'id_remuneracion,id_contrato,vigencia_inicio',
  );

  await ensureByMatch(
    supabase,
    'prevision',
    { id_contrato: contrato.id_contrato, vigencia_inicio: FECHA_INICIO },
    fixture.sinPrevision
      ? {
          id_contrato: contrato.id_contrato,
          tipo_prevision: 'NINGUNA',
          id_regimen_previsional: null,
          id_afp: null,
          vigencia_inicio: FECHA_INICIO,
          vigencia_fin: null,
          observacion_prevision: 'Fixture sin prevision para pruebas de errores',
        }
      : {
          id_contrato: contrato.id_contrato,
          tipo_prevision: 'AFP',
          id_regimen_previsional: catalogos.idRegimenAfp,
          id_afp: catalogos.idAfp,
          vigencia_inicio: FECHA_INICIO,
          vigencia_fin: null,
          observacion_prevision: 'Fixture empleados errores remuneraciones',
        },
    'id_prevision,id_contrato,vigencia_inicio',
  );

  if (!fixture.sinSalud) {
    await ensureByMatch(
      supabase,
      'salud_trabajador',
      { id_contrato: contrato.id_contrato, vigencia_inicio: FECHA_INICIO },
      {
        id_contrato: contrato.id_contrato,
        id_salud: catalogos.idSalud,
        id_moneda_plan: catalogos.idMoneda,
        valor_plan: 0,
        adicional_auge_ges: 0,
        usar_plan_parametrizado: false,
        plan_salud: 'Fonasa QA',
        vigencia_inicio: FECHA_INICIO,
        vigencia_fin: null,
        observaciones_salud: 'Fixture empleados errores remuneraciones',
      },
      'id_salud_trabajador,id_contrato,vigencia_inicio',
    );
  }

  await ensureByMatch(
    supabase,
    'cuenta_bancaria',
    { id_persona: persona.id_persona, numero_cuenta: `2405${fixture.rut}` },
    {
      id_persona: persona.id_persona,
      id_banco: catalogos.idBanco,
      id_tipo_cuenta_bancaria: catalogos.idTipoCuenta,
      numero_cuenta: `2405${fixture.rut}`,
      activa: true,
      es_principal: true,
      titular_nombre: `${fixture.nombres} ${fixture.apellidoPaterno}`,
      titular_rut: `${fixture.rut}-${fixture.dv}`,
      vigencia_inicio: FECHA_INICIO,
      vigencia_fin: null,
      observacion: 'Fixture empleados errores remuneraciones',
    },
    'id_cuenta,id_persona,numero_cuenta',
  );
}

describeFixtures('empleados - fixtures para errores de remuneraciones', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test('crea perfiles QA NOMERR2405 desde el modulo empleados', async () => {
    const supabase = await createAuthenticatedClient();
    const catalogos = await cargarCatalogos(supabase);

    await limpiarFixturesActuales(supabase);

    for (const fixture of FIXTURES) {
      await crearEmpleadoFixture(supabase, catalogos, fixture);
    }

    const { data, error } = await supabase
      .from('vw_persona_factores')
      .select('rut,dv,nombres,apellido_paterno,cargo,base,horas_semanales,estado,estado_ficha,apto_para_remuneraciones,tipo_prevision,id_salud')
      .in('rut', FIXTURES.map((fixture) => fixture.rut))
      .order('rut');

    expect(error, 'No se pudo validar vw_persona_factores para fixtures NOMERR2405.').toBeNull();
    expect(data).toHaveLength(FIXTURES.length);

    for (const fixture of FIXTURES) {
      const row = data?.find((item: any) => item.rut === fixture.rut) as any;
      expect(row, `No se encontro ${fixture.rut}-${fixture.dv} en listado empleados.`).toBeTruthy();
      expect(row.dv).toBe(fixture.dv);
      expect(row.nombres).toBe(fixture.nombres);
      expect(row.apellido_paterno).toBe(fixture.apellidoPaterno);
      expect(row.estado).toBe('ACTIVO');
      expect(row.estado_ficha).toBe(fixture.apto ? 'VALIDO' : 'INCOMPLETO');
      expect(row.apto_para_remuneraciones).toBe(fixture.apto);
      expect(row.base).toBe(fixture.sueldoBase);
      expect(Number(row.horas_semanales)).toBe(fixture.horasSemanales);
      expect(row.tipo_prevision).toBe(fixture.sinPrevision ? 'NINGUNA' : 'AFP');
      expect(Boolean(row.id_salud)).toBe(!fixture.sinSalud);
    }
  });
});
