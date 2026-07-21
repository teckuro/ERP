/**
 * Aplica la plantilla Reset password al proyecto hosted vía Management API.
 *
 * Uso:
 *   set SUPABASE_ACCESS_TOKEN=...   (https://supabase.com/dashboard/account/tokens)
 *   node scripts/apply-recovery-email-template.mjs
 *
 * Opcional:
 *   set SUPABASE_PROJECT_REF=mjrckxodzrfkyqjkyjkn
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'mjrckxodzrfkyqjkyjkn';
const token = process.env.SUPABASE_ACCESS_TOKEN;
const subject = 'Restablecer contraseña — ERP Remuneraciones';
const htmlPath = resolve('supabase/templates/recovery.html');

if (!token) {
  console.error('Falta SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens).');
  process.exit(1);
}

const content = readFileSync(htmlPath, 'utf8');

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mailer_subjects_recovery: subject,
    mailer_templates_recovery_content: content,
  }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Error ${res.status}: ${text}`);
  process.exit(1);
}

console.log(`Plantilla recovery aplicada en proyecto ${projectRef}.`);
console.log(`Asunto: ${subject}`);
