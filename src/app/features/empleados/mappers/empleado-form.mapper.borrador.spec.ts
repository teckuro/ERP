import { TestBed } from '@angular/core/testing';

import { EMPTY_EMPLEADO_FORM_CATALOGOS, EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import { EmpleadosFormOrchestratorService } from '../services/empleados-form-orchestrator.service';
import { mapEmpleadoFormToPayloadBorrador } from './empleado-form.mapper';

function minimalCatalog(): EmpleadoFormCatalogos {
  return {
    ...EMPTY_EMPLEADO_FORM_CATALOGOS,
    tiposTrabajador: [{ value: 10, label: 'Dependiente' }],
    tiposJornada: [{ value: 20, label: 'Completa' }],
    paises: [{ value: 1, label: 'Chile' }],
    comunas: [{ value: 100, label: 'Santiago' }],
    regimenesPrevisionales: [
      { value: 200, label: 'AFP' },
      { value: 201, label: 'IPS' },
      { value: 202, label: 'NINGUNA' },
    ],
    bancos: [{ value: 5, label: 'Banco Test' }],
    tiposCuentaBancaria: [{ value: 6, label: 'Corriente' }],
    afps: [{ value: 30, label: 'AFP X' }],
  };
}

describe('mapEmpleadoFormToPayloadBorrador', () => {
  let orchestrator: EmpleadosFormOrchestratorService;
  const catalog = minimalCatalog();

  beforeEach(() => {
    TestBed.configureTestingModule({});
    orchestrator = TestBed.inject(EmpleadosFormOrchestratorService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Caso A: payload minimo con estado borrador y origen avanzado', () => {
    const form = orchestrator.createForm();
    form.patchValue({
      datosPersonales: {
        rut: '12.345.678-5',
        nombres: 'Test',
        apellidoPaterno: 'Auto',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-01',
        sexo: 'F',
        estadoCivil: 'SOLTERO',
        pasaporte: '',
        idPais: 1,
      },
    } as never);

    const payload = mapEmpleadoFormToPayloadBorrador(form, catalog);
    expect(payload.estado).toBe('borrador');
    expect(payload.origenCreacion).toBe('avanzado');
    expect(payload.rut).toBe('12.345.678-5');
    expect(payload.nombres).toBe('Test');
    expect(payload.idPais).toBe(1);
  });

  it('Caso B: aplica fechaIngreso hoy y cuenta numerica temporal si faltan', () => {
    const today = new Date().toISOString().slice(0, 10);
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_123);

    const form = orchestrator.createForm();
    form.patchValue({
      datosPersonales: {
        rut: '12.345.678-5',
        nombres: 'Test',
        apellidoPaterno: 'Auto',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-01',
        sexo: 'F',
        estadoCivil: 'SOLTERO',
        pasaporte: '',
        idPais: 1,
      },
      contrato: {
        fechaIngreso: '',
      },
      bancario: {
        numeroCuenta: '',
      },
    } as never);

    const payload = mapEmpleadoFormToPayloadBorrador(form, catalog);
    expect(payload.fechaIngreso).toBe(today);
    expect(payload.numeroCuenta).toMatch(/^\d{12}$/);
    expect(payload.numeroCuenta).toBe('700000000123');
    nowSpy.mockRestore();
    expect(payload.idTipoTrabajador).toBe(10);
    expect(payload.idTipoJornada).toBe(20);
    expect(payload.idBanco).toBe(5);
    expect(payload.idTipoCuentaBancaria).toBe(6);
    expect(payload.idComuna).toBe(100);
  });

  it('Caso C: conserva fechaIngreso, banco, cuenta y tipos informados', () => {
    const form = orchestrator.createForm();
    form.patchValue({
      datosPersonales: {
        rut: '12.345.678-5',
        nombres: 'Test',
        apellidoPaterno: 'Auto',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-01',
        sexo: 'F',
        estadoCivil: 'SOLTERO',
        pasaporte: '',
        idPais: 1,
      },
      contrato: {
        idTipoTrabajador: 77,
        idTipoJornada: 88,
        fechaIngreso: '2019-06-15',
      },
      contacto: {
        idComuna: 200,
      },
      bancario: {
        idBanco: 9,
        idTipoCuentaBancaria: 8,
        numeroCuenta: '12345678',
      },
    } as never);

    const payload = mapEmpleadoFormToPayloadBorrador(form, catalog);
    expect(payload.fechaIngreso).toBe('2019-06-15');
    expect(payload.idTipoTrabajador).toBe(77);
    expect(payload.idTipoJornada).toBe(88);
    expect(payload.idBanco).toBe(9);
    expect(payload.idTipoCuentaBancaria).toBe(8);
    expect(payload.numeroCuenta).toBe('12345678');
    expect(payload.idComuna).toBe(200);
  });

  it('Caso D: no deja estado activo ni apto en payload', () => {
    const form = orchestrator.createForm();
    form.patchValue({
      datosPersonales: {
        rut: '12.345.678-5',
        nombres: 'Test',
        apellidoPaterno: 'Auto',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-01',
        sexo: 'F',
        estadoCivil: 'SOLTERO',
        pasaporte: '',
        idPais: 1,
      },
      contrato: {
        estado: 'activo',
      },
    } as never);

    const payload = mapEmpleadoFormToPayloadBorrador(form, catalog);
    expect(payload.estado).toBe('borrador');
  });
});
