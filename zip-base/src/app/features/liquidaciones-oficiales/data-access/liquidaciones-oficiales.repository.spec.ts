import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { LiquidacionesOficialesRepository } from './liquidaciones-oficiales.repository';

describe('LiquidacionesOficialesRepository', () => {
  it('llama RPC generar_liquidaciones_oficiales y mapea snake_case a camelCase', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id_liquidacion_periodo: 7,
        id_calculo_periodo: 15,
        periodo: '2026-04',
        estado: 'generada',
        fecha_generacion: '2026-05-10T10:00:00.000Z',
        usuario_generacion_label: 'rrhh@empresa.cl',
        total_trabajadores: 1,
        total_haberes: 100,
        total_descuentos: 20,
        total_liquido: 80,
        metadata: { origen: 'test' },
      },
      error: null,
    });

    TestBed.configureTestingModule({
      providers: [
        LiquidacionesOficialesRepository,
        { provide: SUPABASE_CLIENT, useValue: { rpc } },
      ],
    });

    const repository = TestBed.inject(LiquidacionesOficialesRepository);
    const result = await repository.generarLiquidacionesOficiales({
      idCalculoPeriodo: 15,
      periodo: '2026-04',
    });

    expect(rpc).toHaveBeenCalledWith('generar_liquidaciones_oficiales', {
      p_id_calculo_periodo: 15,
      p_periodo: '2026-04',
      p_metadata: {},
    });
    expect(result.idLiquidacionPeriodo).toBe(7);
    expect(result.totalLiquido).toBe(80);
  });

  it('maneja error RPC con mensaje operativo', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'duplicate key' } });
    TestBed.configureTestingModule({
      providers: [
        LiquidacionesOficialesRepository,
        { provide: SUPABASE_CLIENT, useValue: { rpc } },
      ],
    });

    const repository = TestBed.inject(LiquidacionesOficialesRepository);
    await expect(repository.generarLiquidacionesOficiales({
      idCalculoPeriodo: 15,
      periodo: '2026-04',
    })).rejects.toThrow('No se pudieron generar las liquidaciones oficiales. No se realizaron cambios parciales.');
  });
});
