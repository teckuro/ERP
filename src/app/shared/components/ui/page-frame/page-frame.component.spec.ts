import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageFrameComponent } from './page-frame.component';

@Component({
  standalone: true,
  imports: [PageFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-frame
      [eyebrow]="eyebrow"
      [title]="title"
      [subtitle]="subtitle"
      [density]="density"
      [tone]="tone"
    >
      <button pageFrameActions type="button" class="primary">Primaria</button>
      <div pageFrameSummary class="summary">resumen</div>
      <div pageFrameToolbar class="toolbar">toolbar</div>
      <p class="body">contenido</p>
      <footer pageFrameFooter class="footer">footer</footer>
    </app-page-frame>
  `,
})
class HostTestComponent {
  eyebrow: string | null = 'Remuneraciones';
  title: string | null = 'Administrador de nominas';
  subtitle: string | null = '3 borradores, 1 en revision';
  density: 'compact' | 'comfortable' = 'compact';
  tone: 'page' | 'workspace' = 'page';

  private readonly cdr = inject(ChangeDetectorRef);
  reflow(): void {
    this.cdr.markForCheck();
  }
}

function setupHost(overrides: Partial<HostTestComponent> = {}): ComponentFixture<HostTestComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [HostTestComponent] });
  const fixture = TestBed.createComponent(HostTestComponent);
  Object.assign(fixture.componentInstance, overrides);
  fixture.componentInstance.reflow();
  fixture.detectChanges();
  return fixture;
}

describe('PageFrameComponent', () => {
  it('renderiza eyebrow, title, subtitle y projecta actions', () => {
    const fixture = setupHost();
    const root = fixture.nativeElement as HTMLElement;
    const head = root.querySelector('.pf-head');

    expect(head).toBeTruthy();
    expect(head?.querySelector('.pf-head__eyebrow')?.textContent).toContain('Remuneraciones');
    expect(head?.querySelector('.pf-head__title')?.textContent).toContain('Administrador');
    expect(head?.querySelector('.pf-head__subtitle')?.textContent).toContain('borradores');
    expect(head?.querySelector('.pf-head__actions .primary')?.textContent).toContain('Primaria');
  });

  it('projecta summary, toolbar, contenido y footer', () => {
    const fixture = setupHost();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.summary')?.textContent).toContain('resumen');
    expect(root.querySelector('.toolbar')?.textContent).toContain('toolbar');
    expect(root.querySelector('.pf-body .body')?.textContent).toContain('contenido');
    expect(root.querySelector('.footer')?.textContent).toContain('footer');
  });

  it('refleja density y tone como atributos del host', () => {
    const fixture = setupHost({ density: 'comfortable', tone: 'workspace' });
    const host = fixture.nativeElement.querySelector('app-page-frame') as HTMLElement;
    expect(host.getAttribute('data-density')).toBe('comfortable');
    expect(host.getAttribute('data-tone')).toBe('workspace');
  });

  it('omite el header completo si no hay eyebrow, title ni subtitle', () => {
    const fixture = setupHost({ eyebrow: null, title: null, subtitle: null });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.pf-head')).toBeNull();
  });
});
