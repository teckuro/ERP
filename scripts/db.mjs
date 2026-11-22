// Ejecuta SQL contra una base del proyecto sin exponer credenciales.
//
//   npm run db:dev  -- <archivo.sql>        → dev (erp-staging, .env.staging). Lectura y escritura.
//   npm run db:dev  -- --sql "select 1"
//   npm run db:prod -- <archivo.sql>        → producción (.env). SIEMPRE solo lectura.
//
// Las migraciones se prueban en dev. En producción se aplican aparte, con el OK explícito del usuario.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

const AMBIENTES = {
  dev: { archivo: '.env.staging', variable: 'STAGING_DB_URL', soloLectura: false, nombre: 'DEV (erp-staging)' },
  prod: { archivo: '.env', variable: 'SUPABASE_DB_URL', soloLectura: true, nombre: 'PRODUCCIÓN (solo lectura)' },
};

const [ambienteArg, ...resto] = process.argv.slice(2);
const ambiente = AMBIENTES[ambienteArg];
if (!ambiente) {
  console.error('Uso: node scripts/db.mjs <dev|prod> <archivo.sql> | --sql "<consulta>"');
  process.exit(1);
}

loadEnv({ path: resolve(ambiente.archivo), quiet: true });
const url = process.env[ambiente.variable]?.trim();
if (!url) {
  console.error(`Falta ${ambiente.variable} en ${ambiente.archivo}.`);
  process.exit(1);
}

const iSql = resto.indexOf('--sql');
const entrada = iSql >= 0 ? ['-c', resto[iSql + 1] ?? ''] : resto[0] ? ['-f', resto[0]] : null;
if (!entrada) {
  console.error('Indique un archivo .sql o --sql "<consulta>".');
  process.exit(1);
}

// Oculta cualquier valor entre comillas y cualquier URL de conexión en los mensajes de error.
const ocultar = (texto) =>
  texto.replace(/postgres(ql)?:\/\/\S+/gi, 'postgresql://***').replace(/"[^"]*"/g, '"***"');

console.error(`→ ${ambiente.nombre}`);

// Solo lectura: el pooler de Supabase ignora PGOPTIONS, así que el SQL va dentro de una
// transacción READ ONLY que termina en ROLLBACK. Cualquier escritura falla y nada se guarda.
let args = [url, '-X', '-v', 'ON_ERROR_STOP=1', ...entrada];
let stdinScript = null;
if (ambiente.soloLectura) {
  const cuerpo = entrada[0] === '-c' ? `${entrada[1]};` : `\\i '${resolve(entrada[1]).replace(/\\/g, '/')}'`;
  stdinScript = `begin transaction read only;\n${cuerpo}\nrollback;\n`;
  args = [url, '-X', '-v', 'ON_ERROR_STOP=1', '-f', '-'];
}

const psql = spawn('psql', args, {
  env: { ...process.env, PGCLIENTENCODING: 'UTF8' },
  stdio: [stdinScript ? 'pipe' : 'inherit', 'inherit', 'pipe'],
});
if (stdinScript) psql.stdin.end(stdinScript);
psql.stderr.on('data', (chunk) => process.stderr.write(ocultar(chunk.toString())));
psql.on('close', (codigo) => process.exit(codigo ?? 1));
