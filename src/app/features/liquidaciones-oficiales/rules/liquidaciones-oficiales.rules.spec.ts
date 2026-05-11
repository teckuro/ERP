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

  it('queda no disponible sin snapshot cerrado', () => {
    expect(determinarEstadoLiquidaciones({ snapshot: null, liquidacion: null })).toBe('no_disponible');
    expect(obtenerMotivoNoPuedeGenerar(null, null)).toBe('No se pudo consultar el estado de la nomina cerrada.');
  });

  it('bloquea si la nomina aun no esta cerrada operativamente', () => {
    const motivo = obtenerMotivoNoPuedeGenerar({ ...snapshot, cerradoOperativamente: false }, null);
    expect(motivo).toBe('Primero debes cerrar operativamente la nomina del periodo.');
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
      'El snapshot cerrado tenia advertencias operativas visibles al aprobar.',
      'Hay trabajadores sin conceptos materializados en la liquidacion.',
      'Existen conceptos sin codigo LRE; LRE operativo queda para una fase posterior.',
    ]);
  });
});
