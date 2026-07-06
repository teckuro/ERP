import { describe, expect, it } from 'vitest';

import type { ConceptoListado } from '../models/haber-descuento-asignacion.model';
import {
  aFilasGridHaberDescuento,
  crearColumnasGridHaberDescuento,
  crearFiltrosGridHaberDescuento,
  debeMostrarCuotasRecurrente,
  etiquetaTipoConceptoHd,
  etiquetaValorAsignacion,
} from './haber-descuento-asignacion-listado.presenter';

describe('haber-descuento-asignacion-listado.presenter', () => {
  it('crearColumnasGridHaberDescuento incluye acciones', () => {
    const columnas = crearColumnasGridHaberDescuento();
    expect(columnas.some((c) => c.id === 'acciones')).toBe(true);
  });

  it('aFilasGridHaberDescuento enriquece filas', () => {
    const [fila] = aFilasGridHaberDescuento([
      {
        idAsignacion: 1,
        idPersona: 10,
        idConcepto: 20,
        idContrato: null,
        nombreConcepto: 'Bono',
        codigoConcepto: 'BONO',
        codigoLre: null,
        tipoConcepto: 'HABER',
        naturalezaConcepto: 'IMPONIBLE',
        esSistemaConcepto: false,
        calculoAutomaticoConcepto: false,
        tipoValor: 'FIJO',
        tipohaber: null,
        monto: 50000,
        porcentaje: null,
        periodicidad: 'MENSUAL',
        vigenciaInicio: '2026-05-01',
        vigenciaFin: null,
        estado: true,
        estadoVigencia: 'ACTIVA',
        estadoVigenciaEtiqueta: 'Activa',
        imponible: true,
        tributable: false,
        observacion: null,
      },
    ]);

    expect(fila.valorAsignacion).toContain('50');
    expect(fila.busquedaAsignacion).toContain('bono');
  });

  it('etiquetas y cuotas', () => {
    expect(etiquetaTipoConceptoHd('HABER')).toBe('Haber');
    expect(etiquetaValorAsignacion({ tipoValor: 'PORCENTAJE', porcentaje: 10, monto: null } as never)).toContain('%');
    expect(crearFiltrosGridHaberDescuento()).toHaveLength(2);
    expect(
      debeMostrarCuotasRecurrente({
        idConcepto: 1,
        codigo: 'PREST',
        nombre: 'Prestamo',
        tipo: 'DESCUENTO',
        naturaleza: null,
        imponible: false,
        tributable: false,
        codigoLre: null,
      } as ConceptoListado),
    ).toBe(true);
  });
});
