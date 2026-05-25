import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { EmpleadosRepository } from '../data-access/empleados.repository';
import { payloadUsuarioDependienteCompleto, payloadUsuarioHonorarios } from '../testing/empleado-payload.fixtures';
import { EmpleadosWriteService } from './empleados-write.service';

describe('EmpleadosWriteService.crear', () => {
  function buildRepositoryMock() {
    return {
      obtenerEmpresaIdParaContrato: vi.fn().mockResolvedValue(1),
      insertarPersona: vi.fn().mockResolvedValue(10),
      insertarContrato: vi.fn().mockResolvedValue(20),
      insertarRemuneracion: vi.fn().mockResolvedValue(undefined),
      insertarPrevision: vi.fn().mockResolvedValue(undefined),
      insertarSaludTrabajador: vi.fn().mockResolvedValue(undefined),
      insertarCuenta2Afp: vi.fn().mockResolvedValue(undefined),
      insertarSemanaCorrida: vi.fn().mockResolvedValue(undefined),
      insertarZonaExtrema: vi.fn().mockResolvedValue(undefined),
      reemplazarCondicionesTrabajador: vi.fn().mockResolvedValue(undefined),
      insertarApv: vi.fn().mockResolvedValue(undefined),
      insertarCuentaBancaria: vi.fn().mockResolvedValue(undefined),
      insertarContratoCentroCosto: vi.fn().mockResolvedValue(undefined),
      activarPersonaCreada: vi.fn().mockResolvedValue(undefined),
      obtenerCentroCostoNombre: vi.fn().mockResolvedValue('Operaciones'),
      rollbackCreacion: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('dependiente completo persiste todos los bloques en orden', async () => {
    const repository = buildRepositoryMock();
    TestBed.configureTestingModule({
      providers: [
        EmpleadosWriteService,
        { provide: EmpleadosRepository, useValue: repository },
      ],
    });
    const service = TestBed.inject(EmpleadosWriteService);
    const payload = payloadUsuarioDependienteCompleto();

    await service.crear(payload);

    expect(repository.insertarPersona).toHaveBeenCalledWith(payload, expect.any(Object));
    expect(repository.insertarContrato).toHaveBeenCalledWith(payload, 10, 1);
    expect(repository.insertarRemuneracion).toHaveBeenCalledWith(payload, 20);
    expect(repository.insertarPrevision).toHaveBeenCalledWith(payload, 20);
    expect(repository.insertarSaludTrabajador).toHaveBeenCalledWith(payload, 20);
    expect(repository.insertarCuenta2Afp).toHaveBeenCalledWith(payload, 20);
    expect(repository.insertarSemanaCorrida).toHaveBeenCalledWith(payload, 20);
    expect(repository.insertarZonaExtrema).toHaveBeenCalledWith(payload, 20);
    expect(repository.reemplazarCondicionesTrabajador).toHaveBeenCalledWith(10, 20, payload);
    expect(repository.insertarApv).toHaveBeenCalledWith(payload, 20);
    expect(repository.insertarCuentaBancaria).toHaveBeenCalledWith(payload, 10);
    expect(repository.insertarContratoCentroCosto).toHaveBeenCalledWith(payload, 20);
    expect(repository.activarPersonaCreada).toHaveBeenCalledWith(payload, 10);
    expect(repository.rollbackCreacion).not.toHaveBeenCalled();
  });

  it('honorarios omite bloques previsionales dependientes', async () => {
    const repository = buildRepositoryMock();
    TestBed.configureTestingModule({
      providers: [
        EmpleadosWriteService,
        { provide: EmpleadosRepository, useValue: repository },
      ],
    });
    const service = TestBed.inject(EmpleadosWriteService);
    const payload = payloadUsuarioHonorarios();

    await service.crear(payload);

    expect(repository.insertarPrevision).not.toHaveBeenCalled();
    expect(repository.insertarSaludTrabajador).not.toHaveBeenCalled();
    expect(repository.reemplazarCondicionesTrabajador).not.toHaveBeenCalled();
    expect(repository.insertarRemuneracion).toHaveBeenCalled();
    expect(repository.insertarCuentaBancaria).toHaveBeenCalled();
  });
});
