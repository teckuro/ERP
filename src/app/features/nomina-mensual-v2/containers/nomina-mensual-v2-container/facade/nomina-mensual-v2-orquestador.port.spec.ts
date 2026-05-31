import { describe, expect, it } from 'vitest';

import { NominaMensualV2OrquestadorPort } from './nomina-mensual-v2-orquestador.port';

describe('NominaMensualV2OrquestadorPort', () => {
  it('mantiene la accion actual cuando se limpia una accion anterior', () => {
    const orquestador = new NominaMensualV2OrquestadorPort();
    const llamadas: string[] = [];

    const limpiarAnterior = orquestador.registrarAccionPrincipal(() => llamadas.push('anterior'));
    orquestador.registrarAccionPrincipal(() => llamadas.push('actual'));

    limpiarAnterior();
    orquestador.ejecutarAccionPrincipal();

    expect(llamadas).toEqual(['actual']);
  });

  it('limpia la accion actual con el disposer que corresponde', () => {
    const orquestador = new NominaMensualV2OrquestadorPort();
    const llamadas: string[] = [];

    const limpiarActual = orquestador.registrarAccionPrincipal(() => llamadas.push('actual'));

    limpiarActual();
    orquestador.ejecutarAccionPrincipal();

    expect(llamadas).toEqual([]);
  });
});
