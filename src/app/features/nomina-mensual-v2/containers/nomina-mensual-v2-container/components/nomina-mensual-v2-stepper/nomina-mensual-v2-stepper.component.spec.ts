import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LucideAngularModule, ArrowRight, Check, Clock3, Lock } from 'lucide-angular';
import { importProvidersFrom, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PayrollStep, PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { ORDEN_PASOS_NOMINA } from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2StepperComponent } from './nomina-mensual-v2-stepper.component';

function pasosBase(): PayrollStep[] {
  return ORDEN_PASOS_NOMINA.map((id, i) => ({
    id,
    number: i + 1,
    title: id,
    subtitle: '',
  }));
}

function orquestadorMock(): unknown {
  return {
    pasoActual: signal('parameters' as PayrollStepId),
    auditoriaPorPaso: signal({}),
    eventosTrazabilidad: signal([]),
  };
}

function configurar() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [NominaMensualV2StepperComponent],
    providers: [
      importProvidersFrom(LucideAngularModule.pick({ ArrowRight, Check, Clock3, Lock })),
      { provide: NominaMensualV2OrquestadorPort, useValue: orquestadorMock() },
    ],
  });
}

describe('NominaMensualV2StepperComponent — bloqueo por accesibilidad efectiva', () => {
  beforeEach(() => configurar());

  it('pasoNoAccesible es false cuando no se pasa indiceMaximoAccesible (default sin regresión)', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'parameters' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.detectChanges();
    expect(fixture.componentInstance.pasoNoAccesible('closure')).toBe(false);
  });

  it('pasoNoAccesible es true para pasos cuyo índice excede indiceMaximoAccesible', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'parameters' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.componentRef.setInput('indiceMaximoAccesible', 1); // hasta dotacion
    fixture.detectChanges();
    expect(fixture.componentInstance.pasoNoAccesible('parameters')).toBe(false);
    expect(fixture.componentInstance.pasoNoAccesible('dotacion')).toBe(false);
    expect(fixture.componentInstance.pasoNoAccesible('movements')).toBe(true);
    expect(fixture.componentInstance.pasoNoAccesible('closure')).toBe(true);
  });

  it('renderiza la clase nomina-step--locked y el icono lock para pasos inaccesibles', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'parameters' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.componentRef.setInput('indiceMaximoAccesible', 0); // solo parameters accesible
    fixture.detectChanges();

    const botones = fixture.debugElement.queryAll(By.css('button.nomina-step'));
    expect(botones.length).toBe(ORDEN_PASOS_NOMINA.length);
    // El primer paso (parameters) NO debe estar locked
    expect(botones[0].nativeElement.classList.contains('nomina-step--locked')).toBe(false);
    // Resto debe estar locked
    for (let i = 1; i < botones.length; i++) {
      expect(botones[i].nativeElement.classList.contains('nomina-step--locked')).toBe(true);
      expect(botones[i].nativeElement.hasAttribute('disabled')).toBe(true);
    }
  });

  it('seleccionarPaso ignora el click sobre pasos no accesibles', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'parameters' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.componentRef.setInput('indiceMaximoAccesible', 0);
    const eventos: PayrollStepId[] = [];
    fixture.componentInstance.pasoSeleccionado.subscribe((p) => eventos.push(p));
    fixture.detectChanges();

    fixture.componentInstance.seleccionarPaso('closure');
    expect(eventos).toEqual([]);

    fixture.componentInstance.seleccionarPaso('parameters');
    expect(eventos).toEqual(['parameters']);
  });

  it('tooltipPaso devuelve mensaje "Completa X" para pasos no accesibles', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'parameters' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.componentRef.setInput('indiceMaximoAccesible', 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.tooltipPaso('movements')).toBe('Completa Dotación para continuar.');
    expect(fixture.componentInstance.tooltipPaso('dotacion')).toBeNull();
  });
});
