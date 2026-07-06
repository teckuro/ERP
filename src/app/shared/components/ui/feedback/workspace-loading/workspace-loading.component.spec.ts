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

  it('renderiza panel y mensaje', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.classList.contains('erp-workspace-loading--fill')).toBe(true);
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
});
