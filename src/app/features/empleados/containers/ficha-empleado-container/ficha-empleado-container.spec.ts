import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';

import { EmpleadoFichaDetalle } from '../../models/empleado-listado.model';
import { EmpleadosCatalogosService } from '../../services/empleados-catalogos.service';
import { EmpleadosService } from '../../services/empleados.service';
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
      previsionSalud: {
        tipoRegimenPrevisional: 'NINGUNA',
        idAfp: null,
        idMonedaCuenta2: null,
        valorCuenta2: null,
        idEntidadPrevisionalIps: null,
        idExCajaPrevisional: null,
        idRegimenExCaja: null,
        nombreExCaja: '',
        regimenExCaja: '',
        tasaExCaja: null,
        idSalud: null,
        idMonedaPlan: null,
        valorPlan: null,
        adicionalAugeGes: null,
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

  beforeEach(async () => {
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
          useValue: {
            obtenerPorId: async () => null,
            guardarSeccionFicha: async () => null,
          },
        },
        {
          provide: EmpleadosCatalogosService,
          useValue: { obtenerFormulario: async () => ({}) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FichaEmpleadoContainer);
    component = fixture.componentInstance;
  });

  it('muestra bloqueos principales desde el helper central', () => {
    const employee = empleado();
    employee.formValue.contrato['sueldoBase'] = 0;
    employee.formValue.bancario['numeroCuenta'] = 'DRAFT-123';
    component['patchFormFromEmployee'](employee);

    expect(component.pendingItemsEvaluados(employee)).toContain('Sueldo base valido.');
    expect(component.pendingItemsEvaluados(employee)).toContain('Cuenta bancaria real.');
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
});
