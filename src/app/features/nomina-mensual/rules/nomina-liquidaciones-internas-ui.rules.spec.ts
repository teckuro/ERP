import { describe, expect, it } from 'vitest';

import {
  calcularTrabajadoresSinLiquidacion,
  esLiquidacionesSoloLectura,
  nominasConLiquidacionesDisponibles,
  puedeRegenerarDesdePantallaLiquidaciones,
  puedeRegenerarLiquidacionesInternas,
} from './nomina-liquidaciones-internas-ui.rules';
import { crearNominaResumen } from '../models/nomina-periodo.models';

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

  it('solo permite regenerar en pantalla Liquidaciones para reabierta', () => {
    expect(puedeRegenerarDesdePantallaLiquidaciones('reabierta', true)).toBe(true);
    expect(puedeRegenerarDesdePantallaLiquidaciones('aprobada', true)).toBe(false);
    expect(puedeRegenerarDesdePantallaLiquidaciones('liquidada', true)).toBe(false);
  });

  it('calcula trabajadores sin liquidación', () => {
    expect(calcularTrabajadoresSinLiquidacion(10, 8, { hayLotesMaterializados: true })).toBe(2);
    expect(calcularTrabajadoresSinLiquidacion(10, null, { hayLotesMaterializados: true })).toBe(10);
    expect(calcularTrabajadoresSinLiquidacion(5, 7, { hayLotesMaterializados: true })).toBe(0);
    expect(calcularTrabajadoresSinLiquidacion(10, null)).toBe(0);
  });

  it('filtra nóminas liquidadas o cerradas con cálculo', () => {
    const lista = nominasConLiquidacionesDisponibles([
      crearNominaResumen({ id: 'a', estado: 'liquidada', periodo: '2026-03', evidenciaCalculo: { idCalculoPeriodo: 1, versionCalculo: 1, calculoVigente: true } }),
      crearNominaResumen({ id: 'b', estado: 'cerrada', periodo: '2026-04', evidenciaCalculo: { idCalculoPeriodo: 2, versionCalculo: 1, calculoVigente: true } }),
      crearNominaResumen({ id: 'c', estado: 'aprobada', periodo: '2026-05', evidenciaCalculo: { idCalculoPeriodo: 3, versionCalculo: 1, calculoVigente: true } }),
    ]);
    expect(lista.map((fila) => fila.id)).toEqual(['b', 'a']);
  });
});
