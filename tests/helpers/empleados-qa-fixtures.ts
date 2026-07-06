import fs from 'node:fs';
import path from 'node:path';

/** RUTs documentados en `scripts/auditoria-empleados-fixtures.mjs` (U1–U8). */
export const QA_AUDITORIA_RUT = {
  U1: '25050001',
  U2: '25050002',
  U3: '25050003',
  U4: '25050004',
  U5: '25050005',
  U6: '25050006',
  U7: '25050007',
  U8: '25050008',
} as const;

/** RUTs `scripts/seed-empleados-prueba-errores.mjs` (ERR01–10). */
export const QA_ERR_RUT_PREFIX = '261000';

export function rutDv(body: string): string {
  let multiplier = 2;
  let sum = 0;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expectedValue = 11 - (sum % 11);
  return expectedValue === 11 ? '0' : expectedValue === 10 ? 'K' : String(expectedValue);
}

/** Formato chileno `XX.XXX.XXX-D` para grilla y formulario. */
export function formatRutDisplay(body: string): string {
  const dv = rutDv(body);
  const b = body.padStart(8, '0').slice(-8);
  return `${b.slice(0, 2)}.${b.slice(2, 5)}.${b.slice(5, 8)}-${dv}`;
}

/** `id_persona` tras `global-setup` / `auditoria-empleados-fixtures.mjs`. */
export function readAuditoriaPersonaId(key: string): number | null {
  const reportPath = path.join(process.cwd(), 'tmp', 'auditoria-qaemp2505-result.json');
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    usuarios?: Array<{ key: string; id_persona: number }>;
  };
  return report.usuarios?.find((u) => u.key === key)?.id_persona ?? null;
}

export const QA_DISPLAY_RUT = {
  U1: formatRutDisplay(QA_AUDITORIA_RUT.U1),
  U2: formatRutDisplay(QA_AUDITORIA_RUT.U2),
  U3: formatRutDisplay(QA_AUDITORIA_RUT.U3),
  U6: formatRutDisplay(QA_AUDITORIA_RUT.U6),
  U8: formatRutDisplay(QA_AUDITORIA_RUT.U8),
  ERR01: formatRutDisplay(`${QA_ERR_RUT_PREFIX}01`),
} as const;
