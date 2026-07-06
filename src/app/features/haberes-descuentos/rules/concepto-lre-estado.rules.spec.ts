import {
  clasificarEstadoLreConcepto,
  contarConceptosPendientesExportacionLre,
  etiquetaEstadoLreConcepto,
  filtroLreDesdeEstado,
} from './concepto-lre-estado.rules';

describe('concepto-lre-estado.rules', () => {
  const base = {
    idCatalogoLre: null,
    codigoLre: null,
    estrategiaLre: 'DIRECTO',
    requiereExportacionLre: true,
  };

  it('clasifica directo con código', () => {
    const estado = clasificarEstadoLreConcepto({ ...base, codigoLre: '2101', idCatalogoLre: 1 });
    expect(estado).toBe('directo_con_codigo');
    expect(etiquetaEstadoLreConcepto(estado)).toBe('Listo para exportar');
    expect(filtroLreDesdeEstado(estado)).toBe('CON');
  });

  it('clasifica requiere asignación', () => {
    const estado = clasificarEstadoLreConcepto(base);
    expect(estado).toBe('requiere_asignacion');
    expect(filtroLreDesdeEstado(estado)).toBe('SIN');
  });

  it('clasifica pendiente normativo', () => {
    const estado = clasificarEstadoLreConcepto({
      ...base,
      estrategiaLre: 'PENDIENTE_NORMATIVO',
    });
    expect(estado).toBe('pendiente_normativo');
    expect(filtroLreDesdeEstado(estado)).toBe('PENDIENTE');
  });

  it('clasifica deriva operativa', () => {
    const estado = clasificarEstadoLreConcepto({
      ...base,
      estrategiaLre: 'DERIVA_DIAS_TRABAJADOS',
    });
    expect(estado).toBe('deriva_operativa');
    expect(filtroLreDesdeEstado(estado)).toBe('DERIVA');
  });

  it('cuenta pendientes de exportación', () => {
    const n = contarConceptosPendientesExportacionLre([
      base,
      { ...base, codigoLre: '2101', idCatalogoLre: 1 },
      { ...base, estrategiaLre: 'PENDIENTE_NORMATIVO' },
    ]);
    expect(n).toBe(1);
  });
});
