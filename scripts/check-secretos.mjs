// Busca credenciales y referencias a PRODUCCIÓN antes de commitear.
//
//   npm run check:secretos            → archivos en stage (git add)
//   npm run check:secretos -- --todo  → todos los archivos versionados
//
// El id del proyecto de producción se lee de .env en tiempo de ejecución, así que este script
// no contiene ningún dato de producción. Sale con código 1 si encuentra algo.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const todo = process.argv.includes('--todo');
const listar = todo ? 'git ls-files' : 'git diff --cached --name-only --diff-filter=ACMR';
const archivos = execSync(listar, { encoding: 'utf8' }).split('\n').map((f) => f.trim()).filter(Boolean);

const IGNORAR = [/package-lock\.json$/, /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|ttf)$/i, /^scripts\/check-secretos\.mjs$/];

// Id del proyecto de producción, tomado del .env local (si existe).
const idProduccion = (() => {
  if (!existsSync('.env')) return null;
  const env = readFileSync('.env', 'utf8');
  const m = env.match(/^(?:SUPABASE_URL|E2E_SUPABASE_URL)\s*=\s*https:\/\/([a-z0-9]{20})\.supabase\.co/m)
    ?? env.match(/^SUPABASE_PROJECT_ID\s*=\s*([a-z0-9]{20})\s*$/m);
  return m?.[1] ?? null;
})();

// Contraseñas de ejemplo que no son secretos reales.
const CLAVE_DE_EJEMPLO = /^(<[^>]*>|\*+|\[[^\]]*\]|\$\{[^}]*\}|\$[A-Z_]+|password|pass|clave|contrase(ñ|n)a|secret|x{3,}|\.\.\.)$/i;

const REGLAS = [
  {
    nombre: 'Cadena de conexión con contraseña',
    buscar: (linea) =>
      [...linea.matchAll(/postgres(?:ql)?:\/\/[^:\s/@]+:([^@\s]+)@/gi)].some((m) => !CLAVE_DE_EJEMPLO.test(m[1])),
  },
  { nombre: 'Clave secreta de Supabase (sb_secret_)', buscar: (l) => /sb_secret_[A-Za-z0-9_-]{10,}/.test(l) },
  { nombre: 'Token JWT (anon/service_role)', buscar: (l) => /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(l) },
  { nombre: 'Token de acceso de Supabase (sbp_)', buscar: (l) => /sbp_[a-f0-9]{30,}/.test(l) },
  ...(idProduccion
    ? [{ nombre: 'Referencia al proyecto de PRODUCCIÓN', buscar: (l) => l.includes(idProduccion) }]
    : []),
];

const hallazgos = [];
for (const archivo of archivos) {
  if (IGNORAR.some((re) => re.test(archivo)) || !existsSync(archivo) || statSync(archivo).size > 2_000_000) continue;
  const lineas = readFileSync(archivo, 'utf8').split(/\r?\n/);
  lineas.forEach((linea, i) => {
    for (const regla of REGLAS) {
      if (regla.buscar(linea)) hallazgos.push(`${archivo}:${i + 1}  ${regla.nombre}`);
    }
  });
}

const alcance = todo ? `${archivos.length} archivos versionados` : `${archivos.length} archivos en stage`;
if (!idProduccion) console.warn('Aviso: no hay .env con la URL de producción; no se buscan referencias a ese proyecto.');
if (hallazgos.length) {
  console.error(`✗ ${hallazgos.length} hallazgo(s) en ${alcance}:`);
  for (const h of hallazgos) console.error(`  ${h}`);
  console.error('Quite los valores reales (use variables de entorno o placeholders) antes de commitear.');
  process.exit(1);
}
console.log(`✓ Sin credenciales ni referencias a producción en ${alcance}.`);
