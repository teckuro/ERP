import { config } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Carga `.env` desde la raíz del proyecto (misma convención que `playwright.config.ts`).
 * Idempotente: dotenv no borra variables ya definidas en el entorno del proceso.
 */
config({ path: resolve(process.cwd(), '.env'), quiet: true });

/** Activa E2E de empleados con persistencia Supabase (`tests/empleados-borrador-persistencia.spec.ts`). */
export function isE2eEmpleadosBorradorEnabled(): boolean {
  const v = (process.env['E2E_EMPLEADOS_BORRADOR'] ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}
