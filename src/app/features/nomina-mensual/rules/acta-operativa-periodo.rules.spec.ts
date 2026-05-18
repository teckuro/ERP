import { describe, expect, it } from 'vitest';

import { buildActaOperativaPeriodoViewModel, type BuildActaOperativaPeriodoInput } from './acta-operativa-periodo.rules';

const baseInput = (overrides: Partial<BuildActaOperativaPeriodoInput> = {}): BuildActaOperativaPeriodoInput => ({
  periodoLabel: 'Mayo 2026',
  periodoValido: true,
  tieneValidacionMinima: true,
  actaPreparadaEnSesion: false,
  estadoPeriodoLabel: 'Periodo validado',
  parametrosLabel: 'Listos',
  trabajadoresLabel: '2 aptos / 0 por revisar',
  movimientosLabel: '1 aprobados / 0 pendientes',
  asignacionesLabel: '1 aplicables / 0 por revisar',
  resultadoPreliminarLabel: 'Guardado para revision',
  resultadoGuardado: true,
  bloqueos: [],
  advertencias: [],
  pendientes: [],
  ...overrides,
});

describe('buildActaOperativaPeriodoViewModel', () => {
  it('queda bloqueada sin validacion minima', () => {
    const vm = buildActaOperativaPeriodoViewModel(baseInput({ tieneValidacionMinima: false }));
    expect(vm.estado).toBe('BLOQUEADA');
    expect(vm.modoCompacto).toBe(true);
    expect(vm.accionDisponible).toBe(false);
    expect(vm.descripcion).toContain('Disponible después de validar el período');
    expect(vm.contexto).toHaveLength(0);
    expect(vm.evidencia).toHaveLength(0);
  });

  it('queda bloqueada con bloqueos criticos', () => {
    const vm = buildActaOperativaPeriodoViewModel(baseInput({ bloqueos: ['Parametros incompletos'] }));
    expect(vm.estado).toBe('BLOQUEADA');
    expect(vm.pendientes).toContain('Parametros incompletos');
  });

  it('queda en revision con advertencias sin bloqueos', () => {
    const vm = buildActaOperativaPeriodoViewModel(baseInput({ advertencias: ['Movimiento pendiente de revision'] }));
    expect(vm.estado).toBe('REQUIERE_REVISION');
    expect(vm.accionDisponible).toBe(true);
  });

  it('queda lista sin bloqueos ni advertencias', () => {
    const vm = buildActaOperativaPeriodoViewModel(baseInput());
    expect(vm.estado).toBe('LISTA');
    expect(vm.accionLabel).toBe('Preparar acta para liquidaciones');
  });

  it('queda preparada si fue confirmada en la sesion', () => {
    const vm = buildActaOperativaPeriodoViewModel(baseInput({ actaPreparadaEnSesion: true }));
    expect(vm.estado).toBe('PREPARADA');
    expect(vm.preparada).toBe(true);
  });

  it('incluye evidencia base sin inventar cifras ausentes', () => {
    const vm = buildActaOperativaPeriodoViewModel(baseInput({
      trabajadoresLabel: null,
      asignacionesLabel: null,
      resultadoGuardado: false,
    }));
    expect(vm.evidencia.map((item) => item.label)).toContain('Resumen de trabajadores');
    expect(vm.contexto.find((item) => item.label === 'Trabajadores')?.valor).toBe('Pendiente de validacion');
    expect(vm.contexto.find((item) => item.label === 'Asignaciones')?.valor).toBe('Pendiente de validacion');
  });
});
