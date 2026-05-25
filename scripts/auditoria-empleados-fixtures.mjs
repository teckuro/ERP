/**
 * Auditoría: crea usuarios U1–U8 (RUT 25.050.001–008) en Supabase remoto.
 * Trazabilidad por RUT/email; nombres solo letras (sin prefijo QAEMP2505 en columna nombres).
 * Uso: node scripts/auditoria-empleados-fixtures.mjs
 * Requiere: E2E_SUPABASE_URL (.supabase.co), E2E_SUPABASE_ANON_KEY, auth email/password
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env'), quiet: true });

function normalizeSupabaseUrl(raw) {
  let url = (raw ?? '').replace(/\/$/, '');
  if (url.includes('.supabase.com')) {
    url = url.replace('.supabase.com', '.supabase.co');
  }
  return url;
}

function rutDv(body) {
  let multiplier = 2;
  let sum = 0;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expectedValue = 11 - (sum % 11);
  return expectedValue === 11 ? '0' : expectedValue === 10 ? 'K' : String(expectedValue);
}

const FECHA_INICIO = '2025-05-01';
const RUT_BODIES = ['25050001', '25050002', '25050003', '25050004', '25050005', '25050006', '25050007', '25050008'];

const USERS = [
  { key: 'U1', nombres: 'Dependiente Activo', flujo: 'F5/F7', tipo: 'dependiente_activo' },
  { key: 'U2', nombres: 'Borrador Paso Dos', flujo: 'F3', tipo: 'borrador_paso2' },
  { key: 'U3', nombres: 'Borrador Reanudar', flujo: 'F4', tipo: 'borrador_reanudar' },
  { key: 'U4', nombres: 'Casa Particular', flujo: 'F8', tipo: 'casa_particular' },
  { key: 'U5', nombres: 'Exclusion Jornada', flujo: 'F9', tipo: 'exclusion_jornada' },
  { key: 'U6', nombres: 'Honorarios', flujo: 'F10', tipo: 'honorarios' },
  { key: 'U7', nombres: 'Alta Basica', flujo: 'F2', tipo: 'basico' },
  { key: 'U8', nombres: 'Ficha Incompleta', flujo: 'F12', tipo: 'ficha_incompleta' },
].map((u, i) => ({
  ...u,
  rut: RUT_BODIES[i],
  dv: rutDv(RUT_BODIES[i]),
}));

async function selectOne(supabase, table, select, build, label) {
  const { data, error } = await build(supabase.from(table).select(select)).limit(1);
  if (error) throw new Error(`Leer ${label}: ${error.message}`);
  if (!data?.[0]) throw new Error(`Sin catálogo: ${label}`);
  return data[0];
}

async function ensureByMatch(supabase, table, match, row, select = '*') {
  let query = supabase.from(table).select(select).limit(1);
  for (const [key, value] of Object.entries(match)) {
    query = value === null ? query.is(key, null) : query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) throw new Error(`${table} read: ${error.message}`);
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
    if (updateError) throw new Error(`${table} update: ${updateError.message}`);
    return existing;
  }
  const { data: inserted, error: insertError } = await supabase.from(table).insert(row).select(select).single();
  if (insertError) throw new Error(`${table} insert: ${insertError.message}`);
  return inserted;
}

async function cargarCatalogos(supabase) {
  const empresa = await selectOne(supabase, 'empresa', 'id_empresa', (q) => q.order('id_empresa'), 'empresa');
  const sucursal = await selectOne(supabase, 'sucursal', 'id_sucursal', (q) => q.order('id_sucursal'), 'sucursal');
  const departamento = await selectOne(
    supabase,
    'departamento_empresa',
    'id_departamento_empresa',
    (q) => q.order('id_departamento_empresa'),
    'departamento',
  );
  const centroCosto = await selectOne(
    supabase,
    'centro_costo',
    'id_centro_costo',
    (q) => q.order('id_centro_costo'),
    'centro_costo',
  );
  const tipoTrabajador = await selectOne(
    supabase,
    'tipo_trabajador',
    'id_tipo_trabajador',
    (q) => q.ilike('nombre', '%dependiente%').order('id_tipo_trabajador'),
    'tipo_trabajador',
  );
  const tipoJornada = await selectOne(
    supabase,
    'tipo_jornada',
    'id_tipo_jornada',
    (q) => q.ilike('nombre', '%completa%').order('id_tipo_jornada'),
    'tipo_jornada',
  );
  const moneda = await selectOne(supabase, 'moneda', 'id_moneda', (q) => q.eq('codigo', 'CLP'), 'moneda CLP');
  const banco = await selectOne(supabase, 'banco', 'id_banco', (q) => q.order('id_banco'), 'banco');
  const tipoCuenta = await selectOne(
    supabase,
    'tipo_cuenta_bancaria',
    'id_tipo_cuenta_bancaria',
    (q) => q.order('id_tipo_cuenta_bancaria'),
    'tipo_cuenta',
  );
  const regimen = await selectOne(
    supabase,
    'regimen_previsional',
    'id_regimen',
    (q) => q.ilike('nombre', '%AFP%').order('id_regimen'),
    'regimen AFP',
  );
  const pais = await selectOne(supabase, 'pais', 'id_pais', (q) => q.ilike('nombre', '%Chile%'), 'pais');
  const afp = await selectOne(supabase, 'afp', 'id_afp', (q) => q.not('tasa_obligatoria', 'is', null).order('id_afp'), 'afp');
  const salud = await selectOne(supabase, 'salud', 'id_salud,tipo', (q) => q.eq('tipo', 'ISAPRE').order('id_salud'), 'salud ISAPRE');
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

async function limpiarQaemp(supabase, ruts) {
  const { data: personas } = await supabase.from('persona').select('id_persona').in('rut', ruts);
  const personaIds = (personas ?? []).map((r) => r.id_persona).filter(Number.isFinite);
  if (personaIds.length === 0) return;

  const { data: contratos } = await supabase.from('contrato').select('id_contrato').in('id_persona', personaIds);
  const contratoIds = (contratos ?? []).map((r) => r.id_contrato).filter(Number.isFinite);

  const tablesContrato = [
    'contrato_centro_costo',
    'remuneracion',
    'prevision',
    'salud_trabajador',
    'cuenta2_afp',
    'apv',
    'semana_corrida',
    'zona_extrema',
  ];
  for (const table of tablesContrato) {
    if (contratoIds.length) await supabase.from(table).delete().in('id_contrato', contratoIds);
  }
  if (contratoIds.length) await supabase.from('contrato').delete().in('id_contrato', contratoIds);
  await supabase.from('persona_condicion_trabajador').delete().in('id_persona', personaIds);
  await supabase.from('cuenta_bancaria').delete().in('id_persona', personaIds);
  await supabase.from('persona').delete().in('id_persona', personaIds);
}

async function crearUsuario(supabase, cat, user) {
  const basePersona = {
    rut: user.rut,
    dv: user.dv,
    nombres: user.nombres,
    apellido_paterno: 'Auditoria',
    apellido_materno: 'ERP',
    fecha_nacimiento: '1990-06-15',
    sexo: 'F',
    estado_civil: 'SOLTERO',
    email: `${user.rut}@qa-auditoria.local`,
    telefono: '56911112222',
    id_pais: cat.idPais,
    direccion: 'Calle Auditoria 100',
    numero_direccion: '100',
    cargas: 0,
  };

  if (user.tipo === 'basico') {
    const persona = await ensureByMatch(
      supabase,
      'persona',
      { rut: user.rut },
      {
        ...basePersona,
        estado: 'EN_PROCESO',
        estado_ficha: 'INCOMPLETO',
        apto_para_remuneraciones: false,
        paso_alta_avanzada: null,
      },
      'id_persona,rut',
    );
    return { id_persona: persona.id_persona, contrato: null };
  }

  const personaState =
    user.tipo === 'borrador_paso2' || user.tipo === 'borrador_reanudar'
      ? {
          estado: 'BORRADOR',
          estado_ficha: 'INCOMPLETO',
          apto_para_remuneraciones: false,
          paso_alta_avanzada: user.tipo === 'borrador_paso2' ? 2 : 4,
        }
      : user.tipo === 'ficha_incompleta' || user.tipo === 'honorarios'
        ? {
            estado: 'ACTIVO',
            estado_ficha: 'INCOMPLETO',
            apto_para_remuneraciones: false,
            paso_alta_avanzada: null,
            fecha_activacion: FECHA_INICIO,
          }
        : {
            estado: 'ACTIVO',
            estado_ficha: 'VALIDO',
            apto_para_remuneraciones: true,
            paso_alta_avanzada: null,
            fecha_activacion: FECHA_INICIO,
          };

  const persona = await ensureByMatch(
    supabase,
    'persona',
    { rut: user.rut },
    { ...basePersona, ...personaState },
    'id_persona,rut',
  );

  if (user.tipo === 'borrador_paso2') {
    return { id_persona: persona.id_persona, contrato: null };
  }

  const relacionLaboral = user.tipo === 'honorarios' ? 'HONORARIOS' : 'CONTRATO';
  const tipoContrato =
    user.tipo === 'casa_particular' ? 'CASA_PARTICULAR' : 'INDEFINIDO';

  const contratoRow = {
    id_persona: persona.id_persona,
    id_empresa: cat.idEmpresa,
    id_sucursal: cat.idSucursal,
    id_departamento_empresa: cat.idDepartamento,
    id_tipo_trabajador: cat.idTipoTrabajador,
    id_tipo_jornada: cat.idTipoJornada,
    relacion_laboral: relacionLaboral,
    codigo_tipo_contrato: tipoContrato,
    fecha_inicio: FECHA_INICIO,
    fecha_contrato: FECHA_INICIO,
    fecha_termino: null,
    cargo: `Cargo ${user.key} auditoria`,
    estado: 'ACTIVO',
    seguro_cesantia: user.tipo !== 'honorarios',
    excluido_limite_jornada: user.tipo === 'exclusion_jornada',
    causal_exclusion_jornada:
      user.tipo === 'exclusion_jornada' ? 'ALTA_RESPONSABILIDAD' : null,
    justificacion_exclusion_jornada:
      user.tipo === 'exclusion_jornada' ? 'Respaldo auditoria ERP' : null,
    casa_particular_modalidad: user.tipo === 'casa_particular' ? 'PUERTAS_ADENTRO' : null,
    casa_particular_labores: user.tipo === 'casa_particular' ? 'Limpieza y cuidado' : null,
    casa_particular_domicilio_especifico:
      user.tipo === 'casa_particular' ? 'Domicilio QA 45' : null,
    casa_particular_asistencia_cuidado: user.tipo === 'casa_particular',
    casa_particular_registro_dt_estado: user.tipo === 'casa_particular' ? 'PENDIENTE' : null,
    casa_particular_registro_dt_fecha: null,
    casa_particular_registro_dt_folio: null,
  };

  const contrato = await ensureByMatch(
    supabase,
    'contrato',
    { id_persona: persona.id_persona, fecha_inicio: FECHA_INICIO },
    contratoRow,
    'id_contrato,id_persona,relacion_laboral',
  );

  if (user.tipo !== 'borrador_reanudar' && user.tipo !== 'honorarios') {
    await ensureByMatch(
      supabase,
      'contrato_centro_costo',
      { id_contrato: contrato.id_contrato, id_centro_costo: cat.idCentroCosto },
      { id_contrato: contrato.id_contrato, id_centro_costo: cat.idCentroCosto, porcentaje: 100 },
      'id_contrato_centro_costo',
    );
    await ensureByMatch(
      supabase,
      'remuneracion',
      { id_contrato: contrato.id_contrato, vigencia_inicio: FECHA_INICIO },
      {
        id_contrato: contrato.id_contrato,
        id_moneda: cat.idMoneda,
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
      'id_remuneracion',
    );
  }

  if (user.tipo === 'borrador_reanudar') {
    await supabase
      .from('persona')
      .update({
        telefono: '56933334444',
        direccion: 'Direccion reanudada auditoria',
        numero_direccion: '200',
      })
      .eq('id_persona', persona.id_persona);
  }

  if (relacionLaboral === 'CONTRATO' && user.tipo !== 'ficha_incompleta') {
    await ensureByMatch(
      supabase,
      'prevision',
      { id_contrato: contrato.id_contrato, vigencia_inicio: FECHA_INICIO },
      {
        id_contrato: contrato.id_contrato,
        tipo_prevision: 'AFP',
        id_regimen_previsional: cat.idRegimenAfp,
        id_afp: cat.idAfp,
        vigencia_inicio: FECHA_INICIO,
        vigencia_fin: null,
      },
      'id_prevision',
    );
    await ensureByMatch(
      supabase,
      'salud_trabajador',
      { id_contrato: contrato.id_contrato, vigencia_inicio: FECHA_INICIO },
      {
        id_contrato: contrato.id_contrato,
        id_salud: cat.idSalud,
        id_moneda_plan: cat.idMoneda,
        valor_plan: 4.2,
        adicional_auge_ges: 0,
        vigencia_inicio: FECHA_INICIO,
        vigencia_fin: null,
      },
      'id_salud_trabajador',
    );
  }

  if (user.tipo !== 'basico' && user.tipo !== 'borrador_paso2') {
    await ensureByMatch(
      supabase,
      'cuenta_bancaria',
      { id_persona: persona.id_persona, numero_cuenta: `QA${user.rut}` },
      {
        id_persona: persona.id_persona,
        id_banco: cat.idBanco,
        id_tipo_cuenta_bancaria: cat.idTipoCuenta,
        numero_cuenta: `QA${user.rut}`,
        activa: true,
        es_principal: true,
        vigencia_inicio: FECHA_INICIO,
        vigencia_fin: null,
      },
      'id_cuenta',
    );
  }

  return {
    id_persona: persona.id_persona,
    id_contrato: contrato.id_contrato,
    relacion_laboral: contrato.relacion_laboral,
  };
}

async function main() {
  const url = normalizeSupabaseUrl(
    process.env.E2E_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
  );
  const key = process.env.E2E_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  const email = process.env.E2E_SUPABASE_AUTH_EMAIL ?? '';
  const password = process.env.E2E_SUPABASE_AUTH_PASSWORD ?? '';

  if (!url || !key || !email || !password) {
    console.error('Faltan E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY, E2E_SUPABASE_AUTH_EMAIL, E2E_SUPABASE_AUTH_PASSWORD');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('Auth fallo:', authError.message);
    process.exit(1);
  }

  const report = { fecha: new Date().toISOString(), urlHost: new URL(url).host, usuarios: [], errores: [] };
  const cat = await cargarCatalogos(supabase);
  await limpiarQaemp(
    supabase,
    USERS.map((u) => u.rut),
  );

  for (const user of USERS) {
    try {
      const created = await crearUsuario(supabase, cat, user);
      report.usuarios.push({
        key: user.key,
        flujo: user.flujo,
        rut: `${user.rut}-${user.dv}`,
        nombres: user.nombres,
        ...created,
      });
      console.log(`OK ${user.key} persona=${created.id_persona}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report.errores.push({ key: user.key, error: msg });
      console.error(`FAIL ${user.key}:`, msg);
    }
  }

  const { data: verificacion } = await supabase
    .from('persona')
    .select('id_persona,rut,dv,nombres,estado,estado_ficha,paso_alta_avanzada,apto_para_remuneraciones')
    .in(
      'rut',
      USERS.map((u) => u.rut),
    )
    .order('rut');

  report.verificacionPersona = verificacion ?? [];

  const personaIds = (verificacion ?? []).map((p) => p.id_persona);
  if (personaIds.length) {
    const { data: contratos } = await supabase
      .from('contrato')
      .select(
        'id_contrato,id_persona,relacion_laboral,excluido_limite_jornada,casa_particular_modalidad,codigo_tipo_contrato',
      )
      .in('id_persona', personaIds);
    report.verificacionContrato = contratos ?? [];
  }

  const outDir = path.join(__dirname, '..', 'tmp');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'auditoria-qaemp2505-result.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Reporte:', outPath);
  process.exit(report.errores.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
