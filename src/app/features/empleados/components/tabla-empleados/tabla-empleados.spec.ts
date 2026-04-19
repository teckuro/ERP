import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaEmpleadosComponent } from './tabla-empleados';

describe('TablaEmpleadosComponent', () => {
  let component: TablaEmpleadosComponent;
  let fixture: ComponentFixture<TablaEmpleadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaEmpleadosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaEmpleadosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
