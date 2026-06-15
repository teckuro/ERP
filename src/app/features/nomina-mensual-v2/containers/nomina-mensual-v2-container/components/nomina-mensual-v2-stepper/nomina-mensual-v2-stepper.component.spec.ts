import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LucideAngularModule, ArrowLeft, ArrowRight, Check, Clock3, Lock } from 'lucide-angular';
import { importProvidersFrom, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PayrollStep, PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import { AuthService } from '../../../../../../core/auth/auth.service';
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

function authMock(opts: { email?: string; fullName?: string } = {}): unknown {
  const user = {
    email: opts.email ?? 'rrhh@empresa.cl',
    user_metadata: opts.fullName ? { full_name: opts.fullName } : {},
  };
  return {
    currentUser: signal(user),
    currentEmail: signal(opts.email ?? 'rrhh@empresa.cl'),
    isAuthenticated: signal(true),
    isReady: signal(true),
  };
}

function configurar(authOverride?: unknown) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [NominaMensualV2StepperComponent],
    providers: [
      importProvidersFrom(LucideAngularModule.pick({ ArrowLeft, ArrowRight, Check, Clock3, Lock })),
      { provide: NominaMensualV2OrquestadorPort, useValue: orquestadorMock() },
      { provide: AuthService, useValue: authOverride ?? authMock({ fullName: 'Catalina Rojas', email: 'catalina@empresa.cl' }) },
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

describe('NominaMensualV2StepperComponent — aside con avatar y botón Volver (NOIA-STEPPER-USUARIO-01)', () => {
  beforeEach(() => configurar());

  it('en el primer paso no expone botón "Volver" porque pasoAnterior es null', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'parameters' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.detectChanges();

    expect(fixture.componentInstance.pasoAnterior()).toBeNull();
    expect(fixture.componentInstance.etiquetaPasoAnterior()).toBeNull();
    const boton = fixture.debugElement.query(By.css('.nmv2-stepper__back'));
    expect(boton).toBeNull();
  });

  it('en pasos posteriores expone botón solo-ícono con tooltip del sistema "Volver a [paso N-1]"', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'calculation' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.detectChanges();

    expect(fixture.componentInstance.pasoAnterior()).toBe('movements');
    expect(fixture.componentInstance.etiquetaPasoAnterior()).toBe('Volver a Movimientos');
    const boton = fixture.debugElement.query(By.css('.nmv2-stepper__back'));
    expect(boton).not.toBeNull();
    const nativo = boton.nativeElement as HTMLElement;
    // Sin `title` nativo: el tooltip se entrega vía <app-tooltip>.
    expect(nativo.getAttribute('title')).toBeNull();
    expect(nativo.getAttribute('aria-label')).toBe('Volver a Movimientos');
    // El botón debe estar envuelto por <app-tooltip text="Volver a ..." />.
    const tooltips = fixture.debugElement.queryAll(By.css('app-tooltip'));
    const tooltipBoton = tooltips.find((t) => t.query(By.css('.nmv2-stepper__back')));
    expect(tooltipBoton).toBeDefined();
    expect(
      (tooltipBoton?.componentInstance as { text?: string } | undefined)?.text,
    ).toBe('Volver a Movimientos');
    // El botón debe ser solo-ícono: sin texto visible al lado del lucide-icon
    expect(nativo.textContent?.trim() ?? '').toBe('');
    expect(boton.query(By.css('lucide-icon'))).not.toBeNull();
  });

  it('emite volverPasoAnterior con el paso N-1 al hacer click en el botón', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'movements' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.detectChanges();

    const eventos: PayrollStepId[] = [];
    fixture.componentInstance.volverPasoAnterior.subscribe((p) => eventos.push(p));

    fixture.componentInstance.emitirVolverPasoAnterior();
    expect(eventos).toEqual(['dotacion']);
  });

  it('expone iniciales del usuario activo derivadas de full_name', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'movements' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.detectChanges();

    expect(fixture.componentInstance.inicialesUsuario()).toBe('CR');
    expect(fixture.componentInstance.tooltipUsuario()).toBe('Catalina Rojas · catalina@empresa.cl');
  });

  it('cuando no hay full_name, las iniciales caen al local-part del email', () => {
    configurar(authMock({ email: 'jp@empresa.cl' }));
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'movements' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.detectChanges();

    expect(fixture.componentInstance.inicialesUsuario()).toBe('JP');
    expect(fixture.componentInstance.tooltipUsuario()).toBe('jp@empresa.cl');
  });

  it('cuando AuthService no provee usuario activo, el avatar muestra placeholder y sin tooltip', () => {
    configurar({
      currentUser: signal(null),
      currentEmail: signal(null),
      isAuthenticated: signal(false),
      isReady: signal(true),
    });
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'movements' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.detectChanges();

    expect(fixture.componentInstance.inicialesUsuario()).toBe('·');
    expect(fixture.componentInstance.tooltipUsuario()).toBeNull();
  });
});
