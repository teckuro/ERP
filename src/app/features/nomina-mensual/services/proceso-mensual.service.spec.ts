import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { EmpleadosService } from '../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesService } from '../../movimientos-variables/services/movimientos-variables.service';
import type { ParametroGeneral } from '../../parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';

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
  isapres: [{ idSalud: 1, codigo: 'x', nombre: 'n', tipo: null, porcentajeCotizacion: null, periodo: null, vigente: true, vigenciaInicio: null, vigenciaFin: null }],
  saludInstituciones: [],
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
  let empleados: { listar: ReturnType<typeof vi.fn> };
  let haberes: {
    listarConceptosMantenimiento: ReturnType<typeof vi.fn>;
    listarAsignacionesParaPrevalidacionMensual: ReturnType<typeof vi.fn>;
  };
  let movimientos: { listarPorPeriodo: ReturnType<typeof vi.fn> };

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
        { estado: 'activo', aptoParaRemuneraciones: true },
        { estado: 'activo', aptoParaRemuneraciones: true },
      ]),
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

    TestBed.configureTestingModule({
      providers: [
        ProcesoMensualService,
        { provide: ParametrosGeneralesService, useValue: parametros },
        { provide: EmpleadosService, useValue: empleados },
        { provide: HaberesDescuentosService, useValue: haberes },
        { provide: MovimientosVariablesService, useValue: movimientos },
      ],
    });
  });

  it('valida periodo invalido sin llamar listarPorPeriodo ni recurrentes ni catalogos', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-13');
    expect(r.estado).toBe('BLOQUEADO');
    expect(movimientos.listarPorPeriodo).not.toHaveBeenCalled();
    expect(haberes.listarAsignacionesParaPrevalidacionMensual).not.toHaveBeenCalled();
    expect(parametros.listarCatalogos).not.toHaveBeenCalled();
  });

  it('con periodo valido llama movimientos variables y recurrentes y catalogos', async () => {
    const svc = TestBed.inject(ProcesoMensualService);
    await svc.ejecutarPrevalidaciones('2026-05');
    expect(movimientos.listarPorPeriodo).toHaveBeenCalledWith('2026-05');
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

  it('propaga fallo de lectura de movimientos como bloqueo en resultado', async () => {
    movimientos.listarPorPeriodo.mockRejectedValue(new Error('red'));
    const svc = TestBed.inject(ProcesoMensualService);
    const r = await svc.ejecutarPrevalidaciones('2026-05');
    expect(r.bloqueos.some((b) => b.codigo === 'MV_LECTURA_ERROR')).toBe(true);
    expect(r.estado).toBe('BLOQUEADO');
  });
});
