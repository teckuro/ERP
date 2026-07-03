/**
 * Utilidades compartidas para check/seed de fixtures E2E F20 (nóminas).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAPA_NATURALEZA = {
  liquidacion_legal: 'Liquidación legal',
  anticipo: 'Anticipo',
  pago_extraordinario: 'Pago extraordinario',
  rectificacion: 'Rectificación',
};

const MAPA_TIPO = {
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  semanal: 'Semanal',
  extraordinaria: 'Extraordinaria',
};

/** Réplica de `etiquetaMetaNomina` (admin-nominas-presentacion.util.ts). */
export function etiquetaMetaNomina(fila) {
  const partes = [];
  if (fila.naturaleza !== 'liquidacion_legal') {
    partes.push(MAPA_NATURALEZA[fila.naturaleza] ?? fila.naturaleza);
  }
  if (fila.tipo !== 'mensual') {
    partes.push(MAPA_TIPO[fila.tipo] ?? fila.tipo);
  }
  return partes.join(' · ');
}

export function metaIncluye(fila, ...partes) {
  const meta = etiquetaMetaNomina(fila).toLowerCase();
  return partes.every((p) => meta.includes(p.toLowerCase()));
}

export function esMensualLegalSinAnticipos(fila) {
  return etiquetaMetaNomina(fila).trim().length === 0;
}

export function agruparPorPeriodo(filas) {
  const mapa = new Map();
  for (const fila of filas) {
    const lista = mapa.get(fila.periodo) ?? [];
    lista.push(fila);
    mapa.set(fila.periodo, lista);
  }
  return mapa;
}

export function periodoE2eDefault() {
  const env = process.env['E2E_NOMINA_PERIODO']?.trim();
  if (env && /^\d{4}-\d{2}$/.test(env)) return env;
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function loadAppConfig() {
  const configPath = path.join(__dirname, '..', '..', 'public', 'app-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Falta public/app-config.json');
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const supabaseUrl = (parsed.supabaseUrl ?? '').replace(/\/$/, '');
  const supabaseAnonKey = parsed.supabaseAnonKey ?? '';
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
    throw new Error('supabaseUrl / supabaseAnonKey incompletos en app-config');
  }
  return { supabaseUrl, supabaseAnonKey };
}

export async function loginE2eNomina(client) {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  if (!email || !password) {
    throw new Error('Defina E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD en .env');
  }
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login → ${error.message}`);
  return email;
}

export async function listarNominasBandeja(client) {
  const { data, error } = await client
    .from('nomina_periodo')
    .select(
      'id, periodo, tipo, naturaleza, estado, codigo_ciclo, total_trabajadores, total_advertencias, total_incidencias_criticas',
    )
    .order('periodo', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listar nomina_periodo → ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    periodo: row.periodo,
    tipo: row.tipo,
    naturaleza: row.naturaleza,
    estado: row.estado,
    codigoCiclo: row.codigo_ciclo,
    totalTrabajadores: row.total_trabajadores ?? 0,
    totalAdvertencias: row.total_advertencias ?? 0,
    totalIncidenciasCriticas: row.total_incidencias_criticas ?? 0,
  }));
}

/** Matriz F20 — qué falta en BD para des-skip Playwright. */
export function evaluarFixturesF20(filas, opts = {}) {
  const partialReady = Boolean(
    process.env['E2E_NOMINA_PARTIAL_EMAIL'] && process.env['E2E_NOMINA_PARTIAL_PASSWORD'],
  );
  const porPeriodo = agruparPorPeriodo(filas);
  const quincenales = filas.filter((f) => metaIncluye(f, 'Anticipo', 'Quincenal'));
  const quincenalesPorPeriodo = [...agruparPorPeriodo(quincenales).entries()].find(
    ([, g]) => g.length >= 2,
  );

  const periodoMixto = [...porPeriodo.entries()].find(([, grupo]) => {
    const tieneAnticipo = grupo.some((f) => metaIncluye(f, 'Anticipo'));
    const tieneExtra = grupo.some(
      (f) => metaIncluye(f, 'Extraordinaria') || metaIncluye(f, 'Pago extraordinario'),
    );
    return tieneAnticipo && tieneExtra;
  });

  return [
    {
      id: 'F20-01',
      ok: filas.some((f) => esMensualLegalSinAnticipos(f) && !String(f.estado).includes('cerrada')),
      falta: 'Nómina mensual legal abierta (sin meta Anticipo/Extraordinaria).',
    },
    {
      id: 'F20-02',
      ok: filas.some((f) => metaIncluye(f, 'Anticipo', 'Semanal')),
      falta: 'Nómina Anticipo · Semanal (gate F09/F10).',
    },
    {
      id: 'F20-03',
      ok: Boolean(quincenalesPorPeriodo),
      falta: '≥2 nóminas Anticipo · Quincenal del mismo período.',
    },
    {
      id: 'F20-04',
      ok: filas.some(
        (f) => metaIncluye(f, 'Extraordinaria') || metaIncluye(f, 'Pago extraordinario'),
      ),
      falta: 'Nómina extraordinaria en bandeja.',
    },
    {
      id: 'F20-05',
      ok: Boolean(periodoMixto),
      falta: 'Mismo período con anticipo y extraordinaria.',
    },
    {
      id: 'F20-06',
      ok: filas.some((f) => (f.totalAdvertencias ?? 0) > 0),
      falta: 'Nómina con advertencias pendientes (total_advertencias > 0).',
      manual: true,
    },
    {
      id: 'F20-07',
      ok: filas.some((f) => (f.totalIncidenciasCriticas ?? 0) > 0),
      falta: 'Nómina con incidencias críticas pendientes.',
      manual: true,
    },
    {
      id: 'F20-08',
      ok: partialReady,
      falta: 'E2E_NOMINA_PARTIAL_EMAIL y E2E_NOMINA_PARTIAL_PASSWORD en .env.',
      manual: true,
    },
    {
      id: 'F20-09',
      ok: filas.length >= 1,
      falta: 'Al menos 1 nómina en bandeja.',
    },
    {
      id: 'F20-10',
      ok: [...porPeriodo.values()].some((g) => g.length >= 2),
      falta: '≥2 nóminas del mismo período (BKL-08).',
    },
    {
      id: 'F20-11',
      ok: filas.some((f) => String(f.estado).toLowerCase().includes('cerrada')),
      falta: 'Nómina cerrada para validar inmutabilidad.',
      manual: true,
    },
    {
      id: 'F20-12',
      ok: filas.some((f) => f.naturaleza === 'rectificacion'),
      falta: 'Nómina rectificación o cerrada con gate de rectificación.',
      manual: true,
    },
    {
      id: 'F20-13',
      ok: true,
      falta: null,
      nota: 'No requiere datos; simula fallo de red.',
    },
    {
      id: 'F20-14',
      ok: filas.length >= 2,
      falta: 'Al menos 2 nóminas en bandeja para concurrencia.',
    },
    {
      id: 'BKL-08-dotacion',
      ok: filas.some((f) => (f.totalTrabajadores ?? 0) >= (opts.dotacionMin ?? 50)),
      falta: `Dotación ≥${opts.dotacionMin ?? 50} trabajadores (E2E_NOMINA_DOTACION_MIN).`,
      manual: true,
    },
  ];
}
