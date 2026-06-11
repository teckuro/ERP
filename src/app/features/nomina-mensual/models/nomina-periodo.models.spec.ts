import { describe, expect, it } from 'vitest';

import {
  agregarTrabajadorASegmento,
  crearNomina,
  crearNominaResumen,
  crearSegmento,
  derivarIdentidadNominaMensual,
  moverTrabajadorEntreSegmentos,
} from './nomina-periodo.models';
import type { MovimientoNomina } from './movimiento-nomina.models';

describe('nomina-periodo.models — helpers de creación y reglas de segmentos', () => {
  it('Test 1 — crearNominaResumen produce un NominaPeriodoResumen válido por defecto', () => {
    const resumen = crearNominaResumen();
    expect(resumen.id).toBeTruthy();
    expect(resumen.periodo).toMatch(/^\d{4}-\d{2}$/);
    expect(resumen.tipo).toBe('mensual');
    expect(resumen.estado).toBe('dotacion_generada');
    expect(resumen.totalIncidenciasCriticas).toBe(0);
    expect(resumen.totalAdvertencias).toBe(0);
  });

  it('Test 2 — crearNomina arranca en estado "dotacion_generada"', () => {
    const nomina = crearNomina();
    expect(nomina.estado).toBe('dotacion_generada');
    expect(nomina.segmentos).toEqual([]);
    expect(nomina.movimientos).toEqual([]);
    expect(nomina.incidencias).toEqual([]);
    expect(nomina.trabajadorIds).toEqual([]);
  });

  it('deriva rango mensual, ciclo y naturaleza incluso en ano bisiesto', () => {
    expect(derivarIdentidadNominaMensual('2028-02')).toEqual({
      fechaInicio: '2028-02-01',
      fechaFin: '2028-02-29',
      naturaleza: 'liquidacion_legal',
      codigoCiclo: '2028-02-MES',
    });
  });

  it('rechaza periodos mensuales invalidos', () => {
    expect(() => derivarIdentidadNominaMensual('2026-13')).toThrow(/periodo mensual invalido/i);
  });

  it('Test 3 — crearSegmento retorna sub-grupo con ordinal explícito y total derivado', () => {
    const segmento = crearSegmento({
      id: 'seg-test',
      nominaPeriodoId: 'nom-test',
      nombre: 'Honorarios',
      tipo: 'honorarios',
      ordinal: 2,
      trabajadorIds: ['t-001', 't-002', 't-003'],
    });
    expect(segmento.id).toBe('seg-test');
    expect(segmento.ordinal).toBe(2);
    expect(segmento.totalTrabajadores).toBe(3);
    expect(segmento.estado).toBe('borrador');
  });

  it('Test 4 — agregarTrabajadorASegmento rechaza duplicidad entre 2 segmentos activos', () => {
    const nomina = crearNomina({ id: 'nom-dup' });
    nomina.segmentos = [
      crearSegmento({ id: 'seg-a', nominaPeriodoId: 'nom-dup', trabajadorIds: ['t-100'] }),
      crearSegmento({ id: 'seg-b', nominaPeriodoId: 'nom-dup', ordinal: 2, trabajadorIds: [] }),
    ];

    const fueAgregado = agregarTrabajadorASegmento(nomina, 'seg-b', 't-100');

    expect(fueAgregado).toBe(false);
    expect(nomina.segmentos[0]!.trabajadorIds).toEqual(['t-100']);
    expect(nomina.segmentos[1]!.trabajadorIds).toEqual([]);
  });

  it('Test 5 — moverTrabajadorEntreSegmentos preserva movimientos del trabajador', () => {
    const nomina = crearNomina({ id: 'nom-move' });
    nomina.segmentos = [
      crearSegmento({ id: 'seg-orig', nominaPeriodoId: 'nom-move', trabajadorIds: ['t-200'] }),
      crearSegmento({ id: 'seg-dest', nominaPeriodoId: 'nom-move', ordinal: 2, trabajadorIds: [] }),
    ];
    const movimiento: MovimientoNomina = {
      id: 'mov-1',
      nominaPeriodoId: 'nom-move',
      trabajadorId: 't-200',
      segmentoId: 'seg-orig',
      tipo: 'horas-extra',
      categoria: 'haber',
      cantidad: 8,
      unidad: 'horas',
      origen: 'manual',
      estado: 'aplicado',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    nomina.movimientos = [movimiento];

    const movido = moverTrabajadorEntreSegmentos(nomina, 't-200', 'seg-dest');

    expect(movido).toBe(true);
    expect(nomina.segmentos[0]!.trabajadorIds).toEqual([]);
    expect(nomina.segmentos[1]!.trabajadorIds).toEqual(['t-200']);
    expect(nomina.movimientos).toHaveLength(1);
    expect(nomina.movimientos[0]!.segmentoId).toBe('seg-dest');
    expect(nomina.movimientos[0]!.tipo).toBe('horas-extra');
  });
});
