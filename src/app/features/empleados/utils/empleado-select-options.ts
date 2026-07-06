import { SearchSelectOption } from '../../../shared/components/ui/forms/search-select.component';

/**
 * Prepend a real empty choice (value null) so the first catalog row is never an implicit selection.
 * @see docs/codex/temas/empleados-estados-completitud-aptitud.md — Selects y opciones vacías
 */
export function withEmptyNumberCatalog(
  options: ReadonlyArray<{ value: number; label: string }>,
  emptyLabel: string,
): SearchSelectOption[] {
  return [{ value: null, label: emptyLabel }, ...options.map((o) => ({ value: o.value, label: o.label }))];
}

export function withEmptyStringCatalog<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  emptyLabel: string,
): SearchSelectOption[] {
  return [{ value: null, label: emptyLabel }, ...options.map((o) => ({ value: o.value, label: o.label }))];
}
