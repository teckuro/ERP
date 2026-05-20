import { describe, expect, it } from 'vitest';

import type { NominaMasivaFila } from './proceso-mensual-masivo-layout.rules';
import {
  filtroInicialRevisionTrabajadores,
  resolveAccionCorreccionDesdeIncidencia,
  resolveAccionCorreccionFilaMasiva,
} from './proceso-mensual-correccion.rules';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';

function filaBase(overrides: Partial<NominaMasivaFila> = {}): NominaMasivaFila {
  return {
    idPersona: 42,
    trabajador: 'Ana Soto',
    rut: '11.111.111-1',
    estado: 'observacion',
    haberes: null,
    descuentos: null,
    liquidoEstimado: null,
    pendientes: 1,
    incidenciasCount: 1,
    movimientosCount: 0,
    tieneMovimientos: false,
    tieneRecurrentes: false,
    ...overrides,
  };
}

describe('proceso-mensual-correccion.rules', () => {
  it('resolveAccionCorreccionDesdeIncidencia parametros usa overlay', () => {
    const accion = resolveAccionCorreccionDesdeIncidencia({
      id: 'P1',
      severidad: 'bloqueo',
      ambito: 'parametros',
      titulo: 'Parámetros',
      detalle: 'Falta UF',
      origen: 'prevalidacion',
      prioridad: 1,
    });
    expect(accion?.kind).toBe('overlay_parametros');
    expect(accion?.label).toBe('Abrir parámetros');
  });

  it('resolveAccionCorreccionFilaMasiva prioriza incidencia con ruta', () => {
    const incidencias: IncidenciaPeriodo[] = [
      {
        id: 'M1',
        severidad: 'advertencia',
        ambito: 'movimientos',
        titulo: 'Movimiento pendiente',
        detalle: 'Revisar bono',
        origen: 'prevalidacion',
        prioridad: 2,
        idPersona: 42,
        accion: { tipo: 'ruta', label: 'Revisar movimiento', destino: '/remuneraciones/novedades-mensuales' },
      },
    ];
    const accion = resolveAccionCorreccionFilaMasiva(filaBase(), incidencias);
    expect(accion.kind).toBe('ruta');
    expect(accion.label).toBe('Revisar movimiento');
  });

  it('filtroInicialRevisionTrabajadores prioriza bloqueados', () => {
    expect(filtroInicialRevisionTrabajadores({ bloqueosCount: 1, advertenciasCount: 2 })).toBe('bloqueados');
    expect(filtroInicialRevisionTrabajadores({ bloqueosCount: 0, advertenciasCount: 2 })).toBe('observaciones');
  });
});
