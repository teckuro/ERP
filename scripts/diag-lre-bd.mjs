/**
 * Diagnóstico rápido BD LRE / conceptos / liquidaciones.
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const dbUrl = (process.env.SUPABASE_DB_URL ?? '').trim();
if (!dbUrl) {
  console.error('SUPABASE_DB_URL no definida');
  process.exit(1);
}

function q(sql) {
  return execFileSync('psql', [dbUrl, '-At', '-c', sql], { encoding: 'utf8' }).trim();
}

console.log('=== CONCEPTOS CLAVE ===');
console.log(
  q(`
SELECT codigo || '|' || COALESCE(id_catalogo_lre::text,'') || '|' || COALESCE(codigo_motor,'') || '|' || COALESCE(estrategia_lre,'')
FROM concepto
WHERE codigo IN ('SUELDO_BASE','AFP','SALUD','CESANTIA','BONO','HORAS_EXTRAS','HORAS_EXTRA','IMPUESTO_RENTA','IMPUESTO_UNICO','GRATIFICACION','MOVILIZACION')
ORDER BY codigo;
`),
);
console.log('\n=== HUÉRFANOS DIRECTO ===');
console.log(
  q(`
SELECT codigo FROM concepto
WHERE estrategia_lre = 'DIRECTO' AND requiere_exportacion_lre = TRUE AND id_catalogo_lre IS NULL
  AND codigo NOT IN ('INASISTENCIA','ZONA_EXTREMA','AFP_EMPLEADOR');
`),
);
console.log('\n=== CATALOGO LRE vigente ===', q('SELECT COUNT(*) FROM catalogo_lre WHERE vigente'));
console.log('=== LIQUIDACIONES activas ===', q('SELECT COUNT(*) FROM nomina_liquidacion_periodo WHERE activo'));
console.log('=== LINEAS sin codigo_lre (monto<>0) ===', q("SELECT COUNT(*) FROM nomina_liquidacion_concepto WHERE COALESCE(TRIM(codigo_lre),'') = '' AND monto <> 0"));
console.log('=== LINEAS con codigo_lre ===', q("SELECT COUNT(*) FROM nomina_liquidacion_concepto WHERE COALESCE(TRIM(codigo_lre),'') <> '' AND monto <> 0"));
console.log('\n=== NOMINA PERIODOS ===');
console.log(q('SELECT id::text || \'|\' || periodo || \'|\' || tipo || \'|\' || COALESCE(estado,\'\') FROM nomina_periodo ORDER BY periodo DESC LIMIT 5'));
console.log('\n=== LIQ PERIODO ===');
console.log(q('SELECT id_liquidacion_periodo::text || \'|\' || periodo || \'|\' || activo::text FROM nomina_liquidacion_periodo'));
console.log('\n=== LIQ TRAB / CONCEPTOS ===');
console.log(q('SELECT COUNT(*)::text || \' trab, \' || (SELECT COUNT(*) FROM nomina_liquidacion_concepto)::text || \' lineas\' FROM nomina_liquidacion_trabajador'));
console.log('\n=== CALCULO SNAPSHOT ===');
console.log(q('SELECT COUNT(*) FROM nomina_calculo_periodo'));
const calcId = q(`SELECT id_calculo_periodo FROM nomina_calculo_periodo WHERE periodo='2026-05' AND activo ORDER BY id_calculo_periodo DESC LIMIT 1`);
if (calcId) {
  console.log('\n=== CALC ACTIVO 2026-05 id ===', calcId);
  console.log('trabajadores:', q(`SELECT COUNT(*) FROM nomina_calculo_trabajador WHERE id_calculo_periodo=${calcId}`));
  console.log('conceptos calc:', q(`SELECT COUNT(*) FROM nomina_calculo_concepto c JOIN nomina_calculo_trabajador t ON t.id_calculo_trabajador=c.id_calculo_trabajador WHERE t.id_calculo_periodo=${calcId}`));
  console.log('conceptos con LRE:', q(`SELECT COUNT(*) FROM nomina_calculo_concepto c JOIN nomina_calculo_trabajador t ON t.id_calculo_trabajador=c.id_calculo_trabajador WHERE t.id_calculo_periodo=${calcId} AND COALESCE(TRIM(c.codigo_lre_snapshot),'') <> ''`));
  console.log('sample LRE:', q(`SELECT codigo_lre_snapshot, nombre_concepto_snapshot, monto FROM nomina_calculo_concepto c JOIN nomina_calculo_trabajador t ON t.id_calculo_trabajador=c.id_calculo_trabajador WHERE t.id_calculo_periodo=${calcId} AND monto<>0 LIMIT 5`));
}
