import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { NominaPeriodo } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoCalculoAdapterService } from '../../../../../nomina-mensual/services/nomina-periodo-calculo-adapter.service';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoCalculoComponent } from './nomina-mensual-v2-paso-calculo.component';

function nominaMock(parcial: Partial<NominaPeriodo> = {}): NominaPeriodo {
  return {
    id: 'np-1',
    periodo: '2026-06',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'calculada',
    segmentos: [],
    movimientos: [],
    incidencias: [],
    trabajadorIds: [],
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...parcial,
  };
}

function configurarTestBed(): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: NominaPeriodoService,
        useValue: {
          obtenerNomina: vi.fn().mockResolvedValue(null),
          obtenerResumenValidacionNomina: vi.fn().mockResolvedValue(null),
          registrarEventoAuditoria: vi.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: NominaPeriodoCalculoAdapterService,
        useValue: { calcular: vi.fn().mockResolvedValue({ resultado: null }) },
      },
    ],
  });
}

describe('NominaMensualV2PasoCalculoComponent (CAL-INV-05)', () => {
  beforeEach(() => {
    configurarTestBed();
  });

  it('no marca cálculo no vigente si la nómina no tiene evidencia', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(nominaMock({ evidenciaCalculo: undefined }));
    expect(cmp.calculoNoVigente()).toBe(false);
    expect(cmp.versionCalculo()).toBe(0);
  });

  it('no marca cálculo no vigente si versionCalculo es 0 (aún sin calcular)', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(
      nominaMock({ evidenciaCalculo: { versionCalculo: 0, calculoVigente: false } }),
    );
    expect(cmp.calculoNoVigente()).toBe(false);
  });

  it('no marca cálculo no vigente si calculoVigente es true', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(
      nominaMock({ evidenciaCalculo: { versionCalculo: 3, calculoVigente: true } }),
    );
    expect(cmp.calculoNoVigente()).toBe(false);
  });

  it('activa la banda de cálculo no vigente con version > 0 y calculoVigente = false', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(
      nominaMock({ evidenciaCalculo: { versionCalculo: 3, calculoVigente: false } }),
    );
    expect(cmp.calculoNoVigente()).toBe(true);
    expect(cmp.versionCalculo()).toBe(3);
  });

  describe('avanzar() — comando único (AG-NAV-03)', () => {
    it('retorna ok:false si no hay resultado de cálculo', async () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.resultado.set(null);

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({
        ok: false,
        razon: 'Procesa el cálculo antes de continuar.',
      });
    });

    it('retorna ok:false si el cálculo no está vigente', async () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(
        nominaMock({ evidenciaCalculo: { versionCalculo: 2, calculoVigente: false } }),
      );

      const resultado = await cmp.avanzar();

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.razon).toMatch(/no está vigente/i);
      }
    });

    it('retorna ok:true cuando hay resultado y el cálculo está vigente', async () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoCalculoComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(
        nominaMock({ evidenciaCalculo: { versionCalculo: 3, calculoVigente: true } }),
      );
      cmp.resultado.set({
        periodo: '2026-06',
        estado: 'calculada',
        generadoEn: '2026-06-01T00:00:00Z',
        resumen: {
          totalTrabajadoresCalculados: 0,
          totalLiquidoPreliminar: 0,
          totalImponible: 0,
          totalHaberes: 0,
          totalDescuentos: 0,
          totalPrevisional: 0,
          totalImpuestoUnico: 0,
        },
        liquidaciones: [],
        issues: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({ ok: true });
    });
  });
});
