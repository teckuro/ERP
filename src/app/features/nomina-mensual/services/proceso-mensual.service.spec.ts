import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideAuthStub } from '../../../core/auth/testing/auth.stub';
import { EmpresaActivaService } from '../../../core/services/empresa-activa.service';
import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { EmpresasRepository } from '../../empresas/data-access/empresas.repository';
import { EmpleadosService } from '../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesService } from '../../movimientos-variables/services/movimientos-variables.service';
import type {
  ParametroGeneral,
  ParametrosGeneralesClienteConfig,
} from '../../parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';
import type { MovimientoNomina } from '../models/movimiento-nomina.models';

import { EntradasMensualesPeriodoService } from '../entradas/services/entradas-mensuales-periodo.service';
import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import { NominaCalculoSnapshotRepository } from '../data-access/nomina-calculo-snapshot.repository';
import { NominaPeriodoDiagnosticoRepository } from '../data-access/nomina-periodo-diagnostico.repository';
import { ProcesoMensualService } from './proceso-mensual.service';

const filaPgMock = {
  periodo: '2026-05',
  uf: 38000,
  utm: 60000,
  uta: 720000,
  sueldoMinimo: 500000,
  sueldoMinimo18a65: 500000,
  sueldoMinimoMenor18Mayor65: 372989,
  sueldoMinimoCasaParticular: 500000,
  ingresoMinimoNoRemuneracional: 322295,
  topeAfpUf: 87.8,
  gratificacion: false,
  immGratificacion: null,
  topeAfp: 3336400,
  topeIpsUf: 87.8,
  topeIps: 3336400,
  topeCesantiaUf: 131.9,
  topeCesantia: 5012200,
  topeApvMensualUf: 50,
  topeApvMensual: 1900000,
  topeApvAnualUf: 600,
  topeApvAnual: 22800000,
  topeDepositoConvenidoAnualUf: null,
  topeDepositoConvenidoAnual: null,
  topeAfpVoluntario: null,
  sis: 0.0145,
  sanna: 0.0003,
  seguroSocialExpectativaVida: null,
  aporteEmpleadorAfp: null,
  saludObligatoria: 0.07,
  saludCcaf: null,
  saludFonasaConCcaf: null,
  descuentosBasePorDia: false,
  afcTrabajadorIndefinido: 0.006,
  afcEmpleadorIndefinido: 0.024,
  afcEmpleadorPlazo: 0.03,
  afcEmpleadorIndefinidoOnceAnosMas: null,
  afcEmpleadorCasaParticular: null,
  trabajoPesadoEmpleador: 0.02,
  trabajoPesadoTrabajador: 0.02,
  trabajoMenosPesadoEmpleador: 0.01,
  trabajoMenosPesadoTrabajador: 0.01,
  fechaActualizacion: null,
} as unknown as ParametroGeneral;

const clienteConfigMock = {
  ...filaPgMock,
  idCcafEntidad: 1,
  idOrganismoAdministradorLey16744: null,
  estadoReconciliacionOficial: 'cliente_confirmado',
  fechaReconciliacionOficial: null,
  origenReconciliacion: null,
  observacionReconciliacion: null,
} as ParametrosGeneralesClienteConfig;

const catalogosMock = {
  afp: [{ idAfp: 1, codigo: 'x', nombre: 'n', periodo: null, tasaObligatoria: 0.1, comision: 0, sis: 0, tasaEmpleador: 0, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
  isapres: [],
  saludInstituciones: [{ idSalud: 1, codigo: 'FONASA', nombre: 'Fonasa', tipo: 'FONASA', porcentajeCotizacion: 0.07, periodo: null, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
  tramosCarga: [{ idTramo: 1, periodo: '2026-05', tramo: 'A', desde: 0, hasta: 500000, valor: 1000 }],
  tramosImpuesto: [{ idTramo: 1, periodo: '2026-05', desde: 0, hasta: 1, factor: 1, rebaja: 0 }],
  tablaImpuestoUnico: [{ id: 1, tramo: 1, desde: 0, hasta: 999999, factor: 0, rebaja: 0, vigenciaInicio: '2026-05-01', vigenciaFin: null }],
  reformaPensiones: [
    {
      idParametro: 1,
      nombre: 'reforma',
      valorDecimal: 0,
      valorEntero: null,
      periodo: '2026-05',
      vigenciaInicio: '2026-01-01',
      vigenciaFin: null,
    },
  ],
  trabajosPesados: [
    {
      idTrabajoPesadoParametro: 1,
      codigo: 'TP',
      periodo: '2026-05',
      nombre: 'Trabajo pesado',
      tasaTrabajador: 0.02,
      tasaEmpleador: 0.02,
      tasaTotal: 0.04,
      requiereDictamenCen: true,
      fuente: null,
      vigente: true,
      vigenciaInicio: '2026-01-01',
      vigenciaFin: null,
    },
  ],
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
    obtenerClienteConfig: ReturnType<typeof vi.fn>;
    listarCatalogos: ReturnType<typeof vi.fn>;
  };
  let empleados: {
    listar: ReturnType<typeof vi.fn>;
    obtenerPorId: ReturnType<typeof vi.fn>;
    congelarFichasNomina: ReturnType<typeof vi.fn>;
  };
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
  let diagnosticoPeriodo: {
    guardar: ReturnType<typeof vi.fn>;
    obtenerActivo: ReturnType<typeof vi.fn>;
    cerrar: ReturnType<typeof vi.fn>;
  };
  let empresas: { obtenerDatosLey16744: ReturnType<typeof vi.fn> };
  let empresaActiva: { asegurarCargada: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    parametros = {
      obtenerUltimoHastaPeriodo: vi.fn().mockResolvedValue(filaPgMock),
      obtenerPeriodoRemuneracion: vi.fn().mockResolvedValue({
        codigo: '2026-05',
        estado: 'cargado',
        fechaInicio: '2026-05-01',
        fechaFin: '2026-05-31',
      }),
      obtenerClienteConfig: vi.fn().mockResolvedValue(clienteConfigMock),
      listarCatalogos: vi.fn().mockResolvedValue(catalogosMock),
    };
    empleados = {
      congelarFichasNomina: vi.fn().mockResolvedValue([]),
      listar: vi.fn().mockResolvedValue([
        { id: 1, estado: 'activo', aptoParaRemuneraciones: true, idContrato: 10, estadoFicha: 'VALIDO' },
        { id: 2, estado: 'activo', aptoParaRemuneraciones: true, idContrato: 20, estadoFicha: 'VALIDO' },
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
    diagnosticoPeriodo = {
      guardar: vi.fn().mockResolvedValue(undefined),
      obtenerActivo: vi.fn().mockResolvedValue(null),
      cerrar: vi.fn().mockResolvedValue(undefined),
    };

    empresas = { obtenerDatosLey16744: vi.fn().mockResolvedValue(null) };
    empresaActiva = { asegurarCargada: vi.fn().mockResolvedValue({ idEmpresa: 7 }) };

    TestBed.configureTestingModule({
      providers: [
        ProcesoMensualService,
        provideAuthStub().provider,
        { provide: EmpresasRepository, useValue: empresas },
        { provide: EmpresaActivaService, useValue: empresaActiva },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user', email: 'rrhh@test.cl' } },
              }),
            },
          },
        },
        { provide: ParametrosGeneralesService, useValue: parametros },
        { provide: EmpleadosService, useValue: empleados },
        { provide: HaberesDescuentosService, useValue: haberes },
        { provide: EntradasMensualesPeriodoService, useValue: entradasMensuales },
        { provide: MovimientosVariablesService, useValue: movimientos },
        { provide: NominaCalculoSnapshotRepository, useValue: snapshots },
        { provide: NominaPeriodoDiagnosticoRepository, useValue: diagnosticoPeriodo },
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

  it('consultarEstadoParametrosPeriodo solo lee parametros generales', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.consultarEstadoParametrosPeriodo('2026-05');
    expect(parametros.obtenerUltimoHastaPeriodo).toHaveBeenCalledWith('2026-05');
    expect(parametros.obtenerPeriodoRemuneracion).toHaveBeenCalledWith('2026-05');
    expect(parametros.obtenerClienteConfig).toHaveBeenCalledWith('2026-05');
    expect(parametros.listarCatalogos).toHaveBeenCalledWith('2026-05');
    expect(empleados.listar).not.toHaveBeenCalled();
    expect(entradasMensuales.listarEntradasPeriodo).not.toHaveBeenCalled();
    expect(haberes.listarAsignacionesParaPrevalidacionMensual).not.toHaveBeenCalled();
  });

  it('no calcula montos ni invoca liquidaciones (solo dependencias declaradas)', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-05');
    expect(r.resumen.trabajadoresActivosAptos).toBe(2);
    expect(r.resumen.recurrentesAplicablesAlPeriodo).toBe(0);
    expect(parametros.obtenerUltimoHastaPeriodo).toHaveBeenCalledWith('2026-05');
  });

  it('marca parametros no operativos si la fila oficial tiene UF vacia', async () => {
    parametros.obtenerUltimoHastaPeriodo.mockResolvedValue({ ...filaPgMock, uf: null });
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-05');
    expect(r.resumen.parametrosOperativos).toBe(false);
    expect(r.resumen.parametrosGrupos.find((g) => g.id === 'mensuales_uf_utm_sueldo')?.clasificacion).toBe('PARCIAL');
  });

  it('marca parametros no operativos si sanna falta en parametros_generales aunque exista en legales', async () => {
    parametros.obtenerUltimoHastaPeriodo.mockResolvedValue({ ...filaPgMock, sanna: null });
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-05');
    expect(r.resumen.parametrosOperativos).toBe(false);
    const mensajesParametros = [...r.bloqueos, ...r.advertencias]
      .filter((m) => m.area === 'PARAMETROS')
      .map((m) => m.texto)
      .join(' ');
    expect(mensajesParametros).toMatch(/sanna/i);
  });

  it('marca parametros no operativos si hay diferencias y la config cliente se edito tras decision', async () => {
    parametros.obtenerClienteConfig.mockResolvedValue({
      ...clienteConfigMock,
      uf: 40000,
      estadoReconciliacionOficial: 'cliente_confirmado',
      fechaReconciliacionOficial: '2026-05-01T10:00:00',
      fechaActualizacion: '2026-05-20T12:00:00',
    });
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.consultarEstadoParametrosPeriodo('2026-05');
    expect(r.resumen.parametrosOperativos).toBe(false);
    expect(r.advertencias.some((a) => a.codigo === 'PARAMETROS_RECONCILIACION_PENDIENTE')).toBe(true);
  });

  it('propaga fallo de lectura de entradas como advertencia (no bloquea generar nómina)', async () => {
    entradasMensuales.listarEntradasPeriodo.mockRejectedValue(new Error('red'));
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-05');
    expect(r.advertencias.some((a) => a.codigo === 'ENTRADAS_LECTURA_ERROR')).toBe(true);
    expect(r.estado).toBe('CON_ADVERTENCIAS');
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
    expect(snapshots.guardarBaseNominaBorrador).toHaveBeenCalledWith(
      expect.objectContaining({
        periodo: '2026-05',
        estado: 'borrador',
        origen: 'preliminar',
        trabajadores: expect.arrayContaining([
          expect.objectContaining({ idPersona: expect.any(Number) }),
        ]),
      }),
      expect.objectContaining({
        entradasMensuales: expect.any(Array),
      }),
    );
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

  it('con nómina usa los insumos congelados y no relee cada ficha (NOM-INSUMOS-01)', async () => {
    const leerFicha = empleados.obtenerPorId as unknown as (id: number) => Promise<unknown>;
    const fichas = await Promise.all([1, 2].map((id) => leerFicha(id)));
    empleados.congelarFichasNomina.mockResolvedValue(fichas);
    empleados.obtenerPorId.mockClear();
    const svc = TestBed.inject(ProcesoMensualService);

    const r = await svc.generarCalculoPeriodo('2026-05', undefined, { nominaPeriodoId: 'nom-1' });

    expect(empleados.congelarFichasNomina).toHaveBeenCalledWith('nom-1');
    expect(empleados.obtenerPorId).not.toHaveBeenCalled();
    expect(r.liquidaciones.length).toBe(2);
  });

  it('si congelar los insumos falla, lee las fichas en vivo y calcula igual', async () => {
    empleados.congelarFichasNomina.mockRejectedValue(new Error('sin permiso de escritura'));
    const svc = TestBed.inject(ProcesoMensualService);

    const r = await svc.generarCalculoPeriodo('2026-05', undefined, { nominaPeriodoId: 'nom-1' });

    expect(empleados.obtenerPorId).toHaveBeenCalledTimes(2);
    expect(r.liquidaciones.length).toBe(2);
  });

  it('sin nómina no congela (cálculo por periodo)', async () => {
    const svc = TestBed.inject(ProcesoMensualService);

    await svc.generarCalculoPeriodo('2026-05');

    expect(empleados.congelarFichasNomina).not.toHaveBeenCalled();
  });

  it('lee la mutual (Ley 16.744) de la empresa activa, no la primera visible', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.generarCalculoPeriodo('2026-05');

    expect(empresas.obtenerDatosLey16744).toHaveBeenCalledWith(7);
  });

  it('no bloquea el cálculo si falla la lectura de la mutual', async () => {
    empresas.obtenerDatosLey16744.mockRejectedValueOnce(new Error('red'));
    const svc = TestBed.inject(ProcesoMensualService);

    const r = await svc.generarCalculoPeriodo('2026-05');

    expect(r.liquidaciones.length).toBe(2);
  });

  it('construye calculo desde entradas canonicas sin alterar resultados legales en MOTOR-04', async () => {
    empleados.listar.mockResolvedValueOnce([
      { id: 1, estado: 'activo', aptoParaRemuneraciones: true, idContrato: 10, estadoFicha: 'VALIDO' },
    ]);
    empleados.obtenerPorId.mockImplementationOnce((id: number) => Promise.resolve({
      id,
      idContrato: 10,
      rut: '11.111.111-1',
      nombre: 'Trabajador MOTOR-04',
      cargo: 'Analista',
      departamento: 'Operaciones',
      fechaIngreso: '2024-01-01',
      sueldoBase: 100,
      estado: 'activo',
      estadoFicha: 'VALIDO',
      aptoParaRemuneraciones: true,
      pasoAltaAvanzada: null,
      historial: [],
      formValue: {
        datosPersonales: {},
        contacto: {},
        contrato: { sueldoBase: 100, tipoContrato: 'I' },
        previsionSalud: { idAfp: 1, idSalud: 1, valorPlan: null },
        bancario: {},
      },
    }));
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
    // B6: la entrada mensual (haber variable aprobado de 50.000) se integra a la base imponible.
    expect(r.liquidaciones[0].baseImponiblePrevisional).toBe(50100);
    expect(r.liquidaciones[0].impuestoUnico).toBe(0);
    expect(r.liquidaciones[0].liquidoAPago).toBe(r.liquidaciones[0].totalHaberes - r.liquidaciones[0].totalDescuentos);
  });

  it('suma al cálculo los movimientos manuales de la nómina (paso Movimientos)', async () => {
    empleados.listar.mockResolvedValue([
      { id: 1, estado: 'activo', aptoParaRemuneraciones: true, idContrato: 10, estadoFicha: 'VALIDO' },
    ]);
    const movimientoManual = {
      id: 'mov-1',
      nominaPeriodoId: 'nom-1',
      trabajadorId: '1',
      conceptoId: 99,
      tipo: 'HORAS_EXTRAS',
      categoria: 'haber',
      monto: 50000,
      cantidad: null,
      unidad: null,
      origen: 'manual',
      estado: 'aplicado',
      glosa: 'Horas extra',
    } as unknown as MovimientoNomina;
    const svc = TestBed.inject(ProcesoMensualService);

    const sinMovimiento = await svc.generarCalculoPeriodo('2026-05', [1], { nominaPeriodoId: 'nom-1' });
    const conMovimiento = await svc.generarCalculoPeriodo('2026-05', [1], {
      nominaPeriodoId: 'nom-1',
      movimientosNomina: [movimientoManual],
    });

    expect(conMovimiento.liquidaciones[0].totalHaberes - sinMovimiento.liquidaciones[0].totalHaberes).toBe(50000);
  });

  it('no duplica: ignora movimientos recurrentes y manuales iguales a una novedad existente', async () => {
    empleados.listar.mockResolvedValue([
      { id: 1, estado: 'activo', aptoParaRemuneraciones: true, idContrato: 10, estadoFicha: 'VALIDO' },
    ]);
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
    const base = {
      nominaPeriodoId: 'nom-1',
      trabajadorId: '1',
      conceptoId: 99,
      tipo: 'BONO',
      categoria: 'haber',
      monto: 50000,
      cantidad: null,
      unidad: null,
      estado: 'aplicado',
      glosa: null,
    };
    const movimientos = [
      { ...base, id: 'mov-rec', origen: 'recurrente' },
      { ...base, id: 'mov-dup', origen: 'manual' },
    ] as unknown as MovimientoNomina[];
    const svc = TestBed.inject(ProcesoMensualService);

    const sin = await svc.generarCalculoPeriodo('2026-05', [1], { nominaPeriodoId: 'nom-1' });
    const con = await svc.generarCalculoPeriodo('2026-05', [1], {
      nominaPeriodoId: 'nom-1',
      movimientosNomina: movimientos,
    });

    expect(con.liquidaciones[0].totalHaberes).toBe(sin.liquidaciones[0].totalHaberes);
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

  it('contarLiquidacionesGeneradas filtra por snapshot activo', async () => {
    const liquidaciones = TestBed.inject(LiquidacionesOficialesRepository) as unknown as {
      obtenerLiquidacionPeriodo: ReturnType<typeof vi.fn>;
    };
    liquidaciones.obtenerLiquidacionPeriodo.mockImplementation(
      async (_periodo: string, idCalculoPeriodo?: number | null) =>
        idCalculoPeriodo === 9
          ? {
              idLiquidacionPeriodo: 1,
              idCalculoPeriodo: 9,
              periodo: '2026-05',
            }
          : null,
    );

    const svc = TestBed.inject(ProcesoMensualService);
    await expect(svc.contarLiquidacionesGeneradas('2026-05', 9)).resolves.toBe(1);
    await expect(svc.contarLiquidacionesGeneradas('2026-05', 99)).resolves.toBe(0);

    expect(liquidaciones.obtenerLiquidacionPeriodo).toHaveBeenCalledWith('2026-05', 9);
    expect(liquidaciones.obtenerLiquidacionPeriodo).toHaveBeenCalledWith('2026-05', 99);
  });

  it('rehidratarPeriodo sin snapshot restaura prevalidacion desde diagnostico persistido (NOM-PERIODO-DIAGNOSTICO)', async () => {
    const prevalidacion = {
      periodo: '2026-05',
      estado: 'LISTO_PARA_CALCULO' as const,
      resumen: {
        periodo: '2026-05',
        hayBloqueos: false,
        hayAdvertencias: false,
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
      items: [],
      entradasMensuales: [],
    };
    snapshots.obtenerSnapshotActivo.mockResolvedValue(null);
    diagnosticoPeriodo.obtenerActivo.mockResolvedValue(prevalidacion);

    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.rehidratarPeriodo('2026-05');

    expect(diagnosticoPeriodo.obtenerActivo).toHaveBeenCalledWith('2026-05');
    expect(r.snapshot).toBeNull();
    expect(r.prevalidacionDiagnostico?.estado).toBe('LISTO_PARA_CALCULO');
  });

  it('guardarDiagnosticoPeriodo delega al repositorio de diagnostico', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const prevalidacion = (await svc.ejecutarPrevalidaciones('2026-05')) as {
      periodo: string;
      estado: string;
    };
    await svc.guardarDiagnosticoPeriodo('2026-05', prevalidacion as never);

    expect(diagnosticoPeriodo.guardar).toHaveBeenCalledWith(
      '2026-05',
      prevalidacion,
      expect.any(String),
    );
  });
});
