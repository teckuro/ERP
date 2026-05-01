import { EmpleadoFormGroup } from '../models/empleado-form.model';

/** Validación mínima cliente para guardar borrador avanzado (identificación + país). */
export function validateBorradorAvanzadoFormMinimo(form: EmpleadoFormGroup): string | null {
  const dp = form.controls.datosPersonales.controls;
  if (dp.rut.invalid) {
    return 'Ingresa un RUT valido antes de guardar el borrador.';
  }
  if (!String(dp.nombres.value || '').trim()) {
    return 'Ingresa el nombre antes de guardar el borrador.';
  }
  if (!String(dp.apellidoPaterno.value || '').trim()) {
    return 'Ingresa el apellido paterno antes de guardar el borrador.';
  }
  if (!String(dp.fechaNacimiento.value || '').trim()) {
    return 'Ingresa la fecha de nacimiento antes de guardar el borrador.';
  }
  if (dp.idPais.value === null || dp.idPais.value < 1) {
    return 'Selecciona el pais antes de guardar el borrador.';
  }
  return null;
}
