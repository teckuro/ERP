/**
 * Siembra fixtures E2E F20 vía RPC F04/F05 (anticipos y extraordinaria).
 *
 *   node scripts/seed-nominas-e2e-fixtures.mjs --confirm
 *   node scripts/seed-nominas-e2e-fixtures.mjs --confirm --dry-run
 *
 * No cierra nóminas ni genera incidencias (F20-06/07/11/12 siguen manuales).
 * Requiere feature gates anticipos/extraordinaria habilitados para el tenant.
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

import {
  evaluarFixturesF20,
  loadAppConfig,
  loginE2eNomina,
  listarNominasBandeja,
  metaIncluye,
  periodoE2eDefault,
} from './lib/nominas-e2e-fixtures.mjs';

loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const dryRun = args.includes('--dry-run');

function log(msg) {
  console.log(`[seed e2e nominas] ${msg}`);
}

function fail(msg) {
  console.error(`[seed e2e nominas] FAIL: ${msg}`);
  process.exit(1);
}

async function obtenerPlantilla(client, tipo) {
  const { data, error } = await client
    .from('nomina_plantilla_ciclo')
    .select('id, tipo, naturaleza, codigo')
    .eq('tipo', tipo)
    .eq('naturaleza', tipo === 'extraordinaria' ? 'pago_extraordinario' : 'anticipo')
    .eq('activo', true)
    .order('version', { ascending: false })
    .limit(1);
  if (error) throw new Error(`plantilla ${tipo} → ${error.message}`);
  return data?.[0] ?? null;
}

async function cortesDelPeriodo(client, plantillaId, periodo) {
  const anio = Number.parseInt(periodo.split('-')[0], 10);
  const { data, error } = await client.rpc('previsualizar_cortes_plantilla', {
    p_plantilla_id: plantillaId,
    p_anio: anio,
    p_cantidad: 52,
  });
  if (error) throw new Error(`cortes plantilla → ${error.message}`);
  return (data ?? []).filter((c) => String(c.fecha_inicio ?? '').startsWith(periodo));
}

async function existeNomina(client, periodo, tipo, codigoCiclo) {
  let q = client
    .from('nomina_periodo')
    .select('id')
    .eq('periodo', periodo)
    .eq('tipo', tipo);
  if (codigoCiclo) {
    q = q.eq('codigo_ciclo', codigoCiclo);
  }
  const { data, error } = await q.limit(1);
  if (error) throw new Error(`existeNomina → ${error.message}`);
  return Boolean(data?.[0]);
}

async function crearNominaRpc(client, periodo, tipo, codigoCiclo) {
  const rpcArgs = {
    p_periodo: periodo,
    p_tipo: tipo,
    p_codigo_ciclo: codigoCiclo ?? undefined,
  };
  const { data: preview, error: prevErr } = await client.rpc('previsualizar_creacion_nomina', rpcArgs);
  if (prevErr) throw new Error(`preview ${tipo} → ${prevErr.message}`);
  if (!preview?.puedeCrear) {
    const conflictos = preview?.totales?.conflictos ?? '?';
    throw new Error(
      `preview ${tipo} no permite crear (conflictos=${conflictos}). ¿Ya existe o sin trabajadores aptos?`,
    );
  }
  const { data: created, error: confErr } = await client.rpc('confirmar_creacion_nomina', {
    p_periodo: periodo,
    p_tipo: tipo,
    p_fingerprint: preview.fingerprint,
    p_codigo_ciclo: codigoCiclo ?? undefined,
  });
  if (confErr) throw new Error(`confirmar ${tipo} → ${confErr.message}`);
  return created;
}

async function main() {
  if (!confirm) {
    fail('Pase --confirm para escribir en BD. Use --dry-run para simular.');
  }

  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = await loginE2eNomina(client);
  log(`Sesión ${email}`);

  const { data: gates, error: gatesErr } = await client.rpc('obtener_feature_gates_nomina');
  if (gatesErr) fail(`feature gates → ${gatesErr.message}`);
  log(`Gates: ${JSON.stringify(gates ?? {})}`);

  const periodo = periodoE2eDefault();
  log(`Período objetivo: ${periodo}`);

  let filas = await listarNominasBandeja(client);
  const plan = [];

  if (!filas.some((f) => metaIncluye(f, 'Anticipo', 'Semanal'))) {
    plan.push({ tipo: 'semanal', label: 'F20-02 anticipo semanal' });
  }
  const quincenales = filas.filter((f) => metaIncluye(f, 'Anticipo', 'Quincenal'));
  const maxQuincenalesPeriodo = Math.max(
    0,
    ...[...new Map(quincenales.map((f) => [f.periodo, quincenales.filter((q) => q.periodo === f.periodo).length])).values()],
  );
  if (maxQuincenalesPeriodo < 2) {
    plan.push({ tipo: 'quincenal', label: 'F20-03 segundo anticipo quincenal', count: 2 - maxQuincenalesPeriodo });
  }
  if (!filas.some((f) => metaIncluye(f, 'Extraordinaria') || metaIncluye(f, 'Pago extraordinario'))) {
    plan.push({ tipo: 'extraordinaria', label: 'F20-04 extraordinaria' });
  }

  if (plan.length === 0) {
    log('No hay creaciones pendientes para F20-02/03/04.');
  } else {
    log(`Plan: ${plan.map((p) => p.label).join('; ')}`);
  }

  if (dryRun) {
    log('--dry-run: sin escrituras.');
    return;
  }

  for (const item of plan) {
    if (item.tipo === 'extraordinaria') {
      if (!gates?.extraordinaria) {
        log('SKIP extraordinaria — gate nomina.extraordinaria.enabled apagado.');
        continue;
      }
      if (await existeNomina(client, periodo, 'extraordinaria', null)) {
        log(`Ya existe extraordinaria en ${periodo}`);
        continue;
      }
      const codigo = `${periodo}-EXT-E2E`;
      log(`Creando extraordinaria ${periodo} (${codigo})…`);
      await crearNominaRpc(client, periodo, 'extraordinaria', codigo);
      continue;
    }

    if (!gates?.anticipos) {
      log(`SKIP ${item.tipo} — gate nomina.anticipos.enabled apagado.`);
      continue;
    }

    const plantilla = await obtenerPlantilla(client, item.tipo);
    if (!plantilla) {
      log(`SKIP ${item.tipo} — sin plantilla activa.`);
      continue;
    }

    const cortes = await cortesDelPeriodo(client, plantilla.id, periodo);
    if (cortes.length === 0) {
      log(`SKIP ${item.tipo} — sin cortes en ${periodo} para plantilla ${plantilla.codigo}.`);
      continue;
    }

    const repeticiones = item.count ?? 1;
    let creadas = 0;
    for (const corte of cortes) {
      if (creadas >= repeticiones) break;
      const codigo = corte.codigo_ciclo;
      if (await existeNomina(client, periodo, item.tipo, codigo)) {
        continue;
      }
      log(`Creando ${item.tipo} ${periodo} corte ${codigo}…`);
      await crearNominaRpc(client, periodo, item.tipo, codigo);
      creadas += 1;
    }
    if (creadas === 0) {
      log(`No se creó ${item.tipo} — cortes ya existentes o preview bloqueado.`);
    }
  }

  filas = await listarNominasBandeja(client);
  const matriz = evaluarFixturesF20(filas);
  const gaps = matriz.filter((m) => !m.ok && !m.nota);
  log(`Post-seed: ${matriz.filter((m) => m.ok).length}/${matriz.length} requisitos F20 cubiertos.`);
  if (gaps.length > 0) {
    log('Pendientes:');
    for (const g of gaps) {
      log(`  ${g.id}: ${g.falta}${g.manual ? ' (manual)' : ''}`);
    }
  }
}

main().catch((err) => {
  fail(err.message ?? String(err));
});
