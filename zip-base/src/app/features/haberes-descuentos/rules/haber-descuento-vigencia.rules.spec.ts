import type { RangoVigenciaAsignacion } from './haber-descuento-vigencia.rules';
import {
  clasificarVigenciaAsignacion,
  etiquetaEstadoVigenciaAsignacion,
  filtrarAsignacionesPorEstadoVigencia,
  validarCierreAsignacion,
  validarRangoAsignacionRecurrente,
} from './haber-descuento-vigencia.rules';

const ref = new Date(2026, 4, 15);

function rango(over: Partial<RangoVigenciaAsignacion> = {}): RangoVigenciaAsignacion {
  return {
    idAsignacion: 1,
    idPersona: 10,
    idConcepto: 20,
    vigenciaInicio: '2026-01-01',
    vigenciaFin: null,
    estado: true,
    ...over,
  };
}

describe('clasificarVigenciaAsignacion', () => {
  it('marca activa con inicio pasado y sin fecha fin', () => {
    expect(clasificarVigenciaAsignacion(rango(), ref)).toBe('ACTIVA');
  });

  it('marca futura cuando inicio es posterior a la referencia', () => {
    expect(clasificarVigenciaAsignacion(rango({ vigenciaInicio: '2026-06-01' }), ref)).toBe(
      'FUTURA',
    );
  });

  it('marca vencida cuando fecha fin es pasada', () => {
    expect(
      clasificarVigenciaAsignacion(
        rango({ vigenciaInicio: '2026-01-01', vigenciaFin: '2026-03-31' }),
        ref,
      ),
    ).toBe('VENCIDA');
  });

  it('marca invalida si fecha fin es anterior a fecha inicio', () => {
    expect(
      clasificarVigenciaAsignacion(
        rango({ vigenciaInicio: '2026-06-01', vigenciaFin: '2026-05-01' }),
        ref,
      ),
    ).toBe('INVALIDA');
  });

  it('marca invalida si falta fecha inicio', () => {
    expect(clasificarVigenciaAsignacion(rango({ vigenciaInicio: null }), ref)).toBe('INVALIDA');
  });

  it('permite fecha fin igual a fecha inicio como vigencia de un dia', () => {
    expect(
      clasificarVigenciaAsignacion(
        rango({ vigenciaInicio: '2026-05-15', vigenciaFin: '2026-05-15' }),
        ref,
      ),
    ).toBe('ACTIVA');
  });

  it('marca cerrada cuando estado es false', () => {
    expect(clasificarVigenciaAsignacion(rango({ estado: false }), ref)).toBe('CERRADA');
  });

  it('marca invalida si la fecha no es interpretable', () => {
    expect(clasificarVigenciaAsignacion(rango({ vigenciaInicio: '2026-02-31' }), ref)).toBe(
      'INVALIDA',
    );
  });
});

describe('filtrarAsignacionesPorEstadoVigencia', () => {
  const rows = [
    { id: 1, estadoVigencia: 'ACTIVA' as const },
    { id: 2, estadoVigencia: 'FUTURA' as const },
    { id: 3, estadoVigencia: 'VENCIDA' as const },
    { id: 4, estadoVigencia: 'CERRADA' as const },
    { id: 5, estadoVigencia: 'INVALIDA' as const },
  ];

  it('filtra operativas como activa y futura por defecto funcional', () => {
    expect(filtrarAsignacionesPorEstadoVigencia(rows, 'OPERATIVAS').map((row) => row.id)).toEqual([
      1,
      2,
    ]);
  });

  it('permite ver todas sin mutar la coleccion original', () => {
    const result = filtrarAsignacionesPorEstadoVigencia(rows, 'TODAS');

    expect(result.map((row) => row.id)).toEqual([1, 2, 3, 4, 5]);
    expect(result).not.toBe(rows);
  });

  it('filtra estados historicos e invalidos de forma explicita', () => {
    expect(filtrarAsignacionesPorEstadoVigencia(rows, 'VENCIDA').map((row) => row.id)).toEqual([
      3,
    ]);
    expect(filtrarAsignacionesPorEstadoVigencia(rows, 'CERRADA').map((row) => row.id)).toEqual([
      4,
    ]);
    expect(filtrarAsignacionesPorEstadoVigencia(rows, 'INVALIDA').map((row) => row.id)).toEqual([
      5,
    ]);
  });

  it('expone etiquetas ASCII para los estados de vigencia', () => {
    expect(etiquetaEstadoVigenciaAsignacion('INVALIDA')).toBe('Invalida');
    expect(etiquetaEstadoVigenciaAsignacion('CERRADA')).toBe('Cerrada');
  });
});

describe('validarRangoAsignacionRecurrente', () => {
  it('bloquea misma persona y concepto con rango activo abierto', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: null }),
      [rango({ idAsignacion: 100 })],
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('Ya existe una asignacion vigente');
  });

  it('bloquea rangos superpuestos de misma persona y concepto', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: null, vigenciaInicio: '2026-06-01', vigenciaFin: null }),
      [rango({ idAsignacion: 100, vigenciaInicio: '2026-01-01', vigenciaFin: '2026-12-31' })],
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('superpone');
  });

  it('permite rangos consecutivos sin solapamiento', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: null, vigenciaInicio: '2026-04-01', vigenciaFin: '2026-06-30' }),
      [rango({ idAsignacion: 100, vigenciaInicio: '2026-01-01', vigenciaFin: '2026-03-31' })],
      ref,
    );

    expect(result.valido).toBe(true);
  });

  it('permite mismo concepto en otro trabajador', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: null }),
      [rango({ idAsignacion: 100, idPersona: 99 })],
      ref,
    );

    expect(result.valido).toBe(true);
  });

  it('permite otro concepto en el mismo trabajador', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: null }),
      [rango({ idAsignacion: 100, idConcepto: 99 })],
      ref,
    );

    expect(result.valido).toBe(true);
  });

  it('no bloquea la edicion contra la misma asignacion', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: 100 }),
      [rango({ idAsignacion: 100 })],
      ref,
    );

    expect(result.valido).toBe(true);
  });

  it('bloquea rango abierto contra rango cerrado superpuesto', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: null, vigenciaInicio: '2026-06-01', vigenciaFin: null }),
      [rango({ idAsignacion: 100, vigenciaInicio: '2026-01-01', vigenciaFin: '2026-12-31' })],
      ref,
    );

    expect(result.valido).toBe(false);
  });

  it('permite nueva asignacion despues de cierre por fecha', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ idAsignacion: null, vigenciaInicio: '2026-04-01', vigenciaFin: null }),
      [rango({ idAsignacion: 100, vigenciaInicio: '2026-01-01', vigenciaFin: '2026-03-31' })],
      ref,
    );

    expect(result.valido).toBe(true);
  });

  it('bloquea fecha fin anterior a fecha inicio', () => {
    const result = validarRangoAsignacionRecurrente(
      rango({ vigenciaInicio: '2026-06-01', vigenciaFin: '2026-05-31' }),
      [],
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('fecha de termino');
  });
});

describe('validarCierreAsignacion', () => {
  it('permite cerrar asignacion activa con fecha de hoy', () => {
    const result = validarCierreAsignacion(
      { ...rango(), fechaCierre: '2026-05-15' },
      ref,
    );

    expect(result.valido).toBe(true);
    expect(result.vigenciaFinResultante).toBe('2026-05-15');
    expect(result.estadoResultante).toBe(false);
  });

  it('bloquea cierre activo con fecha anterior a inicio', () => {
    const result = validarCierreAsignacion(
      { ...rango({ vigenciaInicio: '2026-05-10' }), fechaCierre: '2026-05-09' },
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('anterior a la fecha de inicio');
  });

  it('permite cerrar asignacion futura por desactivacion logica sin forzar fecha fin incoherente', () => {
    const result = validarCierreAsignacion(
      { ...rango({ vigenciaInicio: '2026-06-01' }), fechaCierre: '2026-05-15' },
      ref,
    );

    expect(result.valido).toBe(true);
    expect(result.estadoActual).toBe('FUTURA');
    expect(result.vigenciaFinResultante).toBeNull();
    expect(result.estadoResultante).toBe(false);
  });

  it('bloquea asignacion vencida', () => {
    const result = validarCierreAsignacion(
      {
        ...rango({ vigenciaInicio: '2026-01-01', vigenciaFin: '2026-03-31' }),
        fechaCierre: '2026-05-15',
      },
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('vencida o cerrada');
  });

  it('bloquea asignacion ya cerrada', () => {
    const result = validarCierreAsignacion(
      { ...rango({ estado: false }), fechaCierre: '2026-05-15' },
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('ya se encuentra cerrada');
  });

  it('permite cierre con fecha igual a fecha inicio', () => {
    const result = validarCierreAsignacion(
      { ...rango({ vigenciaInicio: '2026-05-15' }), fechaCierre: '2026-05-15' },
      ref,
    );

    expect(result.valido).toBe(true);
    expect(result.vigenciaFinResultante).toBe('2026-05-15');
  });

  it('bloquea asignacion sin fecha inicio valida', () => {
    const result = validarCierreAsignacion(
      { ...rango({ vigenciaInicio: null }), fechaCierre: '2026-05-15' },
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('fecha de inicio valida');
  });

  it('bloquea cierre con fecha futura', () => {
    const result = validarCierreAsignacion(
      { ...rango(), fechaCierre: '2026-05-16' },
      ref,
    );

    expect(result.valido).toBe(false);
    expect(result.motivos[0]).toContain('no puede ser futura');
  });
});
