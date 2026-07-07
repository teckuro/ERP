import { TestBed } from '@angular/core/testing';

import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import { NovedadesMensualesRepository } from '../data-access/novedades-mensuales.repository';
import type { CrearNovedadMensualInput, NovedadMensual } from '../models/novedad-mensual.model';
import { NovedadesMensualesService } from './novedades-mensuales.service';

function novedad(over: Partial<NovedadMensual> = {}): NovedadMensual {
  return {
    idNovedad: 1,
    periodo: '2026-05',
    idPersona: 10,
    idContrato: null,
    idConcepto: 20,
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 1000,
    moneda: 'CLP',
    origen: 'manual',
    fechaEvento: null,
    estado: 'borrador',
    observacion: null,
    referenciaExterna: null,
    codigoMotivoAusencia: null,
    idLicencia: null,
    creadoPor: null,
    aprobadoPor: null,
    fechaAprobacion: null,
    fechaCreacion: '2026-05-01T00:00:00.000Z',
    fechaActualizacion: '2026-05-01T00:00:00.000Z',
    ...over,
  };
}

function crearInput(over: Partial<CrearNovedadMensualInput> = {}): CrearNovedadMensualInput {
  return {
    periodo: '2026-05',
    idPersona: 10,
    idConcepto: 20,
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    monto: 1000,
    ...over,
  };
}

describe('NovedadesMensualesService', () => {
  let service: NovedadesMensualesService;
  let repository: {
    listarPorPeriodo: ReturnType<typeof vi.fn>;
    listarPorPeriodoYPersona: ReturnType<typeof vi.fn>;
    obtenerPorId: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    cambiarEstado: ReturnType<typeof vi.fn>;
    anular: ReturnType<typeof vi.fn>;
    eliminarSoloBorrador: ReturnType<typeof vi.fn>;
  };
  let haberesDescuentosService: {
    resolverSnapshotConceptoParaMovimientoVariableManual: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      listarPorPeriodo: vi.fn().mockResolvedValue([]),
      listarPorPeriodoYPersona: vi.fn().mockResolvedValue([]),
      obtenerPorId: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      cambiarEstado: vi.fn(),
      anular: vi.fn(),
      eliminarSoloBorrador: vi.fn(),
    };
    haberesDescuentosService = {
      resolverSnapshotConceptoParaMovimientoVariableManual: vi.fn().mockResolvedValue({
        tipo: 'HABER',
        calculoAutomatico: false,
        esSistema: false,
        codigo: 'BONO',
        nombre: 'Bono',
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        NovedadesMensualesService,
        { provide: NovedadesMensualesRepository, useValue: repository },
        { provide: HaberesDescuentosService, useValue: haberesDescuentosService },
      ],
    });
    service = TestBed.inject(NovedadesMensualesService);
  });

  it('listar por periodo delega en repository', async () => {
    repository.listarPorPeriodo.mockResolvedValue([novedad()]);

    const result = await service.listarNovedadesPeriodo('2026-05');

    expect(repository.listarPorPeriodo).toHaveBeenCalledWith('2026-05');
    expect(result).toHaveLength(1);
  });

  it('crear novedad llama repository con datos normalizados', async () => {
    repository.crear.mockImplementation(async (input: CrearNovedadMensualInput) =>
      novedad({ periodo: input.periodo, moneda: input.moneda ?? 'CLP' }),
    );

    await service.crearNovedad(crearInput({ periodo: ' 2026-05 ', moneda: 'clp' }));

    const arg = repository.crear.mock.calls[0][0] as CrearNovedadMensualInput;
    expect(arg.periodo).toBe('2026-05');
    expect(arg.moneda).toBe('CLP');
    expect(haberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual).toHaveBeenCalled();
  });

  it('aprobar valida transicion', async () => {
    repository.obtenerPorId.mockResolvedValue(novedad({ estado: 'pendiente_revision', monto: 1000 }));
    repository.cambiarEstado.mockResolvedValue(novedad({ estado: 'aprobada' }));

    await service.aprobarNovedad(1, '00000000-0000-0000-0000-000000000001');

    expect(repository.cambiarEstado).toHaveBeenCalledWith(1, 'aprobada', {
      aprobadoPor: '00000000-0000-0000-0000-000000000001',
    });
  });

  it('rechazar exige observacion', async () => {
    repository.obtenerPorId.mockResolvedValue(novedad({ estado: 'pendiente_revision' }));

    await expect(service.rechazarNovedad(1, '')).rejects.toThrow(/observacion/);
    expect(repository.cambiarEstado).not.toHaveBeenCalled();
  });

  it('anular no permite calculada', async () => {
    repository.obtenerPorId.mockResolvedValue(novedad({ estado: 'calculada' }));

    await expect(service.anularNovedad(1, 'error')).rejects.toThrow(/calculada/);
    expect(repository.anular).not.toHaveBeenCalled();
  });

  it('actualizar no permite editar calculada', async () => {
    repository.obtenerPorId.mockResolvedValue(novedad({ estado: 'calculada' }));

    await expect(service.actualizarNovedad(1, { monto: 2000 })).rejects.toThrow(/calculada/);
    expect(repository.actualizar).not.toHaveBeenCalled();
  });
});
