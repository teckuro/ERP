import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../models/nomina-periodo.models';
import type { NominaCreatePreview } from '../models/nomina-creacion-preview.models';
import {
  buscarNominaCoincidenteBandeja,
  construirAvisoNominaExistente,
  construirEmptyCreacionPreview,
  construirHandoffCreacionPreview,
  etiquetaPeriodoLegible,
  inferirSiguientePasoPreview,
} from './nomina-creacion-ui.rules';

function resumen(overrides: Parameters<typeof crearNominaResumen>[0] = {}) {
  return crearNominaResumen({
    id: 'nom-1',
    periodo: '2026-07',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'borrador',
    totalTrabajadores: 0,
    totalSegmentos: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  });
}

function previewParcial(totales: NominaCreatePreview['totales']): Pick<NominaCreatePreview, 'totales'> {
  return { totales };
}

describe('nomina-creacion-ui.rules', () => {
  it('etiquetaPeriodoLegible formatea AAAA-MM en español', () => {
    expect(etiquetaPeriodoLegible('2026-07')).toMatch(/julio.*2026/i);
    expect(etiquetaPeriodoLegible('invalido')).toBe('invalido');
  });

  it('buscarNominaCoincidenteBandeja encuentra fila activa por período, empresa y tipo', () => {
    const filas = [
      resumen({ id: 'a', periodo: '2026-07', empresaId: '7', tipo: 'mensual' }),
      resumen({ id: 'b', periodo: '2026-08', empresaId: '7', tipo: 'mensual' }),
    ];
    expect(buscarNominaCoincidenteBandeja(filas, '2026-07', '7', 'mensual')?.id).toBe('a');
    expect(buscarNominaCoincidenteBandeja(filas, '2026-06', '7', 'mensual')).toBeNull();
  });

  it('buscarNominaCoincidenteBandeja excluye nóminas anuladas', () => {
    const filas = [resumen({ estado: 'anulada' })];
    expect(buscarNominaCoincidenteBandeja(filas, '2026-07', '7', 'mensual')).toBeNull();
  });

  it('construirAvisoNominaExistente usa copy RRHH e idempotencia', () => {
    const aviso = construirAvisoNominaExistente(resumen({ estado: 'dotacion_generada' }));
    expect(aviso.title).toContain('Ya hay');
    expect(aviso.estadoLabel).toBe('Dotación lista');
    expect(aviso.detail).toContain('reutilizará');
  });

  it('inferirSiguientePasoPreview elige dotación o parámetros según incluidos', () => {
    expect(inferirSiguientePasoPreview(previewParcial({ incluidos: 3, excluidos: 0, conflictos: 0 })))
      .toBe('dotacion');
    expect(inferirSiguientePasoPreview(previewParcial({ incluidos: 0, excluidos: 2, conflictos: 0 })))
      .toBe('parameters');
  });

  it('construirHandoffCreacionPreview resume trabajadores y paso del generador', () => {
    const handoff = construirHandoffCreacionPreview(
      previewParcial({ incluidos: 5, excluidos: 1, conflictos: 0 }),
    );
    expect(handoff.texto).toContain('5 trabajadores incluidos');
    expect(handoff.texto).toContain('Revisar dotación');
    expect(handoff.icono).toBe('users');
  });

  it('construirEmptyCreacionPreview devuelve acta por tab', () => {
    const incluidos = construirEmptyCreacionPreview('incluidos', { incluidos: 0, excluidos: 0, conflictos: 0 });
    expect(incluidos.icon).toBe('users');
    expect(incluidos.title).toContain('Sin trabajadores');

    const busqueda = construirEmptyCreacionPreview(
      'incluidos',
      { incluidos: 10, excluidos: 0, conflictos: 0 },
      { busquedaActiva: true },
    );
    expect(busqueda.title).toContain('búsqueda');
  });
});
