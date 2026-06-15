import { describe, expect, it } from 'vitest';

import { mapNominaCreatePreview } from './nomina-creacion-preview.mapper';

describe('mapNominaCreatePreview (F04)', () => {
  it('mapea un payload completo de la RPC al viewmodel', () => {
    const raw = {
      periodo: '2026-06',
      tipo: 'mensual',
      naturaleza: 'liquidacion_legal',
      idEmpresa: 7,
      empresaNombre: 'Demo S.A.',
      codigoCiclo: '2026-06-MES',
      fechaInicio: '2026-06-01',
      fechaFin: '2026-06-30',
      plantillaCicloId: 'pl-uuid',
      incluidos: [
        { idPersona: 10, rut: '12345678-9', nombre: 'Ana Pérez', cargo: 'Analista' },
      ],
      excluidos: [
        {
          idPersona: 11,
          rut: '11111111-1',
          nombre: 'Juan Soto',
          motivo: 'ficha_no_apta',
          motivoHumano: 'Ficha no apta para remuneraciones',
        },
      ],
      conflictos: [
        {
          motivo: 'duplicidad_nomina',
          motivoHumano: 'Ya existe una nómina mensual para este período',
          detalle: { idNominaPeriodo: 'uuid' },
        },
      ],
      totales: { incluidos: 1, excluidos: 1, conflictos: 1 },
      puedeCrear: false,
      fingerprint: 'abc123',
      generadoEn: '2026-06-15T12:00:00Z',
    };

    const preview = mapNominaCreatePreview(raw);

    expect(preview.periodo).toBe('2026-06');
    expect(preview.idEmpresa).toBe(7);
    expect(preview.incluidos).toHaveLength(1);
    expect(preview.incluidos[0]?.nombre).toBe('Ana Pérez');
    expect(preview.excluidos[0]?.motivoHumano).toBe('Ficha no apta para remuneraciones');
    expect(preview.conflictos[0]?.detalle).toEqual({ idNominaPeriodo: 'uuid' });
    expect(preview.totales).toEqual({ incluidos: 1, excluidos: 1, conflictos: 1 });
    expect(preview.puedeCrear).toBe(false);
    expect(preview.fingerprint).toBe('abc123');
  });

  it('devuelve estructura segura cuando faltan campos', () => {
    const preview = mapNominaCreatePreview(null);
    expect(preview.incluidos).toEqual([]);
    expect(preview.excluidos).toEqual([]);
    expect(preview.conflictos).toEqual([]);
    expect(preview.totales).toEqual({ incluidos: 0, excluidos: 0, conflictos: 0 });
    expect(preview.puedeCrear).toBe(false);
    expect(preview.fingerprint).toBe('');
  });

  it('descarta filas inválidas en arrays', () => {
    const raw = {
      incluidos: [
        { idPersona: 10, rut: '1-1', nombre: 'OK', cargo: null },
        { idPersona: 0, rut: 'mal', nombre: 'sin id' },
        null,
      ],
      excluidos: [
        { idPersona: 11, rut: '2-2', nombre: 'Excluida', motivo: 'persona_inactiva', motivoHumano: 'inactiva' },
        'string-invalido',
      ],
      totales: { incluidos: 'no-es-numero', excluidos: 1, conflictos: 0 },
    };
    const preview = mapNominaCreatePreview(raw);
    expect(preview.incluidos).toHaveLength(1);
    expect(preview.excluidos).toHaveLength(1);
    expect(preview.totales.incluidos).toBe(1);
    expect(preview.totales.excluidos).toBe(1);
  });
});
