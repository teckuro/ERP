import { TestBed } from '@angular/core/testing';

import { HaberesDescuentosRepository } from '../data-access/haberes-descuentos.repository';
import type {
  ConceptoMantenimientoFila,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
} from '../models/haber-descuento-asignacion.model';
import { HaberesDescuentosService } from './haberes-descuentos.service';

function filaBase(over: Partial<ConceptoMantenimientoFila> = {}): ConceptoMantenimientoFila {
  return {
    idConcepto: 1,
    codigo: 'X',
    codigoMotor: null,
    nombre: 'Concepto X',
    tipo: 'HABER',
    naturaleza: 'IMPONIBLE',
    idCatalogoLre: null,
    codigoLre: null,
    nombreLre: null,
    moduloLre: null,
    grupoLre: null,
    clasificacionLre: null,
    imponible: true,
    tributable: false,
    afectaAfp: false,
    afectaSalud: false,
    afectaAfc: false,
    afectaSis: false,
    afectaLiquido: false,
    esSistema: false,
    vigente: true,
    vigenciaInicio: null,
    vigenciaFin: null,
    ordenImpresion: 0,
    calculoAutomatico: false,
    ...over,
  };
}

function payloadBase(over: Partial<HaberDescuentoAsignacionPayload> = {}): HaberDescuentoAsignacionPayload {
  return {
    idPersona: 1,
    idConcepto: 99,
    idContrato: null,
    tipoValor: 'FIJO',
    monto: 1000,
    porcentaje: null,
    tipohaber: 'IMPONIBLE',
    periodicidad: 'MENSUAL',
    vigenciaInicio: '2026-05-01',
    vigenciaFin: null,
    observacion: null,
    estado: true,
    ...over,
  };
}

function asignacionListadoBase(
  over: Partial<HaberDescuentoAsignacionListado> = {},
): HaberDescuentoAsignacionListado {
  return {
    idAsignacion: 1,
    idPersona: 1,
    idConcepto: 99,
    idContrato: null,
    codigoConcepto: 'HD-001',
    nombreConcepto: 'Asignacion prueba',
    tipoConcepto: 'HABER',
    naturalezaConcepto: 'IMPONIBLE',
    codigoLre: null,
    esSistemaConcepto: false,
    calculoAutomaticoConcepto: false,
    imponible: true,
    tributable: false,
    monto: 1000,
    porcentaje: null,
    tipoValor: 'FIJO',
    tipohaber: 'IMPONIBLE',
    periodicidad: 'MENSUAL',
    vigenciaInicio: '2026-05-01',
    vigenciaFin: null,
    observacion: null,
    estado: true,
    ...over,
  };
}

function conceptoAsignable() {
  return {
    tipo: 'HABER',
    esSistema: false,
    calculoAutomatico: false,
    vigente: true,
    vigenciaInicio: null,
    vigenciaFin: null,
  };
}

describe('HaberesDescuentosService', () => {
  let service: HaberesDescuentosService;
  let repository: {
    listarAsignacionesPorPersona: ReturnType<typeof vi.fn>;
    listarConceptosMantenimiento: ReturnType<typeof vi.fn>;
    obtenerConceptoParaAsignacion: ReturnType<typeof vi.fn>;
    listarAsignacionesPorPersonaYConcepto: ReturnType<typeof vi.fn>;
    obtenerAsignacionPorId: ReturnType<typeof vi.fn>;
    cerrarAsignacion: ReturnType<typeof vi.fn>;
    crearAsignacion: ReturnType<typeof vi.fn>;
    actualizarAsignacion: ReturnType<typeof vi.fn>;
    contratoPerteneceAPersona: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 3, 12, 0, 0, 0));
    repository = {
      listarAsignacionesPorPersona: vi.fn().mockResolvedValue([]),
      listarConceptosMantenimiento: vi.fn(),
      obtenerConceptoParaAsignacion: vi.fn(),
      listarAsignacionesPorPersonaYConcepto: vi.fn().mockResolvedValue([]),
      obtenerAsignacionPorId: vi.fn(),
      cerrarAsignacion: vi.fn().mockResolvedValue(undefined),
      crearAsignacion: vi.fn().mockResolvedValue(undefined),
      actualizarAsignacion: vi.fn().mockResolvedValue(undefined),
      contratoPerteneceAPersona: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        HaberesDescuentosService,
        { provide: HaberesDescuentosRepository, useValue: repository },
      ],
    });
    service = TestBed.inject(HaberesDescuentosService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('listarConceptos excluye conceptos no asignables segun regla central', async () => {
    const ref = new Date(2026, 4, 15, 12, 0, 0, 0);
    const ok = filaBase({ idConcepto: 10 });
    const sistema = filaBase({ idConcepto: 11, esSistema: true });
    const aporte = filaBase({ idConcepto: 12, tipo: 'APORTE_EMPLEADOR' });
    const noVigente = filaBase({ idConcepto: 13, vigente: false });
    repository.listarConceptosMantenimiento.mockResolvedValue([ok, sistema, aporte, noVigente]);

    const list = await service.listarConceptos(ref);

    expect(list.map((c) => c.idConcepto)).toEqual([10]);
  });

  it('listarPorPersona deriva estados de vigencia y etiquetas para la vista historica', async () => {
    repository.listarAsignacionesPorPersona.mockResolvedValue([
      asignacionListadoBase({ idAsignacion: 1, vigenciaInicio: '2026-05-01', vigenciaFin: null, estado: true }),
      asignacionListadoBase({ idAsignacion: 2, vigenciaInicio: '2026-06-01', vigenciaFin: null, estado: true }),
      asignacionListadoBase({ idAsignacion: 3, vigenciaInicio: '2026-01-01', vigenciaFin: '2026-03-31', estado: true }),
      asignacionListadoBase({ idAsignacion: 4, vigenciaInicio: '2026-01-01', vigenciaFin: null, estado: false }),
      asignacionListadoBase({ idAsignacion: 5, vigenciaInicio: '2026-02-31', vigenciaFin: null, estado: true }),
    ]);

    const rows = await service.listarPorPersona(1, new Date(2026, 4, 3, 12, 0, 0, 0));

    expect(repository.listarAsignacionesPorPersona).toHaveBeenCalledWith(1);
    expect(rows.map((row) => row.estadoVigencia)).toEqual([
      'ACTIVA',
      'FUTURA',
      'VENCIDA',
      'CERRADA',
      'INVALIDA',
    ]);
    expect(rows.map((row) => row.estadoVigenciaEtiqueta)).toEqual([
      'Activa',
      'Futura',
      'Vencida',
      'Cerrada',
      'Invalida',
    ]);
  });

  it('crear asignacion con concepto valido y sin duplicados permite guardar', async () => {
    repository.obtenerConceptoParaAsignacion.mockResolvedValue(conceptoAsignable());
    repository.listarAsignacionesPorPersonaYConcepto.mockResolvedValue([]);

    await service.crear(payloadBase());

    expect(repository.crearAsignacion).toHaveBeenCalledWith(payloadBase());
  });

  it('crear asignacion con concepto valido pero duplicado activo rechaza', async () => {
    repository.obtenerConceptoParaAsignacion.mockResolvedValue(conceptoAsignable());
    repository.listarAsignacionesPorPersonaYConcepto.mockResolvedValue([
      {
        idAsignacion: 10,
        idPersona: 1,
        idConcepto: 99,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: null,
        estado: true,
      },
    ]);

    await expect(service.crear(payloadBase())).rejects.toThrow(/Ya existe una asignacion vigente/);
    expect(repository.crearAsignacion).not.toHaveBeenCalled();
  });

  it('crear asignacion con vigencia invalida rechaza antes de guardar', async () => {
    repository.obtenerConceptoParaAsignacion.mockResolvedValue(conceptoAsignable());

    await expect(
      service.crear(payloadBase({ vigenciaInicio: '2026-06-01', vigenciaFin: '2026-05-31' })),
    ).rejects.toThrow(/fecha de termino/);
    expect(repository.crearAsignacion).not.toHaveBeenCalled();
  });

  it('actualizar no se bloquea contra la misma asignacion', async () => {
    repository.obtenerConceptoParaAsignacion.mockResolvedValue(conceptoAsignable());
    repository.listarAsignacionesPorPersonaYConcepto.mockResolvedValue([
      {
        idAsignacion: 10,
        idPersona: 1,
        idConcepto: 99,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: null,
        estado: true,
      },
    ]);

    await service.actualizar(10, payloadBase());

    expect(repository.actualizarAsignacion).toHaveBeenCalledWith(10, payloadBase());
  });

  it('actualizar generando solapamiento con otra asignacion rechaza', async () => {
    repository.obtenerConceptoParaAsignacion.mockResolvedValue(conceptoAsignable());
    repository.listarAsignacionesPorPersonaYConcepto.mockResolvedValue([
      {
        idAsignacion: 10,
        idPersona: 1,
        idConcepto: 99,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: '2026-06-30',
        estado: true,
      },
      {
        idAsignacion: 20,
        idPersona: 1,
        idConcepto: 99,
        vigenciaInicio: '2026-07-01',
        vigenciaFin: null,
        estado: true,
      },
    ]);

    await expect(
      service.actualizar(10, payloadBase({ vigenciaInicio: '2026-06-15', vigenciaFin: null })),
    ).rejects.toThrow(/superpone|vigente/);
    expect(repository.actualizarAsignacion).not.toHaveBeenCalled();
  });

  it('crear rechaza concepto con vigencia vencida respecto a hoy', async () => {
    repository.obtenerConceptoParaAsignacion.mockResolvedValue({
      tipo: 'HABER',
      esSistema: false,
      calculoAutomatico: false,
      vigente: true,
      vigenciaInicio: '2020-01-01',
      vigenciaFin: '2020-12-31',
    });

    await expect(service.crear(payloadBase())).rejects.toThrow(/venci/);
    expect(repository.crearAsignacion).not.toHaveBeenCalled();
  });

  it('cerrarAsignacion obtiene asignacion existente y persiste cierre', async () => {
    repository.obtenerAsignacionPorId.mockResolvedValue({
      idAsignacion: 10,
      idPersona: 1,
      idConcepto: 99,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
      estado: true,
    });

    await service.cerrarAsignacion(10, '2026-05-03');

    expect(repository.obtenerAsignacionPorId).toHaveBeenCalledWith(10);
    expect(repository.cerrarAsignacion).toHaveBeenCalledWith(10, {
      estado: false,
      vigenciaFin: '2026-05-03',
    });
  });

  it('cerrarAsignacion falla si la asignacion no existe', async () => {
    repository.obtenerAsignacionPorId.mockResolvedValue(null);

    await expect(service.cerrarAsignacion(10, '2026-05-03')).rejects.toThrow(
      /No se encontro la asignacion recurrente/,
    );
    expect(repository.cerrarAsignacion).not.toHaveBeenCalled();
  });

  it('cerrarAsignacion no persiste si la fecha de cierre es invalida', async () => {
    repository.obtenerAsignacionPorId.mockResolvedValue({
      idAsignacion: 10,
      idPersona: 1,
      idConcepto: 99,
      vigenciaInicio: '2026-05-02',
      vigenciaFin: null,
      estado: true,
    });

    await expect(service.cerrarAsignacion(10, '2026-05-01')).rejects.toThrow(
      /anterior a la fecha de inicio/,
    );
    expect(repository.cerrarAsignacion).not.toHaveBeenCalled();
  });

  it('cerrarAsignacion bloquea asignacion ya cerrada', async () => {
    repository.obtenerAsignacionPorId.mockResolvedValue({
      idAsignacion: 10,
      idPersona: 1,
      idConcepto: 99,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: '2026-05-10',
      estado: false,
    });

    await expect(service.cerrarAsignacion(10, '2026-05-03')).rejects.toThrow(
      /ya se encuentra cerrada/,
    );
    expect(repository.cerrarAsignacion).not.toHaveBeenCalled();
  });

  it('cerrarAsignacion bloquea asignacion vencida', async () => {
    repository.obtenerAsignacionPorId.mockResolvedValue({
      idAsignacion: 10,
      idPersona: 1,
      idConcepto: 99,
      vigenciaInicio: '2020-01-01',
      vigenciaFin: '2020-12-31',
      estado: true,
    });

    await expect(service.cerrarAsignacion(10, '2026-05-03')).rejects.toThrow(
      /vencida o cerrada/,
    );
    expect(repository.cerrarAsignacion).not.toHaveBeenCalled();
  });

  it('cerrarAsignacion no valida esConceptoAsignable como requisito de cierre', async () => {
    repository.obtenerAsignacionPorId.mockResolvedValue({
      idAsignacion: 10,
      idPersona: 1,
      idConcepto: 99,
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
      estado: true,
    });

    await service.cerrarAsignacion(10, '2026-05-03');

    expect(repository.obtenerConceptoParaAsignacion).not.toHaveBeenCalled();
    expect(repository.cerrarAsignacion).toHaveBeenCalled();
  });
});
