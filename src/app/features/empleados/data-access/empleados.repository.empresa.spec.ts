import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { EmpresaActivaService } from '../../../core/services/empresa-activa.service';
import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { EmpleadosRepository } from './empleados.repository';

function crearRepositorio(empresa: { idEmpresa: number } | null, motivo: string | null = null) {
  const from = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      EmpleadosRepository,
      { provide: SUPABASE_CLIENT, useValue: { from } },
      {
        provide: EmpresaActivaService,
        useValue: {
          asegurarCargada: vi.fn().mockResolvedValue(empresa),
          motivoSinEmpresa: () => motivo,
        },
      },
    ],
  });
  return { repository: TestBed.inject(EmpleadosRepository), from };
}

describe('EmpleadosRepository.obtenerEmpresaIdParaContrato', () => {
  it('usa la empresa activa de la sesión sin consultar la tabla empresa', async () => {
    const { repository, from } = crearRepositorio({ idEmpresa: 7 });

    await expect(repository.obtenerEmpresaIdParaContrato()).resolves.toBe(7);
    expect(from).not.toHaveBeenCalled();
  });

  it('falla con el motivo de la sesión si no hay empresa activa', async () => {
    const { repository } = crearRepositorio(null, 'No hay empresa asignada en tu sesión.');

    await expect(repository.obtenerEmpresaIdParaContrato()).rejects.toThrow(
      /No se encontro una empresa configurada para crear contratos\. No hay empresa asignada en tu sesión\./,
    );
  });
});
