import type { MovimientoVariableMensualRow } from './movimientos-variables.mapper';
import {
  mapActualizarPayloadToUpdate,
  mapAnularPayloadToUpdate,
  mapCrearPayloadToInsert,
  mapRowToMovimientoVariable,
} from './movimientos-variables.mapper';

describe('mappers movimientos variables', () => {
  const filaBase: MovimientoVariableMensualRow = {
    id_movimiento_variable: 5,
    id_persona: 10,
    id_concepto: 20,
    periodo: '2026-05',
    monto: 123.45,
    estado: 'BORRADOR',
    origen: 'MANUAL',
    observacion: 'nota',
    fecha_registro: '2026-05-01T10:00:00.000Z',
    fecha_actualizacion: '2026-05-01T10:00:00.000Z',
    fecha_anulacion: null,
    motivo_anulacion: null,
  };

  it('mapRowToMovimientoVariable convierte snake_case a camelCase', () => {
    const m = mapRowToMovimientoVariable(filaBase);
    expect(m.idMovimiento).toBe(5);
    expect(m.idPersona).toBe(10);
    expect(m.idConcepto).toBe(20);
    expect(m.periodo).toBe('2026-05');
    expect(m.monto).toBe(123.45);
    expect(m.estado).toBe('BORRADOR');
    expect(m.origen).toBe('MANUAL');
    expect(m.observacion).toBe('nota');
    expect(m.fechaRegistro).toBe('2026-05-01T10:00:00.000Z');
    expect(m.fechaActualizacion).toBe('2026-05-01T10:00:00.000Z');
    expect(m.fechaAnulacion).toBeNull();
    expect(m.motivoAnulacion).toBeNull();
  });

  it('mapCrearPayloadToInsert mapea payload de alta a columnas insert snake_case', () => {
    const ins = mapCrearPayloadToInsert({
      idPersona: 1,
      idConcepto: 2,
      periodo: ' 2026-01 ',
      monto: 99.5,
      estado: 'VALIDADO',
      origen: 'IMPORTADO',
      observacion: null,
    });
    expect(ins.id_persona).toBe(1);
    expect(ins.id_concepto).toBe(2);
    expect(ins.periodo).toBe('2026-01');
    expect(ins.monto).toBe(99.5);
    expect(ins.estado).toBe('VALIDADO');
    expect(ins.origen).toBe('IMPORTADO');
    expect(ins.observacion).toBeNull();
  });

  it('mapCrearPayloadToInsert usa valores por defecto de estado y origen', () => {
    const ins = mapCrearPayloadToInsert({
      idPersona: 1,
      idConcepto: 2,
      periodo: '2026-02',
      monto: 1,
    });
    expect(ins.estado).toBe('BORRADOR');
    expect(ins.origen).toBe('MANUAL');
  });

  it('mapActualizarPayloadToUpdate solo define campos indicados más fecha_actualizacion', () => {
    const u = mapActualizarPayloadToUpdate({
      idMovimiento: 1,
      monto: 200,
    });
    expect(u.monto).toBe(200);
    expect(u.id_persona).toBeUndefined();
    expect(u.fecha_actualizacion).toBeDefined();
  });

  it('mapActualizarPayloadToUpdate no incluye observacion si viene undefined', () => {
    const u = mapActualizarPayloadToUpdate({
      idMovimiento: 1,
      observacion: undefined,
    });
    expect(u.observacion).toBeUndefined();
  });

  it('mapAnularPayloadToUpdate fija ANULADO y marcas de tiempo', () => {
    const u = mapAnularPayloadToUpdate({ idMovimiento: 1, motivo: '  error carga ' });
    expect(u.estado).toBe('ANULADO');
    expect(u.fecha_anulacion).toBeDefined();
    expect(u.fecha_actualizacion).toBeDefined();
    expect(u.motivo_anulacion).toBe('error carga');
  });

  it('mapAnularPayloadToUpdate deja motivo_anulacion en null si el motivo está vacío', () => {
    const u = mapAnularPayloadToUpdate({ idMovimiento: 1, motivo: '   ' });
    expect(u.motivo_anulacion).toBeNull();
  });
});
