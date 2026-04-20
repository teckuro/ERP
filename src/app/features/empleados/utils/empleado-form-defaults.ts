import { FormControl } from '@angular/forms';

import { EmpleadoCatalogOption } from '../models/empleado-catalogos.model';
import { normalizeText } from './empleado-form.helpers';

export function buildTodayValue(): string {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function setPreferredCatalogValue(
  control: FormControl<number | null>,
  options: EmpleadoCatalogOption[],
  preferredLabels: string[],
): void {
  if (control.value !== null || options.length === 0) {
    return;
  }

  const preferred = options.find((option) =>
    preferredLabels.some((label) => normalizeText(option.label) === normalizeText(label)),
  );

  control.setValue(preferred?.value ?? options[0].value);
}
