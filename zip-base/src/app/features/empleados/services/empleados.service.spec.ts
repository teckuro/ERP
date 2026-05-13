import { TestBed } from '@angular/core/testing';

import { EmpleadosRepository } from '../data-access/empleados.repository';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { EmpleadosService } from './empleados.service';

describe('EmpleadosService', () => {
  let service: EmpleadosService;
  let repository: {
    validarFichaParaRemuneraciones: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      validarFichaParaRemuneraciones: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SUPABASE_CLIENT, useValue: {} },
        { provide: EmpleadosRepository, useValue: repository },
      ],
    });
    service = TestBed.inject(EmpleadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('delegates validarFichaParaRemuneraciones to repository', async () => {
    const payload = { estado: 'activo' } as CrearEmpleadoPayload;
    repository.validarFichaParaRemuneraciones.mockResolvedValue(null);

    await service.validarFichaParaRemuneraciones(7, payload);

    expect(repository.validarFichaParaRemuneraciones).toHaveBeenCalledWith(7, payload);
  });
});
