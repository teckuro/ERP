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
        fechaIngreso: '2026-01-01',
        fechaTermino: '',
        sueldoBase: 900000,
        idMoneda: 1,
        sueldoVariable: false,
        horasSemanales: 44,
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
    expect(component.payrollReadinessEvaluadoLabel(employee)).toBe('No apta para remuneraciones');
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

    expect(component.canValidateForPayroll(employee)).toBe(true);
    expect(component.primaryActionEvaluadaLabel(employee)).toBe('Validar para remuneraciones');
    expect(component.payrollReadinessEvaluadoLabel(employee)).toBe('Pendiente de validación');
  });

  it('ficha con bloqueos no muestra validar y mantiene pendientes', () => {
    const employee = empleado();
    employee.formValue.bancario['numeroCuenta'] = 'DRAFT-XYZ';
    component['patchFormFromEmployee'](employee);

    expect(component.canValidateForPayroll(employee)).toBe(false);
    expect(component.primaryActionEvaluadaLabel(employee)).toBe('Revisar pendientes');
    expect(component.pendingItemsEvaluados(employee)).toContain('Reemplaza la cuenta bancaria temporal.');
  });

  it('borrador con paso_alta_avanzada no muestra validar y mantiene Continuar alta', () => {
    const employee = empleado({
      estado: 'borrador',
      estadoFicha: 'INCOMPLETO',
      pasoAltaAvanzada: 3,
    });
    component['patchFormFromEmployee'](employee);

    expect(component.canValidateForPayroll(employee)).toBe(false);
    expect(component.primaryActionEvaluadaLabel(employee)).toBe('Continuar alta');
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

    expect(component.canValidateForPayroll(employee)).toBe(false);
    expect(component.pendingItemsEvaluados(employee).length).toBeGreaterThan(0);
    expect(component.primaryActionEvaluadaLabel(employee)).toBe('Revisar pendientes');
    component.selectRecommendedTab(employee);
    expect(component.activeTab()).not.toBeNull();
  });

  it('borrador basico sin paso no muestra validar', () => {
    const employee = empleado({
      estado: 'borrador',
      estadoFicha: 'INCOMPLETO',
      pasoAltaAvanzada: null,
    });
    component['patchFormFromEmployee'](employee);

    expect(component.canValidateForPayroll(employee)).toBe(false);
    expect(component.primaryActionEvaluadaLabel(employee)).toBe('Completar ficha');
  });

  it('ya apta no muestra validar', () => {
    const employee = empleado({
      estadoFicha: 'VALIDO',
      aptoParaRemuneraciones: true,
    });
    component['patchFormFromEmployee'](employee);

    expect(component.canValidateForPayroll(employee)).toBe(false);
    expect(component.primaryActionEvaluadaLabel(employee)).toContain('Ver datos');
  });

  it('publica breadcrumbs, estado y accion primaria en el top bar', () => {
    const employee = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    fixture.detectChanges();

    expect(shellContext.breadcrumbs()).toEqual([
      { label: 'Empleados', path: '/empleados' },
      { label: 'Ana Perez' },
    ]);
    expect(shellContext.statusChip()).toEqual({
      label: 'Ficha completa',
      tone: 'neutral',
    });
    expect(shellContext.primaryAction()).toEqual({
      actionId: 'ficha-empleado-primary',
      label: 'Validar para remuneraciones',
      disabled: false,
      loading: false,
    });
  });

  it('ejecuta la accion primaria desde el top bar', () => {
    const employee = empleado();
    const actionSpy = vi.spyOn(component, 'handlePrimaryFichaAction').mockResolvedValue(undefined);
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    fixture.detectChanges();

    shellContext.invokePrimaryAction();

    expect(actionSpy).toHaveBeenCalledWith(employee);
  });

  it('deshabilita la accion del top bar durante validacion', () => {
    const employee = empleado({ estado: 'en_proceso', estadoFicha: 'INCOMPLETO' });
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isValidatingPayroll.set(true);
    fixture.detectChanges();

    expect(shellContext.primaryAction()).toEqual(
      expect.objectContaining({
        disabled: true,
        loading: true,
      }),
    );
  });

  it('renderiza avatar con iniciales del colaborador', () => {
    const employee = empleado({ nombre: 'Ana Maria Perez' });
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('.file-hero-avatar') as HTMLElement;

    expect(component.employeeInitials(employee)).toBe('AM');
    expect(avatar?.textContent?.trim()).toBe('AM');
  });

  it('mantiene estado accesible en tabs sin depender del texto visible', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const tab = fixture.nativeElement.querySelector('.file-tab-chip') as HTMLButtonElement;
    const stateLabel = tab.querySelector('.tab-state-label') as HTMLElement;

    expect(tab.getAttribute('aria-label')).toContain('General:');
    expect(tab.getAttribute('title')).toContain('General:');
    expect(stateLabel.textContent?.trim()).toBe(component.tabStatusLabel('general', employee));
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

  it('mantiene estado de ficha y completitud en el sidebar', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.file-status-card__title')?.textContent?.trim()).toBe(
      'Estado de la ficha',
    );
    expect(host.querySelector('.file-status-card__completion-pct')?.textContent?.trim()).toContain(
      '%',
    );
  });

  it('deja el sidebar como unico informador de estado de ficha', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.file-state-overview')).toBeNull();
    expect(host.querySelector('.file-general-overview')).toBeNull();
    expect(host.querySelector('.file-status-card')).toBeTruthy();
  });

  it('integra el contexto de seccion en el tabbar', () => {
    const employee = empleado();
    component.empleado.set(employee);
    component['patchFormFromEmployee'](employee);
    component.isLoading.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.file-tabs-context__main strong')?.textContent?.trim()).toBe(
      'General',
    );
    expect(host.querySelector('.file-tabs-context__meta')?.textContent).toContain('bloques');
  });
});
