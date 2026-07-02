import { describe, expect, it } from 'vitest';

import {
  calcularTrabajadoresSinLiquidacion,
  esLiquidacionesSoloLectura,
  puedeRegenerarLiquidacionesInternas,
} from './nomina-liquidaciones-internas-ui.rules';

describe('nomina-liquidaciones-internas-ui.rules', () => {
  it('bloquea edición cuando la nómina está cerrada o anulada', () => {
    expect(esLiquidacionesSoloLectura('cerrada')).toBe(true);
    expect(esLiquidacionesSoloLectura('anulada')).toBe(true);
    expect(esLiquidacionesSoloLectura('aprobada')).toBe(false);
  });

  it('permite regenerar solo con cálculo vigente y estado operativo', () => {
    expect(puedeRegenerarLiquidacionesInternas('aprobada', true)).toBe(true);
    expect(puedeRegenerarLiquidacionesInternas('aprobada', false)).toBe(false);
    expect(puedeRegenerarLiquidacionesInternas('cerrada', true)).toBe(false);
  });

  it('calcula trabajadores sin liquidación', () => {
    expect(calcularTrabajadoresSinLiquidacion(10, 8)).toBe(2);
    expect(calcularTrabajadoresSinLiquidacion(10, null)).toBe(10);
    expect(calcularTrabajadoresSinLiquidacion(5, 7)).toBe(0);
  });
});
