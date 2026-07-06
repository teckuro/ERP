/**
 * Diagnóstico completo del resumen que ve la UI en Preparar nómina.
 * Uso: node scripts/diag-nomina-preparar-resumen.mjs [YYYY-MM]
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { mesActualYm } from './lib/parametros-e2e-db.mjs';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const periodo = process.argv[2] ?? mesActualYm();
const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const supabase = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function periodoRango(p) {
  const [y, m] = p.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { inicio: `${p}-01`, fin: `${p}-${String(last).padStart(2, '0')}` };
}

function vigenciaQuery(q, p) {
  const { inicio, fin } = periodoRango(p);
  return q.lte('vigencia_inicio', fin).or(`vigencia_fin.is.null,vigencia_fin.gte.${inicio}`);
}

function toNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function revisarGruposMinimos({ fila, catalogos }) {
  const grupos = [];
  const exacta = fila != null && fila.periodo === periodo;
  const sisOk = fila != null && exacta && fila.sis != null;

  if (!fila) {
    grupos.push({ id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE', detalle: 'sin_fila' });
    grupos.push({ id: 'topes_base', clasificacion: 'FALTANTE', detalle: 'sin_fila' });
  } else if (!exacta) {
    grupos.push({ id: 'mensuales_uf_utm_sueldo', clasificacion: 'PARCIAL' });
    grupos.push({ id: 'topes_base', clasificacion: 'PARCIAL' });
  } else {
    const invalidos = [
      fila.uf == null || fila.uf === 0,
      fila.utm == null || fila.utm === 0,
      (fila.sueldoMinimo18a65 ?? fila.sueldoMinimo) == null || (fila.sueldoMinimo18a65 ?? fila.sueldoMinimo) === 0,
    ].filter(Boolean).length;
    grupos.push({
      id: 'mensuales_uf_utm_sueldo',
      clasificacion: invalidos === 0 ? 'OK' : invalidos === 3 ? 'FALTANTE' : 'PARCIAL',
    });
    const topesOk =
      (fila.topeAfp != null || fila.topeAfpUf != null) &&
      (fila.topeIps != null || fila.topeIpsUf != null) &&
      (fila.topeCesantia != null || fila.topeCesantiaUf != null);
    grupos.push({
      id: 'topes_base',
      clasificacion: topesOk ? 'OK' : 'FALTANTE',
      detalle: topesOk ? undefined : 'topes_incompletos',
    });
  }

  const okCat =
    catalogos.afp.length > 0 &&
    catalogos.tramosImpuesto.length > 0 &&
    catalogos.tablaImpuestoUnico.length > 0;
  grupos.push({
    id: 'catalogos_afp_impuesto',
    clasificacion: okCat ? 'OK' : 'FALTANTE',
    detalle: okCat ? undefined : 'afp_o_impuesto_vacio',
  });

  if (catalogos) {
    grupos.push({
      id: 'sis_fila_mensual',
      clasificacion: sisOk ? 'OK' : exacta ? 'PARCIAL' : 'FALTANTE',
    });
  }

  return grupos;
}

function mapItemEstado(clasificacion) {
  if (clasificacion === 'OK') return 'ok';
  if (clasificacion === 'FALTANTE') return 'bloqueo';
  return 'revisar';
}

console.log(`[preparar-diag] periodo=${periodo}`);

const { data: pgRows, error: pgErr } = await supabase.from('parametros_generales').select('*').eq('periodo', periodo);
if (pgErr) {
  console.error('[preparar-diag] error parametros_generales:', pgErr.message);
  process.exit(1);
}

const row = pgRows?.[0] ?? null;
const fila = row
  ? {
      periodo: row.periodo,
      uf: toNum(row.uf),
      utm: toNum(row.utm),
      sueldoMinimo: toNum(row.sueldo_minimo),
      sueldoMinimo18a65: toNum(row.sueldo_minimo18_65),
      topeAfp: toNum(row.tope_afp),
      topeAfpUf: toNum(row.tope_afp_uf),
      topeIps: toNum(row.tope_ips),
      topeIpsUf: toNum(row.tope_ips_uf),
      topeCesantia: toNum(row.tope_cesantia),
      topeCesantiaUf: toNum(row.tope_cesantia_uf),
      sis: toNum(row.sis),
    }
  : null;

console.log('[preparar-diag] fila oficial:', fila ? 'si' : 'NO', fila ?? '');

const { inicio, fin } = periodoRango(periodo);
const [
  { data: afp, error: afpErr },
  { data: tablaImpuesto, error: tiErr },
  { data: tramoImpuesto, error: trErr },
  { data: cliente, error: cliErr },
] = await Promise.all([
  vigenciaQuery(supabase.from('afp').select('*'), periodo),
  supabase.from('tabla_impuesto_unico').select('*').eq('periodo', periodo),
  supabase.from('tramo_impuesto').select('*').eq('periodo', periodo),
  supabase.from('parametros_generales_cliente').select('*').eq('periodo', periodo).maybeSingle(),
]);

const tramosImpuesto =
  (tablaImpuesto?.length ?? 0) > 0
    ? tablaImpuesto
    : tramoImpuesto;

const catalogos = {
  afp: afp ?? [],
  tramosImpuesto: tramosImpuesto ?? [],
  tablaImpuestoUnico: tablaImpuesto ?? [],
};

console.log('[preparar-diag] catalogos:', {
  afp: catalogos.afp.length,
  tramosImpuesto: catalogos.tramosImpuesto.length,
  tablaImpuestoUnico: catalogos.tablaImpuestoUnico.length,
  afpErr: afpErr?.message,
  tiErr: tiErr?.message,
  trErr: trErr?.message,
  cliente: cliente ? 'si' : 'NO',
  cliErr: cliErr?.message,
});

const grupos = revisarGruposMinimos({ fila, catalogos });
const items = grupos.map((g) => ({
  id: g.id,
  clasificacion: g.clasificacion,
  estado: mapItemEstado(g.clasificacion),
  detalle: g.detalle,
}));

const bloqueos = items.filter((i) => i.estado === 'bloqueo');
const revisiones = items.filter((i) => i.estado === 'revisar');

console.log('[preparar-diag] grupos:', JSON.stringify(items, null, 2));
console.log('[preparar-diag] bloqueos:', bloqueos.length, 'revisiones:', revisiones.length);
console.log('[preparar-diag] rama preparar:', bloqueos.length > 0 ? 'BLOQUEADO' : 'guardar/continuar');

if (bloqueos.length > 0) {
  console.log('[preparar-diag] >>> items que bloquean:', bloqueos);
}
