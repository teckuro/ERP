import { describe, expect, it } from 'vitest';

import {
  diffVersionLiquidacionConAnterior,
  filaLiquidacionAResumenComparable,
} from './liquidaciones-version-diff.rules';
import type { FilaLiquidacionInterna } from '../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';

describe('liquidaciones-version-diff.rules', () => {
  it('mapea fila interna a resumen comparable', () => {
    const resumen = filaLiquidacionAResumenComparable(fila(1, 100, 20, 80));
    expect(resumen.versionCalculo).toBe(1);
    expect(resumen.totalLiquido).toBe(80);
  });

  it('calcula diff entre versión activa y la anterior', () => {
    const filas = [
      fila(2, 120, 25, 95),
      fila(1, 100, 20, 80),
    ];
    const diff = diffVersionLiquidacionConAnterior(filas, filas[0]);
    expect(diff?.versionAnterior).toBe(1);
    expect(diff?.versionActual).toBe(2);
    expect(diff?.hayCambios).toBe(true);
    expect(diff?.campos.map((c) => c.campo)).toContain('totalLiquido');
  });

  it('retorna null si solo hay una versión', () => {
    expect(diffVersionLiquidacionConAnterior([fila(1, 100, 20, 80)], fila(1, 100, 20, 80))).toBeNull();
  });
});

function fila(
  version: number,
  haberes: number,
  descuentos: number,
  liquido: number,
): FilaLiquidacionInterna {
  return {
    idLiquidacionPeriodo: version,
    nominaPeriodoId: 'nom-1',
    periodo: '2026-06',
    version,
    estado: 'generada',
    activo: version === 2,
    idLiquidacionReemplazada: null,
    fechaGeneracion: '2026-06-01T10:00:00.000Z',
    totalTrabajadores: 3,
    totalHaberes: haberes,
    totalDescuentos: descuentos,
    totalLiquido: liquido,
    createdAt: '2026-06-01T10:00:00.000Z',
    clasificacion: version === 2 ? 'vigente' : 'superada',
    etiquetaClasificacion: version === 2 ? 'Vigente' : 'Superada',
    tono: version === 2 ? 'success' : 'neutral',
  };
}
