import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmpleadosService } from '../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesService } from '../../movimientos-variables/services/movimientos-variables.service';
import type { ParametroGeneral } from '../../parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';

import { EntradasMensualesPeriodoService } from '../entradas/services/entradas-mensuales-periodo.service';
import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import { NominaCalculoSnapshotRepository } from '../data-access/nomina-calculo-snapshot.repository';
import { ProcesoMensualService } from './proceso-mensual.service';

const filaPgMock = {
  periodo: '2026-05',
  uf: 38000,
  utm: 60000,
  uta: null,
  sueldoMinimo: 500000,
  sueldoMinimo18a65: null,
  sueldoMinimoMenor18Mayor65: null,
  sueldoMinimoCasaParticular: null,
  ingresoMinimoNoRemuneracional: null,
  topeAfpUf: null,
  gratificacion: false,
  immGratificacion: null,
  topeAfp: 100,
  topeIpsUf: null,
  topeIps: 100,
  topeCesantiaUf: null,
  topeCesantia: 100,
  topeApvMensualUf: null,
  topeApvMensual: null,
  topeApvAnualUf: null,
  topeApvAnual: null,
  topeDepositoConvenidoAnualUf: null,
  topeDepositoConvenidoAnual: null,
  topeAfpVoluntario: null,
  sis: 0.0145,
  sanna: null,
  seguroSocialExpectativaVida: null,
  aporteEmpleadorAfp: null,
  saludObligatoria: null,
  saludCcaf: null,
  saludFonasaConCcaf: null,
  descuentosBasePorDia: false,
  afcTrabajadorIndefinido: null,
  afcEmpleadorIndefinido: null,
  afcEmpleadorPlazo: null,
  afcEmpleadorIndefinidoOnceAnosMas: null,
  afcEmpleadorCasaParticular: null,
  trabajoPesadoEmpleador: null,
  trabajoPesadoTrabajador: null,
  trabajoMenosPesadoEmpleador: null,
  trabajoMenosPesadoTrabajador: null,
  fechaActualizacion: null,
} as unknown as ParametroGeneral;

const catalogosMock = {
  afp: [{ idAfp: 1, codigo: 'x', nombre: 'n', periodo: null, tasaObligatoria: 0.1, comision: 0, sis: 0, tasaEmpleador: 0, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
  isapres: [],
  saludInstituciones: [{ idSalud: 1, codigo: 'FONASA', nombre: 'Fonasa', tipo: 'FONASA', porcentajeCotizacion: 0.07, periodo: null, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
  tramosCarga: [],
  tramosImpuesto: [{ idTramo: 1, periodo: '2026-05', desde: 0, hasta: 1, factor: 1, rebaja: 0 }],
  tablaImpuestoUnico: [{ id: 1, tramo: 1, desde: 0, hasta: 999999, factor: 0, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null }],
  reformaPensiones: [],
  trabajosPesados: [],
  reformaPrevisional: [
    {
      idReformaPrevisionalParametro: 1,
      periodo: null,
      vigenciaInicio: '2020-01-01',
      vigenciaFin: null,
      aporteEmpleadorTotal: 0,
      cuentaCapitalizacionIndividual: 0,
      cotizacionRentabilidadProtegida: 0,
      seguroSocialSisCev: 0,
      fappSeguroSocial: 0,
      fuente: null,
    },
  ],
  ley16744Parametros: [
    {
      idLey16744Parametro: 1,
      codigo: 'L',
      periodo: '2026-05',
      cotizacionBasicaEmpleador: 0,
      descripcionTasaAdicional: null,
      fuenteFinanciamiento: null,
      fuenteOrganismos: null,
      vigente: true,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
    },
  ],
  organismosLey16744: [],
  ccafEntidades: [{ idCcafEntidad: 1, codigo: 'c', nombre: 'c', vigente: true, fuente: null, periodo: null }],
  apvInstituciones: [],
  apvFormasPago: [],
  afcParametros: [
    {
      idAfcParametro: 1,
      codigoTipoContrato: 'I',
      aplicaSeguro: true,
      aplicaTrabajador: true,
      tasaTrabajador: 0.006,
      tasaEmpleador: 0.002,
      periodo: null,
      vigenciaInicio: '2020-01-01',
      vigenciaFin: null,
      observacion: null,
    },
  ],
} as Awaited<ReturnType<ParametrosGeneralesService['listarCatalogos']>>;

describe('ProcesoMensualService', () => {
  let parametros: {
    obtenerUltimoHastaPeriodo: ReturnType<typeof vi.fn>;
    obtenerPeriodoRemuneracion: ReturnType<typeof vi.fn>;
    listarCatalogos: ReturnType<typeof vi.fn>;
  };
  let empleados: { listar: ReturnType<typeof vi.fn>; obtenerPorId: ReturnType<typeof vi.fn> };
  let haberes: {
    listarConceptosMantenimiento: ReturnType<typeof vi.fn>;
    listarAsignacionesParaPrevalidacionMensual: ReturnType<typeof vi.fn>;
  };
  let movimientos: { listarPorPeriodo: ReturnType<typeof vi.fn> };
  let entradasMensuales: { listarEntradasPeriodo: ReturnType<typeof vi.fn> };
  let snapshots: {
    guardarBaseNominaBorrador: ReturnType<typeof vi.fn>;
    guardarSnapshotPreliminar: ReturnType<typeof vi.fn>;
    obtenerSnapshotActivo: ReturnType<typeof vi.fn>;
    obtenerSnapshotCompletoActivo: ReturnType<typeof vi.fn>;
    obtenerSnapshotCompletoPorId: ReturnType<typeof vi.fn>;
    listarSnapshotsPeriodo: ReturnType<typeof vi.fn>;
    anularSnapshotActivo: ReturnType<typeof vi.fn>;
    aprobarResultadoPreliminarOperativamente: ReturnType<typeof vi.fn>;
    cerrarNominaOperativa: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    parametros = {
      obtenerUltimoHastaPeriodo: vi.fn().mockResolvedValue(filaPgMock),
      obtenerPeriodoRemuneracion: vi.fn().mockResolvedValue({
        codigo: '2026-05',
        estado: 'cargado',
        fechaInicio: '2026-05-01',
        fechaFin: '2026-05-31',
      }),
      listarCatalogos: vi.fn().mockResolvedValue(catalogosMock),
    };
    empleados = {
      listar: vi.fn().mockResolvedValue([
        { id: 1, estado: 'activo', aptoParaRemuneraciones: true },
        { id: 2, estado: 'activo', aptoParaRemuneraciones: true },
      ]),
      obtenerPorId: vi.fn().mockImplementation((id: number) => Promise.resolve({
        id,
        idContrato: id * 10,
        rut: `${id}${id}.${id}${id}${id}.${id}${id}${id}-${id}`,
        nombre: `Trabajador ${id}`,
        cargo: 'Analista',
        departamento: 'Operaciones',
        fechaIngreso: '2024-01-01',
        sueldoBase: 800000,
        estado: 'activo',
        estadoFicha: 'VALIDO',
        aptoParaRemuneraciones: true,
        pasoAltaAvanzada: null,
        historial: [],
        formValue: {
          datosPersonales: {},
          contacto: {},
          contrato: { sueldoBase: 800000, tipoContrato: 'I' },
          previsionSalud: { idAfp: 1, idSalud: 1, valorPlan: null },
          bancario: {},
        },
      })),
    };
    haberes = {
      listarConceptosMantenimiento: vi
        .fn()
        .mockResolvedValue([{ vigente: true, esSistema: false, tipo: 'haber', naturaleza: 'fijo' }] as never),
      listarAsignacionesParaPrevalidacionMensual: vi.fn().mockResolvedValue([]),
    };
    movimientos = {
      listarPorPeriodo: vi.fn().mockResolvedValue([]),
    };
    entradasMensuales = {
      listarEntradasPeriodo: vi.fn().mockResolvedValue([]),
    };
    snapshots = {
      guardarBaseNominaBorrador: vi.fn().mockImplementation((snapshot) => Promise.resolve({
        snapshot: { ...snapshot, idCalculoPeriodo: 77 },
        reemplazoSnapshotAnterior: false,
      })),
      guardarSnapshotPreliminar: vi.fn().mockImplementation((snapshot) => Promise.resolve({
        snapshot: { ...snapshot, idCalculoPeriodo: 1 },
        reemplazoSnapshotAnterior: false,
      })),
      obtenerSnapshotActivo: vi.fn().mockResolvedValue(null),
      obtenerSnapshotCompletoActivo: vi.fn().mockResolvedValue(null),
      obtenerSnapshotCompletoPorId: vi.fn().mockResolvedValue(null),
      listarSnapshotsPeriodo: vi.fn().mockResolvedValue([]),
      anularSnapshotActivo: vi.fn().mockResolvedValue(undefined),
      aprobarResultadoPreliminarOperativamente: vi.fn().mockImplementation((params) => Promise.resolve({
        idCalculoPeriodo: params.idCalculoPeriodo,
        periodo: params.periodo,
        aprobacionOperativa: {
          estado: 'aprobado_operativamente',
          fecha: '2026-05-05T11:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'Usuario no disponible en esta sesion',
          advertencias: params.advertencias,
          metadata: {},
        },
      })),
      cerrarNominaOperativa: vi.fn().mockImplementation((params) => Promise.resolve({
        idCalculoPeriodo: params.idCalculoPeriodo,
        periodo: params.periodo,
        cierreOperativo: {
          estado: 'cerrado_operativamente',
          fecha: '2026-05-05T12:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'Usuario no disponible en esta sesion',
          observacion: null,
          metadata: params.metadata,
        },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        ProcesoMensualService,
        { provide: ParametrosGeneralesService, useValue: parametros },
        { provide: EmpleadosService, useValue: empleados },
        { provide: HaberesDescuentosService, useValue: haberes },
        { provide: EntradasMensualesPeriodoService, useValue: entradasMensuales },
        { provide: MovimientosVariablesService, useValue: movimientos },
        { provide: NominaCalculoSnapshotRepository, useValue: snapshots },
        {
          provide: LiquidacionesOficialesRepository,
          useValue: { obtenerLiquidacionPeriodo: vi.fn().mockResolvedValue(null) },
        },
      ],
    });
  });

  it('valida periodo invalido sin llamar entradas, legacy directo, recurrentes ni catalogos', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-13');
    expect(r.estado).toBe('BLOQUEADO');
    expect(entradasMensuales.listarEntradasPeriodo).not.toHaveBeenCalled();
    expect(movimientos.listarPorPeriodo).not.toHaveBeenCalled();
    expect(haberes.listarAsignacionesParaPrevalidacionMensual).not.toHaveBeenCalled();
    expect(parametros.listarCatalogos).not.toHaveBeenCalled();
  });

  it('con periodo valido usa entradas canonicas y no llama directo movimientos variables', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.ejecutarPrevalidaciones('2026-05');
    expect(entradasMensuales.listarEntradasPeriodo).toHaveBeenCalledWith('2026-05');
    expect(movimientos.listarPorPeriodo).not.toHaveBeenCalled();
    expect(haberes.listarAsignacionesParaPrevalidacionMensual).toHaveBeenCalledWith('2026-05');
    expect(parametros.listarCatalogos).toHaveBeenCalledWith('2026-05');
  });

  it('no calcula montos ni invoca liquidaciones (solo dependencias declaradas)', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-05');
    expect(r.resumen.trabajadoresActivosAptos).toBe(2);
    expect(r.resumen.recurrentesAplicablesAlPeriodo).toBe(0);
    expect(parametros.obtenerUltimoHastaPeriodo).toHaveBeenCalled();
  });

  it('propaga fallo de lectura de entradas como bloqueo en resultado', async () => {
    entradasMensuales.listarEntradasPeriodo.mockRejectedValue(new Error('red'));
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-05');
    expect(r.bloqueos.some((b) => b.codigo === 'ENTRADAS_LECTURA_ERROR')).toBe(true);
    expect(r.estado).toBe('BLOQUEADO');
  });

  it('genera pre-nomina funcional desde la prevalidacion del periodo', async () => {
    entradasMensuales.listarEntradasPeriodo.mockResolvedValue([
      {
        idEntrada: 'legacy_movimiento:1',
        origen: 'legacy_movimiento_variable',
        origenId: 1,
        idPersona: 1,
        idContrato: null,
        idConcepto: 1,
        periodo: '2026-05',
        tipoEntrada: 'otro',
        categoria: 'legacy_movimiento_variable',
        tipoMovimiento: null,
        cantidad: null,
        unidad: null,
        monto: 1000,
        moneda: 'CLP',
        estado: 'aprobada',
        fechaEvento: null,
        observacion: null,
        referenciaExterna: null,
        requiereRevision: false,
        bloqueaProceso: false,
        warnings: [],
        metadata: { estadoLegacy: 'VALIDADO', origenLegacy: 'MANUAL' },
      },
    ]);
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.generarPreNominaPeriodo('2026-05');

    expect(r.periodo).toBe('2026-05');
    expect(r.estado).toBe('GENERADA');
    expect(r.trabajadoresIncluidos).toBe(2);
    expect(r.movimientosVariablesValidados).toBe(1);
    expect(r.entradasMensualesAptas).toBe(1);
    expect(r.generadoEn).toMatch(/T/);
  });

  it('guarda base nomina borrador sin calcular ni cerrar periodo', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const preNomina = await svc.generarPreNominaPeriodo('2026-05');
    const r = await svc.guardarBaseNominaBorrador('2026-05', preNomina);

    expect(r.ok).toBe(true);
    expect(r.snapshot?.estado).toBe('borrador');
    expect(r.snapshot?.totalTrabajadores).toBe(preNomina.trabajadoresIncluidos);
    expect(r.snapshot?.totalLiquido).toBe(0);
    expect(snapshots.guardarBaseNominaBorrador).toHaveBeenCalledWith(expect.objectContaining({
      periodo: '2026-05',
      estado: 'borrador',
      origen: 'preliminar',
    }));
    expect(snapshots.guardarSnapshotPreliminar).not.toHaveBeenCalled();
  });

  it('no guarda base borrador automaticamente si hay advertencias', async () => {
    entradasMensuales.listarEntradasPeriodo.mockResolvedValueOnce([{
      idEntrada: 'novedad:warn',
      origen: 'novedad_mensual',
      origenId: 1,
      idPersona: 1,
      idContrato: null,
      idConcepto: 1,
      periodo: '2026-05',
      tipoEntrada: 'haber',
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
      cantidad: null,
      unidad: null,
      monto: 1000,
      moneda: 'CLP',
      estado: 'pendiente_revision',
      fechaEvento: null,
      observacion: null,
      referenciaExterna: null,
      requiereRevision: true,
      bloqueaProceso: false,
      warnings: [],
      metadata: {},
    }]);
    const svc = TestBed.inject(ProcesoMensualService);
    const preNomina = await svc.generarPreNominaPeriodo('2026-05');
    const r = await svc.guardarBaseNominaBorrador('2026-05', preNomina);

    expect(r.ok).toBe(false);
    expect(r.issues.some((issue) => issue.severidad === 'ADVERTENCIA')).toBe(true);
    expect(snapshots.guardarBaseNominaBorrador).not.toHaveBeenCalled();
  });

  it('guarda base revisada si se permiten advertencias', async () => {
    entradasMensuales.listarEntradasPeriodo.mockResolvedValueOnce([{
      idEntrada: 'novedad:warn',
      origen: 'novedad_mensual',
      origenId: 1,
      idPersona: 1,
      idContrato: null,
      idConcepto: 1,
      periodo: '2026-05',
      tipoEntrada: 'haber',
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
      cantidad: null,
      unidad: null,
      monto: 1000,
      moneda: 'CLP',
      estado: 'pendiente_revision',
      fechaEvento: null,
      observacion: null,
      referenciaExterna: null,
      requiereRevision: true,
      bloqueaProceso: false,
      warnings: [],
      metadata: {},
    }]);
    const svc = TestBed.inject(ProcesoMensualService);
    const preNomina = await svc.generarPreNominaPeriodo('2026-05');
    const r = await svc.guardarBaseNominaBorrador('2026-05', preNomina, undefined, {
      permitirAdvertencias: true,
    });

    expect(r.ok).toBe(true);
    expect(r.snapshot?.estado).toBe('borrador');
    expect(snapshots.guardarBaseNominaBorrador).toHaveBeenCalled();
  });

  it('genera calculo preliminar y lo deja consultable en memoria', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.generarCalculoPeriodo('2026-05');

    expect(r.periodo).toBe('2026-05');
    expect(r.liquidaciones.length).toBe(2);
    expect(r.resumen.totalTrabajadoresCalculados).toBe(2);
    expect(svc.obtenerResultadoCalculoPeriodo('2026-05')).toBe(r);
  });

  it('construye calculo desde entradas canonicas sin alterar resultados legales en MOTOR-04', async () => {
    entradasMensuales.listarEntradasPeriodo.mockResolvedValue([
      {
        idEntrada: 'novedad:1',
        origen: 'novedad_mensual',
        origenId: 1,
        idPersona: 1,
        idContrato: 10,
        idConcepto: 99,
        periodo: '2026-05',
        tipoEntrada: 'haber',
        categoria: 'haber_variable',
        tipoMovimiento: 'haber',
        cantidad: null,
        unidad: null,
        monto: 50000,
        moneda: 'CLP',
        estado: 'aprobada',
        fechaEvento: null,
        observacion: null,
        referenciaExterna: null,
        requiereRevision: false,
        bloqueaProceso: false,
        warnings: [],
        metadata: { origenTecnico: 'novedad_remuneracion_periodo' },
      },
    ]);
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.generarCalculoPeriodo('2026-05');

    expect(entradasMensuales.listarEntradasPeriodo).toHaveBeenCalledWith('2026-05');
    expect(r.liquidaciones[0].baseImponiblePrevisional).toBe(100);
    expect(r.liquidaciones[0].impuestoUnico).toBe(0);
    expect(r.liquidaciones[0].liquidoAPago).toBe(r.liquidaciones[0].totalHaberes - r.liquidaciones[0].totalDescuentos);
  });

  it('guarda snapshot preliminar desde calculo en memoria sin cerrar periodo', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.generarCalculoPeriodo('2026-05');
    const r = await svc.guardarSnapshotPreliminar('2026-05');

    expect(r.ok).toBe(true);
    expect(r.snapshot?.periodo).toBe('2026-05');
    expect(r.snapshot?.estado).toBe('preliminar');
    expect(r.snapshot?.hashSnapshot).toMatch(/^fnv1a32:/);
    expect(snapshots.guardarSnapshotPreliminar).toHaveBeenCalled();
  });

  it('propaga error operativo si falla el guardado atomico del snapshot', async () => {
    snapshots.guardarSnapshotPreliminar.mockRejectedValueOnce(
      new Error('No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.'),
    );
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.generarCalculoPeriodo('2026-05');

    await expect(svc.guardarSnapshotPreliminar('2026-05')).rejects.toThrow(
      'No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.',
    );
  });

  it('no guarda snapshot si el calculo tiene bloqueos', async () => {
    empleados.obtenerPorId.mockResolvedValueOnce({
      id: 1,
      idContrato: null,
      rut: '11.111.111-1',
      nombre: 'Trabajador bloqueo',
      cargo: 'Analista',
      departamento: 'Operaciones',
      fechaIngreso: '2024-01-01',
      sueldoBase: null,
      estado: 'activo',
      estadoFicha: 'VALIDO',
      aptoParaRemuneraciones: true,
      pasoAltaAvanzada: null,
      historial: [],
      formValue: {
        datosPersonales: {},
        contacto: {},
        contrato: { sueldoBase: null, tipoContrato: null },
        previsionSalud: { idAfp: null, idSalud: null, valorPlan: null },
        bancario: {},
      },
    });
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.generarCalculoPeriodo('2026-05');
    const r = await svc.guardarSnapshotPreliminar('2026-05');

    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.codigo === 'SNAPSHOT_CALCULO_BLOQUEADO')).toBe(true);
    expect(snapshots.guardarSnapshotPreliminar).not.toHaveBeenCalled();
  });

  it('persiste aprobacion operativa mediante repository sin usar cierre ni liquidacion', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.aprobarResultadoPreliminarOperativamente({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      advertencias: ['Advertencia visible'],
    });

    expect(snapshots.aprobarResultadoPreliminarOperativamente).toHaveBeenCalledWith({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      advertencias: ['Advertencia visible'],
    });
    expect(r.aprobacionOperativa?.estado).toBe('aprobado_operativamente');
  });

  it('expone consulta de snapshot completo activo sin recalcular resultado', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    snapshots.obtenerSnapshotCompletoActivo.mockResolvedValueOnce({
      cabecera: { idCalculoPeriodo: 1, periodo: '2026-05' },
      trabajadores: [],
      conceptos: [],
      observaciones: [],
      trazabilidad: [],
      aprobacionOperativa: null,
      resumen: {
        totalConceptos: 0,
        totalObservaciones: 0,
        totalTrazas: 0,
        totalTrabajadoresSinDetalle: 0,
        esActivoVigente: true,
        fueReemplazado: false,
      },
    });

    const r = await svc.obtenerSnapshotCompletoActivo('2026-05');

    expect(snapshots.obtenerSnapshotCompletoActivo).toHaveBeenCalledWith('2026-05');
    expect(snapshots.obtenerSnapshotCompletoPorId).not.toHaveBeenCalled();
    expect(r?.cabecera.periodo).toBe('2026-05');
  });

  it('expone consulta de snapshot completo por id_calculo_periodo', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.obtenerSnapshotCompletoPorId(5);
    expect(snapshots.obtenerSnapshotCompletoPorId).toHaveBeenCalledWith(5);
  });

  it('no permite cerrar sin snapshot activo', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    await expect(svc.cerrarNominaOperativamente({ idCalculoPeriodo: 1, periodo: '2026-05' })).rejects.toThrow(
      'No existe un resultado preliminar guardado vigente para cerrar.',
    );
    expect(snapshots.cerrarNominaOperativa).not.toHaveBeenCalled();
  });

  it('no permite cerrar sin aprobacion operativa', async () => {
    snapshots.obtenerSnapshotActivo.mockResolvedValueOnce({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      aprobacionOperativa: null,
      cierreOperativo: null,
    });
    const svc = TestBed.inject(ProcesoMensualService);
    await expect(svc.cerrarNominaOperativamente({ idCalculoPeriodo: 1, periodo: '2026-05' })).rejects.toThrow(
      'El resultado debe estar aprobado operativamente antes de cerrar.',
    );
    expect(snapshots.cerrarNominaOperativa).not.toHaveBeenCalled();
  });

  it('construye metadata y cierra nomina operativa aprobada', async () => {
    snapshots.obtenerSnapshotActivo.mockResolvedValueOnce({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      versionMotor: 'MOTOR-03B',
      hashSnapshot: 'fnv1a32:123',
      totalTrabajadores: 2,
      totalHaberes: 900000,
      totalDescuentos: 180000,
      totalLiquido: 720000,
      aprobacionOperativa: {
        estado: 'aprobado_operativamente',
        fecha: '2026-05-05T11:00:00.000Z',
        usuarioId: null,
        usuarioLabel: 'rrhh@empresa.cl',
        advertencias: ['Advertencia visible'],
        metadata: {},
      },
      cierreOperativo: null,
    });
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.cerrarNominaOperativamente({ idCalculoPeriodo: 1, periodo: '2026-05' });

    expect(snapshots.cerrarNominaOperativa).toHaveBeenCalledWith(expect.objectContaining({
      idCalculoPeriodo: 1,
      periodo: '2026-05',
      metadata: expect.objectContaining({
        totalTrabajadores: 2,
        advertenciasVisibles: ['Advertencia visible'],
      }),
    }));
    expect(r.cierreOperativo?.estado).toBe('cerrado_operativamente');
  });
});
