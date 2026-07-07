/**
 * Diagnóstico: persona → vw_persona_factores → aptitud Previred por trabajador liquidado.
 *
 * Uso:
 *   node scripts/diag-previred-personales.mjs --periodo 2026-07
 *   node scripts/diag-previred-personales.mjs --nomina-periodo-id <uuid>
 *   node scripts/diag-previred-personales.mjs --periodo 2026-07 --json
 *
 * Requiere: E2E_SUPABASE_AUTH_EMAIL/PASSWORD o SERVICE_ROLE en .env
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

function parseArgs(argv) {
  const args = { periodo: null, nominaId: null, json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') args.json = true;
    else if (token === '--periodo') args.periodo = argv[++i] ?? null;
    else if (token === '--nomina-periodo-id') args.nominaId = argv[++i] ?? null;
    else if (!token.startsWith('-') && !args.periodo && !args.nominaId) args.periodo = token;
  }
  return args;
}

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const url = (process.env.E2E_SUPABASE_URL ?? cfg.supabaseUrl ?? '').replace(/\/$/, '');
const anon = process.env.E2E_SUPABASE_ANON_KEY ?? cfg.supabaseAnonKey ?? '';
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

async function createSb() {
  if (service) {
    return createClient(url, service, { auth: { persistSession: false } });
  }
  const email = process.env.E2E_SUPABASE_AUTH_EMAIL ?? '';
  const password = process.env.E2E_SUPABASE_AUTH_PASSWORD ?? '';
  if (!email || !password) {
    throw new Error('Defina E2E_SUPABASE_AUTH_EMAIL/PASSWORD o SERVICE_ROLE_KEY');
  }
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return sb;
}

function normalizarClave(valor) {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function mapearCodigoAfpDesdeNombre(nombre) {
  const clave = normalizarClave(nombre);
  if (!clave) return '00';
  const mapa = {
    capital: '33',
    cuprum: '03',
    habitat: '05',
    'modelo': '34',
    planvital: '29',
    provida: '08',
    'uno': '35',
  };
  for (const [k, v] of Object.entries(mapa)) {
    if (clave.includes(k)) return v;
  }
  return '00';
}

function mapearCodigoSalud(nombre, saludTipo) {
  if (saludTipo === 'FONASA') return '07';
  const clave = normalizarClave(nombre);
  if (!clave) return '00';
  if (clave.includes('banmedica')) return '01';
  if (clave.includes('consalud')) return '02';
  if (clave.includes('colmena')) return '04';
  if (clave.includes('cruz')) return '05';
  if (clave.includes('nueva masvida') || clave.includes('masvida')) return '06';
  if (clave.includes('fonasa')) return '07';
  return '00';
}

function rutValido(rut, dv) {
  if (!rut?.trim() || !dv?.trim()) return false;
  const cuerpo = rut.replace(/\D/g, '');
  if (cuerpo.length < 7) return false;
  let multiplier = 2;
  let sum = 0;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    sum += Number(cuerpo[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expected = 11 - (sum % 11);
  const dvEsperado = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  return dvEsperado.toUpperCase() === dv.trim().toUpperCase();
}

function esPlaceholder(valor) {
  if (!valor?.trim()) return true;
  const t = valor.trim();
  return t === '—' || t === '-' || /^[\s—\-–]*$/.test(t);
}

function evaluarAptitudPrevired({ trabajador, persona, vista }) {
  const bloqueos = [];
  const nombre = trabajador.nombre_trabajador?.trim() || persona?.nombres || 'Trabajador';

  if (trabajador.id_persona == null) {
    bloqueos.push('sin persona vinculada en liquidación');
  }
  if (!vista) {
    bloqueos.push('ficha no disponible en vw_persona_factores');
  }
  if (!rutValido(vista?.rut ?? persona?.rut, vista?.dv ?? persona?.dv)) {
    bloqueos.push('RUT no válido');
  }
  if (esPlaceholder(vista?.apellido_paterno)) {
    bloqueos.push('falta apellido paterno');
  }
  if (esPlaceholder(vista?.nombres)) {
    bloqueos.push('faltan nombres');
  }
  const sexo = (vista?.sexo ?? persona?.sexo ?? '').trim().toUpperCase();
  if (sexo !== 'M' && sexo !== 'F') {
    bloqueos.push('falta sexo registral');
  }
  const regimen = vista?.tipo_prevision ?? 'AFP';
  const codigoAfp = mapearCodigoAfpDesdeNombre(vista?.afp_nombre);
  if (regimen === 'AFP' && (!codigoAfp || codigoAfp === '00')) {
    bloqueos.push('AFP no reconocida');
  }
  const saludTipo = vista?.salud_tipo;
  if (!saludTipo) {
    bloqueos.push('falta institución de salud');
  } else {
    const codSalud = mapearCodigoSalud(vista?.salud_nombre_full, saludTipo);
    if (!codSalud || codSalud === '00') {
      bloqueos.push('salud no reconocida para Previred');
    }
  }

  return { apto: bloqueos.length === 0, bloqueos };
}

function clasificarCausa({ persona, vista, aptitud, trabajador }) {
  if (!persona) return 'sin_persona';
  if (persona.apto_para_remuneraciones && !aptitud.apto) {
    if (!vista) return 'vista_incompleta';
    if (
      trabajador.id_contrato != null
      && vista.id_contrato != null
      && trabajador.id_contrato !== vista.id_contrato
    ) {
      return 'contrato_sin_match';
    }
    return 'flag_incorrecto';
  }
  if (persona.apto_para_remuneraciones && persona.estado_ficha !== 'VALIDO') {
    return 'flag_inconsistente';
  }
  if (!aptitud.apto && !vista) return 'vista_incompleta';
  if (aptitud.apto) return 'ok';
  return 'ficha_incompleta';
}

async function resolverNomina(sb, args) {
  if (args.nominaId) {
    const { data, error } = await sb
      .from('nomina_periodo')
      .select('id, periodo, estado')
      .eq('id', args.nominaId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Nómina no encontrada: ${args.nominaId}`);
    return data;
  }
  if (!args.periodo) {
    throw new Error('Indique --periodo YYYY-MM o --nomina-periodo-id <uuid>');
  }
  const { data, error } = await sb
    .from('nomina_periodo')
    .select('id, periodo, estado')
    .eq('periodo', args.periodo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Nómina no encontrada para periodo ${args.periodo}`);
  return data;
}

async function main() {
  const args = parseArgs(process.argv);
  const sb = await createSb();
  const nomina = await resolverNomina(sb, args);

  const { data: liqPeriodo, error: liqError } = await sb
    .from('nomina_liquidacion_periodo')
    .select('id_liquidacion_periodo, periodo, version, activo')
    .eq('id_nomina_periodo', nomina.id)
    .eq('activo', true)
    .order('fecha_generacion', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (liqError) throw liqError;
  if (!liqPeriodo) {
    console.error('No hay liquidación oficial activa para esta nómina.');
    process.exit(1);
  }

  const { data: trabajadores, error: trabError } = await sb
    .from('nomina_liquidacion_trabajador')
    .select('id_liquidacion_trabajador, id_persona, id_contrato, rut, nombre_trabajador')
    .eq('id_liquidacion_periodo', liqPeriodo.id_liquidacion_periodo)
    .order('nombre_trabajador');
  if (trabError) throw trabError;

  const idsPersona = [...new Set((trabajadores ?? []).map((t) => t.id_persona).filter(Boolean))];

  const { data: personas, error: persError } = idsPersona.length
    ? await sb
        .from('persona')
        .select('id_persona, rut, dv, nombres, sexo, estado, estado_ficha, apto_para_remuneraciones, fecha_activacion')
        .in('id_persona', idsPersona)
    : { data: [], error: null };
  if (persError) throw persError;

  const { data: vistas, error: vistaError } = idsPersona.length
    ? await sb
        .from('vw_persona_factores')
        .select(
          'id_persona, id_contrato, rut, dv, nombres, apellido_paterno, apellido_materno, sexo, tipo_prevision, afp_nombre, salud_tipo, salud_nombre_full',
        )
        .in('id_persona', idsPersona)
    : { data: [], error: null };
  if (vistaError) throw vistaError;

  const personaById = new Map((personas ?? []).map((p) => [p.id_persona, p]));
  const vistaByPersona = new Map();
  for (const v of vistas ?? []) {
    if (v.id_persona != null && !vistaByPersona.has(v.id_persona)) {
      vistaByPersona.set(v.id_persona, v);
    }
  }

  const filas = (trabajadores ?? []).map((trabajador) => {
    const persona = personaById.get(trabajador.id_persona) ?? null;
    const vista = vistaByPersona.get(trabajador.id_persona) ?? null;
    const aptitud = evaluarAptitudPrevired({ trabajador, persona, vista });
    const causa = clasificarCausa({ persona, vista, aptitud, trabajador });
    return {
      rut: trabajador.rut ?? `${persona?.rut ?? '?'}${persona?.dv ? `-${persona.dv}` : ''}`,
      nombre: trabajador.nombre_trabajador,
      idPersona: trabajador.id_persona,
      idContratoLiq: trabajador.id_contrato,
      idContratoVista: vista?.id_contrato ?? null,
      estado: persona?.estado ?? null,
      estadoFicha: persona?.estado_ficha ?? null,
      aptoNomina: persona?.apto_para_remuneraciones === true,
      aptoPrevired: aptitud.apto,
      causa,
      bloqueos: aptitud.bloqueos,
    };
  });

  const resumen = {
    nomina: { id: nomina.id, periodo: nomina.periodo, estado: nomina.estado },
    liquidacion: liqPeriodo,
    total: filas.length,
    listosPrevired: filas.filter((f) => f.aptoPrevired).length,
    noAptosPrevired: filas.filter((f) => !f.aptoPrevired).length,
    flagsIncorrectos: filas.filter((f) => f.causa === 'flag_incorrecto' || f.causa === 'flag_inconsistente').length,
    filas,
  };

  if (args.json) {
    const outPath = resolve(process.cwd(), 'tmp', 'diag-previred-personales.json');
    mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true });
    writeFileSync(outPath, JSON.stringify(resumen, null, 2));
    console.log(`JSON: ${outPath}`);
  }

  console.log(`\n=== Previred personales — ${nomina.periodo} ===`);
  console.log(`Nómina: ${nomina.id} (${nomina.estado})`);
  console.log(`Liquidación: #${liqPeriodo.id_liquidacion_periodo} v${liqPeriodo.version}`);
  console.log(
    `Trabajadores: ${resumen.total} · listos Previred: ${resumen.listosPrevired} · incompletos: ${resumen.noAptosPrevired} · flags sospechosos: ${resumen.flagsIncorrectos}`,
  );
  console.table(
    filas.map((f) => ({
      rut: f.rut,
      nombre: f.nombre,
      apto_nomina: f.aptoNomina ? 'Sí' : 'No',
      apto_previred: f.aptoPrevired ? 'Sí' : 'No',
      causa: f.causa,
      bloqueos: f.bloqueos.join('; ') || '—',
    })),
  );

  if (resumen.noAptosPrevired > 0) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
