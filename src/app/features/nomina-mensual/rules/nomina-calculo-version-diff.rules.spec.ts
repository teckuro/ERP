import { describe, expect, it } from 'vitest';

import {
  compararResumenesCalculoVersion,
  diffEntreVersionesConsecutivas,
  snapshotsAResumenesComparables,
  type ResumenCalculoVersionComparable,
} from './nomina-calculo-version-diff.rules';
import { compararConGoldenFixture, MOTOR_GOLDEN_FIXTURE_V1 } from './nomina-motor-golden.rules';

describe('nomina-calculo-version-diff.rules', () => {
  it('detecta cambios entre dos versiones consecutivas', () => {
    const v1: ResumenCalculoVersionComparable = {
      idCalculoPeriodo: 10,
      versionCalculo: 1,
      totalTrabajadores: 2,
      totalHaberes: 100,
      totalDescuentos: 10,
      totalLiquido: 90,
    };
    const v2: ResumenCalculoVersionComparable = {
      ...v1,
      idCalculoPeriodo: 11,
      versionCalculo: 2,
      totalLiquido: 95,
    };
    const diff = compararResumenesCalculoVersion(v1, v2);
    expect(diff.hayCambios).toBe(true);
    expect(diff.campos).toHaveLength(1);
    expect(diff.campos[0]?.campo).toBe('totalLiquido');
    expect(diff.campos[0]?.delta).toBe(5);
  });

  it('arma diffs consecutivos ordenados por versionCalculo', () => {
    const diffs = diffEntreVersionesConsecutivas([
      { idCalculoPeriodo: 3, versionCalculo: 3, totalTrabajadores: 1, totalHaberes: 1, totalDescuentos: 0, totalLiquido: 1 },
      { idCalculoPeriodo: 1, versionCalculo: 1, totalTrabajadores: 1, totalHaberes: 1, totalDescuentos: 0, totalLiquido: 1 },
      { idCalculoPeriodo: 2, versionCalculo: 2, totalTrabajadores: 2, totalHaberes: 2, totalDescuentos: 0, totalLiquido: 2 },
    ]);
    expect(diffs).toHaveLength(2);
    expect(diffs[0]?.versionAnterior).toBe(1);
    expect(diffs[0]?.versionActual).toBe(2);
    expect(diffs[1]?.versionAnterior).toBe(2);
    expect(diffs[1]?.versionActual).toBe(3);
  });

  it('excluye snapshots de parámetros y numera versiones por id de cálculo', () => {
    const resumenes = snapshotsAResumenesComparables([
      {
        idCalculoPeriodo: 5,
        versionMotor: 'MOTOR-01',
        totalTrabajadores: 2,
        totalHaberes: 100,
        totalDescuentos: 10,
        totalLiquido: 90,
      },
      {
        idCalculoPeriodo: 3,
        versionMotor: 'PARAMETROS-BASE-01',
        totalTrabajadores: 0,
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
      },
      {
        idCalculoPeriodo: 8,
        versionMotor: 'MOTOR-01',
        totalTrabajadores: 3,
        totalHaberes: 150,
        totalDescuentos: 15,
        totalLiquido: 135,
      },
    ]);
    expect(resumenes).toHaveLength(2);
    expect(resumenes[0]?.versionCalculo).toBe(1);
    expect(resumenes[0]?.idCalculoPeriodo).toBe(5);
    expect(resumenes[1]?.versionCalculo).toBe(2);
    expect(resumenes[1]?.idCalculoPeriodo).toBe(8);
  });
});

describe('nomina-motor-golden.rules', () => {
  it('golden fixture sin drift cuando coincide', () => {
    expect(compararConGoldenFixture(MOTOR_GOLDEN_FIXTURE_V1).drift).toBe(false);
  });

  it('detecta drift respecto del golden', () => {
    const drift = compararConGoldenFixture({
      ...MOTOR_GOLDEN_FIXTURE_V1,
      totalLiquido: 1_900_000,
    });
    expect(drift.drift).toBe(true);
    expect(drift.camposDistintos).toContain('totalLiquido');
  });
});
