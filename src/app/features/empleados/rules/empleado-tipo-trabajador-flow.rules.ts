import { EmpleadoCatalogOption } from '../models/empleado-catalogos.model';
import { RelacionLaboral } from '../models/empleado.model';

export type TipoTrabajadorBase = 'DEPENDIENTE' | 'INDEPENDIENTE';

export function tipoTrabajadorBaseParaRelacion(relacionLaboral: RelacionLaboral): TipoTrabajadorBase {
  return relacionLaboral === 'HONORARIOS' ? 'INDEPENDIENTE' : 'DEPENDIENTE';
}

export function normalizarTipoTrabajadorLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export function esTipoTrabajadorBase(label: string, base: TipoTrabajadorBase): boolean {
  return normalizarTipoTrabajadorLabel(label) === base;
}

function labelIncluyeTipoTrabajadorBase(label: string, base: TipoTrabajadorBase): boolean {
  const words = normalizarTipoTrabajadorLabel(label).split(/\s+/).filter(Boolean);
  return words.includes(base);
}

export function buscarTipoTrabajadorBase(
  options: readonly EmpleadoCatalogOption[],
  base: TipoTrabajadorBase,
): EmpleadoCatalogOption | null {
  const exact = options.find((option) => esTipoTrabajadorBase(option.label, base));
  if (exact) {
    return exact;
  }

  return options.find((option) => labelIncluyeTipoTrabajadorBase(option.label, base)) ?? null;
}

export function descripcionTipoTrabajadorBase(base: TipoTrabajadorBase): string {
  return base === 'DEPENDIENTE'
    ? 'Derivado desde relación laboral Contrato. Las condiciones especiales se declaran aparte si aplican.'
    : 'Derivado desde Boleta de honorarios. No corresponde flujo laboral dependiente en esta fase.';
}
