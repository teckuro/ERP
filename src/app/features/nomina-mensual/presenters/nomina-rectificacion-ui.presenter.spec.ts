import { describe, expect, it } from 'vitest';

import type { NominaPeriodoResumen } from '../models/nomina-periodo.models';
import type { RectificacionPreview } from '../models/nomina-rectificacion-preview.models';
import {
  etiquetaSublineaRectificacion,
  prepararComparativaRectificacion,
  prepararContextoRectificacionModal,
} from './nomina-rectificacion-ui.presenter';

describe('nomina-rectificacion-ui.presenter', () => {
  it('prepara comparativa original / ajuste / acumulado', () => {
    const columnas = prepararComparativaRectificacion({
      original: { haberes: 1000, descuentos: 200, liquido: 800 },
      diferencia: { haberes: 100, descuentos: 10, liquido: 90 },
      acumulado: { haberes: 1100, descuentos: 210, liquido: 890 },
    });
    expect(columnas).toHaveLength(3);
    expect(columnas[0].label).toBe('Original cerrada');
    expect(columnas[2].destacada).toBe(true);
    expect(columnas[2].liquido).toContain('890');
  });

  it('prepara contexto modal con referencia al cierre original', () => {
    const origen = {
      totalLiquido: 500000,
      totalTrabajadores: 3,
    } as NominaPeriodoResumen;
    const preview = {
      nominaOrigenId: 'o1',
      nominaReferenciaId: 'o1',
      totales: { seleccionados: 2, disponibles: 3, conflictos: 0 },
    } as RectificacionPreview;
    const ctx = prepararContextoRectificacionModal(origen, preview);
    expect(ctx.seleccionados).toBe(2);
    expect(ctx.referenciaEsOriginal).toBe(true);
    expect(ctx.notaReferencia).toContain('cierre original');
  });

  it('genera sublínea de cadena', () => {
    const origenId = 'o1';
    const resumenes = [
      { id: 'r1', naturaleza: 'rectificacion', nominaOrigenId: origenId, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
      { id: 'r2', naturaleza: 'rectificacion', nominaOrigenId: origenId, createdAt: '2026-06-02T00:00:00Z', updatedAt: '2026-06-02T00:00:00Z' },
    ] as NominaPeriodoResumen[];
    expect(etiquetaSublineaRectificacion(resumenes[1], resumenes)).toContain('#2 de 2');
  });
});
