import { describe, expect, it } from 'vitest';

import type { TrabajadorMotorCalculoSnapshot } from '../models/proceso-mensual.model';
import { generarCalculoAnticipoPeriodo } from './proceso-mensual-motor-anticipo.rules';

function trabajador(partial: Partial<TrabajadorMotorCalculoSnapshot> = {}): TrabajadorMotorCalculoSnapshot {
  return {
    idPersona: 1,
    rut: '11.111.111-1',
    nombreCompleto: 'Ana Test',
    aptoParaRemuneraciones: true,
    estado: 'activo',
    sueldoBase: 1_000_000,
    idContrato: 1,
    tipoContrato: 'indefinido',
    idAfp: null,
    idSalud: null,
    valorPlanSalud: null,
    fechaIngreso: '2020-01-01',
    fechaRetiro: null,
    ...partial,
  } as TrabajadorMotorCalculoSnapshot;
}

describe('proceso-mensual-motor-anticipo.rules', () => {
  it('calcula anticipo por porcentaje del sueldo base', () => {
    const resultado = generarCalculoAnticipoPeriodo({
      periodo: '2026-06',
      reglaAnticipo: { modo: 'porcentaje', valor: 50 },
      trabajadores: [trabajador()],
      generadoEn: '2026-06-01T00:00:00Z',
    });

    expect(resultado.estado).toBe('calculado_preliminar');
    expect(resultado.resumen.totalLiquidoPreliminar).toBe(500_000);
    expect(resultado.liquidaciones[0]?.liquidoAPago).toBe(500_000);
    expect(resultado.liquidaciones[0]?.haberesImponibles[0]?.codigo).toBe('ANTICIPO');
  });

  it('calcula anticipo por monto fijo', () => {
    const resultado = generarCalculoAnticipoPeriodo({
      periodo: '2026-06',
      reglaAnticipo: { modo: 'monto_fijo', valor: 150_000 },
      trabajadores: [trabajador({ sueldoBase: 2_000_000 })],
      generadoEn: '2026-06-01T00:00:00Z',
    });

    expect(resultado.resumen.totalLiquidoPreliminar).toBe(150_000);
  });

  it('bloquea trabajador sin sueldo base', () => {
    const resultado = generarCalculoAnticipoPeriodo({
      periodo: '2026-06',
      reglaAnticipo: { modo: 'porcentaje', valor: 50 },
      trabajadores: [trabajador({ sueldoBase: 0 })],
      generadoEn: '2026-06-01T00:00:00Z',
    });

    expect(resultado.estado).toBe('con_bloqueos');
    expect(resultado.resumen.totalBloqueados).toBe(1);
  });
});
