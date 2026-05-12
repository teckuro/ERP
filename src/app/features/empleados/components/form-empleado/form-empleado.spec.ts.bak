import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { EMPTY_EMPLEADO_FORM_CATALOGOS } from '../../models/empleado-catalogos.model';
import { EmpleadosCatalogosService } from '../../services/empleados-catalogos.service';
import { EmpleadosService } from '../../services/empleados.service';
import { FormEmpleadoComponent } from './form-empleado';

describe('FormEmpleadoComponent - completitud de borrador avanzado', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [FormEmpleadoComponent],
      providers: [
        {
          provide: EmpleadosService,
          useValue: {
            obtenerPorId: vi.fn(),
            guardarBorradorAvanzado: vi.fn(),
            finalizarAltaAvanzadaExistente: vi.fn(),
            crear: vi.fn(),
            crearBasico: vi.fn(),
          },
        },
        {
          provide: EmpleadosCatalogosService,
          useValue: {
            obtenerFormulario: vi.fn().mockResolvedValue(EMPTY_EMPLEADO_FORM_CATALOGOS),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: vi.fn().mockReturnValue(null),
              },
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FormEmpleadoComponent);
    return fixture.componentInstance;
  }

  it('cargo Sin cargo no completa el paso Contrato y organizacion', async () => {
    const component = await setup();
    component.form.patchValue({
      contrato: {
        cargo: 'Sin cargo',
        idSucursal: 1,
        tipoContrato: 'INDEFINIDO',
        fechaIngreso: '2026-05-02',
        fechaContrato: '2026-05-02',
      },
    } as never);

    const summary = component.getWizardStepValidationSummary(2);

    expect(summary.blockingPending).toBeGreaterThan(0);
    expect(component.wizardStepUiKind(2)).toBe('pendiente');
    expect(component.cargoVisible()).toBe('Sin informacion');
  });

  it('sueldo base cero no completa Jornada y remuneracion', async () => {
    const component = await setup();
    component.form.patchValue({
      contrato: {
        idTipoTrabajador: 1,
        idTipoJornada: 1,
        sueldoBase: 0,
        idMoneda: 1,
        horasSemanales: 45,
        diasSemanales: 5,
      },
    } as never);

    const summary = component.getWizardStepValidationSummary(3);

    expect(summary.blockingPending).toBeGreaterThan(0);
    expect(component.wizardStepUiKind(3)).toBe('pendiente');
  });

  it('jornada semanal parte pendiente y no usa 45 como default tecnico', async () => {
    const component = await setup();

    expect(component.form.controls.contrato.controls.horasSemanales.value).toBeNull();
    expect(component.getWizardStepValidationSummary(3).blockingPending).toBeGreaterThan(0);
  });

  it('cuenta DRAFT no completa el paso Bancario', async () => {
    const component = await setup();
    component.form.patchValue({
      bancario: {
        idBanco: 1,
        idTipoCuentaBancaria: 1,
        numeroCuenta: 'DRAFT-ABC123',
      },
    } as never);

    const summary = component.getWizardStepValidationSummary(7);

    expect(summary.blockingPending).toBeGreaterThan(0);
    expect(component.wizardStepUiKind(7)).toBe('pendiente');
  });

  it('Siguiente muestra MsgBox de revision cuando el paso tiene pendientes y permite continuar', async () => {
    const component = await setup();

    component.goToNextTab();

    expect(component.activeWizardStep()).toBe(0);
    expect(component.advancedActionModal()?.kind).toBe('next-step-review');
    expect(component.advancedActionModal()?.primaryLabel).toBe('Continuar');

    component.handleAdvancedActionModalPrimary();

    expect(component.advancedActionModal()).toBeNull();
    expect(component.activeWizardStep()).toBe(1);
  });

  it('Guardar borrador usa MsgBox cuando falta validacion minima', async () => {
    const component = await setup();

    await component.onGuardarBorrador();

    expect(component.advancedActionModal()?.kind).toBe('draft-invalid');
    expect(component.advancedActionModal()?.title).toBe('No se puede guardar el borrador');
    expect(component.errorMessage()).toBeNull();
  });

  it('Finalizar alta usa MsgBox y no cambia de paso hasta elegir ir al bloqueo', async () => {
    const component = await setup();
    component.selectWizardStep(8);

    await component.onSubmit();

    expect(component.activeWizardStep()).toBe(8);
    expect(component.advancedActionModal()?.kind).toBe('finish-invalid');

    component.handleAdvancedActionModalPrimary();

    expect(component.advancedActionModal()).toBeNull();
    expect(component.activeWizardStep()).toBe(0);
  });

});
