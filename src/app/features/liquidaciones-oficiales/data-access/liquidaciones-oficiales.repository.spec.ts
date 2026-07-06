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

  it('persiste estado revisión vía RPC cuando está disponible', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id_liquidacion_trabajador: 12,
        id_liquidacion_periodo: 1,
        id_calculo_periodo: 15,
        nombre_trabajador: 'Ana Pérez',
        estado_revision: 'autorizada',
        metadata: { estadoRevision: 'autorizada' },
        base_imponible: 0,
        base_tributable: 0,
        total_haberes: 0,
        total_descuentos: 0,
        total_aportes_empleador_referencia: 0,
        liquido_pagar: 0,
        observaciones: [],
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
    const result = await repository.actualizarEstadoRevisionTrabajador(12, 'autorizada');

    expect(rpc).toHaveBeenCalledWith('actualizar_estado_revision_liquidacion_trabajador', {
      p_id_liquidacion_trabajador: 12,
      p_estado_revision: 'autorizada',
    });
    expect(result.estadoRevision).toBe('autorizada');
    expect(result.idLiquidacionTrabajador).toBe(12);
  });

  it('hace fallback a UPDATE directo si la RPC no está desplegada', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id_liquidacion_trabajador: 12,
        id_liquidacion_periodo: 1,
        id_calculo_periodo: 15,
        nombre_trabajador: 'Ana Pérez',
        metadata: {},
        base_imponible: 0,
        base_tributable: 0,
        total_haberes: 0,
        total_descuentos: 0,
        total_aportes_empleador_referencia: 0,
        liquido_pagar: 0,
        observaciones: [],
      },
      error: null,
    });
    const updateChain = {
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single,
        }),
      }),
    };
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single }),
      }),
      update: vi.fn().mockReturnValue(updateChain),
    });
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' },
    });

    TestBed.configureTestingModule({
      providers: [
        LiquidacionesOficialesRepository,
        { provide: SUPABASE_CLIENT, useValue: { rpc, from } },
      ],
    });

    const repository = TestBed.inject(LiquidacionesOficialesRepository);
    const result = await repository.actualizarEstadoRevisionTrabajador(12, 'pago_registrado');

    expect(from).toHaveBeenCalledWith('nomina_liquidacion_trabajador');
    expect(result.nombreTrabajador).toBe('Ana Pérez');
  });

  it('registra emisión formal vía RPC emitir_liquidacion_trabajador', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id_liquidacion_emision: 99,
        id_liquidacion_trabajador: 12,
        id_liquidacion_periodo: 3,
        version_liquidacion: 2,
        usuario_id: 'user-1',
        usuario_label: 'rrhh@empresa.cl',
        canal: 'vista_oficial',
        emitido_en: '2026-07-05T12:00:00.000Z',
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
    const result = await repository.emitirLiquidacionTrabajador(12, 'vista_oficial', { origen: 'test' });

    expect(rpc).toHaveBeenCalledWith('emitir_liquidacion_trabajador', {
      p_id_liquidacion_trabajador: 12,
      p_canal: 'vista_oficial',
      p_metadata: { origen: 'test' },
    });
    expect(result.idLiquidacionEmision).toBe(99);
    expect(result.versionLiquidacion).toBe(2);
    expect(result.canal).toBe('vista_oficial');
  });
});
