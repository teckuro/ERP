import { TestBed } from '@angular/core/testing';

import type { EmpleadoFichaDetalle } from '../../empleados/models/empleado-listado.model';
import { EmpleadosService } from '../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesRepository } from '../data-access/movimientos-variables.repository';
import type {
  MovimientoVariable,
  MovimientoVariableActualizarPayload,
  MovimientoVariableAnularPayload,
  MovimientoVariableCrearPayload,
} from '../models/movimiento-variable.model';
import { MovimientosVariablesService } from './movimientos-variables.service';

function empleadoFichaDetalleBase(over: Partial<EmpleadoFichaDetalle> = {}): EmpleadoFichaDetalle {
  const baseForm = {
    datosPersonales: {},
    contacto: {},
    contrato: { fechaIngreso: '2026-01-01', fechaTermino: null as string | null },
    previsionSalud: {},
    bancario: {},
  };
  const oFv = over.formValue;
  const formValue = oFv
    ? {
        ...baseForm,
        ...oFv,
        contrato: {
          ...baseForm.contrato,
          ...(oFv.contrato as Record<string, unknown>),
        },
      }
    : baseForm;
  const { formValue: _omitFv, ...restOver } = over;
  void _omitFv;

  return {
    id: 10,
    idContrato: 1,
    rut: '1-9',
    nombre: 'Test',
    cargo: 'Cargo',
    departamento: 'Dept',
    fechaIngreso: '2026-01-01',
    sueldoBase: 1_000_000,
    estado: 'activo',
    estadoFicha: 'VALIDO',
    aptoParaRemuneraciones: true,
    pasoAltaAvanzada: null,
    historial: [],
    formValue,
    ...restOver,
  };
}

function movBase(over: Partial<MovimientoVariable> = {}): MovimientoVariable {
  return {
    idMovimiento: 1,
    idPersona: 10,
    idConcepto: 20,
    periodo: '2026-05',
    monto: 100,
    estado: 'BORRADOR',
    origen: 'MANUAL',
    observacion: null,
    ...over,
  };
}

function crearPayloadBase(over: Partial<MovimientoVariableCrearPayload> = {}): MovimientoVariableCrearPayload {
  return {
    idPersona: 10,
    idConcepto: 20,
    periodo: '2026-05',
    monto: 50,
    estado: 'BORRADOR',
    origen: 'MANUAL',
    observacion: null,
    ...over,
  };
}

describe('MovimientosVariablesService', () => {
  let service: MovimientosVariablesService;
  let repository: {
    listarPorPeriodo: ReturnType<typeof vi.fn>;
    listarPorPersonaYPeriodo: ReturnType<typeof vi.fn>;
    obtenerPorId: ReturnType<typeof vi.fn>;
    listarDuplicadosOperativos: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    anular: ReturnType<typeof vi.fn>;
  };
  let haberesDescuentosService: {
    resolverSnapshotConceptoParaMovimientoVariableManual: ReturnType<typeof vi.fn>;
  };
  let empleadosService: { obtenerPorId: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repository = {
      listarPorPeriodo: vi.fn().mockResolvedValue([]),
      listarPorPersonaYPeriodo: vi.fn().mockResolvedValue([]),
      obtenerPorId: vi.fn(),
      listarDuplicadosOperativos: vi.fn().mockResolvedValue([]),
      crear: vi.fn(),
      actualizar: vi.fn(),
      anular: vi.fn(),
    };
    haberesDescuentosService = {
      resolverSnapshotConceptoParaMovimientoVariableManual: vi
        .fn()
        .mockResolvedValue({ tipo: 'HABER', calculoAutomatico: false, esSistema: false }),
    };
    empleadosService = {
      obtenerPorId: vi.fn().mockImplementation(async (id: number) => empleadoFichaDetalleBase({ id })),
    };

    TestBed.configureTestingModule({
      providers: [
        MovimientosVariablesService,
        { provide: MovimientosVariablesRepository, useValue: repository },
        { provide: HaberesDescuentosService, useValue: haberesDescuentosService },
        { provide: EmpleadosService, useValue: empleadosService },
      ],
    });
    service = TestBed.inject(MovimientosVariablesService);
  });

  describe('listado', () => {
    it('listarPorPeriodo con periodo valido delega en el repositorio', async () => {
      repository.listarPorPeriodo.mockResolvedValue([movBase()]);

      const filas = await service.listarPorPeriodo('2026-05');

      expect(repository.listarPorPeriodo).toHaveBeenCalledWith('2026-05');
      expect(filas).toHaveLength(1);
      expect(filas[0].idMovimiento).toBe(1);
    });

    it('listarPorPeriodo con periodo invalido rechaza', async () => {
      await expect(service.listarPorPeriodo('2026-13')).rejects.toThrow(/YYYY-MM/);
      expect(repository.listarPorPeriodo).not.toHaveBeenCalled();
    });

    it('listarPorPersonaYPeriodo con persona invalida rechaza', async () => {
      await expect(service.listarPorPersonaYPeriodo(0, '2026-05')).rejects.toThrow(/trabajador/);
      expect(repository.listarPorPersonaYPeriodo).not.toHaveBeenCalled();
    });

    it('listarPorPersonaYPeriodo con periodo invalido rechaza', async () => {
      await expect(service.listarPorPersonaYPeriodo(1, 'bad')).rejects.toThrow(/YYYY-MM/);
      expect(repository.listarPorPersonaYPeriodo).not.toHaveBeenCalled();
    });
  });

  describe('crear', () => {
    beforeEach(() => {
      repository.crear.mockImplementation(async (p: MovimientoVariableCrearPayload) =>
        movBase({
          idPersona: p.idPersona,
          idConcepto: p.idConcepto,
          periodo: p.periodo.trim(),
          monto: p.monto,
          estado: p.estado ?? 'BORRADOR',
        }),
      );
    });

    it('crear movimiento valido llama repository.crear', async () => {
      await service.crear(crearPayloadBase());

      expect(empleadosService.obtenerPorId).toHaveBeenCalledWith(10);
      expect(haberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual).toHaveBeenCalledWith(
        20,
        new Date(2026, 4, 1, 0, 0, 0, 0),
      );
      expect(repository.listarDuplicadosOperativos).toHaveBeenCalled();
      expect(repository.crear).toHaveBeenCalled();
      const arg = repository.crear.mock.calls[0][0] as MovimientoVariableCrearPayload;
      expect(arg.concepto).toBeUndefined();
    });

    it('crear sin trabajador valido falla', async () => {
      await expect(service.crear(crearPayloadBase({ idPersona: 0 }))).rejects.toThrow(/trabajador/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear sin concepto valido falla', async () => {
      await expect(service.crear(crearPayloadBase({ idConcepto: 0 }))).rejects.toThrow(/concepto/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear sin periodo valido falla', async () => {
      await expect(service.crear(crearPayloadBase({ periodo: '' }))).rejects.toThrow(/YYYY-MM/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear con monto cero falla', async () => {
      await expect(service.crear(crearPayloadBase({ monto: 0 }))).rejects.toThrow(/cero/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear con duplicado operativo falla', async () => {
      repository.listarDuplicadosOperativos.mockResolvedValue([
        movBase({ idMovimiento: 99, estado: 'BORRADOR' }),
      ]);

      await expect(service.crear(crearPayloadBase())).rejects.toThrow(/operativo/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear con solo ANULADO en BD no bloquea (lista duplicados vacia)', async () => {
      repository.listarDuplicadosOperativos.mockResolvedValue([]);

      await service.crear(crearPayloadBase());

      expect(repository.crear).toHaveBeenCalled();
    });

    it('crear ignora snapshot malicioso en payload y usa catalogo (CHILE-FIX-01)', async () => {
      await service.crear(
        crearPayloadBase({
          concepto: { tipo: 'APORTE_EMPLEADOR', calculoAutomatico: false, esSistema: false },
        }),
      );

      expect(haberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual).toHaveBeenCalled();
      expect(repository.crear).toHaveBeenCalled();
    });

    it('crear falla si el catalogo rechaza el concepto', async () => {
      haberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual.mockRejectedValueOnce(
        new Error('Los aportes del empleador no se registran como movimientos del mes del trabajador.'),
      );

      await expect(service.crear(crearPayloadBase())).rejects.toThrow(/aportes/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear falla si el trabajador no existe', async () => {
      empleadosService.obtenerPorId.mockResolvedValueOnce(null);

      await expect(service.crear(crearPayloadBase())).rejects.toThrow(/No se encontro el trabajador/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear falla si el trabajador no esta apto para remuneraciones', async () => {
      empleadosService.obtenerPorId.mockResolvedValueOnce(empleadoFichaDetalleBase({ aptoParaRemuneraciones: false }));

      await expect(service.crear(crearPayloadBase())).rejects.toThrow(/no esta apto/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear falla si el trabajador no esta activo', async () => {
      empleadosService.obtenerPorId.mockResolvedValueOnce(empleadoFichaDetalleBase({ estado: 'suspendido' }));

      await expect(service.crear(crearPayloadBase())).rejects.toThrow(/Solo trabajadores activos/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear falla si el contrato no tiene fecha de ingreso', async () => {
      empleadosService.obtenerPorId.mockResolvedValueOnce(
        empleadoFichaDetalleBase({
          formValue: {
            datosPersonales: {},
            contacto: {},
            contrato: { fechaIngreso: '', fechaTermino: null },
            previsionSalud: {},
            bancario: {},
          },
        }),
      );

      await expect(service.crear(crearPayloadBase())).rejects.toThrow(/fecha de ingreso/);
      expect(repository.crear).not.toHaveBeenCalled();
    });

    it('crear falla si el contrato no intersecta el periodo', async () => {
      empleadosService.obtenerPorId.mockResolvedValueOnce(
        empleadoFichaDetalleBase({
          formValue: {
            datosPersonales: {},
            contacto: {},
            contrato: { fechaIngreso: '2026-06-01', fechaTermino: null },
            previsionSalud: {},
            bancario: {},
          },
        }),
      );

      await expect(service.crear(crearPayloadBase({ periodo: '2026-05' }))).rejects.toThrow(/no esta vigente/);
      expect(repository.crear).not.toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('actualizar movimiento existente valido llama repository.actualizar', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'BORRADOR' }));
      repository.listarDuplicadosOperativos.mockResolvedValue([]);
      repository.actualizar.mockResolvedValue(movBase({ monto: 77 }));

      const payload: MovimientoVariableActualizarPayload = { idMovimiento: 1, monto: 77 };
      const out = await service.actualizar(1, payload);

      expect(out.monto).toBe(77);
      expect(empleadosService.obtenerPorId).toHaveBeenCalled();
      expect(haberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual).toHaveBeenCalled();
      expect(repository.actualizar).toHaveBeenCalledWith(1, payload);
    });

    it('actualizar movimiento inexistente falla', async () => {
      repository.obtenerPorId.mockResolvedValue(null);

      await expect(service.actualizar(1, { idMovimiento: 1, monto: 1 })).rejects.toThrow(/No se encontr/);
      expect(repository.actualizar).not.toHaveBeenCalled();
    });

    it('actualizar ANULADO falla', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'ANULADO' }));

      await expect(service.actualizar(1, { idMovimiento: 1, monto: 1 })).rejects.toThrow(/no puede modificarse/);
      expect(repository.actualizar).not.toHaveBeenCalled();
    });

    it('actualizar BLOQUEADO falla', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'BLOQUEADO' }));

      await expect(service.actualizar(1, { idMovimiento: 1, monto: 1 })).rejects.toThrow(/no puede modificarse/);
      expect(repository.actualizar).not.toHaveBeenCalled();
    });

    it('actualizar INCLUIDO_EN_PROCESO falla', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'INCLUIDO_EN_PROCESO' }));

      await expect(service.actualizar(1, { idMovimiento: 1, monto: 1 })).rejects.toThrow(/no puede modificarse/);
      expect(repository.actualizar).not.toHaveBeenCalled();
    });

    it('actualizar que generaria duplicado falla', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ idMovimiento: 1, estado: 'BORRADOR' }));
      repository.listarDuplicadosOperativos.mockResolvedValue([movBase({ idMovimiento: 2, estado: 'VALIDADO' })]);

      await expect(
        service.actualizar(1, {
          idMovimiento: 1,
          idPersona: 10,
          idConcepto: 20,
          periodo: '2026-05',
          monto: 1,
        }),
      ).rejects.toThrow(/operativo/);
      expect(repository.actualizar).not.toHaveBeenCalled();
    });

    it('actualizar pide duplicados excluyendo el propio id', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ idMovimiento: 5, estado: 'BORRADOR' }));
      repository.listarDuplicadosOperativos.mockResolvedValue([]);
      repository.actualizar.mockResolvedValue(movBase({ idMovimiento: 5 }));

      await service.actualizar(5, { idMovimiento: 5, monto: 200 });

      expect(repository.listarDuplicadosOperativos).toHaveBeenCalledWith(10, 20, '2026-05', 5);
    });
  });

  describe('anular', () => {
    it('anular BORRADOR permite y llama repositorio', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'BORRADOR' }));
      repository.anular.mockResolvedValue(movBase({ estado: 'ANULADO' }));

      const p: MovimientoVariableAnularPayload = { idMovimiento: 1, motivo: 'x' };
      await service.anular(1, p);

      expect(repository.anular).toHaveBeenCalledWith(1, p);
    });

    it('anular VALIDADO permite', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'VALIDADO' }));
      repository.anular.mockResolvedValue(movBase({ estado: 'ANULADO' }));

      await service.anular(1, { idMovimiento: 1 });

      expect(repository.anular).toHaveBeenCalled();
    });

    it('anular ANULADO falla', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'ANULADO' }));

      await expect(service.anular(1, { idMovimiento: 1 })).rejects.toThrow(/ya esta anulado/);
      expect(repository.anular).not.toHaveBeenCalled();
    });

    it('anular BLOQUEADO falla', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'BLOQUEADO' }));

      await expect(service.anular(1, { idMovimiento: 1 })).rejects.toThrow(/bloqueado/);
      expect(repository.anular).not.toHaveBeenCalled();
    });

    it('anular INCLUIDO_EN_PROCESO falla', async () => {
      repository.obtenerPorId.mockResolvedValue(movBase({ estado: 'INCLUIDO_EN_PROCESO' }));

      await expect(service.anular(1, { idMovimiento: 1 })).rejects.toThrow(/incluido en proceso/);
      expect(repository.anular).not.toHaveBeenCalled();
    });

    it('anular inexistente falla', async () => {
      repository.obtenerPorId.mockResolvedValue(null);

      await expect(service.anular(9, { idMovimiento: 9 })).rejects.toThrow(/No se encontr/);
      expect(repository.anular).not.toHaveBeenCalled();
    });

    it('el repositorio mock no expone delete fisico', () => {
      expect((repository as unknown as { delete?: unknown }).delete).toBeUndefined();
    });
  });
});
