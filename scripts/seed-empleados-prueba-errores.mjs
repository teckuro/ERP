/**
 * Elimina todos los empleados (persona + dependencias) y crea 10 perfiles QA con errores
 * alineados a empleado-completitud.rules / empleado-diagnostico.rules.
 *
 * Uso:
 *   node scripts/seed-empleados-prueba-errores.mjs --confirm
 *   node scripts/seed-empleados-prueba-errores.mjs --confirm --dry-run
 *   node scripts/seed-empleados-prueba-errores.mjs --confirm --purge-only
 *   node scripts/seed-empleados-prueba-errores.mjs --confirm --append
 *     (solo borra RUT 26.100.001–010 y recrea ERR; no toca U1–U8 ni el resto de personas)
 *
 * Requiere en .env (auth API):
 *   E2E_SUPABASE_AUTH_EMAIL
 *   E2E_SUPABASE_AUTH_PASSWORD
 * Para borrar contrato/persona sin fallar el trigger de auditoria, ademas:
 *   SUPABASE_DB_URL (o SUPABASE_DB_URL_LOCAL) + psql en PATH
 * Opcional: E2E_SUPABASE_SERVICE_ROLE_KEY para saltar login.
 * y public/app-config.json (supabaseUrl, supabaseAnonKey).
 */

import fs from 'node:fs';
import { config } from 'dotenv';
import { resolve } from 'node:path';

import {
  createSupabaseScriptClient,
  fetchAllPersonaIds,
  limpiarEmpleadosPorPersonas,
} from './lib/empleados-cleanup.mjs';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const FECHA_INICIO = '2024-05-01';
const RUT_PREFIX = '261000';

/** Perfiles QA — cada uno reproduce un bloqueo documentado en empleado-completitud.rules.spec.ts */
const FIXTURES = [
  {
    rut: `${RUT_PREFIX}01`,
    nombres: 'Sueldo cero',
    apellidoPaterno: 'Completitud',
    sexo: 'M',
    fechaNacimiento: '1990-03-15',
    cargo: 'Analista remuneraciones',
    apto: false,
    sueldoBase: 0,
    horasSemanales: 42,
    pasoAltaAvanzada: null,
    regla: 'sueldo-base:invalido',
  },
  {
    rut: `${RUT_PREFIX}02`,
    nombres: 'Sin cargo',
    apellidoPaterno: 'Completitud',
    sexo: 'F',
    fechaNacimiento: '1988-07-20',
    cargo: 'Sin cargo',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    regla: 'cargo:sin-cargo',
  },
  {
    rut: `${RUT_PREFIX}03`,
    nombres: 'Cuenta borrador',
    apellidoPaterno: 'Bancario',
    sexo: 'M',
    fechaNacimiento: '1992-11-08',
    cargo: 'Auxiliar administrativo',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    numeroCuenta: 'DRAFT-QA-003',
    regla: 'cuenta-bancaria:draft',
  },
  {
    rut: `${RUT_PREFIX}04`,
    nombres: 'Sin prevision',
    apellidoPaterno: 'Prevision',
    sexo: 'F',
    fechaNacimiento: '1985-01-30',
    cargo: 'Operario planta',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    sinPrevision: true,
    sinSalud: true,
    regla: 'prevision y salud / Sin prevision',
  },
  {
    rut: `${RUT_PREFIX}05`,
    nombres: 'Jornada cuarenta y cuatro',
    apellidoPaterno: 'Jornada',
    sexo: 'M',
    fechaNacimiento: '1991-09-12',
    cargo: 'Supervisor turno',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 44,
    regla: 'maximo 42 horas semanales',
  },
  {
    rut: `${RUT_PREFIX}06`,
    nombres: 'Alta incompleta',
    apellidoPaterno: 'Borrador',
    sexo: 'F',
    fechaNacimiento: '1993-04-25',
    cargo: 'Asistente RRHH',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    pasoAltaAvanzada: 3,
    regla: 'alta avanzada incompleta',
  },
  {
    rut: `${RUT_PREFIX}07`,
    nombres: 'Sin cuenta bancaria',
    apellidoPaterno: 'Pago',
    sexo: 'M',
    fechaNacimiento: '1987-12-01',
    cargo: 'Contador',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    sinCuentaBancaria: true,
    regla: 'cuenta bancaria pendiente / vacia',
  },
  {
    rut: `${RUT_PREFIX}08`,
    nombres: 'Sin email',
    apellidoPaterno: 'Contacto',
    sexo: 'F',
    fechaNacimiento: '1994-06-18',
    cargo: 'Recepcionista',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    email: null,
    regla: 'contacto incompleto',
  },
  {
    rut: `${RUT_PREFIX}09`,
    nombres: 'Borrador alta',
    apellidoPaterno: 'Borrador',
    sexo: 'M',
    fechaNacimiento: '1989-08-09',
    cargo: 'Gerente area',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    pasoAltaAvanzada: 4,
    regla: 'alta avanzada incompleta (paso 4)',
  },
  {
    rut: `${RUT_PREFIX}10`,
    nombres: 'Plazo sin termino',
    apellidoPaterno: 'Contrato',
    sexo: 'F',
    fechaNacimiento: '1990-10-22',
    cargo: 'Ingeniero proceso',
    apto: false,
    sueldoBase: 750000,
    horasSemanales: 42,
    codigoTipoContrato: 'PLAZO_FIJO',
    fechaTermino: null,
    regla: 'contrato plazo fijo sin fecha termino',
  },
];

function calcDv(rutBody) {
  let sum = 0;
  let mul = 2;
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += Number(rutBody[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return '0';
  if (rest === 10) return 'K';
  return String(rest);
}

async function selectOne(supabase, table, select, build, label) {
  const { data, error } = await build(supabase.from(table).select(select)).limit(1);
  if (error) throw new Error(`Catalogo ${label}: ${error.message}`);
  if (!data?.[0]) throw new Error(`No existe catalogo: ${label}`);
  return data[0];
}

async function cargarCatalogos(supabase) {
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
    selectOne(supabase, 'empresa', 'id_empresa', (q) => q.order('id_empresa'), 'empresa'),
    selectOne(supabase, 'sucursal', 'id_sucursal', (q) => q.order('id_sucursal'), 'sucursal'),
    selectOne(supabase, 'departamento_empresa', 'id_departamento_empresa', (q) => q.order('id_departamento_empresa'), 'departamento'),
    selectOne(supabase, 'centro_costo', 'id_centro_costo', (q) => q.order('id_centro_costo'), 'centro costo'),
    selectOne(supabase, 'tipo_trabajador', 'id_tipo_trabajador,nombre', (q) => q.ilike('nombre', '%dependiente%'), 'tipo trabajador'),
    selectOne(supabase, 'tipo_jornada', 'id_tipo_jornada,nombre', (q) => q.ilike('nombre', '%completa%'), 'tipo jornada'),
    selectOne(supabase, 'moneda', 'id_moneda', (q) => q.eq('codigo', 'CLP'), 'moneda CLP'),
    selectOne(supabase, 'banco', 'id_banco', (q) => q.order('id_banco'), 'banco'),
    selectOne(supabase, 'tipo_cuenta_bancaria', 'id_tipo_cuenta_bancaria', (q) => q.order('id_tipo_cuenta_bancaria'), 'tipo cuenta'),
    selectOne(supabase, 'regimen_previsional', 'id_regimen,nombre', (q) => q.ilike('nombre', '%AFP%'), 'regimen AFP'),
    selectOne(supabase, 'pais', 'id_pais', (q) => q.ilike('nombre', '%Chile%'), 'pais Chile'),
  ]);

  const afp = await selectOne(supabase, 'afp', 'id_afp', (q) => q.not('tasa_obligatoria', 'is', null).order('id_afp'), 'AFP');
  const salud = await selectOne(supabase, 'salud', 'id_salud', (q) => q.eq('tipo', 'FONASA').order('id_salud'), 'Fonasa');

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

async function ensureByMatch(supabase, table, match, row, select = '*') {
  let query = supabase.from(table).select(select).limit(1);
  for (const [key, value] of Object.entries(match)) {
    query = value === null ? query.is(key, null) : query.eq(key, value);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Leer ${table}: ${error.message}`);

  const existing = data?.[0];
  if (existing) {
    const pk = Object.keys(existing).find((k) => k.startsWith('id_') || k === 'id');
    let update = supabase.from(table).update(row);
    if (pk) update = update.eq(pk, existing[pk]);
    else {
      for (const [key, value] of Object.entries(match)) {
        update = value === null ? update.is(key, null) : update.eq(key, value);
      }
    }
    const { error: updateError } = await update;
    if (updateError) throw new Error(`Actualizar ${table}: ${updateError.message}`);
    return existing;
  }

  const { data: inserted, error: insertError } = await supabase.from(table).insert(row).select(select).single();
  if (insertError) throw new Error(`Insertar ${table}: ${insertError.message}`);
  return inserted;
}

async function crearEmpleadoFixture(supabase, catalogos, fixture) {
  const dv = calcDv(fixture.rut);
  const email = fixture.email === undefined ? `${fixture.rut}@qa-errores.local` : fixture.email;

  const persona = await ensureByMatch(
    supabase,
    'persona',
    { rut: fixture.rut },
    {
      rut: fixture.rut,
      dv,
      nombres: fixture.nombres,
      apellido_paterno: fixture.apellidoPaterno,
      apellido_materno: 'QA',
      fecha_nacimiento: fixture.fechaNacimiento,
      sexo: fixture.sexo,
      estado_civil: 'SOLTERO',
      email,
      telefono: fixture.telefono ?? '56900000000',
      id_pais: catalogos.idPais,
      direccion: fixture.direccion ?? 'Av. Prueba empleados errores',
      numero_direccion: '100',
      estado: 'ACTIVO',
      estado_ficha: 'INCOMPLETO',
      apto_para_remuneraciones: false,
      fecha_activacion: null,
      paso_alta_avanzada:
        fixture.pasoAltaAvanzada === undefined ? 9 : fixture.pasoAltaAvanzada,
      cargas: 0,
      tramo_carga_manual: false,
    },
    'id_persona,rut',
  );

  const contrato = await ensureByMatch(
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
      codigo_tipo_contrato: fixture.codigoTipoContrato ?? 'INDEFINIDO',
      fecha_inicio: FECHA_INICIO,
      fecha_contrato: FECHA_INICIO,
      fecha_termino: fixture.fechaTermino !== undefined ? fixture.fechaTermino : null,
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
          observacion_prevision: 'QA sin prevision',
        }
      : {
          id_contrato: contrato.id_contrato,
          tipo_prevision: 'AFP',
          id_regimen_previsional: catalogos.idRegimenAfp,
          id_afp: catalogos.idAfp,
          vigencia_inicio: FECHA_INICIO,
          vigencia_fin: null,
          observacion_prevision: 'QA prevision AFP',
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
        observaciones_salud: 'QA salud',
      },
      'id_salud_trabajador,id_contrato,vigencia_inicio',
    );
  }

  if (!fixture.sinCuentaBancaria) {
    await ensureByMatch(
      supabase,
      'cuenta_bancaria',
      { id_persona: persona.id_persona, numero_cuenta: fixture.numeroCuenta ?? `${fixture.rut}01` },
      {
        id_persona: persona.id_persona,
        id_banco: catalogos.idBanco,
        id_tipo_cuenta_bancaria: catalogos.idTipoCuenta,
        numero_cuenta: fixture.numeroCuenta ?? `${fixture.rut}01`,
        activa: true,
        es_principal: true,
        titular_nombre: `${fixture.nombres} ${fixture.apellidoPaterno}`,
        titular_rut: `${fixture.rut}-${dv}`,
        vigencia_inicio: FECHA_INICIO,
        vigencia_fin: null,
        observacion: 'QA cuenta',
      },
      'id_cuenta,id_persona,numero_cuenta',
    );
  }

  return { rut: fixture.rut, dv, regla: fixture.regla };
}

async function limpiarSoloRutsErr(supabase) {
  const ruts = FIXTURES.map((f) => f.rut);
  const { data: personas, error } = await supabase.from('persona').select('id_persona,rut').in('rut', ruts);
  if (error) throw new Error(`Leer personas ERR: ${error.message}`);
  const ids = (personas ?? []).map((p) => p.id_persona).filter((id) => Number.isInteger(id));
  if (ids.length) {
    await limpiarEmpleadosPorPersonas(supabase, ids);
  }
}

async function main() {
  const confirm = process.argv.includes('--confirm');
  const dryRun = process.argv.includes('--dry-run');
  const purgeOnly = process.argv.includes('--purge-only');
  const append = process.argv.includes('--append');

  if (!confirm) {
    console.error('Uso: node scripts/seed-empleados-prueba-errores.mjs --confirm [--dry-run] [--purge-only] [--append]');
    console.error('  --confirm      obligatorio para escribir en BD.');
    console.error('  --dry-run      solo muestra conteos, no escribe en BD.');
    console.error('  --purge-only   borra TODOS los empleados (sin recrear).');
    console.error('  --append       borra solo RUT 26.100.001–010 y recrea ERR (no purge global).');
    process.exit(1);
  }

  const supabase = await createSupabaseScriptClient();
  const personaIds = await fetchAllPersonaIds(supabase);

  console.log(`Personas actuales en BD: ${personaIds.length}`);

  if (dryRun) {
    if (purgeOnly) {
      console.log('Dry-run (--purge-only): no se borra nada.');
      return;
    }
    console.log(`Dry-run${append ? ' (--append)' : ''}: perfiles ERR a crear:`);
    for (const f of FIXTURES) {
      console.log(`  ${f.rut}-${calcDv(f.rut)}  ${f.nombres}  →  ${f.regla}`);
    }
    return;
  }

  if (append) {
    console.log('Modo append: limpiando solo fixtures ERR (26.100.001–010)...');
    await limpiarSoloRutsErr(supabase);
  } else {
    console.log('Eliminando empleados existentes...');
    await limpiarEmpleadosPorPersonas(supabase, personaIds);
  }

  if (purgeOnly) {
    const { count: restantesPurge } = await supabase
      .from('persona')
      .select('id_persona', { count: 'exact', head: true });
    console.log(`Personas tras limpieza: ${restantesPurge ?? 0}`);
    console.log('Purge-only: no se recrean fixtures.');
    return;
  }

  const rutsQa = FIXTURES.map((f) => f.rut);
  const { count: restantes } = await supabase
    .from('persona')
    .select('id_persona', { count: 'exact', head: true });
  console.log(`Personas tras limpieza: ${restantes ?? 0}`);

  console.log('Cargando catalogos...');
  const catalogos = await cargarCatalogos(supabase);

  console.log('Creando 10 empleados QA con errores (rules)...');
  const creados = [];
  for (const fixture of FIXTURES) {
    const row = await crearEmpleadoFixture(supabase, catalogos, fixture);
    creados.push(row);
    console.log(`  OK ${row.rut}-${row.dv} — ${row.regla}`);
  }

  const { data: listado, error: listError } = await supabase
    .from('vw_persona_factores')
    .select('rut,dv,nombres,estado_ficha,apto_para_remuneraciones,base,horas_semanales,tipo_prevision')
    .in('rut', rutsQa)
    .order('rut');

  if (listError) throw new Error(listError.message);

  console.log('\nResumen en listado (deben verse INCOMPLETO / no aptos):');
  console.table(
    (listado ?? []).map((r) => ({
      rut: `${r.rut}-${r.dv}`,
      nombres: r.nombres,
      estado_ficha: r.estado_ficha,
      apto: r.apto_para_remuneraciones,
      base: r.base,
      horas: r.horas_semanales,
      prevision: r.tipo_prevision,
    })),
  );

  const reportPath = resolve(process.cwd(), 'tmp', 'seed-empleados-err-result.json');
  fs.mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fixtures: creados.map((row) => ({ rut: row.rut, dv: row.dv, regla: row.regla })),
      },
      null,
      2,
    ),
  );
  console.log(`Reporte ERR: ${reportPath}`);

  console.log('\nListo. Revisa fichas en /empleados con RUT 26.100.001-* a 26.100.010-*');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
