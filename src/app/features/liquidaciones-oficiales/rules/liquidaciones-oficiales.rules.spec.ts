import { describe, expect, it } from 'vitest';

import {
  clasificarAdvertenciasLiquidacion,
  determinarEstadoLiquidaciones,
  obtenerMotivoNoPuedeGenerar,
  puedeGenerarLiquidaciones,
} from './liquidaciones-oficiales.rules';

describe('liquidaciones-oficiales.rules', () => {
  const snapshot = {
    idCalculoPeriodo: 15,
    totalTrabajadores: 2,
    aprobadoOperativamente: true,
    cerradoOperativamente: true,
  };

  it('queda no disponible sin nomina mensual confirmada', () => {
    expect(determinarEstadoLiquidaciones({ snapshot: null, liquidacion: null })).toBe('no_disponible');
    expect(obtenerMotivoNoPuedeGenerar(null, null)).toBe('No se pudo consultar una nómina mensual confirmada para este período.');
  });

  it('bloquea si la nomina mensual aun no esta confirmada', () => {
    const motivo = obtenerMotivoNoPuedeGenerar({ ...snapshot, cerradoOperativamente: false }, null);
    expect(motivo).toBe('Primero confirma la nómina mensual del período.');
  });

  it('habilita generacion con snapshot aprobado, cerrado y sin liquidaciones', () => {
    expect(puedeGenerarLiquidaciones(snapshot, null)).toBe(true);
    expect(determinarEstadoLiquidaciones({ snapshot, liquidacion: null })).toBe('lista_para_generar');
  });

  it('detecta liquidaciones ya generadas', () => {
    const liquidacion = {
      idLiquidacionPeriodo: 1,
      idCalculoPeriodo: 15,
      periodo: '2026-04',
      estado: 'generada' as const,
      fechaGeneracion: '2026-05-10T10:00:00.000Z',
      usuarioGeneracionLabel: 'rrhh@empresa.cl',
      totalTrabajadores: 2,
      totalHaberes: 100,
      totalDescuentos: 20,
      totalLiquido: 80,
      metadata: {},
    };
    expect(determinarEstadoLiquidaciones({ snapshot, liquidacion })).toBe('generadas');
    expect(obtenerMotivoNoPuedeGenerar(snapshot, liquidacion)).toBe(
      'Ya existen liquidaciones oficiales generadas para este periodo.',
    );
  });

  it('clasifica advertencias informativas', () => {
    expect(clasificarAdvertenciasLiquidacion({
      totalAdvertenciasSnapshot: 1,
      trabajadoresSinConceptos: 1,
      conceptosSinCodigoLre: 1,
    })).toEqual([
      'La nómina mensual confirmada tenía advertencias visibles al aprobar.',
      'Hay trabajadores sin conceptos materializados en la liquidacion.',
      'Existen conceptos sin codigo LRE; LRE operativo queda para una fase posterior.',
    ]);
  });
});
