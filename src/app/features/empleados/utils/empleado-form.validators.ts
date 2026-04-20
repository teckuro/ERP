import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const atLeastOneArrayValueValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return Array.isArray(value) && value.length > 0 ? null : { required: true };
};

export const personNameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(value) ? null : { personName: true };
};

export const digitsOnlyValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /^\d+$/.test(value) ? null : { digitsOnly: true };
};

export const rutValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const rawValue = String(control.value ?? '').replace(/[^0-9kK]/g, '').toUpperCase();

  if (!rawValue) {
    return null;
  }

  if (!/^\d{7,9}[0-9K]$/.test(rawValue)) {
    return { rut: true };
  }

  const body = rawValue.slice(0, -1);
  const verifier = rawValue.slice(-1);
  let multiplier = 2;
  let sum = 0;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedValue = 11 - (sum % 11);
  const expectedVerifier = expectedValue === 11 ? '0' : expectedValue === 10 ? 'K' : String(expectedValue);

  return verifier === expectedVerifier ? null : { rut: true };
};
