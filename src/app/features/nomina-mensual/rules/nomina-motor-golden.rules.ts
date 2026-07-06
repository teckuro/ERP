import type { ResumenCalculoVersionComparable } from './nomina-calculo-version-diff.rules';

/** Golden fixture F09 — referencia inmutable para detectar drift del motor (escenario mínimo). */
export const MOTOR_GOLDEN_FIXTURE_V1: ResumenCalculoVersionComparable = {
  idCalculoPeriodo: 1,
  versionCalculo: 1,
  totalTrabajadores: 2,
  totalHaberes: 2_400_000,
  totalDescuentos: 480_000,
  totalLiquido: 1_920_000,
};

export function compararConGoldenFixture(
  actual: ResumenCalculoVersionComparable,
  golden: ResumenCalculoVersionComparable = MOTOR_GOLDEN_FIXTURE_V1,
): { drift: boolean; camposDistintos: string[] } {
  const camposDistintos: string[] = [];
  const keys: Array<keyof ResumenCalculoVersionComparable> = [
    'totalTrabajadores',
    'totalHaberes',
    'totalDescuentos',
    'totalLiquido',
  ];
  for (const key of keys) {
    if (actual[key] !== golden[key]) {
      camposDistintos.push(key);
    }
  }
  return { drift: camposDistintos.length > 0, camposDistintos };
}
