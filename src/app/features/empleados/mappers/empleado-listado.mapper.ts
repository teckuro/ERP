import { EmpleadoEstado, EmpleadoListado } from '../models/empleado-listado.model';

export interface PersonaFactorEmpleadoRow {
  id_persona: number;
  id_contrato: number | null;
  rut: string | null;
  dv: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  cargo: string | null;
  fingreso: string | null;
  base: number | null;
  estado: string | null;
  estado_contrato: string | null;
}

export function mapPersonaFactorToEmpleado(
  row: PersonaFactorEmpleadoRow,
  departamentos: Map<number, string>,
): EmpleadoListado {
  const rut = row.rut ? formatRut(row.rut, row.dv ?? '') : 'Sin RUT';
  const nombre = [row.nombres, row.apellido_paterno, row.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: row.id_persona,
    rut,
    nombre: nombre || 'Sin nombre',
    cargo: row.cargo?.trim() || 'Sin cargo',
    departamento:
      (typeof row.id_contrato === 'number' ? departamentos.get(row.id_contrato) : null) ??
      'Sin centro de costo',
    fechaIngreso: row.fingreso ? formatDate(row.fingreso) : 'Sin fecha',
    sueldoBase: row.base ?? 0,
    estado:
      mapPersonaEstadoToEmpleadoEstado(row.estado) ??
      mapContratoEstadoToEmpleadoEstado(row.estado_contrato),
  };
}

export function mapContratoEstadoToEmpleadoEstado(value: string | null): EmpleadoEstado {
  switch (value?.toUpperCase()) {
    case 'ACTIVO':
      return 'activo';
    case 'SUSPENDIDO':
    case 'PENDIENTE':
      return 'suspendido';
    case 'TERMINADO':
      return 'desvinculado';
    default:
      return 'inactivo';
  }
}

export function mapPersonaEstadoToEmpleadoEstado(value: string | null): EmpleadoEstado | null {
  switch (value?.toUpperCase()) {
    case 'BORRADOR':
      return 'borrador';
    case 'EN_PROCESO':
      return 'en_proceso';
    case 'ACTIVO':
      return 'activo';
    case 'SUSPENDIDO':
      return 'suspendido';
    case 'INACTIVO':
      return 'inactivo';
    case 'DESVINCULADO':
      return 'desvinculado';
    case 'BLOQUEADO':
      return 'bloqueado';
    default:
      return null;
  }
}

export function mapEmpleadoEstadoToPersonaEstado(value: EmpleadoEstado): string {
  switch (value) {
    case 'borrador':
      return 'BORRADOR';
    case 'en_proceso':
      return 'EN_PROCESO';
    case 'activo':
      return 'ACTIVO';
    case 'suspendido':
      return 'SUSPENDIDO';
    case 'inactivo':
      return 'INACTIVO';
    case 'desvinculado':
      return 'DESVINCULADO';
    case 'bloqueado':
      return 'BLOQUEADO';
  }
}

export function mapEmpleadoEstadoToContratoEstado(value: EmpleadoEstado): string {
  switch (value) {
    case 'activo':
      return 'ACTIVO';
    case 'suspendido':
    case 'bloqueado':
      return 'SUSPENDIDO';
    case 'inactivo':
    case 'borrador':
    case 'en_proceso':
    case 'desvinculado':
      return 'TERMINADO';
  }
}

export function formatRut(rut: string, dv: string): string {
  if (!rut || !dv) {
    return rut || 'Sin RUT';
  }

  const reversedDigits = rut.split('').reverse();
  const parts: string[] = [];

  for (let index = 0; index < reversedDigits.length; index += 3) {
    parts.push(
      reversedDigits
        .slice(index, index + 3)
        .reverse()
        .join(''),
    );
  }

  return `${parts.reverse().join('.')}-${dv}`;
}

export function formatDate(value: string): string {
  const normalized = value.slice(0, 10);
  const [year, month, day] = normalized.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}
