import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';

import { EmpleadosFormOrchestratorService } from '../services/empleados-form-orchestrator.service';
import { validateBorradorAvanzadoFormMinimo } from './empleado-borrador-form.validation';

describe('validateBorradorAvanzadoFormMinimo', () => {
  let orchestrator: EmpleadosFormOrchestratorService;

  beforeEach(() => {
    orchestrator = new EmpleadosFormOrchestratorService();
  });

  it('rechaza RUT invalido (el validador de RUT no marca vacio como error)', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '11.111.111-0',
      nombres: 'Test',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    form.controls.datosPersonales.controls.rut.updateValueAndValidity({ onlySelf: true });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('RUT');
  });

  it('rechaza sin nombre', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: '  ',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('nombre');
  });

  it('rechaza sin apellido paterno', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: '',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('apellido paterno');
  });

  it('rechaza sin fecha de nacimiento', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('fecha de nacimiento');
  });

  it('rechaza sin pais', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '1990-01-01',
      idPais: null,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('país');
  });

  it('rechaza sin sexo', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: null,
      estadoCivil: 'SOLTERO',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('sexo');
  });

  it('rechaza sin estado civil', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: null,
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('estado civil');
  });

  it('permite minimo aunque falten contrato, banco y prevision', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test Borrador',
      apellidoPaterno: 'Automatizado',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    form.controls.contacto.patchValue({
      email: 'borrador@test.cl',
      telefono: '56912345678',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toBeNull();
  });

  it('rechaza sin correo de contacto', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    form.controls.contacto.patchValue({ email: '', telefono: '56912345678' });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('correo');
  });

  it('rechaza sin teléfono de contacto', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test',
      apellidoPaterno: 'Auto',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    form.controls.contacto.patchValue({ email: 'test@empresa.cl', telefono: '' });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('teléfono');
  });

  it('rechaza nombres con dígitos antes de guardar borrador', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Test123',
      apellidoPaterno: 'Automatizado',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('nombres');
  });

  it('rechaza número de dirección con letras', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'Camila',
      apellidoPaterno: 'Soto',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    form.controls.contacto.patchValue({ numeroDireccion: '12B' });
    expect(validateBorradorAvanzadoFormMinimo(form)).toContain('dirección');
  });

  it('acepta apóstrofe y guión en apellidos válidos', () => {
    const form = orchestrator.createForm();
    form.controls.datosPersonales.patchValue({
      rut: '12.345.678-5',
      nombres: 'María José',
      apellidoPaterno: "O'Connor",
      apellidoMaterno: 'Del-Río',
      fechaNacimiento: '1990-01-01',
      idPais: 1,
      sexo: 'F',
      estadoCivil: 'SOLTERO',
    });
    form.controls.contacto.patchValue({
      email: 'maria@empresa.cl',
      telefono: '56987654321',
    });
    expect(validateBorradorAvanzadoFormMinimo(form)).toBeNull();
  });
});
