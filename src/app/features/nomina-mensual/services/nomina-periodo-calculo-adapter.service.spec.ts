import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { NominaPeriodoService } from './nomina-periodo.service';
import { ProcesoMensualService } from './proceso-mensual.service';
import { NominaPeriodoCalculoAdapterService } from './nomina-periodo-calculo-adapter.service';

describe('NominaPeriodoCalculoAdapterService', () => {
  it('calcula solo la dotación seleccionada, guarda snapshot y registra totales', async () => {
    const nominas = {
      obtenerNomina: vi.fn().mockResolvedValue({
        id: 'nom-1',
        periodo: '2026-06',
        trabajadorIds: ['10', '11'],
      }),
      registrarCalculo: vi.fn().mockResolvedValue(undefined),
    };
    const resultado = {
      periodo: '2026-06',
      estado: 'LISTO',
      generadoEn: '2026-06-05T00:00:00Z',
      resumen: {
        totalTrabajadoresCalculados: 2,
        totalBloqueados: 0,
        totalConAdvertencias: 0,
        totalHaberes: 200,
        totalDescuentos: 50,
        totalLiquidoPreliminar: 150,
      },
      liquidaciones: [],
      issues: [],
    };
    const motor = {
      generarCalculoPeriodo: vi.fn().mockResolvedValue(resultado),
      guardarSnapshotPreliminar: vi.fn().mockResolvedValue({
        ok: true,
        snapshot: { idCalculoPeriodo: 77 },
        issues: [],
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        NominaPeriodoCalculoAdapterService,
        { provide: NominaPeriodoService, useValue: nominas },
        { provide: ProcesoMensualService, useValue: motor },
      ],
    });

    const servicio = TestBed.inject(NominaPeriodoCalculoAdapterService);
    await servicio.calcular('nom-1');

    expect(motor.generarCalculoPeriodo).toHaveBeenCalledWith('2026-06', [10, 11]);
    expect(nominas.registrarCalculo).toHaveBeenCalledWith('nom-1', {
      idCalculoPeriodo: 77,
      totalTrabajadores: 2,
      totalHaberes: 200,
      totalDescuentos: 50,
      totalLiquido: 150,
    });
  });
});
