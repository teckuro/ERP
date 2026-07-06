import {
  empresaVigenteEnPeriodo,
  incidenciaLey16744EmpresaObsoleta,
  mapEmpresaRowToLey16744Snapshot,
  resolveEmpresaMutualSnapshot,
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

  it('no emite snapshot mutual si la empresa no aplica mutual', () => {
    expect(
      resolveEmpresaMutualSnapshot(
        {
          id_empresa: 1,
          aplica_ley_16744: false,
          id_organismo_administrador_ley_16744: 2,
          tasa_adicional_diferenciada: 0.1,
          vigencia_inicio: null,
          vigencia_fin: null,
        },
        '2026-05',
      ),
    ).toBeNull();
  });

  it('emite snapshot mutual cuando aplica y está vigente', () => {
    const snapshot = resolveEmpresaMutualSnapshot(
      {
        id_empresa: 1,
        aplica_ley_16744: true,
        id_organismo_administrador_ley_16744: 2,
        tasa_adicional_diferenciada: 0.1,
        vigencia_inicio: '2026-01-01',
        vigencia_fin: null,
      },
      '2026-05',
    );
    expect(snapshot).toEqual(mapEmpresaRowToLey16744Snapshot({
      id_empresa: 1,
      aplica_ley_16744: true,
      id_organismo_administrador_ley_16744: 2,
      tasa_adicional_diferenciada: 0.1,
      vigencia_inicio: '2026-01-01',
      vigencia_fin: null,
    }));
  });
});
