import { describe, expect, it } from 'vitest';

import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { ConceptoListado } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import {
  aFilaGridMovimientoVariable,
  crearColumnasGridMovimientoVariable,
  crearFiltrosGridMovimientoVariable,
  etiquetaEstadoMovimientoVariable,
  formatMontoMovimientoVariable,
} from './movimiento-variable-listado.presenter';

describe('movimiento-variable-listado.presenter', () => {
  it('crearColumnasGridMovimientoVariable incluye acciones', () => {
    const columnas = crearColumnasGridMovimientoVariable();
    expect(columnas.some((c) => c.id === 'acciones')).toBe(true);
    expect(columnas.some((c) => c.id === 'monto')).toBe(true);
  });

  it('aFilaGridMovimientoVariable enriquece etiquetas', () => {
    const fila = aFilaGridMovimientoVariable(
      {
        idMovimiento: 1,
        idPersona: 10,
        idConcepto: 20,
        periodo: '2026-05',
        monto: 1000,
        estado: 'VALIDADO',
        origen: 'MANUAL',
        observacion: null,
      },
      [{ id: 10, nombre: 'Ana Test', rut: '1-9' } as EmpleadoListado],
      [{ idConcepto: 20, codigo: 'BONO', nombre: 'Bono', tipo: 'HABER' } as ConceptoListado],
    );

    expect(fila.trabajadorEtiqueta).toContain('Ana Test');
    expect(fila.conceptoEtiqueta).toContain('Bono');
    expect(fila.busqueda).toContain('validado');
  });

  it('etiquetas y formato monto', () => {
    expect(etiquetaEstadoMovimientoVariable('BORRADOR')).toBe('Borrador');
    expect(formatMontoMovimientoVariable(1500)).toContain('1');
    expect(crearFiltrosGridMovimientoVariable()).toHaveLength(1);
  });
});
