import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { ResumenValidacionNomina } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { RAZON_VALIDACION_MODAL_PENDIENTE } from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2PasoValidacionComponent } from './nomina-mensual-v2-paso-validacion.component';

function resumenMock(parcial: Partial<ResumenValidacionNomina> = {}): ResumenValidacionNomina {
  return {
    totalTrabajadores: 10,
    listosParaCalculo: 10,
    conIncidenciasCriticas: 0,
    conAdvertencias: 0,
    conMovimientosEspeciales: 0,
    advertenciasPendientes: 0,
    puedeCalcular: true,
    puedeValidar: true,
    puedeCerrar: true,
    calculoVigente: true,
    incidenciasCriticas: [],
    advertencias: [],
    ...parcial,
  };
}

interface ServicioMock {
  obtenerResumenValidacionNomina: ReturnType<typeof vi.fn>;
  validarNomina: ReturnType<typeof vi.fn>;
  registrarDecisionIncidencia: ReturnType<typeof vi.fn>;
}

function configurarTestBed(resumen: ResumenValidacionNomina | null): ServicioMock {
  const servicio: ServicioMock = {
    obtenerResumenValidacionNomina: vi.fn().mockResolvedValue(resumen),
    validarNomina: vi.fn().mockResolvedValue(undefined),
    registrarDecisionIncidencia: vi.fn().mockResolvedValue(undefined),
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: NominaPeriodoService, useValue: servicio }],
  });
  return servicio;
}

describe('NominaMensualV2PasoValidacionComponent — avanzar() (AG-NAV-03 / F13)', () => {
  let servicio: ServicioMock;

  beforeEach(() => {
    servicio = configurarTestBed(resumenMock());
  });

  it('retorna ok:false mientras valida', async () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();
    cmp.validando.set(true);

    const resultado = await cmp.avanzar();

    expect(resultado).toEqual({ ok: false, razon: 'Validación en curso.' });
    expect(servicio.validarNomina).not.toHaveBeenCalled();
  });

  it('retorna ok:false si hay incidencias críticas pendientes', async () => {
    servicio = configurarTestBed(resumenMock({ conIncidenciasCriticas: 2, puedeValidar: false }));
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();

    const resultado = await cmp.avanzar();

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.razon).toMatch(/críticas|advertencias/i);
    }
    expect(servicio.validarNomina).not.toHaveBeenCalled();
  });

  it('abre confirmación y retorna modal pendiente cuando puede validar', async () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();

    const resultado = await cmp.avanzar();

    expect(resultado).toEqual({ ok: false, razon: RAZON_VALIDACION_MODAL_PENDIENTE });
    expect(cmp.confirmarValidacionVisible()).toBe(true);
    expect(servicio.validarNomina).not.toHaveBeenCalled();
  });

  it('confirmarValidacion ejecuta validarNomina y emite validacionCompletada', async () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();
    const emitSpy = vi.spyOn(cmp.validacionCompletada, 'emit');

    await cmp.confirmarValidacion();

    expect(servicio.validarNomina).toHaveBeenCalledWith('np-1');
    expect(emitSpy).toHaveBeenCalled();
    expect(cmp.confirmarValidacionVisible()).toBe(false);
  });

  it('retorna ok:false si el cálculo no está vigente', async () => {
    servicio = configurarTestBed(resumenMock({ calculoVigente: false }));
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();

    const resultado = await cmp.avanzar();

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.razon).toMatch(/no está vigente/i);
    }
    expect(servicio.validarNomina).not.toHaveBeenCalled();
  });

  describe('puedeContinuar() — validación pura', () => {
    it('retorna ok:true cuando puedeValidar y cálculo vigente', async () => {
      const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      await fixture.whenStable();
      expect(cmp.puedeContinuar()).toEqual({ ok: true });
    });

    it('retorna ok:false cuando el cálculo no está vigente', async () => {
      servicio = configurarTestBed(resumenMock({ calculoVigente: false }));
      const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
      fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
      const cmp = fixture.componentInstance;
      await fixture.whenStable();
      const r = cmp.puedeContinuar();
      expect(r.ok).toBe(false);
      expect(servicio.validarNomina).not.toHaveBeenCalled();
    });
  });
});
