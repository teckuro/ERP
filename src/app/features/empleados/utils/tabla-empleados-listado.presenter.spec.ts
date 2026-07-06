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
  it('crearColumnasGridTablaEmpleados incluye acciones y avance', () => {
    const columnas = crearColumnasGridTablaEmpleados();
    expect(columnas.some((c) => c.id === 'acciones')).toBe(true);
    expect(columnas.some((c) => c.id === 'avance')).toBe(true);
  });

  it('crearFiltrosGridTablaEmpleados incluye RUT y estado', () => {
    const filtros = crearFiltrosGridTablaEmpleados();
    expect(filtros.some((f) => f.id === 'rut')).toBe(true);
    expect(filtros.some((f) => f.id === 'estado')).toBe(true);
  });

  it('etiquetas y formato', () => {
    expect(etiquetaEstadoEmpleado('activo')).toBe('Activo');
    expect(capitalizarTextoEmpleado('analista rrhh')).toBe('Analista Rrhh');
    expect(formatearFechaIngresoListado('01/05/2024')).toContain('2024');
    expect(crearAccionesMasivasEstadoEmpleado().length).toBeGreaterThan(3);
  });
});
