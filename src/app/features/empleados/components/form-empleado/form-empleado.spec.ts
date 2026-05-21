import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { EMPTY_EMPLEADO_FORM_CATALOGOS } from '../../models/empleado-catalogos.model';
import { EmpleadosCatalogosService } from '../../services/empleados-catalogos.service';
import { EmpleadosService } from '../../services/empleados.service';
import { FormEmpleadoComponent } from './form-empleado';

describe('FormEmpleadoComponent - completitud de borrador avanzado', () => {
  async function setup(catalogos = EMPTY_EMPLEADO_FORM_CATALOGOS) {
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
            obtenerFormulario: vi.fn().mockResolvedValue(catalogos),
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
    const component = fixture.componentInstance;
    component.isLoadingCatalogs.set(false);
    return component;
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

    expect(component.pasoWizardActivo()).toBe(0);
    const modal = component.advancedActionModal();
    expect(modal?.kind).toBe('next-step-review');
    expect(modal?.primaryLabel).toBe('Continuar');
    expect(modal?.sections?.length).toBe(3);

    component.handleAdvancedActionModalPrimary();

    expect(component.advancedActionModal()).toBeNull();
    expect(component.pasoWizardActivo()).toBe(1);
  });

  it('Guardar borrador usa MsgBox cuando falta validacion minima', async () => {
    const component = await setup();

    await component.onGuardarBorrador();

    const modal = component.advancedActionModal();
    expect(modal?.kind).toBe('draft-invalid');
    expect(modal?.title).toBe('No se puede guardar el borrador');
    expect(modal?.sections?.length).toBe(3);
    expect(component.errorMessage()).toBeNull();
  });

  it('Finalizar alta usa MsgBox y no cambia de paso hasta elegir ir al bloqueo', async () => {
    const component = await setup();
    component.selectWizardStep(8);

    await component.onSubmit();

    expect(component.pasoWizardActivo()).toBe(8);
    expect(component.advancedActionModal()?.kind).toBe('finish-invalid');

    component.handleAdvancedActionModalPrimary();

    expect(component.advancedActionModal()).toBeNull();
    expect(component.pasoWizardActivo()).toBe(0);
  });


  it('Boleta de honorarios omite pasos laborales dependientes en la navegacion lineal', async () => {
    const component = await setup();

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');

    expect(component.linearWizardSequence()).toEqual([0, 1, 2, 3, 7, 9]);
    expect(component.wizardStepUiKind(4)).toBe('no-aplica');
    expect(component.wizardStepUiKind(5)).toBe('no-aplica');
    expect(component.wizardStepUiKind(6)).toBe('no-aplica');
  });

  it('Boleta de honorarios bloquea finalizar alta activa y ofrece guardar borrador', async () => {
    const component = await setup();

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');
    component.selectWizardStep(8);

    await component.onSubmit();

    expect(component.advancedActionModal()?.kind).toBe('honorarios-finish-blocked');
    expect(component.advancedActionModal()?.title).toBe('Guardar borrador de honorarios');
    expect(component.advancedActionModal()?.primaryLabel).toBe('Guardar como borrador');
    expect(component.advancedActionModal()?.secondaryLabel).toBe('Cerrar');
  });

  it('Boleta de honorarios usa accion final de borrador en el resumen', async () => {
    const component = await setup();

    expect(component.finalWizardActionLabel()).toBe('Finalizar alta');

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');

    expect(component.finalWizardActionLabel()).toBe('Guardar borrador');
  });

  it('Confirmar honorarios mueve una etapa no aplicable al siguiente paso util', async () => {
    const component = await setup();
    await component.ngOnInit();

    component.selectWizardStep(5);
    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');

    expect(component.advancedActionModal()?.kind).toBe('honorarios-confirm');

    component.handleAdvancedActionModalPrimary();

    expect(component.pasoWizardActivo()).toBe(7);
  });


  it('Siguiente muestra MsgBox de coherencia y permite activar seguro de cesantía', async () => {
    const component = await setup();
    component.selectWizardStep(3);
    component.form.patchValue({
      contrato: {
        tipoContrato: 'INDEFINIDO',
        idTipoJornada: 1,
        sueldoBase: 500000,
        idMoneda: 1,
        horasSemanales: 42,
        diasSemanales: 5,
        seguroCesantia: false,
      },
    } as never);

    component.goToNextTab();

    expect(component.advancedActionModal()?.kind).toBe('coherence-decision');
    expect(component.advancedActionModal()?.primaryLabel).toBe('Activar seguro de cesantía');

    component.handleAdvancedActionModalPrimary();

    expect(component.form.controls.contrato.controls.seguroCesantia.value).toBe(true);
    expect(component.pasoWizardActivo()).toBe(3);
  });

  it('Mantener revision de coherencia permite continuar sin cambiar el dato', async () => {
    const component = await setup();
    component.selectWizardStep(3);
    component.form.patchValue({
      contrato: {
        tipoContrato: 'INDEFINIDO',
        idTipoJornada: 1,
        sueldoBase: 500000,
        idMoneda: 1,
        horasSemanales: 42,
        diasSemanales: 5,
        seguroCesantia: false,
      },
    } as never);

    component.goToNextTab();
    component.handleAdvancedActionModalSecondary();

    expect(component.form.controls.contrato.controls.seguroCesantia.value).toBe(false);
    expect(component.pasoWizardActivo()).toBe(4);
    expect(component.coherenciaResumenItems()).toContain('Seguro de Cesantía desactivado en contrato indefinido.');
  });

  it('sincroniza tipo trabajador base desde relacion laboral', async () => {
    const component = await setup({
      ...EMPTY_EMPLEADO_FORM_CATALOGOS,
      tiposTrabajador: [
        { value: 1, label: 'DEPENDIENTE' },
        { value: 2, label: 'INDEPENDIENTE' },
      ],
    });

    await component.ngOnInit();

    expect(component.form.controls.contrato.controls.idTipoTrabajador.value).toBe(1);

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');

    expect(component.form.controls.contrato.controls.idTipoTrabajador.value).toBe(2);
    expect(component.advancedActionModal()?.kind).toBe('honorarios-confirm');

    component.handleAdvancedActionModalSecondary();

    expect(component.form.controls.contrato.controls.relacionLaboral.value).toBe('CONTRATO');
    expect(component.form.controls.contrato.controls.idTipoTrabajador.value).toBe(1);
  });
});
