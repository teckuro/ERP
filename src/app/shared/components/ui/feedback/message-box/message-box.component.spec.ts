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
