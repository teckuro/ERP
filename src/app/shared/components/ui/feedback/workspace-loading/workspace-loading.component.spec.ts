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
});
