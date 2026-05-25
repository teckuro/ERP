import { describe, expect, it } from 'vitest';

import { payloadUsuarioDependienteCompleto } from '../testing/empleado-payload.fixtures';
import { assertPayloadIdentificacionValida } from './empleado-payload-guard.rules';

describe('empleado-payload-guard.rules', () => {
  it('acepta payload de identificación válido', () => {
    expect(() => assertPayloadIdentificacionValida(payloadUsuarioDependienteCompleto())).not.toThrow();
  });

  it('rechaza correo vacío', () => {
    const payload = payloadUsuarioDependienteCompleto({ email: '  ' });
    expect(() => assertPayloadIdentificacionValida(payload)).toThrow(/correo de contacto es obligatorio/i);
  });

  it('rechaza teléfono vacío', () => {
    const payload = payloadUsuarioDependienteCompleto({ telefono: '' });
    expect(() => assertPayloadIdentificacionValida(payload)).toThrow(/teléfono de contacto es obligatorio/i);
  });

  it('rechaza nombres con dígitos', () => {
    const payload = payloadUsuarioDependienteCompleto({ nombres: 'Juan3' });
    expect(() => assertPayloadIdentificacionValida(payload)).toThrow(
      /nombres solo pueden incluir letras/i,
    );
  });

  it('rechaza número de dirección con letras', () => {
    const payload = payloadUsuarioDependienteCompleto({ numeroDireccion: '12B' });
    expect(() => assertPayloadIdentificacionValida(payload)).toThrow(
      /número de dirección solo puede contener dígitos/i,
    );
  });

  it('rechaza número de cuenta con letras', () => {
    const payload = payloadUsuarioDependienteCompleto({ numeroCuenta: '12B' });
    expect(() => assertPayloadIdentificacionValida(payload)).toThrow(
      /número de cuenta solo puede contener dígitos/i,
    );
  });
});
