import { describe, expect, it } from 'vitest';

import {
  capitalizarTextoEmpleado,
  crearAccionesMasivasEstadoEmpleado,
  crearColumnasGridTablaEmpleados,
  crearFiltrosGridTablaEmpleados,
  etiquetaEstadoEmpleado,
  formatearFechaIngresoListado,
} from './tabla-empleados-listado.presenter';

describe('tabla-empleados-listado.presenter', () => {
  describe('capitalizarTextoEmpleado', () => {
    it('pone en mayúscula solo la primera letra', () => {
      expect(capitalizarTextoEmpleado('jefe de turno')).toBe('Jefe de turno');
      expect(capitalizarTextoEmpleado('de turno')).toBe('De turno');
    });

    it('no reescribe el resto del texto guardado', () => {
      expect(capitalizarTextoEmpleado('Jefe de Turno')).toBe('Jefe de Turno');
      expect(capitalizarTextoEmpleado('Asistente de RR.HH.')).toBe('Asistente de RR.HH.');
      expect(capitalizarTextoEmpleado('JEFE DE TURNO')).toBe('JEFE DE TURNO');
    });

    it('respeta paréntesis, espacios y vacíos', () => {
      expect(capitalizarTextoEmpleado('diseñadora (honorarios)')).toBe('Diseñadora (honorarios)');
      expect(capitalizarTextoEmpleado('  analista  ')).toBe('Analista');
      expect(capitalizarTextoEmpleado('')).toBe('');
    });
  });


  it('crearColumnasGridTablaEmpleados incluye acciones y avance', () => {
    const columnas = crearColumnasGridTablaEmpleados();
    expect(columnas.some((c) => c.id === 'acciones')).toBe(true);
    expect(columnas.some((c) => c.id === 'avance')).toBe(true);
  });

  it('crearFiltrosGridTablaEmpleados incluye RUT, estado y situación ficha', () => {
    const filtros = crearFiltrosGridTablaEmpleados();
    expect(filtros.some((f) => f.id === 'rut')).toBe(true);
    expect(filtros.some((f) => f.id === 'estado')).toBe(true);
    expect(filtros.some((f) => f.id === 'situacionFicha')).toBe(true);
  });

  it('filtro situacionFicha incompletas usa predicate', () => {
    const filtro = crearFiltrosGridTablaEmpleados({ filtroInicial: 'incompletas' }).find(
      (f) => f.id === 'situacionFicha',
    );
    expect(filtro?.initialValue).toBe('incompletas');
    expect(
      filtro?.predicate?.(
        {
          estadoFicha: 'INCOMPLETO',
          aptoParaRemuneraciones: false,
          pasoAltaAvanzada: null,
        } as never,
        'incompletas',
      ),
    ).toBe(true);
    expect(
      filtro?.predicate?.(
        {
          estadoFicha: 'VALIDO',
          aptoParaRemuneraciones: true,
          pasoAltaAvanzada: null,
        } as never,
        'incompletas',
      ),
    ).toBe(false);
  });

  it('etiquetas y formato', () => {
    expect(etiquetaEstadoEmpleado('activo')).toBe('Activo');
    expect(formatearFechaIngresoListado('01/05/2024')).toContain('2024');
    expect(crearAccionesMasivasEstadoEmpleado().length).toBeGreaterThan(3);
  });
});
