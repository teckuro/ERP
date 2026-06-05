import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { ResumenValidacionNomina } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoValidacionComponent } from './nomina-mensual-v2-paso-validacion.component';

function resumenMock(parcial: Partial<ResumenValidacionNomina> = {}): ResumenValidacionNomina {
  return {
    totalTrabajadores: 10,
    listosParaCalculo: 10,
    conIncidenciasCriticas: 0,
    conAdvertencias: 0,
    conMovimientosEspeciales: 0,
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
  validarYAprobarNomina: ReturnType<typeof vi.fn>;
}

function configurarTestBed(resumen: ResumenValidacionNomina | null): ServicioMock {
  const servicio: ServicioMock = {
    obtenerResumenValidacionNomina: vi.fn().mockResolvedValue(resumen),
    validarYAprobarNomina: vi.fn().mockResolvedValue(undefined),
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: NominaPeriodoService, useValue: servicio }],
  });
  return servicio;
}

describe('NominaMensualV2PasoValidacionComponent — avanzar() (AG-NAV-03)', () => {
  let servicio: ServicioMock;

  beforeEach(() => {
    servicio = configurarTestBed(resumenMock());
  });

  it('retorna ok:false mientras está aprobando', async () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();
    cmp.aprobando.set(true);

    const resultado = await cmp.avanzar();

    expect(resultado).toEqual({ ok: false, razon: 'Aprobación en curso.' });
    expect(servicio.validarYAprobarNomina).not.toHaveBeenCalled();
  });

  it('retorna ok:false si hay incidencias críticas (no puedeAprobar)', async () => {
    servicio = configurarTestBed(resumenMock({ conIncidenciasCriticas: 2, puedeValidar: false }));
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();

    const resultado = await cmp.avanzar();

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.razon).toMatch(/incidencias críticas|no está lista/i);
    }
    expect(servicio.validarYAprobarNomina).not.toHaveBeenCalled();
  });

  it('ejecuta validarYAprobarNomina y retorna ok:true cuando puede aprobar', async () => {
    const fixture = TestBed.createComponent(NominaMensualV2PasoValidacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;
    await fixture.whenStable();

    const resultado = await cmp.avanzar();

    expect(resultado).toEqual({ ok: true });
    expect(servicio.validarYAprobarNomina).toHaveBeenCalledWith('np-1');
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
    expect(servicio.validarYAprobarNomina).not.toHaveBeenCalled();
  });
});
