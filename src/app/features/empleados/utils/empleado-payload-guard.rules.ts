import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import { buildRepositoryError } from './empleados-repository-errors';
import { isValidDigitsOnlyValue, isValidPersonNameValue } from './empleado-form.validators';

export function assertPayloadIdentificacionValida(payload: CrearEmpleadoPayload): void {
  if (!payload.email.trim()) {
    throw buildRepositoryError('El correo de contacto es obligatorio.', '');
  }

  if (!payload.telefono.trim()) {
    throw buildRepositoryError('El teléfono de contacto es obligatorio.', '');
  }

  if (!isValidPersonNameValue(payload.nombres)) {
    throw buildRepositoryError(
      'Los nombres solo pueden incluir letras, espacios, apóstrofes o guiones.',
      '',
    );
  }

  if (!isValidPersonNameValue(payload.apellidoPaterno)) {
    throw buildRepositoryError(
      'El apellido paterno solo puede incluir letras, espacios, apóstrofes o guiones.',
      '',
    );
  }

  if (payload.apellidoMaterno.trim() && !isValidPersonNameValue(payload.apellidoMaterno)) {
    throw buildRepositoryError(
      'El apellido materno solo puede incluir letras, espacios, apóstrofes o guiones.',
      '',
    );
  }

  const numeroDireccion = payload.numeroDireccion?.trim() ?? '';
  if (numeroDireccion && !isValidDigitsOnlyValue(numeroDireccion)) {
    throw buildRepositoryError('El número de dirección solo puede contener dígitos.', '');
  }

  const numeroCuenta = payload.numeroCuenta?.trim() ?? '';
  if (numeroCuenta && !isValidDigitsOnlyValue(numeroCuenta)) {
    throw buildRepositoryError('El número de cuenta solo puede contener dígitos.', '');
  }
}
