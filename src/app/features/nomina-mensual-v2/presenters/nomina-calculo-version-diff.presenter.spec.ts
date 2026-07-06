import { describe, expect, it } from 'vitest';

import {
  presentarDiffRecalculo,
  ultimoDiffRecalculoConCambios,
} from './nomina-calculo-version-diff.presenter';

describe('nomina-calculo-version-diff.presenter', () => {
  it('presenta etiquetas RRHH y formatea montos', () => {
    const view = presentarDiffRecalculo({
      versionAnterior: 1,
      versionActual: 2,
      hayCambios: true,
      campos: [
        {
          campo: 'totalLiquido',
          anterior: 1_000_000,
          actual: 1_050_000,
          delta: 50_000,
        },
      ],
    });
    expect(view?.titulo).toContain('v1 y v2');
    expect(view?.campos[0]?.label).toBe('Líquido');
    expect(view?.campos[0]?.delta).toContain('50.000');
  });

  it('devuelve null si no hay cambios', () => {
    expect(
      presentarDiffRecalculo({
        versionAnterior: 1,
        versionActual: 2,
        hayCambios: false,
        campos: [],
      }),
    ).toBeNull();
  });

  it('toma el último diff con cambios', () => {
    const ultimo = ultimoDiffRecalculoConCambios([
      { versionAnterior: 1, versionActual: 2, hayCambios: false, campos: [] },
      {
        versionAnterior: 2,
        versionActual: 3,
        hayCambios: true,
        campos: [{ campo: 'totalTrabajadores', anterior: 2, actual: 3, delta: 1 }],
      },
    ]);
    expect(ultimo?.titulo).toContain('v2 y v3');
  });
});
