/**
 * Siembra 10 empleados productivos puros (RUT 27.000.001–010) marcados como
 * `apto_para_remuneraciones = true`, con contrato indefinido, jornada completa,
 * AFP + ISAPRE/Fonasa + cuenta bancaria. Pensado para poblar el alcance del
 * paso 3 de Nómina mensual V2 sin depender de la auditoría (`U1–U8`) ni del
 * seed de errores (`ERR01–ERR10`).
 *
 * Uso:
 *   node scripts/seed-empleados-aptos.mjs --confirm
 *   node scripts/seed-empleados-aptos.mjs --confirm --dry-run
 *   node scripts/seed-empleados-aptos.mjs --confirm --purge-only
 *   node scripts/seed-empleados-aptos.mjs --confirm --append
 *     (solo borra RUT 27.000.001–010 y recrea APTOS; no toca U1–U8 ni ERR)
 *
 * Requiere en .env (igual que `seed-empleados-prueba-errores.mjs`):
 *   E2E_SUPABASE_AUTH_EMAIL, E2E_SUPABASE_AUTH_PASSWORD
 *   (opcional) E2E_SUPABASE_SERVICE_ROLE_KEY para saltar login
 *   SUPABASE_DB_URL (o SUPABASE_DB_URL_LOCAL) + psql en PATH para borrados
 *   con triggers de auditoría.
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
const RUT_PREFIX = '270000';

const FIXTURES = [
  { rut: `${RUT_PREFIX}01`, nombres: 'Apto Uno',    apellidoPaterno: 'Productivo', sexo: 'F', fechaNacimiento: '1989-03-12', cargo: 'Analista de Operaciones' },
  { rut: `${RUT_PREFIX}02`, nombres: 'Apto Dos',    apellidoPaterno: 'Productivo', sexo: 'M', fechaNacimiento: '1985-08-04', cargo: 'Supervisor de Bodega' },
  { rut: `${RUT_PREFIX}03`, nombres: 'Apto Tres',   apellidoPaterno: 'Productivo', sexo: 'F', fechaNacimiento: '1992-11-21', cargo: 'Asistente Administrativo' },
  { rut: `${RUT_PREFIX}04`, nombres: 'Apto Cuatro', apellidoPaterno: 'Productivo', sexo: 'M', fechaNacimiento: '1990-01-15', cargo: 'Operario Producción' },
  { rut: `${RUT_PREFIX}05`, nombres: 'Apto Cinco',  apellidoPaterno: 'Productivo', sexo: 'F', fechaNacimiento: '1987-06-30', cargo: 'Contadora' },
  { rut: `${RUT_PREFIX}06`, nombres: 'Apto Seis',   apellidoPaterno: 'Productivo', sexo: 'M', fechaNacimiento: '1993-09-09', cargo: 'Vendedor Sucursal' },
  { rut: `${RUT_PREFIX}07`, nombres: 'Apto Siete',  apellidoPaterno: 'Productivo', sexo: 'F', fechaNacimiento: '1991-04-17', cargo: 'Encargada de Compras' },
  { rut: `${RUT_PREFIX}08`, nombres: 'Apto Ocho',   apellidoPaterno: 'Productivo', sexo: 'M', fechaNacimiento: '1988-12-02', cargo: 'Técnico de Mantención' },
  { rut: `${RUT_PREFIX}09`, nombres: 'Apto Nueve',  apellidoPaterno: 'Productivo', sexo: 'F', fechaNacimiento: '1994-07-25', cargo: 'Recepcionista' },
  { rut: `${RUT_PREFIX}10`, nombres: 'Apto Diez',   apellidoPaterno: 'Productivo', sexo: 'M', fechaNacimiento: '1986-10-08', cargo: 'Jefe de Turno' },
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
  const salud = await selectOne(
    supabase,
    'salud',
    'id_salud,tipo',
    (q) => q.eq('tipo', 'ISAPRE').order('id_salud'),
    'Salud ISAPRE',
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

async function crearEmpleadoApto(supabase, catalogos, fixture) {
  const dv = calcDv(fixture.rut);
  const email = `${fixture.rut}@qa-aptos.local`;

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
      telefono: '56900000000',
      id_pais: catalogos.idPais,
      direccion: 'Av. Productiva 100',
      numero_direccion: '100',
      estado: 'ACTIVO',
      estado_ficha: 'VALIDO',
      apto_para_remuneraciones: true,
      fecha_activacion: FECHA_INICIO,
      paso_alta_avanzada: null,
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
      relacion_laboral: 'CONTRATO',
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
      sueldo_base: 900000,
      horas_semanales: 44,
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
    {
      id_contrato: contrato.id_contrato,
      tipo_prevision: 'AFP',
      id_regimen_previsional: catalogos.idRegimenAfp,
      id_afp: catalogos.idAfp,
      vigencia_inicio: FECHA_INICIO,
      vigencia_fin: null,
      observacion_prevision: 'QA aptos AFP',
    },
    'id_prevision,id_contrato,vigencia_inicio',
  );

  await ensureByMatch(
    supabase,
    'salud_trabajador',
    { id_contrato: contrato.id_contrato, vigencia_inicio: FECHA_INICIO },
    {
      id_contrato: contrato.id_contrato,
      id_salud: catalogos.idSalud,
      id_moneda_plan: catalogos.idMoneda,
      valor_plan: 4.2,
      adicional_auge_ges: 0,
      usar_plan_parametrizado: false,
      plan_salud: 'ISAPRE QA aptos',
      vigencia_inicio: FECHA_INICIO,
      vigencia_fin: null,
      observaciones_salud: 'QA salud aptos',
    },
    'id_salud_trabajador,id_contrato,vigencia_inicio',
  );

  await ensureByMatch(
    supabase,
    'cuenta_bancaria',
    { id_persona: persona.id_persona, numero_cuenta: `${fixture.rut}01` },
    {
      id_persona: persona.id_persona,
      id_banco: catalogos.idBanco,
      id_tipo_cuenta_bancaria: catalogos.idTipoCuenta,
      numero_cuenta: `${fixture.rut}01`,
      activa: true,
      es_principal: true,
      titular_nombre: `${fixture.nombres} ${fixture.apellidoPaterno}`,
      titular_rut: `${fixture.rut}-${dv}`,
      vigencia_inicio: FECHA_INICIO,
      vigencia_fin: null,
      observacion: 'QA cuenta aptos',
    },
    'id_cuenta,id_persona,numero_cuenta',
  );

  return { rut: fixture.rut, dv, cargo: fixture.cargo };
}

async function limpiarSoloRutsAptos(supabase) {
  const ruts = FIXTURES.map((f) => f.rut);
  const { data: personas, error } = await supabase.from('persona').select('id_persona,rut').in('rut', ruts);
  if (error) throw new Error(`Leer personas APTOS: ${error.message}`);
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
    console.error('Uso: node scripts/seed-empleados-aptos.mjs --confirm [--dry-run] [--purge-only] [--append]');
    console.error('  --confirm      obligatorio para escribir en BD.');
    console.error('  --dry-run      solo muestra perfiles, no escribe en BD.');
    console.error('  --purge-only   borra TODOS los empleados (sin recrear).');
    console.error('  --append       borra solo RUT 27.000.001–010 y recrea APTOS (no purge global).');
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
    console.log(`Dry-run${append ? ' (--append)' : ''}: perfiles APTOS a crear:`);
    for (const f of FIXTURES) {
      console.log(`  ${f.rut}-${calcDv(f.rut)}  ${f.nombres} ${f.apellidoPaterno}  ${f.cargo}`);
    }
    return;
  }

  if (append) {
    console.log('Modo append: limpiando solo fixtures APTOS (27.000.001–010)...');
    await limpiarSoloRutsAptos(supabase);
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

  console.log(`Creando ${FIXTURES.length} empleados APTOS (RUT 27.000.001–010)...`);
  const creados = [];
  for (const fixture of FIXTURES) {
    const row = await crearEmpleadoApto(supabase, catalogos, fixture);
    creados.push(row);
    console.log(`  OK ${row.rut}-${row.dv} — ${row.cargo}`);
  }

  const { data: listado, error: listError } = await supabase
    .from('vw_persona_factores')
    .select('rut,dv,nombres,estado_ficha,apto_para_remuneraciones,base,horas_semanales,tipo_prevision')
    .in('rut', rutsQa)
    .order('rut');

  if (listError) throw new Error(listError.message);

  console.log('\nResumen en listado (deben verse VALIDO / aptos):');
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

  const reportPath = resolve(process.cwd(), 'tmp', 'seed-empleados-aptos-result.json');
  fs.mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fixtures: creados.map((row) => ({ rut: row.rut, dv: row.dv, cargo: row.cargo })),
      },
      null,
      2,
    ),
  );
  console.log(`Reporte APTOS: ${reportPath}`);

  console.log('\nListo. Revisa fichas en /empleados con RUT 27.000.001-* a 27.000.010-*');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
