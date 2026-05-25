import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { EMPTY_EMPLEADO_FORM_CATALOGOS, type EmpleadoFormCatalogos } from '../../models/empleado-catalogos.model';
import { EmpleadosCatalogosService } from '../../services/empleados-catalogos.service';
import { EmpleadosService } from '../../services/empleados.service';
import { ShellPageContextService } from '../../../../layout/shell-page-context.service';
import { FormEmpleadoComponent } from './form-empleado';

describe('FormEmpleadoComponent - completitud de borrador avanzado', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  function catalogoMinimoBorrador(): EmpleadoFormCatalogos {
    return {
      ...EMPTY_EMPLEADO_FORM_CATALOGOS,
      tiposTrabajador: [{ value: 10, label: 'Dependiente' }],
      tiposJornada: [{ value: 20, label: 'Completa' }],
      paises: [{ value: 1, label: 'Chile' }],
      comunas: [{ value: 100, label: 'Santiago' }],
      bancos: [{ value: 5, label: 'Banco Test' }],
      tiposCuentaBancaria: [{ value: 6, label: 'Corriente' }],
      regimenesPrevisionales: [{ value: 202, label: 'NINGUNA' }],
    };
  }

  async function setup(catalogos = EMPTY_EMPLEADO_FORM_CATALOGOS) {
    const queryParamMapGet = vi.fn().mockReturnValue(null);
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
                get: queryParamMapGet,
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
    component.cargandoCatalogos.set(false);
    component.modo.set('avanzado');
    return component;
  }

  async function setupFixture(options: { modo?: 'basico' | 'avanzado' } = {}) {
    const queryParamMapGet = vi.fn((key: string) => {
      if (key === 'modo' && options.modo === 'basico') return 'basico';
      return null;
    });
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
              queryParamMap: { get: queryParamMapGet },
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
            url: '/empleados/nuevo',
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FormEmpleadoComponent);
    const component = fixture.componentInstance;
    component.cargandoCatalogos.set(false);
    component.modo.set(options.modo === 'basico' ? 'basico' : 'avanzado');
    fixture.detectChanges();
    return { fixture, component, shell: TestBed.inject(ShellPageContextService) };
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

    const summary = component.obtenerResumenValidacionPasoAsistente(2);

    expect(summary.blockingPending).toBeGreaterThan(0);
    expect(component.tipoUiPasoAsistente(2)).toBe('pendiente');
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

    const summary = component.obtenerResumenValidacionPasoAsistente(3);

    expect(summary.blockingPending).toBeGreaterThan(0);
    expect(component.tipoUiPasoAsistente(3)).toBe('pendiente');
  });

  it('jornada semanal parte pendiente y no usa 45 como default tecnico', async () => {
    const component = await setup();

    expect(component.form.controls.contrato.controls.horasSemanales.value).toBeNull();
    expect(component.obtenerResumenValidacionPasoAsistente(3).blockingPending).toBeGreaterThan(0);
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

    const summary = component.obtenerResumenValidacionPasoAsistente(7);

    expect(summary.blockingPending).toBeGreaterThan(0);
    expect(component.tipoUiPasoAsistente(7)).toBe('pendiente');
  });

  it('publica Guardar borrador en el shell durante la bitacora avanzada', async () => {
    const { shell } = await setupFixture();

    expect(shell.primaryAction()?.label).toBe('Guardar borrador');
    expect(shell.primaryAction()?.actionId).toBe('empleado-alta-avanzada-guardar');
  });

  it('el CTA del shell guarda borrador fuera del resumen', async () => {
    const { component, shell } = await setupFixture();
    const guardarSpy = vi.spyOn(component, 'onGuardarBorrador').mockResolvedValue();

    shell.invokePrimaryAction();

    expect(guardarSpy).toHaveBeenCalled();
  });

  it('en resumen dependiente el CTA del shell finaliza alta', async () => {
    const { component, fixture, shell } = await setupFixture();
    const submitSpy = vi.spyOn(component, 'enviarFormulario').mockResolvedValue();

    component.seleccionarPasoAsistente(component.indicePasoResumenAsistente());
    fixture.detectChanges();
    shell.invokePrimaryAction();

    expect(shell.primaryAction()?.label).toBe('Finalizar alta');
    expect(submitSpy).toHaveBeenCalled();
  });

  it('en resumen de honorarios el CTA del shell finaliza honorarios', async () => {
    const { component, fixture, shell } = await setupFixture();
    const submitSpy = vi.spyOn(component, 'enviarFormulario').mockResolvedValue();

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');
    component.seleccionarPasoAsistente(component.indicePasoResumenAsistente());
    fixture.detectChanges();
    shell.invokePrimaryAction();

    expect(shell.primaryAction()?.label).toBe('Finalizar honorarios');
    expect(submitSpy).toHaveBeenCalled();
  });

  it('publica CTA de borrador en creacion basica', async () => {
    const { shell } = await setupFixture({ modo: 'basico' });

    expect(shell.primaryAction()).toMatchObject({
      label: 'Guardar borrador',
      disabled: true,
      loading: false,
      actionId: 'empleado-alta-basica-guardar-borrador',
    });
  });

  it('no renderiza acciones locales duplicadas en la cabecera avanzada ni en resumen', async () => {
    const { component, fixture } = await setupFixture();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="guardar-borrador-avanzado"]')).toBeNull();

    component.seleccionarPasoAsistente(component.indicePasoResumenAsistente());
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="finalizar-alta"]')).toBeNull();
  });

  it('Siguiente muestra MsgBox de revision cuando el paso tiene pendientes y permite continuar', async () => {
    const component = await setup();

    component.irAPestanaSiguiente();

    expect(component.pasoWizardActivo()).toBe(0);
    const modal = component.modalAccionAvanzada();
    expect(modal?.kind).toBe('next-step-review');
    expect(modal?.primaryLabel).toBe('Continuar');
    expect(modal?.sections?.length).toBe(3);

    component.manejarPrimariaModalAccionAvanzada();

    expect(component.modalAccionAvanzada()).toBeNull();
    expect(component.pasoWizardActivo()).toBe(1);
  });

  it('Siguiente muestra pendientes obligatorios por campo dentro del modal', async () => {
    const { component, fixture } = await setupFixture();

    component.irAPestanaSiguiente();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const modal = component.modalAccionAvanzada();
    expect(modal?.kind).toBe('next-step-review');
    expect(modal?.fieldItems?.length).toBeGreaterThan(1);
    expect(modal?.fieldItems?.[0]).toMatchObject({
      sectionTitle: 'Identificacion legal',
      actionLabel: 'Ir al campo',
      controlPath: 'datosPersonales.rut',
    });
    expect(modal?.fieldItems?.[0]?.detail).toBe('Ingresa un RUT valido antes de activar la ficha.');
  });

  it('accion de pendiente del modal navega al paso y cierra el modal', async () => {
    const { component } = await setupFixture();
    component.seleccionarPasoAsistente(component.indicePasoResumenAsistente());

    await component.enviarFormulario();

    const bankItem = component
      .modalAccionAvanzada()
      ?.fieldItems?.find((item) => item.controlPath === 'bancario.idBanco');
    expect(bankItem).toBeTruthy();

    component.manejarItemCampoModalAvanzada(bankItem!);

    expect(component.modalAccionAvanzada()).toBeNull();
    expect(component.pasoWizardActivo()).toBe(7);
  });

  it('Guardar borrador usa MsgBox cuando falta validacion minima', async () => {
    const component = await setup();

    await component.onGuardarBorrador();

    const modal = component.modalAccionAvanzada();
    expect(modal?.kind).toBe('draft-invalid');
    expect(modal?.title).toBe('No se puede guardar el borrador');
    expect(modal?.sections?.length).toBe(3);
    expect(component.mensajeError()).toBeNull();
  });

  it('Guardar borrador persiste el mayor paso visitado aunque el activo sea el primero', async () => {
    const component = await setup(catalogoMinimoBorrador());
    component.modo.set('avanzado');
    component.catalogos.set(catalogoMinimoBorrador());
    const empleadosService = TestBed.inject(EmpleadosService) as unknown as {
      guardarBorradorAvanzado: ReturnType<typeof vi.fn>;
    };
    empleadosService.guardarBorradorAvanzado.mockResolvedValue({
      id: 123,
      pasoAltaAvanzada: 7,
    });
    component.form.patchValue({
      datosPersonales: {
        rut: '12.345.678-5',
        nombres: 'Test',
        apellidoPaterno: 'Borrador',
        fechaNacimiento: '1990-01-01',
        sexo: 'F',
        estadoCivil: 'SOLTERO',
        idPais: 1,
      },
      contacto: {
        email: 'borrador@test.cl',
        telefono: '56912345678',
      },
    } as never);

    component.seleccionarPasoAsistente(7);
    component.seleccionarPasoAsistente(0);
    await component.onGuardarBorrador();

    expect(empleadosService.guardarBorradorAvanzado).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ rut: '12.345.678-5', estado: 'borrador' }),
      7,
    );
  });

  it('Finalizar alta usa MsgBox y no cambia de paso hasta elegir ir al bloqueo', async () => {
    const component = await setup();
    component.seleccionarPasoAsistente(8);

    await component.enviarFormulario();

    expect(component.pasoWizardActivo()).toBe(8);
    expect(component.modalAccionAvanzada()?.kind).toBe('finish-invalid');

    component.manejarPrimariaModalAccionAvanzada();

    expect(component.modalAccionAvanzada()).toBeNull();
    expect(component.pasoWizardActivo()).toBe(0);
  });

  it('Finalizar alta lista bloqueos de distintas secciones como campos accionables', async () => {
    const { component, fixture } = await setupFixture();
    component.seleccionarPasoAsistente(component.indicePasoResumenAsistente());

    await component.enviarFormulario();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const modal = component.modalAccionAvanzada();
    const sectionTitles = new Set(
      modal?.fieldItems?.map((item) => item.sectionTitle) ?? [],
    );
    expect(modal?.kind).toBe('finish-invalid');
    expect(modal?.fieldItems?.length).toBeGreaterThan(5);
    expect(sectionTitles.size).toBeGreaterThan(1);
    expect(modal?.sections?.[0]?.items ?? []).not.toContain('Además hay');
  });


  it('Boleta de honorarios omite pasos laborales dependientes en la navegacion lineal', async () => {
    const component = await setup();

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');

    expect(component.secuenciaLinealAsistente()).toEqual([0, 1, 2, 3, 7, 9]);
    expect(component.tipoUiPasoAsistente(4)).toBe('no-aplica');
    expect(component.tipoUiPasoAsistente(5)).toBe('no-aplica');
    expect(component.tipoUiPasoAsistente(6)).toBe('no-aplica');
  });

  it('Boleta de honorarios incompleta bloquea finalizacion sin modal de borrador', async () => {
    const component = await setup();

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');
    component.seleccionarPasoAsistente(8);

    await component.enviarFormulario();

    expect(component.modalAccionAvanzada()?.kind).toBe('finish-invalid');
    expect(component.modalAccionAvanzada()?.primaryAction).toBe('focus-first-blocking');
  });

  it('Boleta de honorarios usa accion final propia en el resumen', async () => {
    const component = await setup();

    expect(component.etiquetaAccionFinalAsistente()).toBe('Finalizar alta');

    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');

    expect(component.etiquetaAccionFinalAsistente()).toBe('Finalizar honorarios');
  });

  it('Confirmar honorarios mueve una etapa no aplicable al siguiente paso util', async () => {
    const component = await setup();
    await component.ngOnInit();

    component.seleccionarPasoAsistente(5);
    component.form.controls.contrato.controls.relacionLaboral.setValue('HONORARIOS');

    expect(component.modalAccionAvanzada()?.kind).toBe('honorarios-confirm');

    component.manejarPrimariaModalAccionAvanzada();

    expect(component.pasoWizardActivo()).toBe(7);
  });


  it('Siguiente muestra MsgBox de coherencia y permite activar seguro de cesantía', async () => {
    const component = await setup();
    component.seleccionarPasoAsistente(3);
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

    component.irAPestanaSiguiente();

    expect(component.modalAccionAvanzada()?.kind).toBe('coherence-decision');
    expect(component.modalAccionAvanzada()?.primaryLabel).toBe('Activar seguro de cesantía');

    component.manejarPrimariaModalAccionAvanzada();

    expect(component.form.controls.contrato.controls.seguroCesantia.value).toBe(true);
    expect(component.pasoWizardActivo()).toBe(3);
  });

  it('Mantener revision de coherencia permite continuar sin cambiar el dato', async () => {
    const component = await setup();
    component.seleccionarPasoAsistente(3);
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

    component.irAPestanaSiguiente();
    component.manejarSecundariaModalAccionAvanzada();

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
    expect(component.modalAccionAvanzada()?.kind).toBe('honorarios-confirm');

    component.manejarSecundariaModalAccionAvanzada();

    expect(component.form.controls.contrato.controls.relacionLaboral.value).toBe('CONTRATO');
    expect(component.form.controls.contrato.controls.idTipoTrabajador.value).toBe(1);
  });
});

describe('FormEmpleadoComponent - consola bitácora pendientes', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  async function setupAvanzado() {
    const queryParamMapGet = vi.fn().mockReturnValue(null);
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
            snapshot: { queryParamMap: { get: queryParamMapGet } },
          },
        },
        {
          provide: Router,
          useValue: { navigate: vi.fn(), url: '/empleados/nuevo' },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FormEmpleadoComponent);
    const component = fixture.componentInstance;
    component.cargandoCatalogos.set(false);
    component.modo.set('avanzado');
    return { fixture, component };
  }

  it('altaBitacoraConsoleVm une faltantes de expediente y registros pendientes', async () => {
    const { component } = await setupAvanzado();
    component.form.patchValue({
      contrato: {
        cargo: 'Sin cargo',
        sueldoBase: 0,
        horasSemanales: 45,
        diasSemanales: 5,
        idMoneda: 1,
      },
    } as never);

    const vm = component.altaBitacoraConsoleVm();

    expect(vm.visible).toBe(true);
    expect(vm.totalVisible).toBeGreaterThan(0);
    expect(vm.faltantes.length).toBeGreaterThan(0);
    expect(vm.registrosPendientes.length).toBeGreaterThan(0);
    expect(vm.revisionesNormativas.length).toBeGreaterThan(0);
  });

  it('altaBitacoraConsoleVm expande por defecto en paso resumen con pendientes', async () => {
    const { component } = await setupAvanzado();
    component.form.patchValue({
      contrato: {
        cargo: 'Sin cargo',
        sueldoBase: 0,
        horasSemanales: 45,
        diasSemanales: 5,
        idMoneda: 1,
      },
    } as never);

    component.seleccionarPasoAsistente(component.indicePasoResumenAsistente());
    const vm = component.altaBitacoraConsoleVm();

    expect(vm.expandedByDefault).toBe(true);
  });
});
