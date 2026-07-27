import { describe, expect, it } from 'vitest';

import {
  construirComposicionCosto,
  construirEvolucionCosto,
  construirIndicadoresEconomicos,
  construirResumenOperativo,
  contarMovimientosRevision,
  formatearValorEconomico,
} from './resumen-operativo.rules';

describe('resumen-operativo.rules', () => {
  it('ordena la bandeja por prioridad operativa', () => {
    const snapshot = construirResumenOperativo({
      periodoYm: '2026-04',
      nominas: [
        {
          periodo: '2026-04',
          estado: 'borrador',
          totalIncidenciasCriticas: 2,
          totalHaberes: 0,
        } as never,
      ],
      empleados: [
        {
          estado: 'activo',
          estadoFicha: 'INCOMPLETO',
          aptoParaRemuneraciones: false,
        } as never,
      ],
      licenciasPendientes: [{ idLicencia: 1 } as never],
      novedades: [],
      parametros: {
        uf: 39000,
        utm: 68000,
        uta: 816000,
        sueldoMinimo: 529000,
      },
    });
    expect(snapshot.atencion.map((item) => item.id)).toEqual([
      'nominas-criticas',
      'licencias',
      'fichas',
    ]);
  });

  it('cuenta movimientos en pendiente_revision', () => {
    expect(
      contarMovimientosRevision([
        { estado: 'pendiente_revision' } as never,
        { estado: 'aprobada' } as never,
      ]),
    ).toBe(1);
  });

  it('usa administrador de nóminas como fallback', () => {
    const snapshot = construirResumenOperativo({
      periodoYm: '2026-04',
      nominas: [],
      empleados: [],
      licenciasPendientes: [],
      novedades: [],
    });
    expect(snapshot.accionRecomendada.ruta).toBe('/remuneraciones/nominas');
  });

  it('expone UF, UTM, UTA, sueldo mínimo y dólar pendiente', () => {
    const economicos = construirIndicadoresEconomicos({
      uf: 39123.45,
      utm: 68000,
      uta: 816000,
      sueldoMinimo: 529000,
      dolarObservado: null,
    });
    expect(economicos.map((item) => item.id)).toEqual([
      'uf',
      'utm',
      'uta',
      'sueldo-minimo',
      'dolar',
    ]);
    expect(economicos.find((item) => item.id === 'uf')?.disponible).toBe(true);
    expect(economicos.find((item) => item.id === 'dolar')?.disponible).toBe(false);
    expect(formatearValorEconomico(39123.45, 'clp')).toContain('39.123');
  });

  it('alerta cuando faltan indicadores económicos del período', () => {
    const snapshot = construirResumenOperativo({
      periodoYm: '2026-04',
      nominas: [],
      empleados: [],
      licenciasPendientes: [],
      novedades: [],
      parametros: {
        uf: null,
        utm: 68000,
        uta: null,
        sueldoMinimo: 529000,
      },
    });
    expect(snapshot.atencion.some((item) => item.id === 'parametros-economicos')).toBe(true);
  });

  it('expone KPIs en 0 y evolución/composición vacías cuando no hay montos', () => {
    const snapshot = construirResumenOperativo({
      periodoYm: '2026-07',
      nominas: [],
      empleados: [],
      licenciasPendientes: [],
      novedades: [],
    });
    expect(snapshot.kpis.find((k) => k.id === 'empleados-activos')?.value).toBe(0);
    expect(snapshot.kpis.find((k) => k.id === 'costo-esperado')?.value).toBe(0);
    expect(snapshot.evolucion.puntos).toHaveLength(6);
    expect(snapshot.evolucion.hayDatos).toBe(false);
    expect(snapshot.composicion.total).toBe(0);
    expect(snapshot.composicion.hayDatos).toBe(false);
  });

  it('calcula variación de indicadores vs período anterior', () => {
    const economicos = construirIndicadoresEconomicos(
      { uf: 40820.31, utm: 71506, uta: 858072, sueldoMinimo: 539000, dolarObservado: null },
      { uf: 40759.12, utm: 71506, uta: 856360, sueldoMinimo: 529000, dolarObservado: null },
    );
    expect(economicos.find((e) => e.id === 'uf')?.tendencia).toBe('up');
    expect(economicos.find((e) => e.id === 'utm')?.variacionLabel).toBe('Sin variación');
    expect(economicos.find((e) => e.id === 'dolar')?.variacionLabel).toBe('Sin valor');
  });

  it('arma evolución y composición con totales reales de nómina', () => {
    const evolucion = construirEvolucionCosto('2026-07', [
      { periodo: '2026-07', estado: 'calculada', totalHaberes: 1000 } as never,
      { periodo: '2025-07', estado: 'cerrada', totalHaberes: 800 } as never,
    ]);
    expect(evolucion.puntos.at(-1)?.valorActual).toBe(1000);
    expect(evolucion.puntos.at(-1)?.valorAnterior).toBe(800);
    expect(evolucion.variacionPct).toBeCloseTo(25);

    const composicion = construirComposicionCosto([
      {
        periodo: '2026-07',
        estado: 'calculada',
        totalHaberes: 800,
        totalDescuentos: 200,
        totalLiquido: 600,
      } as never,
    ]);
    expect(composicion.total).toBe(800);
    expect(composicion.segmentos.find((s) => s.id === 'haberes')?.porcentaje).toBe(80);
    expect(composicion.segmentos.find((s) => s.id === 'descuentos')?.porcentaje).toBe(20);
  });
});
