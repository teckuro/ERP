import { describe, expect, it } from 'vitest';
import type { ParametroGeneral, PeriodoRemuneracionEstadoInfo } from '../../parametros-generales/models/parametro-general.model';
import type { MovimientoVariableListadoFila } from '../../movimientos-variables/models/movimiento-variable.model';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';

import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import {
  construirPrevalidacionMensual,
  type ProcesoMensualHechosPrevalidacion,
} from './proceso-mensual-prevalidacion.rules';
import { buildTrabajadoresPendientesRevision } from './proceso-mensual-trabajadores-prevalidacion.rules';

function filaPgBase(): ParametroGeneral {
  return {
    periodo: '2026-05',
    uf: 1,
    utm: 1,
    sueldoMinimo: 1,
    topeAfp: 1,
    topeIps: 1,
    topeCesantia: 1,
    sis: 0.01,
  } as ParametroGeneral;
}

function baseHechos(over: Partial<ProcesoMensualHechosPrevalidacion> = {}): ProcesoMensualHechosPrevalidacion {
  return {
    periodo: '2026-05',
    ultimoPg: filaPgBase(),
    lecturaUltimoPg: 'ok',
    periodoRem: {
      codigo: '2026-05',
      estado: 'cargado',
      fechaInicio: '2026-05-01',
      fechaFin: '2026-05-31',
    } satisfies PeriodoRemuneracionEstadoInfo,
    lecturaPeriodoRem: 'ok',
    parametrosGrupos: [],
    empleadosActivosAptos: 2,
    empleadosActivosNoAptos: 0,
    trabajadoresPendientesRevision: [],
    lecturaEmpleados: 'ok',
    totalConceptosMantenimiento: 3,
    lecturaConceptos: 'ok',
    alertaConceptosMotorFuturo: false,
    recurrentesConteo: { lectura: 'ok', aplicables: 0, invalidas: 0, cerradas: 0, fueraDelMes: 0 },
    entradasMensuales: [],
    lecturaEntradasMensuales: 'ok',
    movimientos: [],
    lecturaMovimientos: 'ok',
    ...over,
  };
}

function mv(estado: MovimientoVariableListadoFila['estado']): MovimientoVariableListadoFila {
  return {
    idMovimiento: 1,
    idPersona: 1,
    idConcepto: 1,
    periodo: '2026-05',
    monto: 1000,
    estado,
    origen: 'MANUAL',
  };
}

function entrada(over: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: over.idEntrada ?? 'novedad:1',
    origen: over.origen ?? 'novedad_mensual',
    origenId: over.origenId ?? 1,
    periodo: over.periodo ?? '2026-05',
    idPersona: over.idPersona ?? 1,
    idContrato: over.idContrato ?? 10,
    idConcepto: over.idConcepto ?? 1,
    tipoEntrada: over.tipoEntrada ?? 'haber',
    categoria: over.categoria ?? 'haber_variable',
    tipoMovimiento: over.tipoMovimiento ?? 'haber',
    cantidad: over.cantidad ?? null,
    unidad: over.unidad ?? null,
    monto: over.monto ?? 1000,
    moneda: over.moneda ?? 'CLP',
    estado: over.estado ?? 'aprobada',
    fechaEvento: over.fechaEvento ?? null,
    observacion: over.observacion ?? null,
    referenciaExterna: over.referenciaExterna ?? null,
    requiereRevision: over.requiereRevision ?? false,
    bloqueaProceso: over.bloqueaProceso ?? false,
    warnings: over.warnings ?? [],
    metadata: over.metadata ?? {},
  };
}

describe('proceso-mensual-prevalidacion.rules', () => {
  it('periodo invalido -> BLOQUEADO y bloqueo de formato', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        periodo: '2026-13',
        ultimoPg: null,
        periodoRem: null,
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'PERIODO_FORMATO_INVALIDO')).toBe(true);
  });

  it('sin parametros integrados (sin fila) -> BLOQUEADO', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        ultimoPg: null,
        periodoRem: null,
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'PARAMETROS_SIN_FILA')).toBe(true);
  });

  it('entradas mensuales aprobadas -> area canonica OK', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        entradasMensuales: [entrada({ estado: 'aprobada' })],
        movimientos: [mv('VALIDADO')],
      }),
    );
    expect(r.items.find((i) => i.area === 'ENTRADAS_MENSUALES')?.estado).toBe('LISTO');
    expect(r.resumen.resumenEntradasMensuales?.aptasPreNomina).toBe(1);
    expect(r.bloqueos.filter((b) => b.area === 'ENTRADAS_MENSUALES').length).toBe(0);
  });

  it('entradas mensuales pendientes -> advertencia canonica', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        entradasMensuales: [entrada({ estado: 'borrador', requiereRevision: true })],
        movimientos: [mv('BORRADOR')],
      }),
    );
    expect(r.advertencias.some((a) => a.codigo === 'ENTRADAS_PENDIENTES_REVISION')).toBe(true);
    expect(r.estado).toBe('CON_ADVERTENCIAS');
  });

  it('entradas mensuales observadas -> advertencia canonica', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        entradasMensuales: [entrada({ estado: 'observada', requiereRevision: true })],
        movimientos: [mv('OBSERVADO')],
      }),
    );
    expect(r.estado).toBe('CON_ADVERTENCIAS');
    expect(r.advertencias.some((a) => a.codigo === 'ENTRADAS_OBSERVADAS')).toBe(true);
  });

  it('entradas mensuales anuladas -> no bloquean ni advierten en area canonica', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        entradasMensuales: [entrada({ estado: 'anulada' })],
        movimientos: [mv('ANULADO')],
      }),
    );
    expect(r.bloqueos.filter((b) => b.area === 'ENTRADAS_MENSUALES').length).toBe(0);
    expect(r.advertencias.filter((a) => a.area === 'ENTRADAS_MENSUALES').length).toBe(0);
  });

  it('sin parametros y entradas bloqueantes -> BLOQUEADO por parametros y entradas', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        ultimoPg: null,
        entradasMensuales: [entrada({ estado: 'legacy_bloqueado', origen: 'legacy_movimiento_variable', bloqueaProceso: true })],
        movimientos: [mv('BLOQUEADO')],
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'PARAMETROS_SIN_FILA')).toBe(true);
    expect(r.bloqueos.some((a) => a.codigo === 'ENTRADAS_BLOQUEANTES')).toBe(true);
  });

  it('trabajadores bloqueados para nomina -> BLOQUEADO', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        empleadosActivosNoAptos: 1,
        entradasMensuales: [entrada({ estado: 'aprobada' })],
        movimientos: [mv('VALIDADO')],
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'TRABAJADORES_BLOQUEADOS_NOMINA')).toBe(true);
    expect(r.informaciones.length).toBeGreaterThan(0);
  });

  it('sin bloqueos ni advertencias -> LISTO_PARA_CALCULO', () => {
    const r = construirPrevalidacionMensual(baseHechos());
    expect(r.estado).toBe('LISTO_PARA_CALCULO');
    expect(r.bloqueos.length).toBe(0);
    expect(r.advertencias.length).toBe(0);
    expect(r.resumen.parametrosOperativos).toBe(true);
  });

  it('resumen de entradas calcula totales canónicos y legacy', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        entradasMensuales: [
          entrada({ estado: 'aprobada', origen: 'novedad_mensual' }),
          entrada({
            idEntrada: 'legacy_movimiento:1',
            origen: 'legacy_movimiento_variable',
            estado: 'legacy_bloqueado',
            bloqueaProceso: true,
            warnings: ['bloqueado'],
          }),
          entrada({ idEntrada: 'novedad:2', estado: 'pendiente_revision', requiereRevision: true }),
        ],
        movimientos: [mv('BLOQUEADO')],
      }),
    );
    expect(r.resumen.totalEntradasMensuales).toBe(3);
    expect(r.resumen.resumenEntradasMensuales?.aprobadas).toBe(1);
    expect(r.resumen.resumenEntradasMensuales?.pendientesRevision).toBe(1);
    expect(r.resumen.resumenEntradasMensuales?.legacyMovimientos).toBe(1);
    expect(r.resumen.resumenEntradasMensuales?.bloqueantes).toBe(1);
    expect(r.bloqueos.some((b) => b.codigo === 'ENTRADAS_BLOQUEANTES')).toBe(true);
    expect(r.advertencias.some((a) => a.codigo === 'ENTRADAS_BLOQUEANTES')).toBe(false);
  });

  it('recurrentes invalidas -> CON_ADVERTENCIAS (no bloquea generar nómina)', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        recurrentesConteo: { lectura: 'ok', aplicables: 0, invalidas: 2, cerradas: 0, fueraDelMes: 0 },
      }),
    );
    expect(r.estado).toBe('CON_ADVERTENCIAS');
    expect(r.bloqueos.some((b) => b.codigo === 'RECURRENTES_INVALIDAS')).toBe(false);
    expect(r.advertencias.some((a) => a.codigo === 'RECURRENTES_INVALIDAS')).toBe(true);
  });

  it('recurrentes aplicables sin invalidas -> no bloquea por recurrentes', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        recurrentesConteo: { lectura: 'ok', aplicables: 3, invalidas: 0, cerradas: 1, fueraDelMes: 2 },
      }),
    );
    expect(r.bloqueos.some((b) => b.codigo === 'RECURRENTES_INVALIDAS')).toBe(false);
  });

  it('expone trabajadoresPendientesRevision en la prevalidación', () => {
    const listado = [
      {
        id: 1,
        estado: 'activo',
        nombre: 'Ana',
        rut: '1-9',
        aptoParaRemuneraciones: false,
        estadoFicha: 'VALIDO',
      },
    ] as EmpleadoListado[];
    const pendientes = buildTrabajadoresPendientesRevision(listado);
    const r = construirPrevalidacionMensual(
      baseHechos({
        empleadosActivosNoAptos: 1,
        trabajadoresPendientesRevision: pendientes,
      }),
    );
    expect(r.trabajadoresPendientesRevision).toHaveLength(1);
    expect(r.trabajadoresPendientesRevision[0].nombre).toBe('Ana');
  });

  it('tolera colecciones ausentes durante verificar periodo', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        parametrosGrupos: undefined as any,
        trabajadoresPendientesRevision: undefined as any,
        entradasMensuales: undefined as any,
        movimientos: undefined as any,
      }),
    );

    expect(r.estado).toBe('LISTO_PARA_CALCULO');
    expect(r.resumen.totalEntradasMensuales).toBe(0);
    expect(r.trabajadoresPendientesRevision).toEqual([]);
  });

  it('tolera entrada sin warnings durante verificar periodo', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        entradasMensuales: [entrada({ warnings: undefined as any })],
      }),
    );

    expect(r.resumen.resumenEntradasMensuales?.conWarnings).toBe(0);
    expect(r.bloqueos).toEqual([]);
  });
});
