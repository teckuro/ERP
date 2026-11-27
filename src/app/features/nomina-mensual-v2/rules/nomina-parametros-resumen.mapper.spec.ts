import { describe, expect, it } from 'vitest';

import type { ProcesoMensualGrupoParametro } from '../../nomina-mensual/models/proceso-mensual.model';
import {
  MENSAJES_COMPLETITUD,
  mensajeFaltaCampoConfigEmpresa,
  type ParametrosCompletitudGrupo,
  type ParametrosCompletitudResultado,
} from '../../parametros-generales/rules/parametros-completitud.rules';
import { buildNominaParametrosResumen } from './nomina-parametros-resumen.mapper';

describe('nomina-parametros-resumen.mapper', () => {
  const gruposOk: ProcesoMensualGrupoParametro[] = [
    { id: 'mensuales_uf_utm_sueldo', clasificacion: 'OK' },
    { id: 'topes_base', clasificacion: 'OK' },
    { id: 'catalogos_afp_impuesto', clasificacion: 'OK' },
    { id: 'afc_catalogo', clasificacion: 'OK' },
    { id: 'sis_fila_mensual', clasificacion: 'OK' },
    { id: 'salud_catalogo', clasificacion: 'OK' },
    { id: 'mutualidad_ley16744_ccaf', clasificacion: 'OK' },
    { id: 'reforma_previsional', clasificacion: 'OK' },
  ];

  it('configuracion cliente solo incluye validaciones de cliente y reconciliacion', () => {
    const completitud = completitudMock({
      pendientes: [MENSAJES_COMPLETITUD.sinCcaf],
      grupos: {
        configuracionCliente: grupo('configuracionCliente', 0, 1),
        consistencia: grupo('consistencia', 0, 1),
      },
      advertencias: [MENSAJES_COMPLETITUD.diferenciasOficialEmpresa],
    });

    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: gruposOk,
      completitud,
    });

    const config = resumen.areas.find((area) => area.id === 'configuracionCliente');
    expect(config?.items.map((item) => item.label)).toEqual([
      'Configuración del período',
      'Gratificación',
      'IMM gratificación',
      'Descuentos por ausencias',
      'CCAF',
      'Mutual Ley 16.744',
      'Valores operativos',
      'Reconciliación oficial/cliente',
    ]);
    expect(config?.items.find((item) => item.label === 'CCAF')?.estado).toBe('revisar');
    expect(config?.items.some((item) => item.label.includes('Centros'))).toBe(false);
    expect(config?.items.some((item) => item.label.includes('Jornadas'))).toBe(false);
  });

  it('no duplica catalogos_afp_impuesto entre datos oficiales y catalogos previsionales', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: gruposOk,
      completitud: completitudMock(),
    });

    const oficiales = resumen.areas.find((area) => area.id === 'datosOficiales');
    const catalogos = resumen.areas.find((area) => area.id === 'catalogosPrevisionales');

    expect(oficiales?.items.map((item) => item.label)).toEqual([
      'UF / UTM / IPC',
      'Topes imponibles',
    ]);
    expect(catalogos?.items.map((item) => item.label)).toEqual([
      'AFP e impuesto único',
      'Salud',
      'CCAF / Mutual',
    ]);
  });

  it('reglas de calculo no incluye reconciliacion oficial/cliente', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: gruposOk,
      completitud: completitudMock({
        grupos: {
          consistencia: grupo('consistencia', 0, 1),
        },
      }),
    });

    const reglas = resumen.areas.find((area) => area.id === 'reglasCalculo');
    expect(reglas?.items.map((item) => item.label)).toEqual(['AFC', 'SIS / SANNA']);
    expect(reglas?.items.some((item) => item.label.includes('Reconciliación'))).toBe(false);
  });

  it('asigna bloqueos al area correspondiente', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: [
        ...gruposOk.filter((grupo) => grupo.id !== 'mensuales_uf_utm_sueldo'),
        { id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE', detalle: 'sin_fila' },
      ],
      completitud: completitudMock({
        pendientes: [MENSAJES_COMPLETITUD.sinMutual],
        grupos: {
          configuracionCliente: grupo('configuracionCliente', 0, 1),
        },
      }),
    });

    expect(resumen.bloqueosActuales.some((bloqueo) => bloqueo.areaId === 'datosOficiales')).toBe(true);
    expect(resumen.bloqueosActuales.some((bloqueo) => bloqueo.areaId === 'configuracionCliente')).toBe(true);
    expect(resumen.bloqueosActuales.every((bloqueo) => bloqueo.areaId !== 'reglasCalculo')).toBe(true);
  });

  it('oficiales mensuales faltantes no incrementan bloqueos de preparacion', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: [
        ...gruposOk.filter((grupo) => !['mensuales_uf_utm_sueldo', 'topes_base', 'sis_fila_mensual'].includes(grupo.id)),
        { id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE', detalle: 'sin_fila' },
        { id: 'topes_base', clasificacion: 'FALTANTE', detalle: 'topes_incompletos' },
        { id: 'sis_fila_mensual', clasificacion: 'FALTANTE', detalle: 'sis_null' },
      ],
      completitud: completitudMock(),
    });

    expect(resumen.bloqueos).toBeGreaterThan(0);
    expect(resumen.bloqueosPreparacion).toBe(0);
    expect(resumen.advertenciasOficiales).toBe(3);
    expect(resumen.puedePreparar).toBe(true);
    expect(resumen.pendientesPreparacion).toEqual([]);
    expect(resumen.advertenciasNoBloqueantes).toHaveLength(3);
  });

  it('sin configuración de la empresa deja los checks pendientes y omite valores operativos', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: gruposOk,
      completitud: completitudMock({
        pendientes: [MENSAJES_COMPLETITUD.sinConfigEmpresa, mensajeFaltaCampoConfigEmpresa('uf')],
        grupos: { configuracionCliente: grupo('configuracionCliente', 0, 1) },
      }),
    });

    const items = resumen.areas.find((area) => area.id === 'configuracionCliente')?.items ?? [];
    expect(items.find((item) => item.label === 'Configuración del período')).toEqual(
      expect.objectContaining({ estado: 'revisar', detalle: MENSAJES_COMPLETITUD.sinConfigEmpresa }),
    );
    expect(items.find((item) => item.label === 'Gratificación')?.estado).toBe('pendiente');
    expect(items.some((item) => item.label === 'Valores operativos')).toBe(false);
  });

  it('marca valores operativos a revisar cuando falta un dato de la configuración de la empresa', () => {
    const pendiente = mensajeFaltaCampoConfigEmpresa('uf');
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: gruposOk,
      completitud: completitudMock({
        pendientes: [pendiente],
        grupos: {
          configuracionCliente: grupo('configuracionCliente', 0, 1),
          consistencia: grupo('consistencia', 0, 1),
        },
      }),
    });

    const items = resumen.areas.find((area) => area.id === 'configuracionCliente')?.items ?? [];
    expect(items.find((item) => item.label === 'Valores operativos')).toEqual(
      expect.objectContaining({ estado: 'revisar', detalle: pendiente }),
    );
    expect(items.find((item) => item.label === 'Reconciliación oficial/cliente')?.detalle)
      .toBe(MENSAJES_COMPLETITUD.diferenciasOficialEmpresa);
  });

  it('configuracion cliente incompleta bloquea preparacion', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: gruposOk,
      completitud: completitudMock({
        pendientes: [MENSAJES_COMPLETITUD.sinCcaf],
        grupos: {
          configuracionCliente: grupo('configuracionCliente', 0, 1),
        },
      }),
    });

    expect(resumen.bloqueosPreparacion).toBe(1);
    expect(resumen.puedePreparar).toBe(false);
    expect(resumen.pendientesPreparacion.some((bloqueo) => bloqueo.areaId === 'configuracionCliente')).toBe(true);
  });

  it('catalogos y vigencias no oficiales incompletos bloquean preparacion', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: [
        ...gruposOk.filter((grupo) => !['catalogos_afp_impuesto', 'afc_catalogo', 'salud_catalogo'].includes(grupo.id)),
        { id: 'catalogos_afp_impuesto', clasificacion: 'FALTANTE', detalle: 'afp_o_impuesto_vacio' },
        { id: 'afc_catalogo', clasificacion: 'FALTANTE', detalle: 'sin_filas_afc' },
        { id: 'salud_catalogo', clasificacion: 'FALTANTE', detalle: 'sin_isapre' },
      ],
      completitud: completitudMock(),
    });

    expect(resumen.bloqueosPreparacion).toBe(3);
    expect(resumen.puedePreparar).toBe(false);
    expect(resumen.pendientesPreparacion.map((bloqueo) => bloqueo.titulo)).toEqual([
      'AFP e impuesto único',
      'Salud',
      'AFC',
    ]);
  });

  it('expone resumen por 5 secciones visibles y controles internos verificados', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: gruposOk,
      completitud: completitudMock(),
    });

    expect(resumen.seccionesTotales).toBe(5);
    expect(resumen.seccionesListas).toBe(5);
    expect(resumen.completitudSecciones).toBe(100);
    expect(resumen.controlesTotales).toBe(resumen.totalParametros);
    expect(resumen.controlesVerificados).toBe(resumen.completos);
    expect(resumen.controlesVerificados).toBeGreaterThan(resumen.seccionesTotales);
  });

  it('cuenta secciones listas segun estado del visor, no solo controles ok', () => {
    const resumen = buildNominaParametrosResumen({
      periodo: '2026-05',
      gruposMinimos: [
        ...gruposOk.filter((grupo) => grupo.id !== 'mensuales_uf_utm_sueldo'),
        { id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE', detalle: 'sin_fila' },
      ],
      completitud: completitudMock(),
    });

    expect(resumen.seccionesListas).toBeLessThan(5);
    expect(resumen.completitudSecciones).toBeLessThan(100);
  });
});

function grupo(
  id: 'oficialesMensuales' | 'configuracionCliente' | 'vigencias' | 'consistencia' | 'tecnico',
  completos: number,
  total: number,
): ParametrosCompletitudGrupo {
  return {
    id,
    completo: completos === total && total > 0,
    porcentaje: total === 0 ? 0 : Math.round((completos / total) * 100),
    total,
    completos,
  };
}

function completitudMock(
  partial: Partial<Omit<ParametrosCompletitudResultado, 'grupos'>> & {
    grupos?: Partial<ParametrosCompletitudResultado['grupos']>;
  } = {},
): ParametrosCompletitudResultado {
  const { grupos: gruposPartial, ...restPartial } = partial;
  const defaultGrupos: ParametrosCompletitudResultado['grupos'] = {
    oficialesMensuales: grupo('oficialesMensuales', 1, 1),
    configuracionCliente: grupo('configuracionCliente', 1, 1),
    vigencias: grupo('vigencias', 1, 1),
    consistencia: grupo('consistencia', 1, 1),
    tecnico: grupo('tecnico', 1, 1),
  };

  return {
    estadoCalculado: 'parcial',
    porcentaje: 80,
    grupos: { ...defaultGrupos, ...(gruposPartial ?? {}) },
    pendientes: partial.pendientes ?? [],
    advertencias: partial.advertencias ?? [],
    errores: partial.errores ?? [],
    diferencias: partial.diferencias ?? [],
    reconciliacionPendiente: partial.reconciliacionPendiente ?? false,
    ...restPartial,
  };
}
