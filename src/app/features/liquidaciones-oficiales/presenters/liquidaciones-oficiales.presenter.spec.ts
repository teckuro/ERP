import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import type { LiquidacionTrabajador } from '../models/liquidacion-oficial.model';
import {
  crearFiltrosSeleccionNominaLiquidacion,
  crearFiltrosTrabajadoresLiquidacion,
} from './liquidaciones-oficiales.presenter';

describe('liquidaciones-oficiales.presenter', () => {
  it('crearFiltrosSeleccionNominaLiquidacion incluye búsqueda y filtros derivados', () => {
    const filtros = crearFiltrosSeleccionNominaLiquidacion([
      crearNominaResumen({
        id: 'a',
        estado: 'liquidada',
        periodo: '2026-04',
        empresaNombre: 'Acme',
        evidenciaCalculo: { idCalculoPeriodo: 1, versionCalculo: 1, calculoVigente: true },
      }),
      crearNominaResumen({
        id: 'b',
        estado: 'cerrada',
        periodo: '2026-03',
        empresaNombre: 'Beta',
        evidenciaCalculo: { idCalculoPeriodo: 2, versionCalculo: 1, calculoVigente: true },
      }),
    ]);

    expect(filtros.some((f) => f.id === 'busqueda')).toBe(true);
    expect(filtros.some((f) => f.id === 'periodo')).toBe(true);
    expect(filtros.some((f) => f.id === 'estado')).toBe(true);

    const busqueda = filtros.find((f) => f.id === 'busqueda');
    expect(busqueda?.predicate?.(
      crearNominaResumen({ empresaNombre: 'Acme', estado: 'liquidada', periodo: '2026-04' }),
      'acme',
    )).toBe(true);
    expect(busqueda?.predicate?.(
      crearNominaResumen({ empresaNombre: 'Beta', estado: 'cerrada', periodo: '2026-03' }),
      'acme',
    )).toBe(false);
  });

  it('crearFiltrosTrabajadoresLiquidacion filtra por búsqueda y estado', () => {
    const trabajador: LiquidacionTrabajador = {
      idLiquidacionTrabajador: 5,
      idPersona: 1,
      idContrato: 1,
      rut: '11.111.111-1',
      nombreTrabajador: 'Ana Pérez',
      cargo: 'Analista',
      centroCosto: 'RRHH',
      fechaIngreso: null,
      diasTrabajados: 30,
      baseImponible: 100,
      baseTributable: 90,
      totalHaberes: 100,
      totalDescuentos: 10,
      totalAportesEmpleadorReferencia: 0,
      liquidoPagar: 90,
      estado: 'generada',
      observaciones: [],
      metadata: {},
    };
    const filtros = crearFiltrosTrabajadoresLiquidacion({ 5: 'autorizada' });

    expect(filtros.some((f) => f.id === 'busqueda')).toBe(true);
    expect(filtros.some((f) => f.id === 'estadoTrabajador')).toBe(true);

    const busqueda = filtros.find((f) => f.id === 'busqueda');
    const estadoTrabajador = filtros.find((f) => f.id === 'estadoTrabajador');

    expect(busqueda?.predicate?.(trabajador, 'ana')).toBe(true);
    expect(busqueda?.predicate?.(trabajador, 'beta')).toBe(false);
    expect(estadoTrabajador?.predicate?.(trabajador, 'autorizada')).toBe(true);
    expect(estadoTrabajador?.predicate?.(trabajador, 'pendiente_autorizar')).toBe(false);
  });
});
