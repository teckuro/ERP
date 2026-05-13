import { TestBed } from '@angular/core/testing';

import { EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import { EmpleadosFormOrchestratorService } from './empleados-form-orchestrator.service';

function catalogosConListas(): EmpleadoFormCatalogos {
  return {
    sexos: [{ value: 'F', label: 'Femenino' }],
    estadosCivil: [{ value: 'SOLTERO', label: 'Soltero' }],
    comunas: [{ value: 100, label: 'Santiago' }],
    paises: [{ value: 1, label: 'Chile' }],
    centrosCosto: [{ value: 1, label: 'CC1' }],
    sucursales: [{ value: 2, label: 'Matriz' }],
    departamentos: [{ value: 3, label: 'RRHH', idSucursal: 2 }],
    tiposTrabajador: [{ value: 10, label: 'Dependiente' }],
    tiposJornada: [{ value: 20, label: 'Completa' }],
    tiposContrato: [{ value: 'INDEFINIDO', label: 'Indefinido' }],
    tiposGratificacion: [{ value: 'LEGAL_ART_50', label: 'Legal 50' }],
    tiposRegimenPrevisional: [{ value: 'NINGUNA', label: 'Sin previsión' }],
    regimenesPrevisionales: [{ value: 200, label: 'NINGUNA' }],
    entidadesPrevisionalesIps: [{ value: 30, label: 'IPS' }],
    exCajasPrevisionales: [{ value: 40, label: 'Ex caja' }],
    regimenesExCaja: [{ value: 50, label: 'Régimen', idExCajaPrevisional: 40, tasaCotizacionReferencia: 1 }],
    afps: [{ value: 60, label: 'AFP X' }],
    entidadesSalud: [{ value: 70, label: 'Isapre' }],
    monedas: [{ value: 80, label: 'CLP' }],
    tramosCarga: [],
    institucionesApv: [{ value: 90, label: 'APV' }],
    formasPagoApv: [{ value: 91, label: 'Depósito' }],
    bancos: [{ value: 5, label: 'Banco Test' }],
    tiposCuentaBancaria: [{ value: 6, label: 'Corriente' }],
  };
}

describe('EmpleadosFormOrchestratorService — selects sin autodefault', () => {
  let orchestrator: EmpleadosFormOrchestratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    orchestrator = TestBed.inject(EmpleadosFormOrchestratorService);
  });

  it('applyCatalogDefaults no asigna primer banco ni AFP ni tipo trabajador', () => {
    const form = orchestrator.createForm();
    const cat = catalogosConListas();
    orchestrator.applyCatalogDefaults(form, cat);

    expect(form.controls.bancario.controls.idBanco.value).toBeNull();
    expect(form.controls.contrato.controls.idTipoTrabajador.value).toBeNull();
    expect(form.controls.contrato.controls.idTipoJornada.value).toBeNull();
    expect(form.controls.contrato.controls.idSucursal.value).toBeNull();
    expect(form.controls.contrato.controls.idMoneda.value).toBeNull();
    expect(form.controls.datosPersonales.controls.idPais.value).toBeNull();
  });

  it('createForm deja sexo y estado civil sin valor hasta que el usuario elija', () => {
    const form = orchestrator.createForm();
    expect(form.controls.datosPersonales.controls.sexo.value).toBeNull();
    expect(form.controls.datosPersonales.controls.estadoCivil.value).toBeNull();
    expect(form.controls.contrato.controls.tipoContrato.value).toBeNull();
    expect(form.controls.contrato.controls.tipoGratificacion.value).toBeNull();
  });
});
