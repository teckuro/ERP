import { describe, expect, it } from 'vitest';

import {
  buildAccionesNominaPeriodo,
  type AccionesNominaPeriodoInput,
} from './proceso-mensual-acciones-periodo.rules';

function baseInput(
  overrides: Partial<AccionesNominaPeriodoInput> = {},
): AccionesNominaPeriodoInput {
  return {
    tieneNominaGenerada: true,
    tieneNominaConfirmada: false,
    liquidacionesGeneradas: 0,
    esAdmin: false,
    modoPruebas: false,
    ...overrides,
  };
}

describe('proceso-mensual-acciones-periodo.rules', () => {
  it('nómina generada sin liquidaciones permite abrir cuando está confirmada', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({ tieneNominaConfirmada: true }),
    );
    const abrir = view.normales.find((a) => a.id === 'abrir_nomina');
    expect(abrir?.disponible).toBe(true);
    expect(abrir?.bloqueada).toBe(false);
  });

  it('nómina generada sin liquidaciones permite descartar', () => {
    const view = buildAccionesNominaPeriodo(baseInput());
    const descartar = view.normales.find((a) => a.id === 'descartar_nomina');
    expect(descartar?.disponible).toBe(true);
    expect(descartar?.bloqueada).toBe(false);
    expect(descartar?.label).toBe('Descartar nómina generada');
  });

  it('nómina confirmada con liquidaciones bloquea abrir para RRHH', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({ tieneNominaConfirmada: true, liquidacionesGeneradas: 1 }),
    );
    const abrir = view.normales.find((a) => a.id === 'abrir_nomina');
    expect(abrir?.disponible).toBe(false);
    expect(abrir?.bloqueada).toBe(true);
    expect(abrir?.motivoBloqueo).toContain('liquidaciones generadas');
    expect(abrir?.motivoBloqueo).not.toMatch(/rpc|snapshot|enum/i);
  });

  it('nómina confirmada con liquidaciones bloquea descartar para RRHH', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({ tieneNominaConfirmada: true, liquidacionesGeneradas: 2 }),
    );
    const descartar = view.normales.find((a) => a.id === 'descartar_nomina');
    expect(descartar?.disponible).toBe(false);
    expect(descartar?.bloqueada).toBe(true);
    expect(descartar?.motivoBloqueo).toContain('liquidaciones generadas');
  });

  it('admin con liquidaciones ve acciones forzadas', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({
        tieneNominaConfirmada: true,
        liquidacionesGeneradas: 1,
        esAdmin: true,
        modoPruebas: true,
      }),
    );
    expect(view.admin.map((a) => a.id)).toEqual(['forzar_apertura', 'forzar_eliminacion']);
    expect(view.admin.every((a) => a.disponible)).toBe(true);
    expect(view.admin.every((a) => a.variante === 'admin')).toBe(true);
  });

  it('usuario normal no ve acciones forzadas', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({ liquidacionesGeneradas: 0, esAdmin: false, modoPruebas: true }),
    );
    expect(view.admin).toHaveLength(0);
  });

  it('admin sin modo pruebas no ve acciones forzadas', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({ esAdmin: true, modoPruebas: false }),
    );
    expect(view.admin).toHaveLength(0);
  });

  it('acciones normales y admin no se mezclan en la misma lista', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({ tieneNominaConfirmada: true, esAdmin: true, modoPruebas: true }),
    );
    expect(view.normales.every((a) => a.variante !== 'admin')).toBe(true);
    expect(view.admin.every((a) => a.variante === 'admin')).toBe(true);
    expect(view.normales).toHaveLength(2);
    expect(view.admin).toHaveLength(2);
  });

  it('sin nómina generada no ofrece descartar disponible', () => {
    const view = buildAccionesNominaPeriodo(
      baseInput({ tieneNominaGenerada: false }),
    );
    const descartar = view.normales.find((a) => a.id === 'descartar_nomina');
    expect(descartar?.disponible).toBe(false);
    expect(descartar?.bloqueada).toBe(true);
  });
});
