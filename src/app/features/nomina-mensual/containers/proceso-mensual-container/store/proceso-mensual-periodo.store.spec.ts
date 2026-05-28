import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import { ProcesoMensualService } from '../../../services/proceso-mensual.service';
import { ProcesoMensualPeriodoStore } from './proceso-mensual-periodo.store';

describe('ProcesoMensualPeriodoStore rehidratacion', () => {
  const rehidratarPeriodo = vi.fn();
  const obtenerSnapshotCompletoActivo = vi.fn();
  const listarSnapshotsPeriodo = vi.fn();

  beforeEach(() => {
    rehidratarPeriodo.mockReset();
    obtenerSnapshotCompletoActivo.mockReset();
    listarSnapshotsPeriodo.mockReset();
    rehidratarPeriodo.mockResolvedValue({
      snapshot: null,
      completo: null,
      liquidacionesGeneradas: 0,
      prevalidacionDiagnostico: null,
    });
    obtenerSnapshotCompletoActivo.mockResolvedValue(null);
    listarSnapshotsPeriodo.mockResolvedValue([]);

    TestBed.configureTestingModule({
      providers: [
        ProcesoMensualPeriodoStore,
        PeriodoActivoService,
        {
          provide: ProcesoMensualService,
          useValue: { rehidratarPeriodo, obtenerSnapshotCompletoActivo, listarSnapshotsPeriodo },
        },
      ],
    });

    TestBed.inject(PeriodoActivoService).setPeriodoYm('2026-05');
  });

  async function storeTrasHidratacionInicial(): Promise<ProcesoMensualPeriodoStore> {
    const store = TestBed.inject(ProcesoMensualPeriodoStore);
    await vi.waitFor(() => expect(store.rehidratandoPeriodo()).toBe(false));
    rehidratarPeriodo.mockClear();
    return store;
  }

  it('rehidratarPeriodoActivo aplica snapshot sin limpiar antes de la respuesta', async () => {
    const store = await storeTrasHidratacionInicial();
    const snapshot = {
      idCalculoPeriodo: 9,
      periodo: '2026-05',
      idEmpresa: null,
      estado: 'preliminar' as const,
      fechaGeneracion: '2026-05-05T10:00:00.000Z',
      usuarioGenerador: null,
      totalTrabajadores: 2,
      totalHaberes: 1,
      totalDescuentos: 0,
      totalLiquido: 1,
      totalBloqueados: 0,
      totalAdvertencias: 0,
      versionMotor: 'MOTOR',
      hashSnapshot: 'hash-9',
      origen: 'preliminar' as const,
      activo: true,
      reemplazadoPor: null,
      aprobacionOperativa: null,
      cierreOperativo: null,
      trabajadores: [],
      issues: [],
      trazabilidad: [],
    };

    rehidratarPeriodo.mockImplementation(async (periodo: string) =>
      periodo === '2026-05'
        ? { snapshot, completo: null, liquidacionesGeneradas: 0, prevalidacionDiagnostico: null }
        : { snapshot: null, completo: null, liquidacionesGeneradas: 0, prevalidacionDiagnostico: null },
    );
    store.rehidratarPeriodoActivo('2026-05');
    await vi.waitFor(() => expect(store.snapshotActivo()?.hashSnapshot).toBe('hash-9'));

    expect(store.resultado()).toBeNull();
    expect(store.preNomina()).toBeNull();
  });

  it('sin snapshot limpia señales volátiles', async () => {
    TestBed.inject(PeriodoActivoService).setPeriodoYm('2026-06');
    const store = await storeTrasHidratacionInicial();

    rehidratarPeriodo.mockResolvedValueOnce({
      snapshot: null,
      completo: null,
      liquidacionesGeneradas: 0,
      prevalidacionDiagnostico: null,
    });
    store.rehidratarPeriodoActivo('2026-06');
    await vi.waitFor(() => expect(store.rehidratandoPeriodo()).toBe(false));

    expect(store.snapshotActivo()).toBeNull();
    expect(store.resultado()).toBeNull();
  });

  it('sin snapshot conserva conteo de liquidaciones del periodo', async () => {
    const store = await storeTrasHidratacionInicial();

    rehidratarPeriodo.mockImplementation(async () => ({
      snapshot: null,
      completo: null,
      liquidacionesGeneradas: 1,
      prevalidacionDiagnostico: null,
    }));
    store.rehidratarPeriodoActivo('2026-05');
    await vi.waitFor(() => expect(store.liquidacionesGeneradasCount()).toBe(1));

    expect(store.snapshotActivo()).toBeNull();
    expect(store.liquidacionesGeneradasCount()).toBe(1);
  });

  it('borrador rehidrata prevalidacion desde metadata y mantiene snapshot', async () => {
    const store = await storeTrasHidratacionInicial();
    const prevalidacion = {
      periodo: '2026-05',
      estado: 'CON_ADVERTENCIAS' as const,
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: true,
        conteoMovimientosPorEstado: {},
        trabajadoresActivosAptos: 2,
        trabajadoresActivosNoAptos: 0,
        parametrosOperativos: true,
        parametrosGrupos: [],
        recurrentesAplicablesAlPeriodo: 0,
        recurrentesInvalidas: 0,
        recurrentesCerradas: 0,
        recurrentesFueraDelMes: 0,
      },
      bloqueos: [],
      advertencias: [],
      informaciones: [],
      items: [{ area: 'TRABAJADORES', etiqueta: 'Trabajadores', estado: 'LISTO' as const }],
      entradasMensuales: [],
    };
    const snapshot = {
      idCalculoPeriodo: 12,
      periodo: '2026-05',
      idEmpresa: null,
      estado: 'borrador' as const,
      fechaGeneracion: '2026-05-18T10:00:00.000Z',
      usuarioGenerador: null,
      totalTrabajadores: 2,
      totalHaberes: 0,
      totalDescuentos: 0,
      totalLiquido: 0,
      totalBloqueados: 0,
      totalAdvertencias: 1,
      versionMotor: 'BASE-NOMINA-01',
      hashSnapshot: null,
      origen: 'preliminar' as const,
      activo: true,
      reemplazadoPor: null,
      aprobacionOperativa: null,
      cierreOperativo: null,
      trabajadores: [],
      issues: [],
      trazabilidad: [],
    };

    rehidratarPeriodo.mockImplementation(async (periodo: string) =>
      periodo === '2026-05'
        ? {
            snapshot,
            completo: null,
            liquidacionesGeneradas: 0,
            prevalidacionDiagnostico: prevalidacion,
          }
        : {
            snapshot: null,
            completo: null,
            liquidacionesGeneradas: 0,
            prevalidacionDiagnostico: null,
          },
    );
    store.rehidratarPeriodoActivo('2026-05');
    await vi.waitFor(() => expect(store.snapshotActivo()?.estado).toBe('borrador'));

    expect(store.resultado()?.estado).toBe('CON_ADVERTENCIAS');
    expect(store.preNomina()).toBeNull();
  });

  it('preliminar rehidrata resultado desde metadata del snapshot', async () => {
    const store = await storeTrasHidratacionInicial();
    const prevalidacion = {
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO' as const,
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: {},
        trabajadoresActivosAptos: 3,
        trabajadoresActivosNoAptos: 0,
        parametrosOperativos: true,
        parametrosGrupos: [],
        recurrentesAplicablesAlPeriodo: 0,
        recurrentesInvalidas: 0,
        recurrentesCerradas: 0,
        recurrentesFueraDelMes: 0,
      },
      bloqueos: [],
      advertencias: [],
      informaciones: [],
      items: [],
      entradasMensuales: [],
      trabajadoresPendientesRevision: [],
    };
    const snapshot = {
      idCalculoPeriodo: 20,
      periodo: '2026-05',
      idEmpresa: null,
      estado: 'preliminar' as const,
      fechaGeneracion: '2026-05-18T10:00:00.000Z',
      usuarioGenerador: null,
      totalTrabajadores: 3,
      totalHaberes: 100,
      totalDescuentos: 20,
      totalLiquido: 80,
      totalBloqueados: 0,
      totalAdvertencias: 0,
      versionMotor: 'v1',
      hashSnapshot: 'hash-20',
      origen: 'preliminar' as const,
      activo: true,
      reemplazadoPor: null,
      aprobacionOperativa: null,
      cierreOperativo: null,
      trabajadores: [],
      issues: [],
      trazabilidad: [],
      borradorPersist: {
        entradasMensuales: [],
        resumenPrevalidacion: prevalidacion.resumen,
        prevalidacionEstado: prevalidacion.estado,
        trabajadoresPendientesRevision: [],
        bloqueos: [],
        advertencias: [],
      },
    };
    rehidratarPeriodo.mockImplementation(async (periodo: string) =>
      periodo === '2026-05'
        ? {
            snapshot,
            completo: null,
            liquidacionesGeneradas: 0,
            prevalidacionDiagnostico: prevalidacion,
          }
        : {
            snapshot: null,
            completo: null,
            liquidacionesGeneradas: 0,
            prevalidacionDiagnostico: null,
          },
    );
    store.rehidratarPeriodoActivo('2026-05');
    await vi.waitFor(() => expect(store.snapshotActivo()?.estado).toBe('preliminar'));
    expect(store.resultado()?.resumen.trabajadoresActivosAptos).toBe(3);
    expect(store.preNomina()).toBeNull();
  });

  it('sin snapshot rehidrata prevalidacion persistida', async () => {
    const store = await storeTrasHidratacionInicial();
    const prevalidacion = {
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO',
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
        conteoMovimientosPorEstado: {},
        trabajadoresActivosAptos: 1,
        trabajadoresActivosNoAptos: 0,
        parametrosOperativos: true,
        parametrosGrupos: [],
        recurrentesAplicablesAlPeriodo: 0,
        recurrentesInvalidas: 0,
        recurrentesCerradas: 0,
        recurrentesFueraDelMes: 0,
      },
      bloqueos: [],
      advertencias: [],
      informaciones: [],
      items: [{ area: 'TRABAJADORES', etiqueta: 'Trabajadores', estado: 'LISTO' as const }],
    };

    rehidratarPeriodo.mockReset();
    rehidratarPeriodo.mockImplementation(async (periodo: string) => ({
      snapshot: null,
      completo: null,
      liquidacionesGeneradas: 0,
      prevalidacionDiagnostico: periodo === '2026-05' ? prevalidacion : null,
    }));
    store.rehidratarPeriodoActivo('2026-05');
    await vi.waitFor(() => expect(store.resultado()?.periodo).toBe('2026-05'));

    expect(store.snapshotActivo()).toBeNull();
    expect(store.preNomina()).toBeNull();
  });

  it('respuesta de período distinto no aplica snapshot', async () => {
    const store = await storeTrasHidratacionInicial();
    const periodo = TestBed.inject(PeriodoActivoService);
    let resolveLate: (value: { snapshot: unknown; completo: null }) => void = () => undefined;

    rehidratarPeriodo.mockImplementation((p: string) => {
      if (p === '2026-05') {
        return new Promise((resolve) => {
          resolveLate = resolve;
        });
      }
      return Promise.resolve({
        snapshot: null,
        completo: null,
        liquidacionesGeneradas: 0,
        prevalidacionDiagnostico: null,
      });
    });

    store.rehidratarPeriodoActivo('2026-05');
    periodo.setPeriodoYm('2026-06');
    await vi.waitFor(() => expect(store.rehidratandoPeriodo()).toBe(false));

    resolveLate({
      snapshot: {
        periodo: '2026-05',
        hashSnapshot: 'stale',
      },
      completo: null,
    });
    await Promise.resolve();

    expect(store.snapshotActivo()).toBeNull();
  });
});

describe('ProcesoMensualPeriodoStore generar nómina + persistencia', () => {
  const generarPreNominaPeriodo = vi.fn();
  const guardarBaseNominaBorrador = vi.fn();
  const generarCalculoPeriodo = vi.fn();
  const guardarSnapshotPreliminar = vi.fn();
  const obtenerSnapshotCompletoActivo = vi.fn();
  const cerrarDiagnosticoPeriodo = vi.fn();
  const rehidratarPeriodo = vi.fn();
  const listarSnapshotsPeriodo = vi.fn();

  beforeEach(() => {
    generarPreNominaPeriodo.mockReset();
    guardarBaseNominaBorrador.mockReset();
    generarCalculoPeriodo.mockReset();
    guardarSnapshotPreliminar.mockReset();
    obtenerSnapshotCompletoActivo.mockReset();
    cerrarDiagnosticoPeriodo.mockReset();
    rehidratarPeriodo.mockReset();
    listarSnapshotsPeriodo.mockReset();

    generarPreNominaPeriodo.mockResolvedValue({
      periodo: '2026-05',
      estado: 'GENERADA',
      generadoEn: '2026-05-20T00:00:00.000Z',
      trabajadoresIncluidos: 1,
      recurrentesIncluidos: 0,
      movimientosVariablesValidados: 1,
      movimientosVariablesBorrador: 0,
      parametrosOperativos: true,
      codigosBloqueo: [],
      codigosAdvertencia: [],
      origenPrevalidacion: 'LISTO_PARA_CALCULO',
      trazabilidad: { trabajadores: [], trabajadoresConsiderados: 1, listosParaCalculo: 1 },
    });
    guardarBaseNominaBorrador.mockResolvedValue({
      ok: true,
      snapshot: {
        idCalculoPeriodo: 10,
        periodo: '2026-05',
        idEmpresa: null,
        estado: 'borrador',
        fechaGeneracion: '2026-05-20T00:00:00.000Z',
        usuarioGenerador: null,
        totalTrabajadores: 1,
        totalHaberes: 0,
        totalDescuentos: 0,
        totalLiquido: 0,
        totalBloqueados: 0,
        totalAdvertencias: 0,
        versionMotor: 'BASE-NOMINA-01',
        hashSnapshot: 'hash-borrador',
        origen: 'preliminar',
        activo: true,
        reemplazadoPor: null,
        aprobacionOperativa: null,
        cierreOperativo: null,
        trabajadores: [],
        issues: [],
        trazabilidad: [],
      },
      reemplazoSnapshotAnterior: false,
      hashSnapshot: 'hash-borrador',
      issues: [],
    });
    generarCalculoPeriodo.mockResolvedValue({ periodo: '2026-05' });
    guardarSnapshotPreliminar.mockResolvedValue({
      ok: true,
      snapshot: {
        idCalculoPeriodo: 11,
        periodo: '2026-05',
        idEmpresa: null,
        estado: 'preliminar',
        fechaGeneracion: '2026-05-20T00:10:00.000Z',
        usuarioGenerador: null,
        totalTrabajadores: 1,
        totalHaberes: 100,
        totalDescuentos: 0,
        totalLiquido: 100,
        totalBloqueados: 0,
        totalAdvertencias: 0,
        versionMotor: 'MOTOR-03B',
        hashSnapshot: 'hash-preliminar',
        origen: 'preliminar',
        activo: true,
        reemplazadoPor: null,
        aprobacionOperativa: null,
        cierreOperativo: null,
        trabajadores: [],
        issues: [],
        trazabilidad: [],
      },
      reemplazoSnapshotAnterior: true,
      hashSnapshot: 'hash-preliminar',
      issues: [],
    });
    obtenerSnapshotCompletoActivo.mockResolvedValue(null);
    cerrarDiagnosticoPeriodo.mockResolvedValue(undefined);
    rehidratarPeriodo.mockResolvedValue({
      snapshot: null,
      completo: null,
      liquidacionesGeneradas: 0,
      prevalidacionDiagnostico: null,
    });
    listarSnapshotsPeriodo.mockResolvedValue([]);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ProcesoMensualPeriodoStore,
        PeriodoActivoService,
        {
          provide: ProcesoMensualService,
          useValue: {
            generarPreNominaPeriodo,
            guardarBaseNominaBorrador,
            generarCalculoPeriodo,
            guardarSnapshotPreliminar,
            obtenerSnapshotCompletoActivo,
            cerrarDiagnosticoPeriodo,
            rehidratarPeriodo,
            listarSnapshotsPeriodo,
          },
        },
      ],
    });

    TestBed.inject(PeriodoActivoService).setPeriodoYm('2026-05');
  });

  async function storeTrasHidratacionInicial(): Promise<ProcesoMensualPeriodoStore> {
    const store = TestBed.inject(ProcesoMensualPeriodoStore);
    await vi.waitFor(() => expect(store.rehidratandoPeriodo()).toBe(false));
    rehidratarPeriodo.mockClear();
    return store;
  }

  it('tras generar nómina calcula y guarda snapshot preliminar automaticamente', async () => {
    const store = await storeTrasHidratacionInicial();
    vi.spyOn(store, 'rehidratarPeriodoActivo').mockImplementation(() => undefined);
    store.generarPreNomina();

    await vi.waitFor(() => expect(store.generandoPreNomina()).toBe(false), { timeout: 5000 });
    expect(guardarBaseNominaBorrador).toHaveBeenCalled();
    expect(generarCalculoPeriodo).toHaveBeenCalledWith('2026-05');
    expect(guardarSnapshotPreliminar).toHaveBeenCalledWith('2026-05', { prevalidacion: null });
    expect(store.errorGuardadoResultado()).toBeNull();
    expect(store.exitoGuardadoResultado()).toMatch(/guardada/i);
    expect(store.snapshotActivo()?.estado).toBe('preliminar');
    expect(store.preNomina()).toBeNull();
    expect(store.calculo()).not.toBeNull();
  });
});
