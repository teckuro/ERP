/** Conversion entre filas Supabase (snake_case) y el modelo de dominio (camelCase). */
import type { Tables, TablesInsert, TablesUpdate } from '../../../core/models/database.types';
import type {
  MovimientoVariable,
  MovimientoVariableActualizarPayload,
  MovimientoVariableAnularPayload,
  MovimientoVariableCrearPayload,
  MovimientoVariableEstado,
  MovimientoVariableOrigen,
} from '../models/movimiento-variable.model';

export type MovimientoVariableMensualRow = Tables<'movimiento_variable_mensual'>;

export function mapRowToMovimientoVariable(row: MovimientoVariableMensualRow): MovimientoVariable {
  return {
    idMovimiento: row.id_movimiento_variable,
    idPersona: row.id_persona,
    idConcepto: row.id_concepto,
    periodo: (row.periodo as string).trim(),
    monto: Number(row.monto),
    estado: row.estado as MovimientoVariableEstado,
    origen: (row.origen ?? 'MANUAL') as MovimientoVariableOrigen,
    observacion: row.observacion ?? null,
    fechaRegistro: row.fecha_registro ?? null,
    fechaActualizacion: row.fecha_actualizacion ?? null,
    fechaAnulacion: row.fecha_anulacion ?? null,
    motivoAnulacion: row.motivo_anulacion ?? null,
  };
}

export function mapCrearPayloadToInsert(
  payload: MovimientoVariableCrearPayload,
): TablesInsert<'movimiento_variable_mensual'> {
  const estado = payload.estado ?? 'BORRADOR';
  const origen = payload.origen ?? 'MANUAL';
  const insert: TablesInsert<'movimiento_variable_mensual'> = {
    id_persona: payload.idPersona,
    id_concepto: payload.idConcepto,
    periodo: payload.periodo.trim(),
    monto: payload.monto,
    estado,
    origen,
    observacion: payload.observacion ?? null,
  };
  return insert;
}

/**
 * Solo incluye columnas presentes en el payload (además de fecha_actualizacion).
 * No usar para transición a ANULADO: usar mapAnularPayloadToUpdate.
 */
export function mapActualizarPayloadToUpdate(
  payload: MovimientoVariableActualizarPayload,
): TablesUpdate<'movimiento_variable_mensual'> {
  const { idMovimiento: _id, ...rest } = payload;
  void _id;
  const patch: TablesUpdate<'movimiento_variable_mensual'> = {
    fecha_actualizacion: new Date().toISOString(),
  };
  if (rest.idPersona !== undefined) {
    patch.id_persona = rest.idPersona;
  }
  if (rest.idConcepto !== undefined) {
    patch.id_concepto = rest.idConcepto;
  }
  if (rest.periodo !== undefined) {
    patch.periodo = rest.periodo.trim();
  }
  if (rest.monto !== undefined) {
    patch.monto = rest.monto;
  }
  if (rest.estado !== undefined) {
    patch.estado = rest.estado;
  }
  if (rest.observacion !== undefined) {
    patch.observacion = rest.observacion;
  }
  return patch;
}

export function mapAnularPayloadToUpdate(
  payload: MovimientoVariableAnularPayload,
): TablesUpdate<'movimiento_variable_mensual'> {
  const now = new Date().toISOString();
  return {
    estado: 'ANULADO',
    fecha_anulacion: now,
    fecha_actualizacion: now,
    motivo_anulacion: payload.motivo?.trim() ? payload.motivo.trim() : null,
  };
}
