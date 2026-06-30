import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { MessageBoxComponent } from './message-box.component';

describe('MessageBoxComponent', () => {
  it('normaliza variant legacy error a danger', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.variant = 'error';
    expect(fixture.componentInstance.resolvedVariant()).toBe('danger');
    expect(fixture.componentInstance.resolvedEyebrow()).toBe('Error de guardado');
  });

  it('renderiza header neutro NOIA en modal', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.variant = 'decision';
    fixture.componentInstance.eyebrow = 'Decisión requerida';
    fixture.componentInstance.title = '¿Aplicar el ajuste?';
    fixture.componentInstance.message = 'Puede afectar la nómina del período activo.';
    fixture.componentInstance.primaryLabel = 'Aplicar ajuste';
    fixture.componentInstance.secondaryLabel = 'Mantener revisión';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.message-intent-line')).toBeNull();
    expect(el.querySelector('.message-category-dot')).toBeNull();
    expect(el.querySelector('.noia-msgbox__header')).not.toBeNull();
    expect(el.textContent).toContain('Decisión requerida');
    expect(el.textContent).toContain('¿Aplicar el ajuste?');
    expect(el.querySelector('.noia-msgbox__action--primary')?.textContent?.trim()).toBe(
      'Aplicar ajuste',
    );
  });

  it('mapea secciones estructuradas con tonos suaves', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.variant = 'warning';
    fixture.componentInstance.title = 'No se puede guardar el borrador';
    fixture.componentInstance.sections = [
      { title: 'Pendiente principal', text: 'Completar datos mínimos.', tone: 'attention' },
      { label: 'Por qué importa', body: 'Trazabilidad en bitácora.', tone: 'neutral' },
    ];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const sections = el.querySelectorAll('.noia-msgbox__section');
    expect(sections.length).toBe(2);
    expect(sections[0].classList.contains('noia-msgbox__section--attention')).toBe(true);
    expect(sections[0].textContent).toContain('Pendiente principal');
    expect(el.querySelector('.noia-msgbox__section ul')).toBeNull();
  });

  it('usa layout de dos bloques cuando hay dos secciones principales', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.title = 'Confirmar nómina';
    fixture.componentInstance.sections = [
      { title: 'Principal', text: 'Queda congelada.', tone: 'attention' },
      { title: 'Acción', text: 'Generar liquidaciones.', tone: 'info' },
    ];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.noia-msgbox__body--two-blocks')).not.toBeNull();
  });

  it('mantiene tres bloques en layout vertical compacto', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.title = 'Confirmar cierre';
    fixture.componentInstance.sections = [
      { title: 'Pendiente principal', text: 'Validar cierre.', tone: 'attention' },
      { title: 'Impacto operativo', text: 'Congela el período.', tone: 'neutral' },
      { title: 'Acción recomendada', text: 'Confirmar solo si está revisado.', tone: 'info' },
    ];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.noia-msgbox__section').length).toBe(3);
    expect(el.querySelector('.noia-msgbox__body--two-blocks')).toBeNull();
  });

  it('loading no renderiza acciones aunque se configuren labels', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.variant = 'loading';
    fixture.componentInstance.title = 'Calculando remuneraciones...';
    fixture.componentInstance.primaryLabel = 'Aceptar';
    fixture.componentInstance.sections = [{ title: 'Principal', text: 'No debe mostrarse como acción.' }];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.noia-msgbox__action')).toBeNull();
    expect(el.querySelector('.noia-msgbox--loading')).not.toBeNull();
  });

  it('incluye el cuerpo en aria-describedby cuando hay detalle o secciones', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.title = 'Confirmar acción';
    fixture.componentInstance.message = 'Mensaje principal.';
    fixture.componentInstance.detail = 'Detalle operativo visible.';
    fixture.componentInstance.sections = [
      { title: 'Impacto operativo', text: 'Queda en auditoría.', tone: 'neutral' },
    ];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('.noia-msgbox') as HTMLElement;
    const describedBy = dialog.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain(fixture.componentInstance.messageId);
    expect(describedBy).toContain(fixture.componentInstance.bodyId);
    expect(el.textContent).toContain('Detalle operativo visible.');
  });

  it('renderiza acciones configuradas con rol danger y emite primary', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.title = 'Descartar nómina';
    fixture.componentInstance.actions = [
      { label: 'Cancelar', value: 'secondary', role: 'secondary', align: 'left' },
      { label: 'Descartar', value: 'primary', role: 'danger', align: 'right' },
    ];
    let primary = 0;
    fixture.componentInstance.action.subscribe(() => primary++);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const danger = el.querySelector('.noia-msgbox__action--danger') as HTMLButtonElement;
    expect(danger.textContent?.trim()).toBe('Descartar');
    danger.click();
    expect(primary).toBe(1);
  });

  it('la X del modal emite secondary cuando hay acción de cierre', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.title = 'Confirmar';
    fixture.componentInstance.primaryLabel = 'Aplicar';
    fixture.componentInstance.secondaryLabel = 'Cerrar';
    let secondary = 0;
    fixture.componentInstance.secondary.subscribe(() => secondary++);
    fixture.detectChanges();

    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.noia-msgbox__close',
    ) as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    closeBtn.click();
    expect(secondary).toBe(1);
  });

  it('inline dismissible muestra icono X y emite dismiss', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'inline';
    fixture.componentInstance.variant = 'danger';
    fixture.componentInstance.message = 'Error operativo';
    fixture.componentInstance.dismissible = true;
    let dismissed = 0;
    fixture.componentInstance.dismiss.subscribe(() => dismissed++);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const closeBtn = el.querySelector('.noia-msgbox__close--inline') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    expect(closeBtn.getAttribute('aria-label')).toBe('Cerrar');
    closeBtn.click();
    expect(dismissed).toBe(1);
  });

  it('limita a tres bloques de decisión', () => {
    const fixture = TestBed.createComponent(MessageBoxComponent);
    fixture.componentInstance.mode = 'modal';
    fixture.componentInstance.sections = [
      { title: 'Uno', text: '1' },
      { title: 'Dos', text: '2' },
      { title: 'Tres', text: '3' },
      { title: 'Cuatro', text: '4' },
    ];
    fixture.detectChanges();
    expect(fixture.componentInstance.normalizedSections().length).toBe(3);
  });
});
