import { Enums, Tables } from '../../../core/models/database.types';
import {
  EmpleadoEstado,
  EmpleadoEstadoFicha,
  EmpleadoListado,
} from '../models/empleado-listado.model';

type PersonaEstadoDb = Enums<'tipo_estado_persona_enum'>;
type EstadoFichaDb = Enums<'tipo_estado_ficha_enum'>;
type PersonaFactorRow = Tables<'vw_persona_factores'>;

export type PersonaFactorEmpleadoRow = Pick<
  PersonaFactorRow,
  | 'id_contrato'
  | 'rut'
  | 'dv'
  | 'nombres'
  | 'apellido_paterno'
  | 'apellido_materno'
  | 'cargo'
  | 'fingreso'
  | 'base'
  | 'estado'
  | 'estado_contrato'
  | 'estado_ficha'
> & {
  id_persona: number;
  apto_para_remuneraciones?: boolean | null;
  paso_alta_avanzada?: number | null;
};

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
    idContrato: row.id_contrato ?? null,
    rut,
    nombre: nombre || 'Nuevo Colaborador',
    cargo: row.cargo?.trim() || 'Sin cargo',
    departamento:
      (typeof row.id_contrato === 'number' ? departamentos.get(row.id_contrato) : null) ??
      'Sin centro de costo',
    fechaIngreso: row.fingreso ? formatDate(row.fingreso) : 'Sin fecha',
    sueldoBase: row.base ?? 0,
    estado:
      mapPersonaEstadoToEmpleadoEstado(row.estado) ??
      mapEstadoFichaToEmpleadoEstado(row.estado_ficha) ??
      mapContratoEstadoToEmpleadoEstado(row.estado_contrato),
    estadoFicha: row.estado_ficha ?? 'INCOMPLETO',
    aptoParaRemuneraciones: row.apto_para_remuneraciones ?? row.estado_ficha === 'VALIDO',
    pasoAltaAvanzada:
      typeof row.paso_alta_avanzada === 'number' ? row.paso_alta_avanzada : null,
  };
}

export function mapContratoEstadoToEmpleadoEstado(value: string | null): EmpleadoEstado {
  switch (value?.toUpperCase()) {
    case 'ACTIVO':
      return 'activo';
    case 'SUSPENDIDO':
      return 'suspendido';
    case 'PENDIENTE':
      return 'en_proceso';
    case 'TERMINADO':
      return 'desvinculado';
    default:
      return 'inactivo';
  }
}

export function mapPersonaEstadoToEmpleadoEstado(
  value: PersonaEstadoDb | null,
): EmpleadoEstado | null {
  switch (value) {
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

export function mapEstadoFichaToEmpleadoEstado(value: EstadoFichaDb | null): EmpleadoEstado | null {
  switch (value) {
    case 'BORRADOR':
      return 'borrador';
    case 'INCOMPLETO':
      return 'en_proceso';
    case 'VALIDO':
      return 'activo';
    default:
      return null;
  }
}

export function mapEmpleadoEstadoToPersonaEstado(value: EmpleadoEstado): PersonaEstadoDb {
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
    case 'borrador':
    case 'en_proceso':
      return 'PENDIENTE';
    case 'activo':
      return 'ACTIVO';
    case 'suspendido':
    case 'bloqueado':
      return 'SUSPENDIDO';
    case 'desvinculado':
      return 'TERMINADO';
    case 'inactivo':
      return 'SUSPENDIDO';
  }
}

export function mapEmpleadoEstadoToEstadoFicha(value: EmpleadoEstado): EstadoFichaDb {
  switch (value) {
    case 'borrador':
      return 'BORRADOR';
    case 'activo':
      return 'VALIDO';
    case 'en_proceso':
    case 'suspendido':
    case 'inactivo':
    case 'desvinculado':
    case 'bloqueado':
      return 'INCOMPLETO';
  }
}

export function mapEstadoFichaDbToEmpleadoEstadoFicha(
  value: EstadoFichaDb | null,
): EmpleadoEstadoFicha {
  return value ?? 'INCOMPLETO';
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
