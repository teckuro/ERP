import { FormControl } from '@angular/forms';

export function onlyDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function formatRutInput(value: string): string {
  const cleaned = value
    .replace(/[^0-9kK]/g, '')
    .toUpperCase()
    .slice(0, 10);

  if (cleaned.length <= 1) {
    return cleaned;
  }

  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1);
  const reversedDigits = body.split('').reverse();
  const parts: string[] = [];

  for (let index = 0; index < reversedDigits.length; index += 3) {
    parts.push(
      reversedDigits
        .slice(index, index + 3)
        .reverse()
        .join(''),
    );
  }

  return `${parts.reverse().join('.')}-${verifier}`;
}

export function setNormalizedTextValue(
  control: FormControl<string>,
  normalizedValue: string,
): void {
  if (control.value === normalizedValue) {
    return;
  }

  control.setValue(normalizedValue, { emitEvent: false });
}
