import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChevronRight } from 'lucide-angular/src/icons';

import { NovedadesFormularioMovimientoMesComponent } from './novedades-formulario-movimiento-mes.component';

describe('NovedadesFormularioMovimientoMesComponent', () => {
  let fixture: ComponentFixture<NovedadesFormularioMovimientoMesComponent>;
  let component: NovedadesFormularioMovimientoMesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        LucideAngularModule.pick({ ChevronRight }),
        NovedadesFormularioMovimientoMesComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NovedadesFormularioMovimientoMesComponent);
    component = fixture.componentInstance;
    component.formulario = {
      idConcepto: null,
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
      monto: null,
      moneda: 'CLP',
      origen: 'manual',
      fechaEvento: '2026-07-01',
    };
    fixture.detectChanges();
  });

  it('renderiza grid de movimiento mensual', () => {
    expect(fixture.nativeElement.querySelector('.nfm-form__grid')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Concepto');
    expect(fixture.nativeElement.textContent).toContain('Fecha de referencia');
  });

  it('emite cambio de monto', () => {
    const spy = vi.spyOn(component.cambioCampo, 'emit');
    component.onMontoChange(50000);
    expect(spy).toHaveBeenCalledWith({ campo: 'monto', valor: 50000 });
  });

  it('muestra campo trabajador solo si mostrarTrabajador es true', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Trabajador');
    component.mostrarTrabajador = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Trabajador');
  });
});
