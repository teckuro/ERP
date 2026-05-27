import {
  esEstadoMovimientoVariableValido,
  esPeriodoRemuneracionValido,
  existeDuplicadoMovimientoVariable,
  puedeAnularMovimientoVariable,
  validarMovimientoVariableInput,
} from './movimiento-variable-validacion.rules';

describe('movimiento-variable-validacion.rules', () => {
  describe('esPeriodoRemuneracionValido', () => {
    it('acepta YYYY-MM con mes 01-12', () => {
      expect(esPeriodoRemuneracionValido('2026-01')).toBe(true);
      expect(esPeriodoRemuneracionValido('2026-12')).toBe(true);
    });

    it('rechaza mes 00 o 13', () => {
      expect(esPeriodoRemuneracionValido('2026-00')).toBe(false);
      expect(esPeriodoRemuneracionValido('2026-13')).toBe(false);
    });

    it('rechaza formato incorrecto o anio fuera de rango', () => {
      expect(esPeriodoRemuneracionValido('26-01')).toBe(false);
      expect(esPeriodoRemuneracionValido('2026-1')).toBe(false);
      expect(esPeriodoRemuneracionValido('1999-01')).toBe(false);
      expect(esPeriodoRemuneracionValido('2101-01')).toBe(false);
      expect(esPeriodoRemuneracionValido(null)).toBe(false);
      expect(esPeriodoRemuneracionValido('')).toBe(false);
    });
  });

  describe('esEstadoMovimientoVariableValido', () => {
    it('acepta estados del union', () => {
      expect(esEstadoMovimientoVariableValido('BORRADOR')).toBe(true);
      expect(esEstadoMovimientoVariableValido('INCLUIDO_EN_PROCESO')).toBe(true);
    });

    it('rechaza desconocidos', () => {
      expect(esEstadoMovimientoVariableValido('PENDIENTE')).toBe(false);
      expect(esEstadoMovimientoVariableValido(null)).toBe(false);
    });
  });

  describe('validarMovimientoVariableInput', () => {
    const base = {
      idPersona: 1,
      idConcepto: 2,
      periodo: '2026-05',
      monto: 1000,
      estado: 'BORRADOR' as const,
    };

    it('valido con campos minimos', () => {
      const r = validarMovimientoVariableInput(base);
      expect(r.valido).toBe(true);
      expect(r.motivos).toEqual([]);
    });

    it('rechaza idPersona o idConcepto invalidos', () => {
      expect(validarMovimientoVariableInput({ ...base, idPersona: 0 }).valido).toBe(false);
      expect(validarMovimientoVariableInput({ ...base, idConcepto: -1 }).valido).toBe(false);
    });

    it('rechaza monto no finito o <= 0', () => {
      expect(validarMovimientoVariableInput({ ...base, monto: 0 }).valido).toBe(false);
      expect(validarMovimientoVariableInput({ ...base, monto: NaN }).valido).toBe(false);
      expect(validarMovimientoVariableInput({ ...base, monto: Number.POSITIVE_INFINITY }).valido).toBe(
        false,
      );
    });

    it('usa BORRADOR por defecto si estado omitido', () => {
      const { estado: _e, ...sinEstado } = base;
      const r = validarMovimientoVariableInput(sinEstado as typeof base);
      expect(r.valido).toBe(true);
    });

    it('con snapshot: rechaza tipo distinto de HABER/DESCUENTO', () => {
      const r = validarMovimientoVariableInput(base, { tipo: 'APORTE_EMPLEADOR' });
      expect(r.valido).toBe(false);
      expect(r.motivos.some((m) => m.includes('HABER'))).toBe(true);
    });

    it('con snapshot: rechaza calculo automatico o sistema', () => {
      expect(
        validarMovimientoVariableInput(base, { tipo: 'HABER', calculoAutomatico: true }).valido,
      ).toBe(false);
      expect(validarMovimientoVariableInput(base, { tipo: 'DESCUENTO', esSistema: true }).valido).toBe(
        false,
      );
    });

    it('con snapshot: rechaza concepto reservado de sueldo base', () => {
      const r = validarMovimientoVariableInput(base, {
        tipo: 'HABER',
        codigo: 'SUELDO_BASE',
        nombre: 'Sueldo base',
        esSistema: false,
      });
      expect(r.valido).toBe(false);
      expect(r.motivos.some((m) => m.includes('ficha del trabajador'))).toBe(true);
    });

    it('sin snapshot no valida tipo de concepto', () => {
      const r = validarMovimientoVariableInput(base);
      expect(r.valido).toBe(true);
    });
  });

  describe('existeDuplicadoMovimientoVariable', () => {
    const existentes = [
      { idPersona: 1, idConcepto: 10, periodo: '2026-05', estado: 'BORRADOR' as const },
    ];

    it('detecta duplicado operativo', () => {
      expect(
        existeDuplicadoMovimientoVariable(
          { idPersona: 1, idConcepto: 10, periodo: '2026-05', monto: 1, estado: 'VALIDADO' },
          existentes,
        ),
      ).toBe(true);
    });

    it('ignora fila ANULADO al comparar', () => {
      const rows = [{ ...existentes[0], estado: 'ANULADO' as const }];
      expect(
        existeDuplicadoMovimientoVariable(
          { idPersona: 1, idConcepto: 10, periodo: '2026-05', monto: 1, estado: 'BORRADOR' },
          rows,
        ),
      ).toBe(false);
    });

    it('no marca duplicado si clave distinta', () => {
      expect(
        existeDuplicadoMovimientoVariable(
          { idPersona: 2, idConcepto: 10, periodo: '2026-05', monto: 1, estado: 'BORRADOR' },
          existentes,
        ),
      ).toBe(false);
    });
  });

  describe('puedeAnularMovimientoVariable', () => {
    it('permite anular desde BORRADOR u OBSERVADO', () => {
      expect(puedeAnularMovimientoVariable('BORRADOR').valido).toBe(true);
      expect(puedeAnularMovimientoVariable('OBSERVADO').valido).toBe(true);
    });

    it('no permite desde BLOQUEADO o INCLUIDO_EN_PROCESO o ANULADO', () => {
      expect(puedeAnularMovimientoVariable('BLOQUEADO').valido).toBe(false);
      expect(puedeAnularMovimientoVariable('INCLUIDO_EN_PROCESO').valido).toBe(false);
      expect(puedeAnularMovimientoVariable('ANULADO').valido).toBe(false);
    });
  });
});
