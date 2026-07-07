import { describe, expect, it } from 'vitest';

import {
  construirInputNovedadMasiva,
  puedeSeleccionarTrabajadorMovimiento,
  prepararAsignacionMasiva,
  resumirResultadoAsignacionMasiva,
  resolverIdContratoMasivo,
} from './novedades-asignacion-masiva.rules';

const formBase = {
  idConcepto: 20,
  categoria: 'haber_variable' as const,
  tipoMovimiento: 'haber' as const,
  cantidad: null,
  unidad: '',
  monto: 50000,
  moneda: 'CLP',
  origen: 'manual' as const,
  fechaEvento: '2026-05-01',
  observacion: '',
  referenciaExterna: '',
};

describe('novedades-asignacion-masiva.rules', () => {
  it('bloquea seleccion de trabajadores incompletos', () => {
    expect(
      puedeSeleccionarTrabajadorMovimiento({
        idPersona: 1,
        trabajador: 'Ana',
        rut: '1-1',
        estado: 'Incompleto',
      }),
    ).toBe(false);
    expect(
      puedeSeleccionarTrabajadorMovimiento({
        idPersona: 2,
        trabajador: 'Luis',
        rut: '2-2',
        estado: 'Listo',
      }),
    ).toBe(true);
  });

  it('construye input por trabajador con contrato del listado', () => {
    const input = construirInputNovedadMasiva('2026-05', formBase, 10, 100);
    expect(input.idPersona).toBe(10);
    expect(input.idContrato).toBe(100);
    expect(input.idConcepto).toBe(20);
    expect(input.monto).toBe(50000);
  });

  it('resuelve contrato desde empleados', () => {
    expect(resolverIdContratoMasivo(10, [{ id: 10, idContrato: 100 }])).toBe(100);
    expect(resolverIdContratoMasivo(10, [{ id: 10, idContrato: null }])).toBeNull();
  });

  it('prepara filas validas y marca errores previos', () => {
    const preparadas = prepararAsignacionMasiva(
      '2026-05',
      formBase,
      [
        { idPersona: 10, trabajador: 'Ana', rut: '1-1', estado: 'Listo' },
        { idPersona: 11, trabajador: 'Incompleta', rut: '2-2', estado: 'Incompleto' },
      ],
      [{ id: 10, idContrato: 100 }],
    );

    expect(preparadas[0]?.input?.idPersona).toBe(10);
    expect(preparadas[0]?.errorPrevio).toBeNull();
    expect(preparadas[1]?.input).toBeNull();
    expect(preparadas[1]?.errorPrevio).toContain('ficha incompleta');
  });

  it('resume exitos y fallos en copy RRHH', () => {
    const resumen = resumirResultadoAsignacionMasiva([
      { idPersona: 1, trabajador: 'Ana', ok: true },
      { idPersona: 2, trabajador: 'Luis', ok: false, mensaje: 'Sin contrato visible' },
    ]);

    expect(resumen.exitos).toBe(1);
    expect(resumen.fallos).toBe(1);
    expect(resumen.mensaje).toContain('1 movimientos registrados · 1 no se pudieron');
    expect(resumen.detalle).toContain('Luis');
  });
});
