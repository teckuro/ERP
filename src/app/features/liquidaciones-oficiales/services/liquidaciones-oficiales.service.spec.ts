import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { LiquidacionesOficialesRepository } from '../data-access/liquidaciones-oficiales.repository';
import { LiquidacionesOficialesService } from './liquidaciones-oficiales.service';

describe('LiquidacionesOficialesService', () => {
  const snapshot = {
    idCalculoPeriodo: 15,
    periodo: '2026-04',
    idEmpresa: null,
    estado: 'preliminar',
    fechaGeneracion: '2026-05-10T10:00:00.000Z',
    usuarioGenerador: null,
    totalTrabajadores: 1,
    totalHaberes: 100,
    totalDescuentos: 20,
    totalLiquido: 80,
    totalBloqueados: 0,
    totalAdvertencias: 0,
    versionMotor: 'v1',
    hashSnapshot: 'abc',
    origen: 'preliminar',
    activo: true,
    reemplazadoPor: null,
    aprobacionOperativa: { estado: 'aprobado_operativamente', fecha: '', usuarioId: null, usuarioLabel: null, advertencias: [], metadata: {} },
    cierreOperativo: null,
    trabajadores: [],
    issues: [],
    trazabilidad: [],
  };

  let liquidaciones: {
    obtenerLiquidacionPeriodo: ReturnType<typeof vi.fn>;
    obtenerLiquidacionesTrabajadores: ReturnType<typeof vi.fn>;
    generarLiquidacionesOficiales: ReturnType<typeof vi.fn>;
    obtenerDetalleTrabajador: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    liquidaciones = {
      obtenerLiquidacionPeriodo: vi.fn().mockResolvedValue(null),
      obtenerLiquidacionesTrabajadores: vi.fn().mockResolvedValue([]),
      generarLiquidacionesOficiales: vi.fn().mockResolvedValue({
      idLiquidacionPeriodo: 1,
      idCalculoPeriodo: 15,
      periodo: '2026-04',
      estado: 'generada',
      fechaGeneracion: '',
      usuarioGeneracionLabel: null,
      totalTrabajadores: 1,
      totalHaberes: 100,
      totalDescuentos: 20,
      totalLiquido: 80,
      metadata: {},
      }),
      obtenerDetalleTrabajador: vi.fn().mockResolvedValue([]),
    };
    const snapshots = {
      obtenerSnapshotActivo: vi.fn().mockResolvedValue(snapshot),
    };

    TestBed.configureTestingModule({
      providers: [
        LiquidacionesOficialesService,
        { provide: LiquidacionesOficialesRepository, useValue: liquidaciones },
        { provide: NominaCalculoSnapshotRepository, useValue: snapshots },
      ],
    });
  });

  it('prevalida estado listo para generar sin recalcular', async () => {
    const service = TestBed.inject(LiquidacionesOficialesService);
    const estado = await service.consultarEstadoPeriodo('2026-04');
    expect(estado.estado).toBe('lista_para_generar');
    expect(estado.snapshot?.idCalculoPeriodo).toBe(15);
  });

  it('genera por RPC y recarga estado', async () => {
    const service = TestBed.inject(LiquidacionesOficialesService);
    await service.generarLiquidaciones('2026-04');
    expect(liquidaciones.generarLiquidacionesOficiales).toHaveBeenCalledWith(expect.objectContaining({
      idCalculoPeriodo: 15,
      periodo: '2026-04',
    }));
  });
});
