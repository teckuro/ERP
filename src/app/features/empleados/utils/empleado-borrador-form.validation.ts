import { EmpleadoFormGroup } from '../models/empleado-form.model';

function mensajeFormatoIdentificacion(form: EmpleadoFormGroup): string | null {
  const dp = form.controls.datosPersonales.controls;
  const campos = [
    { control: dp.nombres, mensaje: 'Los nombres solo pueden incluir letras, espacios, apóstrofes o guiones.' },
    {
      control: dp.apellidoPaterno,
      mensaje: 'El apellido paterno solo puede incluir letras, espacios, apóstrofes o guiones.',
    },
    {
      control: dp.apellidoMaterno,
      mensaje: 'El apellido materno solo puede incluir letras, espacios, apóstrofes o guiones.',
    },
  ];

  for (const { control, mensaje } of campos) {
    control.updateValueAndValidity({ onlySelf: true });
    if (control.hasError('personName')) {
      return mensaje;
    }
  }

  return null;
}

function mensajeFormatoContacto(form: EmpleadoFormGroup): string | null {
  const numero = form.controls.contacto.controls.numeroDireccion;
  if (!String(numero.value ?? '').trim()) {
    return null;
  }
  numero.updateValueAndValidity({ onlySelf: true });
  if (numero.hasError('digitsOnly')) {
    return 'El número de dirección solo puede contener dígitos.';
  }
  return null;
}

/** Validación mínima cliente para guardar borrador avanzado (identificación + país). */
export function validateBorradorAvanzadoFormMinimo(form: EmpleadoFormGroup): string | null {
  const dp = form.controls.datosPersonales.controls;
  dp.rut.updateValueAndValidity({ onlySelf: true });
  if (dp.rut.invalid) {
    return 'Ingresa un RUT válido o identificador extranjero antes de guardar el borrador.';
  }
  if (!String(dp.nombres.value || '').trim()) {
    return 'Ingresa los nombres del trabajador antes de guardar el borrador.';
  }
  if (!String(dp.apellidoPaterno.value || '').trim()) {
    return 'Ingresa el apellido paterno antes de guardar el borrador.';
  }

  const formatoIdentificacion = mensajeFormatoIdentificacion(form);
  if (formatoIdentificacion) {
    return formatoIdentificacion;
  }

  const formatoContacto = mensajeFormatoContacto(form);
  if (formatoContacto) {
    return formatoContacto;
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
