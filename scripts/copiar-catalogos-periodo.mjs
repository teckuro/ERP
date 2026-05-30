/**
 * Copia catálogos mensuales de un período origen a uno destino (p. ej. 2026-05 → 2026-06).
 *
 * Uso: node scripts/copiar-catalogos-periodo.mjs --origen 2026-05 --destino 2026-06
 */
import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { ensurePeriodoRemuneracionAbierto, mesActualYm, parsePeriodoYm, resolveParametrosDbUrl, runPsql } from './lib/parametros-e2e-db.mjs';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

function psqlAt(dbUrl, sql) {
  return execFileSync('psql', [dbUrl, '-At', '-c', sql], { encoding: 'utf8' }).trim();
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  return idx === -1 || idx + 1 >= process.argv.length ? null : process.argv[idx + 1];
}

const origen = argValue('--origen') ?? mesActualYm();
const destino = argValue('--destino') ?? mesActualYm();

for (const periodo of [origen, destino]) {
  parsePeriodoYm(periodo);
}

const dbUrl = resolveParametrosDbUrl();
const tablas = [
  'tramo_carga',
  'tramo_impuesto',
  'tabla_impuesto_unico',
  'ley_16744_parametros',
  'afc_parametro',
];

console.log(`[copiar catalogos] ${origen} -> ${destino}`);

ensurePeriodoRemuneracionAbierto(dbUrl, destino);

for (const tabla of tablas) {
  const safeOrigen = origen.replace(/'/g, "''");
  const safeDestino = destino.replace(/'/g, "''");
  const colsRaw = psqlAt(
    dbUrl,
    `SELECT string_agg(c.column_name, ', ' ORDER BY c.ordinal_position)
     FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = '${tabla}'
       AND c.column_name NOT IN (
         SELECT a.attname::text
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
         WHERE i.indrelid = ('public.' || '${tabla}')::regclass AND i.indisprimary
       );`,
  );

  if (!colsRaw) {
    console.warn(`[copiar catalogos] omitida ${tabla}: sin columnas`);
    continue;
  }

  const generatedPeriodo = psqlAt(
    dbUrl,
    `SELECT CASE WHEN EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = '${tabla}'
         AND column_name = 'periodo' AND is_generated = 'ALWAYS'
     ) THEN 'true' ELSE 'false' END;`,
  ) === 'true';

  const insertCols = generatedPeriodo
    ? colsRaw.split(',').map((c) => c.trim()).filter((c) => c !== 'periodo').join(', ')
    : colsRaw;

  const selectCols = colsRaw
    .split(',')
    .map((c) => c.trim())
    .filter((c) => !generatedPeriodo || c !== 'periodo')
    .map((c) => {
      if (c === 'periodo') return `'${safeDestino}' AS periodo`;
      if (generatedPeriodo && c === 'vigencia_inicio') {
        return `'${destino}-01'::date AS vigencia_inicio`;
      }
      return c;
    })
    .join(', ');

  runPsql(dbUrl, `DELETE FROM public.${tabla} WHERE periodo = '${safeDestino}';`);
  try {
    runPsql(
      dbUrl,
      `INSERT INTO public.${tabla} (${insertCols})
       SELECT ${selectCols}
       FROM public.${tabla}
       WHERE periodo = '${safeOrigen}';`,
    );
  } catch (err) {
    const msg = String(err.message ?? err);
    if (/duplicate key|uq_/i.test(msg)) {
      console.warn(`[copiar catalogos] ${tabla}: omitida por conflicto de unicidad (${msg.split('\n')[0]})`);
      continue;
    }
    throw err;
  }

  const count = psqlAt(
    dbUrl,
    `SELECT count(*)::text FROM public.${tabla} WHERE periodo = '${safeDestino}';`,
  );
  console.log(`[copiar catalogos] ${tabla}: ${count} filas en ${destino}`);
}

console.log('[copiar catalogos] OK');
