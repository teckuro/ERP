import { describe, expect, it } from 'vitest';

import type { NominaPeriodoResumen } from '../models/nomina-periodo.models';
import {
  agruparRectificacionesPorOrigen,
  etiquetaAccionPrimariaFila,
  indiceRectificacionEnCadena,
  puedeConsultarOriginal,
  rectificacionesDeOrigen,
} from './nomina-rectificacion-ui.rules';

function resumen(partial: Partial<NominaPeriodoResumen> & Pick<NominaPeriodoResumen, 'id'>): NominaPeriodoResumen {
  return {
    id: partial.id,
    periodo: partial.periodo ?? '2026-06',
    empresaId: partial.empresaId ?? 'e1',
    empresaNombre: partial.empresaNombre ?? 'Empresa',
    tipo: partial.tipo ?? 'mensual',
    estado: partial.estado ?? 'borrador',
    fechaInicio: partial.fechaInicio ?? '2026-06-01',
    fechaFin: partial.fechaFin ?? '2026-06-30',
    naturaleza: partial.naturaleza ?? 'liquidacion_legal',
    codigoCiclo: partial.codigoCiclo ?? 'c1',
    versionEstado: partial.versionEstado ?? 1,
    totalTrabajadores: partial.totalTrabajadores ?? 1,
    totalSegmentos: partial.totalSegmentos ?? 1,
    totalHaberes: partial.totalHaberes ?? 100,
    totalDescuentos: partial.totalDescuentos ?? 10,
    totalLiquido: partial.totalLiquido ?? 90,
    totalIncidenciasCriticas: partial.totalIncidenciasCriticas ?? 0,
    totalAdvertencias: partial.totalAdvertencias ?? 0,
    nominaOrigenId: partial.nominaOrigenId,
    createdAt: partial.createdAt ?? '2026-06-01T00:00:00Z',
    updatedAt: partial.updatedAt ?? '2026-06-01T00:00:00Z',
  };
}

describe('nomina-rectificacion-ui.rules', () => {
  it('agrupa rectificaciones por origen y ordena por creación', () => {
    const origenId = 'origen-1';
    const lista = [
      resumen({ id: 'r2', naturaleza: 'rectificacion', nominaOrigenId: origenId, createdAt: '2026-06-03T00:00:00Z' }),
      resumen({ id: 'r1', naturaleza: 'rectificacion', nominaOrigenId: origenId, createdAt: '2026-06-02T00:00:00Z' }),
      resumen({ id: 'origen-1', naturaleza: 'liquidacion_legal', estado: 'cerrada' }),
    ];
    const cadena = rectificacionesDeOrigen(lista, origenId);
    expect(cadena.map((f) => f.id)).toEqual(['r1', 'r2']);
    expect(agruparRectificacionesPorOrigen(lista).get(origenId)?.length).toBe(2);
  });

  it('calcula índice en cadena', () => {
    const origenId = 'origen-1';
    const lista = [
      resumen({ id: 'r1', naturaleza: 'rectificacion', nominaOrigenId: origenId, createdAt: '2026-06-02T00:00:00Z' }),
      resumen({ id: 'r2', naturaleza: 'rectificacion', nominaOrigenId: origenId, createdAt: '2026-06-03T00:00:00Z' }),
    ];
    expect(indiceRectificacionEnCadena(lista[1], lista)).toBe(2);
  });

  it('diferencia acción primaria y consulta original', () => {
    const rect = resumen({ id: 'r1', naturaleza: 'rectificacion', nominaOrigenId: 'o1' });
    const normal = resumen({ id: 'o1', naturaleza: 'liquidacion_legal' });
    expect(etiquetaAccionPrimariaFila(rect)).toBe('Continuar rectificación');
    expect(etiquetaAccionPrimariaFila(normal)).toBe('Abrir generador');
    expect(puedeConsultarOriginal(rect)).toBe(true);
    expect(puedeConsultarOriginal(normal)).toBe(false);
  });
});
