import {
  empresaVigenteEnPeriodo,
  incidenciaLey16744EmpresaObsoleta,
  mapEmpresaRowToLey16744Snapshot,
} from './proceso-mensual-empresa-ley16744.rules';

describe('proceso-mensual-empresa-ley16744.rules', () => {
  it('marca vigente en período cuando no hay fechas de vigencia', () => {
    expect(
      empresaVigenteEnPeriodo(
        { vigencia_inicio: null, vigencia_fin: null },
        '2026-05',
      ),
    ).toBe(true);
  });

  it('excluye fila fuera del período', () => {
    expect(
      empresaVigenteEnPeriodo(
        { vigencia_inicio: '2020-01-01', vigencia_fin: '2020-12-31' },
        '2026-05',
      ),
    ).toBe(false);
  });

  it('suprime incidencia obsoleta de empresa Ley 16.744', () => {
    expect(incidenciaLey16744EmpresaObsoleta('LEY_16744_EMPRESA_INCOMPLETA')).toBe(true);
    expect(incidenciaLey16744EmpresaObsoleta('SANNA_NO_DEFINIDO')).toBe(false);
  });
});
