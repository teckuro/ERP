import type { ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';
import { buildValidacionCalculoPreliminarView } from './proceso-mensual-validacion-calculo.rules';

function prevalidacionBase(
  overrides: Partial<Omit<ProcesoMensualPrevalidacion, 'resumen'>> & {
    resumen?: Partial<ProcesoMensualPrevalidacion['resumen']>;
  } = {},
): ProcesoMensualPrevalidacion {
  const { resumen: resumenOverrides, ...rest } = overrides;
  return {
    periodo: '2026-05',
    estado: 'CON_ADVERTENCIAS',
    resumen: {
      periodo: '2026-05',
      hayBloqueos: false,
      hayAdvertencias: true,
      conteoMovimientosPorEstado: {},
      trabajadoresActivosAptos: 1,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: true,
      parametrosGrupos: [],
      recurrentesAplicablesAlPeriodo: 0,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
      ...resumenOverrides,
    },
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    items: [],
    ...rest,
  };
}

describe('proceso-mensual-validacion-calculo.rules', () => {
  it('devuelve pendiente sin prevalidacion ni bloqueos previos', () => {
    const vm = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: null,
      preNomina: null,
      base: null,
      errorEjecucion: null,
      nominaCerradaOperativamente: false,
    });

    expect(vm.estado).toBe('pendiente');
    expect(vm.siguienteAccion.accionLocal).toBe('validarPeriodo');
    expect(vm.bloqueos).toHaveLength(0);
  });

  it('bloquea cuando hay error de ejecucion', () => {
    const vm = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: null,
      preNomina: null,
      base: null,
      errorEjecucion: 'Timeout de red',
      nominaCerradaOperativamente: false,
    });

    expect(vm.estado).toBe('bloqueado');
    expect(vm.bloqueos.some((b) => b.codigo === 'BLOQ-004')).toBe(false);
    expect(vm.bloqueos.some((b) => b.codigo === 'BLOQ-002')).toBe(true);
  });

  it('no agrega BLOQ-004 si parametrosOperativos es true aunque haya grupos PARCIAL obligatorios', () => {
    const vm = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: prevalidacionBase({
        resumen: {
          parametrosOperativos: true,
          parametrosGrupos: [{ id: 'topes_base', clasificacion: 'PARCIAL', detalle: 'topes_incompletos' }],
        },
      }),
      preNomina: null,
      base: null,
      errorEjecucion: null,
      nominaCerradaOperativamente: false,
    });

    expect(vm.bloqueos.some((b) => b.codigo === 'BLOQ-004')).toBe(false);
  });

  it('agrega BLOQ-004 si parametrosOperativos es false y faltan grupos obligatorios', () => {
    const vm = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: prevalidacionBase({
        resumen: {
          parametrosOperativos: false,
          parametrosGrupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE', detalle: 'sin_fila' }],
        },
      }),
      preNomina: null,
      base: null,
      errorEjecucion: null,
      nominaCerradaOperativamente: false,
    });

    expect(vm.bloqueos.some((b) => b.codigo === 'BLOQ-004')).toBe(true);
    expect(vm.bloqueos.find((b) => b.codigo === 'BLOQ-004')?.ruta).toBe('/parametros');
  });
});
