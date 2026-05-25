import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Periodo aislado pero con año presente en cabecera ERP (evita 2099 fuera de yearOptions). */
export const E2E_PARAMETROS_PERIODO_DEFAULT = '2026-06';

function normalizeSupabaseUrl(raw) {
  return (raw ?? '').replace(/\/$/, '').replace('.supabase.com', '.supabase.co');
}

function loadAppConfig() {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'public', 'app-config.json'), 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Cliente admin para inserts visibles con las mismas reglas que la UI (si hay service role). */
export function createParametrosE2eSupabaseAdmin() {
  const cfg = loadAppConfig();
  const url = normalizeSupabaseUrl(process.env.E2E_SUPABASE_URL ?? cfg.supabaseUrl ?? '');
  const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function resolveParametrosDbUrl() {
  const url =
    process.env.SUPABASE_DB_URL_LOCAL ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    '';
  if (!url.trim()) {
    throw new Error(
      'Falta SUPABASE_DB_URL_LOCAL, DATABASE_URL o SUPABASE_DB_URL para fixtures E2E de parámetros.',
    );
  }
  return url.trim();
}

export function parsePeriodoYm(periodo) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!m) {
    throw new Error(`Periodo invalido (YYYY-MM): ${periodo}`);
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    year,
    month,
    fechaInicio: `${periodo}-01`,
    fechaFin: `${periodo}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function runPsql(databaseUrl, sql) {
  try {
    return execFileSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' });
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}${err.message ?? ''}`.trim();
    throw new Error(out || 'psql fallo');
  }
}

export function purgeParametrosPeriodo(databaseUrl, periodo) {
  const safe = periodo.replace(/'/g, "''");
  const tables = [
    ['parametros_generales_cliente', 'periodo'],
    ['parametros_generales', 'periodo'],
    ['tramo_carga', 'periodo'],
    ['tramo_impuesto', 'periodo'],
    ['tabla_impuesto_unico', 'periodo'],
    ['ley_16744_parametros', 'periodo'],
  ];

  for (const [table, column] of tables) {
    try {
      runPsql(databaseUrl, `DELETE FROM public.${table} WHERE ${column} = '${safe}';`);
    } catch (err) {
      const msg = String(err.message ?? err);
      if (/does not exist|no existe/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }
}

export function ensurePeriodoRemuneracionAbierto(databaseUrl, periodo) {
  const { year, month, fechaInicio, fechaFin } = parsePeriodoYm(periodo);
  const safe = periodo.replace(/'/g, "''");
  runPsql(
    databaseUrl,
    `INSERT INTO public.periodo_remuneracion (codigo, anio, mes, fecha_inicio, fecha_fin, estado)
     VALUES ('${safe}', ${year}, ${month}, '${fechaInicio}', '${fechaFin}', 'pendiente')
     ON CONFLICT (codigo) DO UPDATE SET
       anio = EXCLUDED.anio,
       mes = EXCLUDED.mes,
       fecha_inicio = EXCLUDED.fecha_inicio,
       fecha_fin = EXCLUDED.fecha_fin,
       estado = EXCLUDED.estado;`,
  );
}

/**
 * Simula la carga oficial mensual (equivalente simplificado a run-parametros-mensuales -ApplySql).
 */
/** Vuelve a `pendiente` la decisión de reconciliación (simula nueva carga oficial tras «Mantener»). */
export function resetClienteReconciliacionEstado(databaseUrl, periodo) {
  const safe = periodo.replace(/'/g, "''");
  runPsql(
    databaseUrl,
    `UPDATE public.parametros_generales_cliente
     SET estado_reconciliacion_oficial = 'pendiente',
         fecha_reconciliacion_oficial = NULL,
         origen_reconciliacion = NULL,
         observacion_reconciliacion = NULL
     WHERE periodo = '${safe}';`,
  );
}

export async function applyOficialParametrosGenerales(databaseUrl, periodo, valores = {}) {
  const uf = valores.uf ?? 38100;
  const utm = valores.utm ?? 70000;
  const sueldoMinimo = valores.sueldoMinimo ?? 500000;
  const safe = periodo.replace(/'/g, "''");

  const supabase = createParametrosE2eSupabaseAdmin();
  if (supabase) {
    const { error: delError } = await supabase.from('parametros_generales').delete().eq('periodo', periodo);
    if (delError) {
      throw new Error(delError.message);
    }
    const { error: insError } = await supabase.from('parametros_generales').upsert({
      periodo,
      uf,
      utm,
      sueldo_minimo: sueldoMinimo,
      sueldo_minimo18_65: Math.round(sueldoMinimo * 0.75),
      gratificacion: false,
      dsctosbpordia: false,
      afc_trabajador_indefinido: 0.6,
      afc_empleador_indefinido: 2.4,
      afc_empleador_plazo: 3,
    });
    if (insError) {
      throw new Error(insError.message);
    }
    return;
  }

  runPsql(databaseUrl, `DELETE FROM public.parametros_generales WHERE periodo = '${safe}';`);
  runPsql(
    databaseUrl,
    `INSERT INTO public.parametros_generales (
       periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion,
       tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia,
       afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo
     ) VALUES (
       '${safe}', ${uf}, ${utm}, ${sueldoMinimo}, ${Math.round(sueldoMinimo * 0.75)}, FALSE, NULL,
       3500000, 2300000, 5200000, 1900000, 1.5, FALSE,
       0.6, 2.4, 3.0
     );`,
  );
}
