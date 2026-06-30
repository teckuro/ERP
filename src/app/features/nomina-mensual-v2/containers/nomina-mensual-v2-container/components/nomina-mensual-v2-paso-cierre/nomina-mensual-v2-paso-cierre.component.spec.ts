import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type {
  EstadoNomina,
  NominaPeriodo,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { crearNomina } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoCierreComponent } from './nomina-mensual-v2-paso-cierre.component';

function nominaMock(parcial: Partial<NominaPeriodo> = {}): NominaPeriodo {
  return crearNomina({
    id: 'np-1',
    periodo: '2026-06',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'cerrada',
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
  });
}

function configurarTestBed(servicio?: Partial<Record<string, ReturnType<typeof vi.fn>>>): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      {
        provide: NominaPeriodoService,
        useValue: {
          obtenerNomina: vi.fn().mockResolvedValue(null),
          obtenerResumenValidacionNomina: vi.fn().mockResolvedValue(null),
          cerrarNomina: vi.fn().mockResolvedValue(undefined),
          reabrirNomina: vi.fn().mockResolvedValue(undefined),
          ...servicio,
        },
      },
    ],
  });
}

describe('NominaMensualV2PasoCierreComponent (CIE-ENUM-01)', () => {
  beforeEach(() => {
    configurarTestBed();
  });

  it('traduce el enum interno a etiqueta RRHH legible', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
    const cmp = fixture.componentInstance;

    const casos: Array<[EstadoNomina, string]> = [
      ['borrador', 'Borrador'],
      ['dotacion_generada', 'Dotación lista'],
      ['en_revision', 'En revisión'],
      ['calculada', 'Calculada'],
      ['validada', 'Validada'],
      ['aprobada', 'Aprobada'],
      ['liquidada', 'Liquidada'],
      ['cerrada', 'Cerrada'],
      ['reabierta', 'Reabierta'],
      ['anulada', 'Anulada'],
    ];

    for (const [estado, esperado] of casos) {
      expect(cmp.estadoLabel(estado)).toBe(esperado);
    }
  });

  it('estadoLabel devuelve string vacío para null/undefined', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
    const cmp = fixture.componentInstance;

    expect(cmp.estadoLabel(null)).toBe('');
    expect(cmp.estadoLabel(undefined)).toBe('');
  });

  it('calculoNoVigente sólo se activa con versionCalculo>0 y calculoVigente=false', () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
    const cmp = fixture.componentInstance;

    cmp.nomina.set(nominaMock({ evidenciaCalculo: undefined }));
    expect(cmp.calculoNoVigente()).toBe(false);

    cmp.nomina.set(nominaMock({ evidenciaCalculo: { versionCalculo: 0, calculoVigente: false } }));
    expect(cmp.calculoNoVigente()).toBe(false);

    cmp.nomina.set(nominaMock({ evidenciaCalculo: { versionCalculo: 2, calculoVigente: true } }));
    expect(cmp.calculoNoVigente()).toBe(false);

    cmp.nomina.set(nominaMock({ evidenciaCalculo: { versionCalculo: 2, calculoVigente: false } }));
    expect(cmp.calculoNoVigente()).toBe(true);
    expect(cmp.versionCalculo()).toBe(2);
  });

  it('abrirReaperturaModal limpia motivo/error y muestra el message-box (QA-FOC-01)', () => {
    configurarTestBed();
    const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
    const cmp = fixture.componentInstance;

    cmp.motivoReapertura.set('texto previo');
    cmp.error.set('error previo');
    cmp.abrirReaperturaModal();

    expect(cmp.mostrarReabrir()).toBe(true);
    expect(cmp.motivoReapertura()).toBe('');
    expect(cmp.error()).toBeNull();
  });

  it('cancelarReapertura cierra el modal y respeta ejecutando', () => {
    configurarTestBed();
    const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
    const cmp = fixture.componentInstance;

    cmp.abrirReaperturaModal();
    cmp.motivoReapertura.set('motivo');
    cmp.cancelarReapertura();
    expect(cmp.mostrarReabrir()).toBe(false);
    expect(cmp.motivoReapertura()).toBe('');

    cmp.abrirReaperturaModal();
    cmp.ejecutando.set(true);
    cmp.cancelarReapertura();
    expect(cmp.mostrarReabrir()).toBe(true);
  });

  it('reabrirNomina exige motivo y refleja error si no hay', async () => {
    configurarTestBed();
    const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.abrirReaperturaModal();
    cmp.motivoReapertura.set('   ');
    await cmp.reabrirNomina();
    expect(cmp.error()).toContain('motivo');
  });

  describe('avanzar() — comando único (AG-NAV-03)', () => {
    it('retorna ok:false cuando la nómina ya está cerrada', async () => {
      configurarTestBed();
      const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(nominaMock({ estado: 'cerrada' }));

      const resultado = await cmp.avanzar();

      expect(resultado).toEqual({ ok: false, razon: 'La nómina ya está cerrada.' });
      expect(cmp.confirmarCierreVisible()).toBe(false);
    });

    it('retorna ok:false si la checklist está incompleta', async () => {
      configurarTestBed();
      const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(nominaMock({ estado: 'borrador', trabajadorIds: [] }));
      cmp.resumen.set({
        totalTrabajadores: 0,
        listosParaCalculo: 0,
        conIncidenciasCriticas: 0,
        conAdvertencias: 0,
        conMovimientosEspeciales: 0,
        puedeCalcular: false,
        puedeValidar: false,
        puedeCerrar: false,
        calculoVigente: false,
        incidenciasCriticas: [],
        advertencias: [],
      });

      const resultado = await cmp.avanzar();

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.razon).toMatch(/checklist/i);
      }
      expect(cmp.confirmarCierreVisible()).toBe(false);
    });

    it('abre el modal de confirmación y retorna hint pendiente cuando todoCumplido', async () => {
      configurarTestBed();
      const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
      const cmp = fixture.componentInstance;

      cmp.nomina.set(
        nominaMock({
          estado: 'aprobada',
          trabajadorIds: ['tr-1', 'tr-2'],
          evidenciaCalculo: {
            versionCalculo: 1,
            calculoVigente: true,
            idCalculoPeriodo: 42,
          },
        }),
      );
      cmp.resumen.set({
        totalTrabajadores: 2,
        listosParaCalculo: 2,
        conIncidenciasCriticas: 0,
        conAdvertencias: 0,
        conMovimientosEspeciales: 0,
        puedeCalcular: true,
        puedeValidar: true,
        puedeCerrar: true,
        calculoVigente: true,
        incidenciasCriticas: [],
        advertencias: [],
      });

      const resultado = await cmp.avanzar();

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.razon).toMatch(/confirma el cierre/i);
      }
      expect(cmp.confirmarCierreVisible()).toBe(true);
    });
  });

  describe('puedeContinuar() — validación pura', () => {
    it('retorna ok:false cuando la nómina ya está cerrada', () => {
      configurarTestBed();
      const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(nominaMock({ estado: 'cerrada' }));
      const r = cmp.puedeContinuar();
      expect(r.ok).toBe(false);
    });

    it('retorna ok:false si la checklist está incompleta (no abre modal)', () => {
      configurarTestBed();
      const fixture = TestBed.createComponent(NominaMensualV2PasoCierreComponent);
      const cmp = fixture.componentInstance;
      cmp.nomina.set(nominaMock({ estado: 'borrador', trabajadorIds: [] }));
      cmp.resumen.set({
        totalTrabajadores: 0,
        listosParaCalculo: 0,
        conIncidenciasCriticas: 0,
        conAdvertencias: 0,
        conMovimientosEspeciales: 0,
        puedeCalcular: false,
        puedeValidar: false,
        puedeCerrar: false,
        calculoVigente: false,
        incidenciasCriticas: [],
        advertencias: [],
      });
      const r = cmp.puedeContinuar();
      expect(r.ok).toBe(false);
      expect(cmp.confirmarCierreVisible()).toBe(false);
    });
  });
});
