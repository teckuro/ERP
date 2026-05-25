import { TestBed } from '@angular/core/testing';

import { EMPTY_EMPLEADO_FORM_CATALOGOS, EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import { EmpleadosFormOrchestratorService } from '../services/empleados-form-orchestrator.service';
import { mapEmpleadoFormToPayload } from './empleado-form.mapper';

function catalogoHonorarios(): EmpleadoFormCatalogos {
  return {
    ...EMPTY_EMPLEADO_FORM_CATALOGOS,
    tiposTrabajador: [
      { value: 1, label: 'DEPENDIENTE' },
      { value: 2, label: 'INDEPENDIENTE' },
    ],
    tiposJornada: [{ value: 20, label: 'Completa' }],
    paises: [{ value: 1, label: 'Chile' }],
    comunas: [{ value: 100, label: 'Santiago' }],
    monedas: [{ value: 1, label: 'CLP', codigo: 'CLP' }],
    bancos: [{ value: 5, label: 'Banco Test' }],
    tiposCuentaBancaria: [{ value: 6, label: 'Corriente' }],
    regimenesPrevisionales: [{ value: 202, label: 'NINGUNA' }],
  };
}

describe('mapEmpleadoFormToPayload honorarios', () => {
  let orchestrator: EmpleadosFormOrchestratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    orchestrator = TestBed.inject(EmpleadosFormOrchestratorService);
  });

  it('mapea honorarios con campos dependientes vacios sin lanzar', () => {
    const form = orchestrator.createForm();
    const catalogos = catalogoHonorarios();

    form.patchValue({
      datosPersonales: {
        rut: '12.345.678-5',
        nombres: 'Prestador',
        apellidoPaterno: 'Honorarios',
        apellidoMaterno: '',
        fechaNacimiento: '1990-01-01',
        sexo: 'M',
        estadoCivil: 'SOLTERO',
        pasaporte: '',
        idPais: 1,
      },
      contacto: {
        email: 'honorarios@test.local',
        telefono: '56912345678',
        direccion: 'Calle 1',
        numeroDireccion: '10',
        departamentoDireccion: '',
        observacionesDireccion: '',
        idComuna: 100,
      },
      contrato: {
        relacionLaboral: 'HONORARIOS',
        cargo: 'Consultoria E2E',
        fechaIngreso: '2024-06-01',
        sueldoBase: 500000,
        idMoneda: 1,
        tipoContrato: null,
        idTipoJornada: null,
        tipoGratificacion: null,
      },
      previsionSalud: {
        tipoRegimenPrevisional: 'NINGUNA',
      },
      bancario: {
        idBanco: 5,
        idTipoCuentaBancaria: 6,
        numeroCuenta: '123456789012',
      },
    } as never);

    const payload = mapEmpleadoFormToPayload(form, catalogos);

    expect(payload.relacionLaboral).toBe('HONORARIOS');
    expect(payload.estado).toBe('activo');
    expect(payload.tipoPrevision).toBe('NINGUNA');
    expect(payload.sueldoBase).toBe(500000);
    expect(payload.idMoneda).toBe(1);
    expect(payload.horasSemanales).toBe(0);
    expect(payload.idAfp).toBeNull();
    expect(payload.idSalud).toBeNull();
  });
});
