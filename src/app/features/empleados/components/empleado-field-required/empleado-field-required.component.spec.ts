import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpleadoFieldRequiredComponent } from './empleado-field-required.component';

describe('EmpleadoFieldRequiredComponent', () => {
  let fixture: ComponentFixture<EmpleadoFieldRequiredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpleadoFieldRequiredComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmpleadoFieldRequiredComponent);
    fixture.detectChanges();
  });

  it('expone trigger accesible con etiqueta de obligatorio', () => {
    const trigger = fixture.nativeElement.querySelector(
      '.erp-field-help-tip__trigger--required',
    ) as HTMLButtonElement;

    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-label')).toBe('Campo obligatorio');
  });
});
