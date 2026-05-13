import { Injectable } from '@angular/core';

import { injectSupabase } from '../../../core/services/supabase.service';
import type { MovimientoVariable, MovimientoVariableActualizarPayload, MovimientoVariableAnularPayload, MovimientoVariableCrearPayload, MovimientoVariableEstado } from '../models/movimiento-variable.model';
import {
  existeDuplicadoMovimientoVariable,
  puedeAnularMovimientoVariable,
  validarMovimientoVariableInput,
  type MovimientoVariableFilaDuplicado,
  type MovimientoVariableInput,
} from '../rules/movimiento-variable-validacion.rules';
import {
  mapActualizarPayloadToUpdate,
  mapAnularPayloadToUpdate,
  mapCrearPayloadToInsert,
  mapRowToMovimientoVariable,
  type MovimientoVariableMensualRow,
} from './movimientos-variables.mapper';

/** Columnas seleccionadas en consultas al repositorio. */
const SELECT_MOVVAR =
  'id_movimiento_variable, id_persona, id_concepto, periodo, monto, estado, origen, observacion, fecha_registro, fecha_actualizacion, fecha_anulacion, motivo_anulacion';

const ESTADOS_SIN_EDICION: readonly MovimientoVariableEstado[] = ['ANULADO', 'BLOQUEADO', 'INCLUIDO_EN_PROCESO'];

function assertValidacion(valido: boolean, motivos: string[]): void {
  if (!valido) {
    throw new Error(motivos.join(' '));
  }
}

function mergeParaValidacion(actual: MovimientoVariable, patch: MovimientoVariableActualizarPayload): MovimientoVariableInput {
  return {
    idPersona: patch.idPersona ?? actual.idPersona,
    idConcepto: patch.idConcepto ?? actual.idConcepto,
    periodo: patch.periodo ?? actual.periodo,
    monto: patch.monto ?? actual.monto,
    estado: patch.estado ?? actual.estado,
    observacion: patch.observacion !== undefined ? patch.observacion : actual.observacion ?? null,
  };
}

function filasDuplicadoDesdeMovimientos(rows: MovimientoVariable[]): MovimientoVariableFilaDuplicado[] {
  return rows.map((r) => ({
    idPersona: r.idPersona,
    idConcepto: r.idConcepto,
    periodo: r.periodo,
    estado: r.estado,
  }));
}

/** Acceso a datos de movimientos variables mensuales (Supabase). Sin borrado físico; validación alineada a reglas 9.4B. */
@Injectable({ providedIn: 'root' })
export class MovimientosVariablesRepository {
  private readonly supabase = injectSupabase();

  async listarPorPeriodo(periodo: string): Promise<MovimientoVariable[]> {
    const per = periodo.trim();
    const { data, error } = await this.supabase
      .from('movimiento_variable_mensual')
      .select(SELECT_MOVVAR)
      .eq('periodo', per)
      .order('id_movimiento_variable', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRowToMovimientoVariable(row as MovimientoVariableMensualRow));
  }

  async listarPorPersonaYPeriodo(idPersona: number, periodo: string): Promise<MovimientoVariable[]> {
    const per = periodo.trim();
    const { data, error } = await this.supabase
      .from('movimiento_variable_mensual')
      .select(SELECT_MOVVAR)
      .eq('id_persona', idPersona)
      .eq('periodo', per)
      .order('id_movimiento_variable', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRowToMovimientoVariable(row as MovimientoVariableMensualRow));
  }

  async obtenerPorId(idMovimiento: number): Promise<MovimientoVariable | null> {
    const { data, error } = await this.supabase
      .from('movimiento_variable_mensual')
      .select(SELECT_MOVVAR)
      .eq('id_movimiento_variable', idMovimiento)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return mapRowToMovimientoVariable(data as MovimientoVariableMensualRow);
  }

  async listarDuplicadosOperativos(
    idPersona: number,
    idConcepto: number,
    periodo: string,
    excluirIdMovimiento?: number,
  ): Promise<MovimientoVariable[]> {
    const per = periodo.trim();
    let query = this.supabase
      .from('movimiento_variable_mensual')
      .select(SELECT_MOVVAR)
      .eq('id_persona', idPersona)
      .eq('id_concepto', idConcepto)
      .eq('periodo', per)
      .neq('estado', 'ANULADO');

    if (excluirIdMovimiento != null) {
      query = query.neq('id_movimiento_variable', excluirIdMovimiento);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRowToMovimientoVariable(row as MovimientoVariableMensualRow));
  }

  async crear(payload: MovimientoVariableCrearPayload): Promise<MovimientoVariable> {
    const input: MovimientoVariableInput = {
      idPersona: payload.idPersona,
      idConcepto: payload.idConcepto,
      periodo: payload.periodo,
      monto: payload.monto,
      estado: payload.estado ?? 'BORRADOR',
      observacion: payload.observacion ?? null,
    };
    const v = validarMovimientoVariableInput(input, null);
    assertValidacion(v.valido, v.motivos);

    const dupRows = await this.listarDuplicadosOperativos(payload.idPersona, payload.idConcepto, payload.periodo);
    const dup = existeDuplicadoMovimientoVariable(input, filasDuplicadoDesdeMovimientos(dupRows));
    if (dup) {
      throw new Error('Ya existe un movimiento operativo para el mismo trabajador, concepto y periodo.');
    }

    const insert = mapCrearPayloadToInsert(payload);
    const { data, error } = await this.supabase
      .from('movimiento_variable_mensual')
      .insert(insert)
      .select(SELECT_MOVVAR)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToMovimientoVariable(data as MovimientoVariableMensualRow);
  }

  async actualizar(idMovimiento: number, payload: MovimientoVariableActualizarPayload): Promise<MovimientoVariable> {
    if (payload.idMovimiento !== idMovimiento) {
      throw new Error('El id del movimiento no coincide con la solicitud.');
    }

    const actual = await this.obtenerPorId(idMovimiento);
    if (!actual) {
      throw new Error('Movimiento no encontrado.');
    }

    if (ESTADOS_SIN_EDICION.includes(actual.estado)) {
      throw new Error('No se puede actualizar un movimiento anulado, bloqueado o incluido en proceso.');
    }

    if (payload.estado === 'ANULADO') {
      throw new Error('Para anular debe usar la operación de anulación.');
    }

    const merged = mergeParaValidacion(actual, payload);
    const v = validarMovimientoVariableInput(merged, null);
    assertValidacion(v.valido, v.motivos);

    const dupRows = await this.listarDuplicadosOperativos(
      merged.idPersona!,
      merged.idConcepto!,
      merged.periodo!,
      idMovimiento,
    );
    const dup = existeDuplicadoMovimientoVariable(merged, filasDuplicadoDesdeMovimientos(dupRows));
    if (dup) {
      throw new Error('Ya existe un movimiento operativo para el mismo trabajador, concepto y periodo.');
    }

    const patch = mapActualizarPayloadToUpdate(payload);
    const clavesConCambio = Object.keys(patch).filter((k) => k !== 'fecha_actualizacion');
    if (clavesConCambio.length === 0) {
      return actual;
    }

    const { data, error } = await this.supabase
      .from('movimiento_variable_mensual')
      .update(patch)
      .eq('id_movimiento_variable', idMovimiento)
      .select(SELECT_MOVVAR)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToMovimientoVariable(data as MovimientoVariableMensualRow);
  }

  async anular(idMovimiento: number, payload: MovimientoVariableAnularPayload): Promise<MovimientoVariable> {
    if (payload.idMovimiento !== idMovimiento) {
      throw new Error('El id del movimiento no coincide con la solicitud.');
    }

    const actual = await this.obtenerPorId(idMovimiento);
    if (!actual) {
      throw new Error('Movimiento no encontrado.');
    }

    const p = puedeAnularMovimientoVariable(actual.estado);
    assertValidacion(p.valido, p.motivos);

    const patch = mapAnularPayloadToUpdate(payload);
    const { data, error } = await this.supabase
      .from('movimiento_variable_mensual')
      .update(patch)
      .eq('id_movimiento_variable', idMovimiento)
      .select(SELECT_MOVVAR)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRowToMovimientoVariable(data as MovimientoVariableMensualRow);
  }
}
