import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const atLeastOneArrayValueValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  return Array.isArray(value) && value.length > 0 ? null : { required: true };
};

export const personNameValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(value) ? null : { personName: true };
};

export const digitsOnlyValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /^\d+$/.test(value) ? null : { digitsOnly: true };
};

export const passportValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /^[A-Za-z0-9-]{5,30}$/.test(value) ? null : { passport: true };
};

export const phoneFormatValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, '');
  const hasValidCharacters = /^[+()\d\s-]+$/.test(value);

  return hasValidCharacters && digits.length >= 8 && digits.length <= 15
    ? null
    : { phoneFormat: true };
};

export const notFutureDateValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(selectedDate.getTime())) {
    return { date: true };
  }

  return selectedDate > today ? { futureDate: true } : null;
};

export const rutOrPassportValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const rut = String(control.get('rut')?.value ?? '').trim();
  const passport = String(control.get('pasaporte')?.value ?? '').trim();

  return rut || passport ? null : { rutOrPassport: true };
};

export const rutValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const rawValue = String(control.value ?? '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase();

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
  const expectedVerifier =
    expectedValue === 11 ? '0' : expectedValue === 10 ? 'K' : String(expectedValue);

  return verifier === expectedVerifier ? null : { rut: true };
};
