import { describe, expect, it, vi } from 'vitest';

import { parseResultadoAplicarConsolidaciones, rowToNominaConsolidacion } from '../mappers/nomina-consolidacion.mapper';

describe('nomina-consolidacion.mapper', () => {
  it('mapea fila de consolidación', () => {
    const row = rowToNominaConsolidacion({
      id: 'c1',
      id_empresa: 1,
      id_nomina_origen: 'o1',
      id_nomina_destino: 'd1',
      tipo: 'anticipo',
      estado: 'pendiente',
      monto_pagado: 500000,
      metadata: { version_calculo: 1 },
      created_at: '2026-06-01',
      updated_at: '2026-06-01',
    });
    expect(row.tipo).toBe('anticipo');
    expect(row.montoPagado).toBe(500000);
  });

  it('parsea resultado de aplicar consolidaciones', () => {
    const r = parseResultadoAplicarConsolidaciones({
      aplicadas: 2,
      total_anticipos: 100,
      total_extraordinarias: 50,
    });
    expect(r.aplicadas).toBe(2);
    expect(r.totalAnticipos).toBe(100);
  });
});
