import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LucideAngularModule, ArrowLeft, ArrowRight, Check, Clock3, Lock, TriangleAlert } from 'lucide-angular';
import { importProvidersFrom, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PayrollStep, PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { ORDEN_PASOS_NOMINA, MENSAJE_CALCULO_NO_VIGENTE } from '../../facade/nomina-mensual-v2-navegacion';
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
    abrirTrazabilidadPaso: () => undefined,
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
      importProvidersFrom(LucideAngularModule.pick({ ArrowLeft, ArrowRight, Check, Clock3, Lock, TriangleAlert })),
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
    const vistaMovements = fixture.componentInstance.vistasStepper().find((v) => v.clave === 'movements')!;
    const vistaDotacion = fixture.componentInstance.vistasStepper().find((v) => v.clave === 'dotacion')!;
    expect(fixture.componentInstance.tooltipPaso(vistaMovements)).toBe('Completa Dotación para continuar.');
    expect(fixture.componentInstance.tooltipPaso(vistaDotacion)).toBeNull();
  });
});

describe('NominaMensualV2StepperComponent — advertencia y bitácora por paso (NOIA-NMV2-REPAIR-11)', () => {
  beforeEach(() => configurar());

  it('renderiza triangle-alert en paso calculation con cálculo no vigente', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'closure' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.componentRef.setInput('nomina', {
      estado: 'validada',
      evidenciaCalculo: { versionCalculo: 2, calculoVigente: false },
    });
    fixture.detectChanges();

    const botones = fixture.debugElement.queryAll(By.css('button.nomina-step'));
    const indiceCalculo = ORDEN_PASOS_NOMINA.indexOf('calculation');
    const pasoCalculo = botones[indiceCalculo];
    expect(pasoCalculo.nativeElement.classList.contains('nomina-step--warning')).toBe(true);
    const icono = pasoCalculo.query(By.css('lucide-icon'));
    expect(icono).not.toBeNull();
    expect(icono.nativeElement.getAttribute('aria-label')).toBe('Revisión requerida');
  });

  it('tooltipPaso expone MENSAJE_CALCULO_NO_VIGENTE en advertencia', () => {
    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'closure' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.componentRef.setInput('nomina', {
      estado: 'validada',
      evidenciaCalculo: { versionCalculo: 2, calculoVigente: false },
    });
    fixture.detectChanges();

    const vistaCalculo = fixture.componentInstance.vistasStepper().find((v) => v.clave === 'calculation')!;
    expect(vistaCalculo.estado).toBe('advertencia');
    expect(fixture.componentInstance.tooltipPaso(vistaCalculo)).toBe(MENSAJE_CALCULO_NO_VIGENTE);
  });

  it('Ctrl+clic abre bitácora del paso cuando hay trazabilidad', () => {
    let pasoAbierto: PayrollStepId | null = null;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NominaMensualV2StepperComponent],
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ ArrowLeft, ArrowRight, Check, Clock3, Lock, TriangleAlert })),
        {
          provide: NominaMensualV2OrquestadorPort,
          useValue: {
            pasoActual: signal('movements' as PayrollStepId),
            auditoriaPorPaso: signal({
              dotacion: {
                paso: 'dotacion',
                estado: 'completado',
                usuarioNombre: 'Ana',
                usuarioId: 'u1',
                accionPrincipal: 'Dotación confirmada',
                fechaAccion: '2026-06-30T10:00:00Z',
                integridad: { estadoIntegridad: 'registrado' },
              },
            }),
            eventosTrazabilidad: signal([
              {
                idEvento: 'e1',
                paso: 'dotacion',
                descripcion: 'Dotación confirmada',
                usuarioNombre: 'Ana',
                fechaEvento: '2026-06-30',
                periodo: '2026-06',
                tipoEvento: 'EMPLEADOS_VALIDADOS',
                integridad: { estadoIntegridad: 'registrado' },
              },
            ]),
            abrirTrazabilidadPaso: (paso: PayrollStepId) => {
              pasoAbierto = paso;
            },
          },
        },
        { provide: AuthService, useValue: authMock() },
      ],
    });

    const fixture = TestBed.createComponent(NominaMensualV2StepperComponent);
    fixture.componentRef.setInput('pasoActual', 'movements' as PayrollStepId);
    fixture.componentRef.setInput('steps', pasosBase());
    fixture.componentRef.setInput('nomina', { estado: 'dotacion_confirmada' });
    const eventos: PayrollStepId[] = [];
    fixture.componentInstance.pasoSeleccionado.subscribe((p) => eventos.push(p));
    fixture.detectChanges();

    fixture.componentInstance.seleccionarPaso('dotacion', {
      ctrlKey: true,
      preventDefault: () => undefined,
    } as MouseEvent);
    expect(pasoAbierto).toBe('dotacion');
    expect(eventos).toEqual([]);
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
