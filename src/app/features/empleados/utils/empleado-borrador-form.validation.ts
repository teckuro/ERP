import { EmpleadoFormGroup } from '../models/empleado-form.model';
import type { BorradorValidacionIssue } from './empleado-alta-modal.presenter';

const SECCION_IDENTIFICACION = 'Identificación legal';
const SECCION_CONTACTO = 'Contacto';

function issue(
  id: string,
  message: string,
  controlPath: string,
  wizardStep: number,
  sectionTitle: string,
  fieldLabel: string,
): BorradorValidacionIssue {
  return { id, message, controlPath, wizardStep, sectionTitle, fieldLabel };
}

function mensajeFormatoIdentificacion(form: EmpleadoFormGroup): BorradorValidacionIssue | null {
  const dp = form.controls.datosPersonales.controls;
  const campos = [
    {
      control: dp.nombres,
      id: 'borrador.nombres-formato',
      mensaje: 'Los nombres solo pueden incluir letras, espacios, apóstrofes o guiones.',
      path: 'datosPersonales.nombres',
      label: 'Nombres',
    },
    {
      control: dp.apellidoPaterno,
      id: 'borrador.apellido-paterno-formato',
      mensaje:
        'El apellido paterno solo puede incluir letras, espacios, apóstrofes o guiones.',
      path: 'datosPersonales.apellidoPaterno',
      label: 'Apellido paterno',
    },
    {
      control: dp.apellidoMaterno,
      id: 'borrador.apellido-materno-formato',
      mensaje:
        'El apellido materno solo puede incluir letras, espacios, apóstrofes o guiones.',
      path: 'datosPersonales.apellidoMaterno',
      label: 'Apellido materno',
    },
  ];

  for (const { control, id, mensaje, path, label } of campos) {
    control.updateValueAndValidity({ onlySelf: true });
    if (control.hasError('personName')) {
      return issue(id, mensaje, path, 0, SECCION_IDENTIFICACION, label);
    }
  }

  return null;
}

function mensajeFormatoContacto(form: EmpleadoFormGroup): BorradorValidacionIssue | null {
  const numero = form.controls.contacto.controls.numeroDireccion;
  if (!String(numero.value ?? '').trim()) {
    return null;
  }
  numero.updateValueAndValidity({ onlySelf: true });
  if (numero.hasError('digitsOnly')) {
    return issue(
      'borrador.numero-direccion-formato',
      'El número de dirección solo puede contener dígitos.',
      'contacto.numeroDireccion',
      1,
      SECCION_CONTACTO,
      'Número de dirección',
    );
  }
  return null;
}

/** Todos los pendientes mínimos para guardar borrador (orden de validación). */
export function collectBorradorAvanzadoIssues(
  form: EmpleadoFormGroup,
): readonly BorradorValidacionIssue[] {
  const out: BorradorValidacionIssue[] = [];
  const dpGroup = form.controls.datosPersonales;
  const dp = dpGroup.controls;
  const contacto = form.controls.contacto.controls;

  dp.rut.updateValueAndValidity({ onlySelf: true });
  dpGroup.updateValueAndValidity();
  if (dpGroup.hasError('rutOrPassport') || dp.rut.hasError('rut')) {
    out.push(
      issue(
        'borrador.rut',
        'Ingresa un RUT válido o identificador extranjero antes de guardar el borrador.',
        'datosPersonales.rut',
        0,
        SECCION_IDENTIFICACION,
        'RUT o identificador',
      ),
    );
  }
  if (!String(dp.nombres.value || '').trim()) {
    out.push(
      issue(
        'borrador.nombres',
        'Ingresa los nombres del trabajador antes de guardar el borrador.',
        'datosPersonales.nombres',
        0,
        SECCION_IDENTIFICACION,
        'Nombres',
      ),
    );
  }
  if (!String(dp.apellidoPaterno.value || '').trim()) {
    out.push(
      issue(
        'borrador.apellido-paterno',
        'Ingresa el apellido paterno antes de guardar el borrador.',
        'datosPersonales.apellidoPaterno',
        0,
        SECCION_IDENTIFICACION,
        'Apellido paterno',
      ),
    );
  }

  const formatoId = mensajeFormatoIdentificacion(form);
  if (formatoId) {
    out.push(formatoId);
  }

  const formatoContacto = mensajeFormatoContacto(form);
  if (formatoContacto) {
    out.push(formatoContacto);
  }

  if (!String(dp.fechaNacimiento.value || '').trim()) {
    out.push(
      issue(
        'borrador.fecha-nacimiento',
        'Ingresa la fecha de nacimiento antes de guardar el borrador.',
        'datosPersonales.fechaNacimiento',
        0,
        SECCION_IDENTIFICACION,
        'Fecha de nacimiento',
      ),
    );
  }
  if (dp.idPais.value === null || dp.idPais.value < 1) {
    out.push(
      issue(
        'borrador.pais',
        'Selecciona país o nacionalidad antes de guardar el borrador.',
        'datosPersonales.idPais',
        0,
        SECCION_IDENTIFICACION,
        'País o nacionalidad',
      ),
    );
  }
  if (dp.sexo.value === null) {
    out.push(
      issue(
        'borrador.sexo',
        'Selecciona sexo registral antes de guardar el borrador.',
        'datosPersonales.sexo',
        0,
        SECCION_IDENTIFICACION,
        'Sexo registral',
      ),
    );
  }
  if (dp.estadoCivil.value === null) {
    out.push(
      issue(
        'borrador.estado-civil',
        'Selecciona el estado civil antes de guardar el borrador.',
        'datosPersonales.estadoCivil',
        0,
        SECCION_IDENTIFICACION,
        'Estado civil',
      ),
    );
  }

  contacto.email.updateValueAndValidity({ onlySelf: true });
  if (!String(contacto.email.value || '').trim()) {
    out.push(
      issue(
        'borrador.email',
        'Ingresa el correo de contacto antes de guardar el borrador.',
        'contacto.email',
        0,
        SECCION_CONTACTO,
        'Correo de contacto',
      ),
    );
  } else if (contacto.email.hasError('email')) {
    out.push(
      issue(
        'borrador.email-formato',
        'Ingresa un correo de contacto válido antes de guardar el borrador.',
        'contacto.email',
        0,
        SECCION_CONTACTO,
        'Correo de contacto',
      ),
    );
  }

  contacto.telefono.updateValueAndValidity({ onlySelf: true });
  if (!String(contacto.telefono.value || '').trim()) {
    out.push(
      issue(
        'borrador.telefono',
        'Ingresa el teléfono de contacto antes de guardar el borrador.',
        'contacto.telefono',
        0,
        SECCION_CONTACTO,
        'Teléfono de contacto',
      ),
    );
  } else if (contacto.telefono.hasError('phoneFormat')) {
    out.push(
      issue(
        'borrador.telefono-formato',
        'Ingresa un teléfono de contacto válido antes de guardar el borrador.',
        'contacto.telefono',
        0,
        SECCION_CONTACTO,
        'Teléfono de contacto',
      ),
    );
  }

  return out;
}

/** Validación mínima cliente para guardar borrador avanzado (primer mensaje). */
export function validateBorradorAvanzadoFormMinimo(form: EmpleadoFormGroup): string | null {
  const issues = collectBorradorAvanzadoIssues(form);
  return issues[0]?.message ?? null;
}
