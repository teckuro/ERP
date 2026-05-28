import { describe, expect, it } from 'vitest';

import { buildValidacionCalculoPreliminarView } from './proceso-mensual-validacion-calculo.rules';
import { buildResultadoPreliminarView } from './proceso-mensual-resultado-preliminar.rules';
import { buildRevisionAprobacionView } from './proceso-mensual-revision-aprobacion.rules';

describe('proceso-mensual-revision-aprobacion.rules', () => {
  it('sin resultado guardado no permite aprobar', () => {
    const resultadoPreliminar = buildResultadoPreliminarView({
      calculo: null,
      base: null,
      snapshotActivo: null,
      snapshotCompleto: null,
      errorGuardadoResultado: null,
      identificadorResultadoGuardadoActual: null,
      puedeCalcular: true,
      puedeGuardarPreliminar: false,
      periodoValido: true,
      nominaCerradaOperativamente: false,
      errorEjecucion: null,
      guardandoSnapshot: false,
    });
    const validacionCalculo = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: null,
      preNomina: null,
      base: null,
      errorEjecucion: null,
      nominaCerradaOperativamente: false,
    });

    const vm = buildRevisionAprobacionView({
      resultadoPreliminar,
      validacionCalculo,
      hayResultadoActual: false,
      snapshotHash: null,
      aprobacionOperativa: null,
      guardandoSnapshot: false,
      aprobandoResultado: false,
      nominaCerradaOperativamente: false,
      periodoValido: true,
    });

    expect(vm.puedeAprobar).toBe(false);
    expect(vm.estado).toBe('sin_resultado_guardado');
    expect(vm.checklist.length).toBeGreaterThan(0);
  });

  it('con guardado vigente y sin bloqueos permite aprobar', () => {
    const resultadoPreliminar = buildResultadoPreliminarView({
      calculo: null,
      base: null,
      snapshotActivo: {
        idCalculoPeriodo: 1,
        periodo: '2026-05',
        idEmpresa: null,
        estado: 'preliminar',
        fechaGeneracion: '2026-05-10T10:00:00.000Z',
        usuarioGenerador: 'RRHH',
        totalTrabajadores: 1,
        totalHaberes: 900000,
        totalDescuentos: 180000,
        totalLiquido: 720000,
        totalBloqueados: 0,
        totalAdvertencias: 0,
        versionMotor: 'v1',
        hashSnapshot: 'hash-abc',
        origen: 'preliminar',
        activo: true,
        reemplazadoPor: null,
        aprobacionOperativa: null,
        cierreOperativo: null,
        trabajadores: [],
        issues: [],
        trazabilidad: [],
      },
      snapshotCompleto: null,
      errorGuardadoResultado: null,
      identificadorResultadoGuardadoActual: 'hash-abc',
      puedeCalcular: true,
      puedeGuardarPreliminar: false,
      periodoValido: true,
      nominaCerradaOperativamente: false,
      errorEjecucion: null,
      guardandoSnapshot: false,
    });
    const validacionCalculo = buildValidacionCalculoPreliminarView({
      periodo: '2026-05',
      resultado: null,
      preNomina: null,
      base: null,
      errorEjecucion: null,
      nominaCerradaOperativamente: false,
      tieneSnapshotPersistido: true,
    });

    const vm = buildRevisionAprobacionView({
      resultadoPreliminar,
      validacionCalculo,
      hayResultadoActual: false,
      snapshotHash: 'hash-abc',
      aprobacionOperativa: null,
      guardandoSnapshot: false,
      aprobandoResultado: false,
      nominaCerradaOperativamente: false,
      periodoValido: true,
    });

    expect(vm.puedeAprobar).toBe(true);
    expect(vm.estado).toBe('listo');
  });

  it('tolera listas ausentes al confirmar una nomina guardada', () => {
    const resultadoPreliminar = {
      estado: 'guardado',
      ultimoGuardado: {
        trabajadoresCalculados: 1,
        trabajadoresOmitidos: 0,
        trabajadoresConObservaciones: 0,
      },
      acciones: {
        puedeGuardarPreliminar: false,
        puedeRecalcular: true,
      },
    } as any;
    const validacionCalculo = {
      bloqueos: undefined,
      advertencias: undefined,
      informaciones: undefined,
    } as any;

    const vm = buildRevisionAprobacionView({
      resultadoPreliminar,
      validacionCalculo,
      hayResultadoActual: false,
      snapshotHash: 'hash-abc',
      aprobacionOperativa: null,
      guardandoSnapshot: false,
      aprobandoResultado: false,
      nominaCerradaOperativamente: false,
      periodoValido: true,
    });

    expect(vm.bloqueos).toEqual([]);
    expect(vm.advertencias).toEqual([]);
    expect(vm.informaciones).toEqual([]);
    expect(vm.puedeAprobar).toBe(true);
  });

  it('trabajadores omitidos sin bloqueo real no impiden confirmar', () => {
    const resultadoPreliminar = {
      estado: 'guardado',
      ultimoGuardado: {
        trabajadoresCalculados: 1,
        trabajadoresOmitidos: 1,
        trabajadoresConObservaciones: 0,
      },
      bloqueos: [],
      advertencias: [],
      informaciones: [],
      acciones: {
        puedeGuardarPreliminar: false,
        puedeRecalcular: true,
      },
    } as any;
    const validacionCalculo = {
      bloqueos: [],
      advertencias: [],
      informaciones: [],
    } as any;

    const vm = buildRevisionAprobacionView({
      resultadoPreliminar,
      validacionCalculo,
      hayResultadoActual: false,
      snapshotHash: 'hash-abc',
      aprobacionOperativa: null,
      guardandoSnapshot: false,
      aprobandoResultado: false,
      nominaCerradaOperativamente: false,
      periodoValido: true,
    });

    expect(vm.estado).toBe('listo');
    expect(vm.puedeAprobar).toBe(true);
    expect(vm.razonNoPuedeAprobar).toBeUndefined();
  });
});
