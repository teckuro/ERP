import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceLoadingComponent } from './workspace-loading.component';

describe('WorkspaceLoadingComponent', () => {
  let fixture: ComponentFixture<WorkspaceLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceLoadingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceLoadingComponent);
    fixture.componentRef.setInput('message', 'Cargando ficha...');
    fixture.componentRef.setInput('fill', true);
    fixture.detectChanges();
  });

  it('renderiza panel y mensaje con fill de panel', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.classList.contains('erp-workspace-loading--fill')).toBe(true);
    expect(host.classList.contains('erp-workspace-loading--viewport')).toBe(false);
    expect(host.querySelector('.erp-workspace-loading__panel')?.textContent).toContain('Cargando ficha');
    expect(host.querySelector('.erp-workspace-loading__spinner')).toBeTruthy();
  });

  it('si hay title, muestra message como linea secundaria', () => {
    fixture.componentRef.setInput('title', 'Procesando');
    fixture.componentRef.setInput('message', 'Aplicando cambios...');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.erp-workspace-loading__title')?.textContent).toContain('Procesando');
    expect(host.querySelector('.erp-workspace-loading__message')?.textContent).toContain('Aplicando cambios');
  });

  it('scope viewport aplica overlay de pantalla completa', () => {
    fixture.componentRef.setInput('scope', 'viewport');
    fixture.componentRef.setInput('fill', false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('erp-workspace-loading--viewport')).toBe(true);
    expect(host.classList.contains('erp-workspace-loading--fill')).toBe(false);
    expect(host.classList.contains('erp-workspace-loading--shell')).toBe(false);
  });

  it('scope shell aplica overlay solo sobre el contenido ERP', () => {
    fixture.componentRef.setInput('scope', 'shell');
    fixture.componentRef.setInput('fill', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('erp-workspace-loading--shell')).toBe(true);
    expect(host.classList.contains('erp-workspace-loading--fill')).toBe(false);
    expect(host.classList.contains('erp-workspace-loading--viewport')).toBe(false);
  });
});
