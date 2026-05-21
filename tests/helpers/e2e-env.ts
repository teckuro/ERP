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

/** Activa E2E que crea fixtures de empleados para pruebas de errores de remuneraciones. */
export function isE2eEmpleadosNominaFixturesEnabled(): boolean {
  const v = (process.env['E2E_EMPLEADOS_NOMINA_FIXTURES'] ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** Activa E2E real de Preparar nomina con sesion Supabase authenticated. */
export function isE2eNominaRealEnabled(): boolean {
  const v = (process.env['E2E_NOMINA_REAL'] ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** Activa smoke UI del epic NOM-MENSUAL-FLOW-UNIFICADO-03 (mismas credenciales que E2E real). */
export function isE2eNominaFlowUiEnabled(): boolean {
  const v = (process.env['E2E_NOMINA_FLOW_UI'] ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}
