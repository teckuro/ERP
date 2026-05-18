import { buildValidacionCalculoPreliminarView } from './proceso-mensual-validacion-calculo.rules';

describe('proceso-mensual-validacion-calculo.rules', () => {
  it('devuelve pendiente sin prevalidacion ni bloqueos previos', () => {
    const vm = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: null,
      preNomina: null,
      base: null,
      errorEjecucion: null,
      nominaCerradaOperativamente: false,
    });

    expect(vm.estado).toBe('pendiente');
    expect(vm.siguienteAccion.accionLocal).toBe('validarPeriodo');
    expect(vm.bloqueos).toHaveLength(0);
  });

  it('bloquea cuando hay error de ejecucion', () => {
    const vm = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: null,
      preNomina: null,
      base: null,
      errorEjecucion: 'Timeout de red',
      nominaCerradaOperativamente: false,
    });

    expect(vm.estado).toBe('bloqueado');
    expect(vm.bloqueos.some((b) => b.codigo === 'BLOQ-002')).toBe(true);
  });
});
