import { DestroyRef, inject } from '@angular/core';
import { Validators } from '@angular/forms';
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
    entidadesSalud: [
      { value: 70, label: 'Isapre Test', tipo: 'ISAPRE' },
      { value: 71, label: 'Fonasa', tipo: 'FONASA' },
    ],
    monedas: [
      { value: 80, label: 'Pesos', codigo: 'CLP' },
      { value: 81, label: 'Unidad de Fomento', codigo: 'UF' },
    ],
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

  it('FONASA asigna pesos y valor plan cero sin exigir valor manual', () => {
    const form = orchestrator.createForm();
    const cat = catalogosConListas();

    TestBed.runInInjectionContext(() => {
      orchestrator.configureFormBehavior(form, inject(DestroyRef), () => cat);
    });

    const controls = form.controls.previsionSalud.controls;
    controls.tipoRegimenPrevisional.setValue('AFP');
    controls.idSalud.setValue(71);

    expect(controls.idMonedaPlan.value).toBe(80);
    expect(controls.valorPlan.value).toBe(0);
    expect(controls.adicionalAugeGes.value).toBe(0);
    expect(controls.valorPlan.hasValidator(Validators.required)).toBe(false);
  });

  it('ISAPRE mantiene valor plan requerido', () => {
    const form = orchestrator.createForm();
    const cat = catalogosConListas();

    TestBed.runInInjectionContext(() => {
      orchestrator.configureFormBehavior(form, inject(DestroyRef), () => cat);
    });

    const controls = form.controls.previsionSalud.controls;
    controls.tipoRegimenPrevisional.setValue('AFP');
    controls.idSalud.setValue(70);
    controls.valorPlan.setValue(null);

    expect(controls.valorPlan.hasValidator(Validators.required)).toBe(true);
    expect(controls.valorPlan.valid).toBe(false);
  });
});
