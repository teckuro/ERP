import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';

import { EMPTY_EMPLEADO_FORM_CATALOGOS } from '../../models/empleado-catalogos.model';
import { EmpleadoFichaDetalle } from '../../models/empleado-listado.model';
import { EmpleadosCatalogosService } from '../../services/empleados-catalogos.service';
import { EmpleadosService } from '../../services/empleados.service';
import { ShellPageContextService } from '../../../../layout/shell-page-context.service';
import { FichaEmpleadoContainer } from './ficha-empleado-container';

function empleado(over: Partial<EmpleadoFichaDetalle> = {}): EmpleadoFichaDetalle {
  return {
    id: 1,
    idContrato: 10,
    rut: '11.111.111-1',
    nombre: 'Ana Perez',
    cargo: 'Analista',
    departamento: 'Administracion',
    fechaIngreso: '01/01/2026',
    sueldoBase: 900000,
    estado: 'activo',
    estadoFicha: 'INCOMPLETO',
    aptoParaRemuneraciones: false,
    pasoAltaAvanzada: null,
    historial: [],
    formValue: {
      datosPersonales: {
        rut: '11111111-1',
        nombres: 'Ana',
        apellidoPaterno: 'Perez',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-01',
        sexo: 'F',
        pasaporte: '',
        idPais: 1,
        estadoCivil: 'SOLTERO',
      },
      contacto: {
        email: 'ana@example.com',
        telefono: '912345678',
        direccion: 'Calle Uno',
        numeroDireccion: '123',
        departamentoDireccion: '',
        observacionesDireccion: '',
        idComuna: 1,
      },
      contrato: {
        relacionLaboral: 'CONTRATO',
        idSucursal: 1,
        idDepartamentoEmpresa: 1,
        idCentroCosto: 1,
        cargo: 'Analista',
        fechaContrato: '2026-01-01',
        tipoContrato: 'INDEFINIDO',
        idTipoTrabajador: 1,
        idTipoJornada: 1,
        seguroCesantia: true,
        excluidoLimiteJornada: false,
        causalExclusionJornada: null,
        justificacionExclusionJornada: '',
        casaParticularModalidad: null,
        casaParticularLabores: '',
        casaParticularDomicilioEspecifico: '',
        casaParticularAsistenciaCuidado: false,
        casaParticularRegistroDtEstado: null,
        casaParticularRegistroDtFecha: '',
        casaParticularRegistroDtFolio: '',
        fechaIngreso: '2026-01-01',
        fechaTermino: '',
        sueldoBase: 900000,
        idMoneda: 1,
        sueldoVariable: false,
        horasSemanales: 42,
        diasSemanales: 5,
        distribucionJornada: '',
        tiempoColacionMinutos: null,
        tipoGratificacion: 'LEGAL_ART_50',
        gratificacionProporcional: false,
        semanaCorridaActiva: false,
        semanaCorridaDiasLaborables: [],
        zonaExtremaActiva: false,
        zonaExtremaTerritorio: '',
        zonaExtremaPorcentaje: null,
        estado: 'activo',
        cargas: 0,
        idTramoCarga: null,
      },
      perfilLaboral: {
        pensionado: false,
        pensionadoInvalidezParcial: false,
        pensionadoInvalidezTotal: false,
        exentoCotizacionPension: false,
        trabajadorAdolescenteProtegido: false,
        autorizacionMenorRegistrada: false,
        tecnicoExtranjeroExento: false,
        discapacidad: false,
        vigenciaInicio: '2026-01-01',
        vigenciaFin: '',
        respaldoRegistrado: false,
        observacion: '',
      },
      previsionSalud: {
        tipoRegimenPrevisional: 'AFP',
        idAfp: 1,
        idMonedaCuenta2: null,
        valorCuenta2: null,
        idEntidadPrevisionalIps: null,
        idExCajaPrevisional: null,
        idRegimenExCaja: null,
        nombreExCaja: '',
        regimenExCaja: '',
        tasaExCaja: null,
        idSalud: 1,
        tipoSalud: 'ISAPRE',
        idMonedaPlan: 1,
        valorPlan: 4.2,
        adicionalAugeGes: 0,
        tieneApv: false,
        idInstitucionApv: null,
        idMonedaApv: null,
        montoApv: null,
        idFormaPagoApv: null,
        depositoConvenidoApvi: null,
      },
      bancario: {
        idBanco: 1,
        idTipoCuentaBancaria: 1,
        numeroCuenta: '123456',
      },
    },
    ...over,
  };
}

describe('FichaEmpleadoContainer', () => {
  let component: FichaEmpleadoContainer;
  let fixture: ComponentFixture<FichaEmpleadoContainer>;
  let empleadosServiceMock: {
    obtenerPorId: ReturnType<typeof vi.fn>;
    guardarSeccionFicha: ReturnType<typeof vi.fn>;
    validarFichaParaRemuneraciones: ReturnType<typeof vi.fn>;
  };
  let shellContext: ShellPageContextService;

  beforeEach(async () => {
    empleadosServiceMock = {
      obtenerPorId: vi.fn().mockResolvedValue(null),
      guardarSeccionFicha: vi.fn().mockResolvedValue(null),
      validarFichaParaRemuneraciones: vi.fn().mockResolvedValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [FichaEmpleadoContainer],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        {
          provide: EmpleadosService,
          useValue: empleadosServiceMock,
        },
        {
          provide: EmpleadosCatalogosService,
          useValue: {
            obtenerFormulario: async () => ({
              ...EMPTY_EMPLEADO_FORM_CATALOGOS,
              tiposRegimenPrevisional: [
                { value: 'AFP', label: 'AFP' },
                { value: 'IPS', label: 'IPS' },
                { value: 'NINGUNA', label: 'Sin prevision' },
              ],
              regimenesPrevisionales: [
                { value: 1, label: 'AFP' },
                { value: 2, label: 'IPS' },
              ],
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FichaEmpleadoContainer);
    component = fixture.componentInstance;
    shellContext = TestBed.inject(ShellPageContextService);
    component.catalogos.set({
      ...EMPTY_EMPLEADO_FORM_CATALOGOS,
      tiposRegimenPrevisional: [
        { value: 'AFP', label: 'AFP' },
        { value: 'IPS', label: 'IPS' },
        { value: 'NINGUNA', label: 'Sin prevision' },
      ],
      regimenesPrevisionales: [
        { value: 1, label: 'AFP' },
        { value: 2, label: 'IPS' },
      ],
    });
  });

  it('muestra bloqueos principales desde el helper central', () => {
    const employee = empleado();
    employee.formValue.contrato['sueldoBase'] = 0;
    employee.formValue.bancario['numeroCuenta'] = 'DRAFT-123';
    component['patchFormFromEmployee'](employee);

    expect(component.pendingItemsEvaluados(employee)).toContain('Ingresa sueldo base válido.');
    expect(component.pendingItemsEvaluados(employee)).toContain('Reemplaza la cuenta bancaria temporal.');
    expect(component.fichaEstadoPanel(employee).remuneracionesLabel).toBe('No apta para remuneraciones');
  });

  it('cuenta DRAFT se muestra como pendiente visual en ficha', () => {
    const employee = empleado();
    employee.formValue.bancario['numeroCuenta'] = 'DRAFT-XYZ';
    component['patchFormFromEmployee'](employee);
    component.selectTab('pago');

    const cuenta = component
      .detailItems(employee)
      .find((item) => item.label === 'Número de cuenta');

    expect(cuenta?.value).toBe('Cuenta bancaria pendiente');
  });

  it('ficha completa no apta muestra Validar para remuneraciones', () => {
    const employee = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    component['patchFormFromEmployee'](employee);

    expect(component.puedeValidarRemuneraciones(employee)).toBe(true);
    expect(component.etiquetaAccionPrincipalEvaluada(employee)).toBe('Validar para remuneraciones');
    expect(component.fichaEstadoPanel(employee).remuneracionesLabel).toBe('Pendiente de validación');
  });

  it('ficha con bloqueos no muestra validar y mantiene pendientes', () => {
    const employee = empleado();
    employee.formValue.bancario['numeroCuenta'] = 'DRAFT-XYZ';
    component['patchFormFromEmployee'](employee);

    expect(component.puedeValidarRemuneraciones(employee)).toBe(false);
    expect(component.etiquetaAccionPrincipalEvaluada(employee)).toBe('Revisar pendientes');
    expect(component.pendingItemsEvaluados(employee)).toContain('Reemplaza la cuenta bancaria temporal.');
  });

  it('ficha muestra avisos compartidos como revision sin bloquear validacion', () => {
    const employee = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    employee.formValue.contacto['email'] = '';
    component['patchFormFromEmployee'](employee);

    expect(component.puedeValidarRemuneraciones(employee)).toBe(true);
    expect(component.estadoTab('general', employee)).toBe('warning');
    expect(component.fichaEstadoPanel(employee).faltantes.some((item) => item.severidad === 'revision')).toBe(true);
  });

  it('borrador con paso_alta_avanzada no muestra validar y mantiene Continuar alta', () => {
    const employee = empleado({
      estado: 'borrador',
      estadoFicha: 'INCOMPLETO',
      pasoAltaAvanzada: 3,
    });
    component['patchFormFromEmployee'](employee);

    expect(component.puedeValidarRemuneraciones(employee)).toBe(false);
    expect(component.etiquetaAccionPrincipalEvaluada(employee)).toBe('Continuar alta');
  });

  it('validar ficha exitosa actualiza la ficha recargada desde servicio', async () => {
    const current = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    const updated = empleado({
      estado: 'activo',
      estadoFicha: 'VALIDO',
      aptoParaRemuneraciones: true,
    });
    empleadosServiceMock.validarFichaParaRemuneraciones.mockResolvedValue(updated);
    component.empleado.set(current);
    component['patchFormFromEmployee'](current);

    await component.validarFichaParaRemuneraciones();

    expect(empleadosServiceMock.validarFichaParaRemuneraciones).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        estado: 'activo',
        cargo: 'Analista',
        sueldoBase: 900000,
        numeroCuenta: '123456',
      }),
    );
    expect(component.empleado()?.estadoFicha).toBe('VALIDO');
    expect(component.empleado()?.aptoParaRemuneraciones).toBe(true);
    expect(component.empleado()?.estado).toBe('activo');
  });

  it('validar con DRAFT bloquea y no llama servicio', async () => {
    const employee = empleado();
    employee.formValue.bancario['numeroCuenta'] = 'DRAFT-XYZ';
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);

    await component.validarFichaParaRemuneraciones();

    expect(empleadosServiceMock.validarFichaParaRemuneraciones).not.toHaveBeenCalled();
    expect(component.validationBlockingItems()).toContain('Reemplaza la cuenta bancaria temporal.');
  });

  it('validar con Sin cargo bloquea', async () => {
    const employee = empleado();
    employee.formValue.contrato['cargo'] = 'Sin cargo';
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);

    await component.validarFichaParaRemuneraciones();

    expect(empleadosServiceMock.validarFichaParaRemuneraciones).not.toHaveBeenCalled();
    expect(component.validationBlockingItems()).toContain('Define un cargo real.');
  });

  it('validar con sueldo base 0 bloquea', async () => {
    const employee = empleado();
    employee.formValue.contrato['sueldoBase'] = 0;
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);

    await component.validarFichaParaRemuneraciones();

    expect(empleadosServiceMock.validarFichaParaRemuneraciones).not.toHaveBeenCalled();
    expect(component.validationBlockingItems()).toContain('Ingresa sueldo base válido.');
  });

  it('ficha con Sin prevision bloquea validar y recomienda Prevision y salud', () => {
    const employee = empleado();
    component.evaluacionEmpleado = vi.fn().mockReturnValue({
      estadoFicha: 'INCOMPLETO',
      aptoParaRemuneraciones: false,
      bloqueos: [
        'La opcion "Sin prevision" no habilita calculo de nomina. Selecciona AFP o IPS antes de validar para remuneraciones.',
      ],
      advertencias: [],
      defaultsTecnicosDetectados: [],
      seccionesPendientes: ['prevision y salud'],
    });

    expect(component.puedeValidarRemuneraciones(employee)).toBe(false);
    expect(component.pendingItemsEvaluados(employee).length).toBeGreaterThan(0);
    expect(component.etiquetaAccionPrincipalEvaluada(employee)).toBe('Revisar pendientes');
    component.selectRecommendedTab(employee);
    expect(component.tabActivo()).not.toBeNull();
  });

  it('borrador basico sin paso no muestra validar', () => {
    const employee = empleado({
      estado: 'borrador',
      estadoFicha: 'INCOMPLETO',
      pasoAltaAvanzada: null,
    });
    component['patchFormFromEmployee'](employee);

    expect(component.puedeValidarRemuneraciones(employee)).toBe(false);
    expect(component.etiquetaAccionPrincipalEvaluada(employee)).toBe('Completar ficha');
  });

  it('ya apta no muestra validar', () => {
    const employee = empleado({
      estadoFicha: 'VALIDO',
      aptoParaRemuneraciones: true,
    });
    component['patchFormFromEmployee'](employee);

    expect(component.puedeValidarRemuneraciones(employee)).toBe(false);
    expect(component.etiquetaAccionPrincipalEvaluada(employee)).toContain('Ver datos');
  });

  it('publica breadcrumbs y chip de estado en el shell sin CTA duplicado', () => {
    const employee = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    fixture.detectChanges();

    expect(shellContext.breadcrumbs()).toEqual([
      { label: 'Empleados', path: '/empleados' },
      { label: 'Ana Perez' },
    ]);
    expect(shellContext.statusChip()).toEqual({
      label: 'En proceso',
      tone: 'warning',
    });
    expect(shellContext.primaryAction()).toBeUndefined();
  });

  it('ejecuta la accion principal desde el panel de diagnostico', async () => {
    const employee = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    const openSpy = vi.spyOn(component, 'openPayrollValidationConfirm');
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const cta = fixture.nativeElement.querySelector(
      '.employee-record-status__cta',
    ) as HTMLButtonElement;
    expect(cta?.textContent?.trim()).toBe('Validar para remuneraciones');
    cta?.click();
    await fixture.whenStable();

    expect(openSpy).toHaveBeenCalled();
  });

  it('renderiza avatar con iniciales del colaborador', () => {
    const employee = empleado({ nombre: 'Ana Maria Perez' });
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector(
      '.employee-record-header__avatar',
    ) as HTMLElement;

    expect(component.employeeInitials(employee)).toBe('AM');
    expect(avatar?.textContent?.trim()).toBe('AM');
  });

  it('marca el bloque activo en el tabbar del expediente', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const tablist = fixture.nativeElement.querySelector(
      '[role="tablist"]',
    ) as HTMLElement;
    const active = fixture.nativeElement.querySelector(
      '.employee-record-tabbar__tab--active',
    ) as HTMLButtonElement;

    expect(tablist?.getAttribute('aria-label')).toContain('Expediente');
    expect(active?.textContent).toContain('General');
    expect(active?.getAttribute('aria-selected')).toBe('true');
  });

  it('cambia el bloque central al pulsar una pestaña del expediente', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const pago = [...fixture.nativeElement.querySelectorAll('.employee-record-tabbar__tab')].find(
      (el: Element) => el.textContent?.includes('Pago'),
    ) as HTMLButtonElement;
    pago?.click();
    fixture.detectChanges();

    expect(component.tabActivo()).toBe('pago');
    expect(
      fixture.nativeElement.querySelector('.employee-record-block__title')?.textContent?.trim(),
    ).toBe('Pago');
  });

  it('no renderiza acciones primarias duplicadas en la cabecera local', () => {
    const employee = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.file-sheet-actions')).toBeNull();
    expect(host.querySelector('.section-head__action')).toBeNull();
    expect(host.querySelector('.file-toolbar-button--primary')).toBeNull();
  });

  it('mantiene estado de ficha y completitud coherente en el panel de diagnostico', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const estado = component.fichaEstadoPanel(employee);
    const progress = host.querySelector(
      '.employee-record-status__progress',
    ) as HTMLElement;

    expect(host.querySelector('.employee-record-status__title')?.textContent?.trim()).toBe(
      'Diagnóstico operativo',
    );
    expect(host.querySelector('.employee-record-status__completion')?.textContent).toContain(
      'de 5 bloques operativos',
    );
    expect(host.querySelector('.employee-record-status__pct')?.textContent?.trim()).toBe(
      `${estado.porcentajeAvance}%`,
    );
    expect(progress.getAttribute('aria-valuenow')).toBe(String(estado.porcentajeAvance));
    expect(estado.porcentajeAvance).toBe(
      Math.round((estado.bloquesOperativosCompletos / estado.totalBloquesOperativos) * 100),
    );
  });

  it('no muestra impacto operativo y si motivo principal en el panel', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).not.toContain('Impacto operativo');
    expect(host.textContent).not.toContain('Editar bloque actual');
    expect(host.querySelector('.employee-record-status__motivo')).toBeTruthy();
    expect(host.textContent).toContain('Motivo principal');
  });

  it('muestra tabbar horizontal del expediente', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const tablist = host.querySelector('.employee-record-tabbar__list') as HTMLElement;

    expect(host.querySelector('.employee-record-tabbar__title')?.textContent?.trim()).toBe(
      'Expediente',
    );
    expect(host.querySelector('.employee-record-tabbar__count')?.textContent).toContain('bloques');
    expect(host.querySelector('[role="tablist"]')).toBeTruthy();
    expect(getComputedStyle(tablist).display).toBe('flex');
    expect(host.querySelector('.employee-record-rail')).toBeNull();
  });

  it('deduplica faltantes criticos en el panel', () => {
    const employee = empleado();
    employee.formValue.bancario['numeroCuenta'] = 'DRAFT-XYZ';
    component['patchFormFromEmployee'](employee);
    const faltantes = component.fichaEstadoPanel(employee).faltantes;
    const keys = faltantes.map((i) => `${i.claveBloque}:${i.mensaje}`);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('abre modal de edicion con titulo y acciones al editar un bloque', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    const firstBlockId = component.detailBlocks(employee)[0]?.id;
    component.startEditing(firstBlockId ?? null);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const modal = host.querySelector('.ficha-edit-modal') as HTMLElement;

    expect(modal).toBeTruthy();
    expect(modal.querySelector('#ficha-edit-modal-title')?.textContent?.trim()).toBe(
      'Identificación legal',
    );
    expect(modal.querySelector('.ficha-edit-modal__hint')?.textContent).toContain(
      'Los cambios se aplicarán',
    );
    expect(modal.querySelector('.ficha-edit-modal__actions')?.textContent).toContain('Guardar');
    expect(modal.querySelector('.ficha-edit-modal__actions')?.textContent).toContain('Cancelar');
    expect(modal.querySelector('.ficha-edit-modal__foot')).toBeNull();
    expect(host.querySelector('.detail-block--editorial.is-editing')).toBeNull();
    expect(host.querySelector('.ficha-registro-tab')).toBeTruthy();
  });

  it('expone contacto al editar el bloque base en bloquesVisibles', () => {
    expect(component.editVisibleBlocks('base')).toEqual(['base', 'contacto']);
  });

  it('muestra email y telefono al editar Informacion personal y contacto', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    component.startEditing('base');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.ficha-edit-modal #empleado-email')).toBeTruthy();
    expect(host.querySelector('.ficha-edit-modal #empleado-telefono')).toBeTruthy();
  });

  it('muestra marcador accesible de campo obligatorio al editar identificacion', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    component.startEditing('identificacion');
    fixture.detectChanges();

    const triggers = [
      ...fixture.nativeElement.querySelectorAll(
        '.ficha-edit-modal .erp-field-help-tip__trigger--required',
      ),
    ] as HTMLButtonElement[];

    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers.some((el) => el.getAttribute('aria-label') === 'Campo obligatorio')).toBe(true);
  });

  it('usa el titulo del bloque en el msgbox de guardado parcial', async () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    component.startEditing('identificacion');
    fixture.detectChanges();

    await component.saveSection();
    fixture.detectChanges();

    expect(component.tituloExitoSeccion()).toBe('Identificación legal');
    expect(component.mensajeExitoSeccion()).toContain(
      'Las demás secciones de la ficha no se modificaron.',
    );
  });
});

