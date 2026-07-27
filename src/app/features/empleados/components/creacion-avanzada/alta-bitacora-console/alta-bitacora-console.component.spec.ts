import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaBitacoraConsoleComponent } from './alta-bitacora-console.component';
import type { VmConsolaBitacoraAlta } from '../../../models/empleado-alta-avanzada.vm';

function vmBase(overrides: Partial<VmConsolaBitacoraAlta> = {}): VmConsolaBitacoraAlta {
  return {
    visible: true,
    expandedByDefault: false,
    collapsedLabel: '2 pendientes · Bitácora',
    motivoPrincipal: 'General impide incluir al trabajador en nómina mensual.',
    faltantes: [
      {
        claveBloque: 'general',
        etiquetaBloque: 'General',
        mensaje: 'Continúa el alta avanzada antes de validar la ficha para remuneraciones.',
        severidad: 'critico',
      },
    ],
    registrosPendientes: [
      {
        stepIndex: 2,
        label: 'Contrato y organización',
        kind: 'pendiente',
        stateLabel: 'Pendiente de datos',
      },
    ],
    revisionesNormativas: [],
    pendientesCierre: [],
    totalVisible: 2,
    ...overrides,
  };
}

describe('AltaBitacoraConsoleComponent', () => {
  let fixture: ComponentFixture<AltaBitacoraConsoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaBitacoraConsoleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AltaBitacoraConsoleComponent);
  });

  it('no renderiza cuando visible es false', () => {
    fixture.componentRef.setInput('vm', vmBase({ visible: false }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alta-bitacora-console')).toBeNull();
  });

  it('colapsada no lleva clase expanded; toggle la activa', () => {
    fixture.componentRef.setInput('vm', vmBase({ expandedByDefault: false }));
    fixture.detectChanges();

    const host = fixture.nativeElement;
    const root = fixture.nativeElement.querySelector('.alta-bitacora-console');
    expect(host.classList.contains('alta-bitacora-console-host--expanded')).toBe(false);
    expect(root?.classList.contains('alta-bitacora-console--expanded')).toBe(false);
    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).toBeNull();

    (fixture.nativeElement.querySelector('.alta-bitacora-console__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.classList.contains('alta-bitacora-console-host--expanded')).toBe(true);
    expect(root?.classList.contains('alta-bitacora-console--expanded')).toBe(true);
    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).not.toBeNull();
  });

  it('expande por defecto cuando expandedByDefault es true', () => {
    fixture.componentRef.setInput('vm', vmBase({ expandedByDefault: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Pendientes del expediente');
  });

  it('emite navegarFaltante al pulsar un pendiente de expediente', () => {
    const vm = vmBase({ expandedByDefault: true });
    fixture.componentRef.setInput('vm', vm);
    fixture.detectChanges();

    const emitSpy = vi.fn();
    fixture.componentInstance.navegarFaltante.subscribe(emitSpy);

    const issueBtn = fixture.nativeElement.querySelector(
      '.alta-bitacora-console__issue',
    ) as HTMLButtonElement;
    issueBtn.click();

    expect(emitSpy).toHaveBeenCalledWith(vm.faltantes[0]);
  });

  it('no re-expande si el usuario colapsó y el vm se actualiza en resumen', () => {
    fixture.componentRef.setInput('vm', vmBase({ expandedByDefault: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).not.toBeNull();

    (fixture.nativeElement.querySelector('.alta-bitacora-console__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).toBeNull();

    fixture.componentRef.setInput(
      'vm',
      vmBase({
        expandedByDefault: true,
        collapsedLabel: '3 pendientes · Bitácora',
        totalVisible: 3,
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).toBeNull();
  });

  it('colapsa al salir del paso resumen (expandedByDefault pasa a false)', () => {
    fixture.componentRef.setInput('vm', vmBase({ expandedByDefault: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).not.toBeNull();

    fixture.componentRef.setInput('vm', vmBase({ expandedByDefault: false }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).toBeNull();
  });

  it('expande cuando cambia expandRequest', () => {
    fixture.componentRef.setInput('vm', vmBase({ expandedByDefault: false }));
    fixture.componentRef.setInput('expandRequest', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).toBeNull();

    fixture.componentRef.setInput('expandRequest', 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alta-bitacora-console__body')).not.toBeNull();
  });

  it('muestra revisiones normativas y emite aplicar', () => {
    const rev = {
      id: 'coherencia.coh.seguro.indefinido-inactivo',
      origen: 'coherencia' as const,
      stepIndex: 3,
      titulo: 'Seguro de Cesantía desactivado',
      detalle: 'Revisar contrato indefinido.',
      puedeAplicarCorreccion: true,
      bajoRevision: false,
      coherenciaIssueId: 'coh.seguro.indefinido-inactivo',
    };
    fixture.componentRef.setInput(
      'vm',
      vmBase({
        expandedByDefault: true,
        revisionesNormativas: [rev],
        totalVisible: 3,
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Revisiones normativas');

    const aplicarSpy = vi.fn();
    fixture.componentInstance.aplicarRevisionNormativa.subscribe(aplicarSpy);
    const applyBtn = fixture.nativeElement.querySelector(
      '.alta-bitacora-console__apply',
    ) as HTMLButtonElement;
    applyBtn.click();
    expect(aplicarSpy).toHaveBeenCalledWith(rev);
  });

  it('emite irAPendienteCierre al pulsar un pendiente de cierre', () => {
    const cierre = {
      id: 'contract.salary',
      mensaje: 'Ingresa un sueldo base válido para remuneraciones.',
      wizardStep: 3,
      controlPath: 'contrato.sueldoBase',
      fieldLabel: 'Sueldo base',
    };
    fixture.componentRef.setInput(
      'vm',
      vmBase({
        expandedByDefault: true,
        pendientesCierre: [cierre],
        totalVisible: 3,
      }),
    );
    fixture.detectChanges();

    const spy = vi.fn();
    fixture.componentInstance.irAPendienteCierre.subscribe(spy);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.alta-bitacora-console__issue'),
    ) as HTMLButtonElement[];
    const cierreBtn = buttons.find((btn) => btn.textContent?.includes('sueldo base'));
    expect(cierreBtn).toBeTruthy();
    cierreBtn!.click();
    expect(spy).toHaveBeenCalledWith(cierre);
  });

  it('emite revisarPaso al pulsar Revisar en bitácora', () => {
    fixture.componentRef.setInput('vm', vmBase({ expandedByDefault: true }));
    fixture.detectChanges();

    const emitSpy = vi.fn();
    fixture.componentInstance.revisarPaso.subscribe(emitSpy);

    const reviewBtn = fixture.nativeElement.querySelector(
      '.alta-bitacora-console__review',
    ) as HTMLButtonElement;
    reviewBtn.click();

    expect(emitSpy).toHaveBeenCalledWith(2);
  });
});
