import { formatRut } from '../mappers/empleado-listado.mapper';

export interface RutParts {
  rut: string;
  dv: string;
}

export function parseRut(value: string): RutParts {
  const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();

  if (cleaned.length < 2) {
    throw new Error('El RUT no tiene un formato valido.');
  }

  const rut = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!/^\d{7,9}$/.test(rut) || !/^[0-9K]$/.test(dv)) {
    throw new Error('El RUT no tiene un formato valido.');
  }

  return { rut, dv };
}

export function formatRutParts(parts: RutParts): string {
  return formatRut(parts.rut, parts.dv);
}
