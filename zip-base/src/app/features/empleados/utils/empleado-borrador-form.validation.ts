import { EmpleadoFormGroup } from '../models/empleado-form.model';

/** Validación mínima cliente para guardar borrador avanzado (identificación + país). */
export function validateBorradorAvanzadoFormMinimo(form: EmpleadoFormGroup): string | null {
  const dp = form.controls.datosPersonales.controls;
  if (dp.rut.invalid) {
    return 'Ingresa un RUT válido o identificador extranjero antes de guardar el borrador.';
  }
  if (!String(dp.nombres.value || '').trim()) {
    return 'Ingresa los nombres del trabajador antes de guardar el borrador.';
  }
  if (!String(dp.apellidoPaterno.value || '').trim()) {
    return 'Ingresa el apellido paterno antes de guardar el borrador.';
  }
  if (!String(dp.fechaNacimiento.value || '').trim()) {
    return 'Ingresa la fecha de nacimiento antes de guardar el borrador.';
  }
  if (dp.idPais.value === null || dp.idPais.value < 1) {
    return 'Selecciona país o nacionalidad antes de guardar el borrador.';
  }
  if (dp.sexo.value === null) {
    return 'Selecciona sexo registral antes de guardar el borrador.';
  }
  if (dp.estadoCivil.value === null) {
    return 'Selecciona el estado civil antes de guardar el borrador.';
  }
  return null;
}
