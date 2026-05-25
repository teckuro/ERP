import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import {
  digitsOnlyValidator,
  personNameValidator,
  phoneFormatValidator,
  rutValidator,
} from './empleado-form.validators';

describe('personNameValidator', () => {
  const control = new FormControl('');

  it('acepta nombres con letras, espacios, apóstrofe y guión', () => {
    const validos = ['Camila Andrea', "O'Connor", 'Del-Río', 'ÁNGELA', 'Jean-Pierre'];
    for (const value of validos) {
      control.setValue(value);
      expect(personNameValidator(control)).toBeNull();
    }
  });

  it('rechaza dígitos y símbolos no permitidos', () => {
    const invalidos = ['Juan3', 'Ana@mail', 'Test123', 'Nombre_', 'María.'];
    for (const value of invalidos) {
      control.setValue(value);
      expect(personNameValidator(control)).toEqual({ personName: true });
    }
  });

  it('no valida vacío (lo cubre required)', () => {
    control.setValue('   ');
    expect(personNameValidator(control)).toBeNull();
  });
});

describe('digitsOnlyValidator', () => {
  const control = new FormControl('');

  it('acepta solo números en número de dirección o cuenta', () => {
    control.setValue('1234');
    expect(digitsOnlyValidator(control)).toBeNull();
  });

  it('rechaza letras y mezclas', () => {
    for (const value of ['12a', 'abc', '123-4', '12 34']) {
      control.setValue(value);
      expect(digitsOnlyValidator(control)).toEqual({ digitsOnly: true });
    }
  });

  it('no valida vacío', () => {
    control.setValue('');
    expect(digitsOnlyValidator(control)).toBeNull();
  });
});

describe('rutValidator', () => {
  const control = new FormControl('');

  it('acepta RUT chileno válido formateado', () => {
    control.setValue('12.345.678-5');
    expect(rutValidator(control)).toBeNull();
  });

  it('rechaza RUT con dígito verificador incorrecto', () => {
    control.setValue('12.345.678-0');
    expect(rutValidator(control)).toEqual({ rut: true });
  });
});

describe('phoneFormatValidator', () => {
  const control = new FormControl('');

  it('acepta teléfono móvil chileno típico', () => {
    control.setValue('+56 9 8765 4321');
    expect(phoneFormatValidator(control)).toBeNull();
  });

  it('rechaza teléfono con letras', () => {
    control.setValue('569abc12345');
    expect(phoneFormatValidator(control)).toEqual({ phoneFormat: true });
  });
});
