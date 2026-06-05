/**
 * Repositorio productivo de la cabecera Nómina mensual (rebuild Admin + Generador).
 *
 * Creado en `NOM-REBUILD-NOMINA-MENSUAL-01` (F3b, 2026-06-04).
 *
 * Operaciones por tabla:
 *   - nomina_periodo: listar / obtener / crear / actualizar estado.
 *   - segmento_nomina: listar por nómina / upsert / eliminar.
 *   - movimiento_recurrente: listar activos de la empresa.
 *   - movimiento_nomina: listar por nómina / insertar / actualizar estado (omitir).
 *   - incidencia_nomina: listar por nómina / upsert.
 *   - evento_auditoria_nomina: listar por nómina / insertar.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import { Injectable } from '@angular/core';

import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  EstadoNomina,
  EventoAuditoriaNomina,
  IncidenciaNomina,
  NominaPeriodo,
  SegmentoNomina,
  EstadoTrabajadorNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
  PaginacionGrilla,
} from '../models/nomina-periodo.models';
import type {
  MovimientoNomina,
  MovimientoRecurrente,
} from '../models/movimiento-nomina.models';
import type { PayrollStepId } from '../../nomina-mensual-v2/models/nomina-mensual-v2.models';
import {
  ensamblarNominaPeriodo,
  eventoAuditoriaToInsert,
  incidenciaNominaToInsert,
  movimientoNominaToInsert,
  type MovimientoNominaInsert,
  nominaPeriodoEstadoToUpdate,
  nominaPeriodoToInsert,
  type NominaPeriodoUpdate,
  rowToEventoAuditoria,
  rowToIncidenciaNomina,
  rowToMovimientoNomina,
  rowToMovimientoRecurrente,
  rowToNominaPeriodoResumen,
  rowToSegmentoNomina,
  segmentoNominaToInsert,
} from '../mappers/nomina-periodo.mapper';
import type { NominaPeriodoResumen } from '../models/nomina-periodo.models';

interface CrearNominaPayload {
  empresaId: string;
  empresaNombre: string;
  periodo: string;
  tipo: NominaPeriodo['tipo'];
}

interface GuardarTotalesPayload {
  totalHaberes?: number;
  totalDescuentos?: number;
  totalLiquido?: number;
  totalTrabajadores?: number;
  totalSegmentos?: number;
  totalIncidenciasCriticas?: number;
  totalAdvertencias?: number;
}

export interface TransicionNominaPayload {
  estadoEsperado: EstadoNomina;
  estadoDestino: EstadoNomina;
  motivo?: string;
  idCalculoPeriodo?: number;
  totalTrabajadores?: number;
  totalHaberes?: number;
  totalDescuentos?: number;
  totalLiquido?: number;
}

function throwIfError(error: { message: string } | null, contexto: string): void {
  if (error) {
    throw new Error(`${contexto}: ${error.message}`);
  }
}

@Injectable({ providedIn: 'root' })
export class NominaPeriodoRepository {
  private readonly supabase = injectSupabase();

  // -------------------------------------------------------------------------
  // nomina_periodo
  // -------------------------------------------------------------------------

  async listarResumenes(idEmpresa: number): Promise<NominaPeriodoResumen[]> {
    const { data, error } = await this.supabase
      .from('nomina_periodo')
      .select('*')
      .eq('id_empresa', idEmpresa)
      .order('periodo', { ascending: false })
      .order('created_at', { ascending: false });

    throwIfError(error, 'listarResumenes');
    return (data ?? []).map((row) => rowToNominaPeriodoResumen(row));
  }

  async obtenerCabecera(id: string): Promise<NominaPeriodoResumen | null> {
    const { data, error } = await this.supabase
      .from('nomina_periodo')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    throwIfError(error, 'obtenerCabecera');
    return data ? rowToNominaPeriodoResumen(data) : null;
  }

  async obtenerNominaCompleta(id: string): Promise<NominaPeriodo | null> {
    const cabPromise = this.supabase
      .from('nomina_periodo')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    const segPromise = this.supabase
      .from('segmento_nomina')
      .select('*')
      .eq('id_nomina_periodo', id)
      .order('ordinal', { ascending: true });
    const movPromise = this.supabase
      .from('movimiento_nomina')
      .select('*')
      .eq('id_nomina_periodo', id);
    const incPromise = this.supabase
      .from('incidencia_nomina')
      .select('*')
      .eq('id_nomina_periodo', id);

    const [cab, seg, mov, inc] = await Promise.all([cabPromise, segPromise, movPromise, incPromise]);

    throwIfError(cab.error, 'obtenerNominaCompleta.cabecera');
    if (!cab.data) return null;
    throwIfError(seg.error, 'obtenerNominaCompleta.segmentos');
    throwIfError(mov.error, 'obtenerNominaCompleta.movimientos');
    throwIfError(inc.error, 'obtenerNominaCompleta.incidencias');

    return ensamblarNominaPeriodo({
      cabecera: cab.data,
      segmentos: seg.data ?? [],
      movimientos: mov.data ?? [],
      incidencias: inc.data ?? [],
    });
  }

  async crear(payload: CrearNominaPayload): Promise<NominaPeriodoResumen> {
    const insert = nominaPeriodoToInsert(payload);
    const { data, error } = await this.supabase
      .from('nomina_periodo')
      .insert(insert)
      .select('*')
      .single();

    throwIfError(error, 'crearNominaPeriodo');
    if (!data) {
      throw new Error('crearNominaPeriodo: BD no retornó la fila creada');
    }
    return rowToNominaPeriodoResumen(data);
  }

  async actualizarEstado(id: string, estado: NominaPeriodo['estado']): Promise<void> {
    const { error } = await this.supabase
      .from('nomina_periodo')
      .update(nominaPeriodoEstadoToUpdate(estado))
      .eq('id', id);
    throwIfError(error, 'actualizarEstado');
  }

  async transicionarEstado(
    id: string,
    payload: TransicionNominaPayload,
  ): Promise<NominaPeriodoResumen> {
    const { data, error } = await this.supabase.rpc('transicionar_nomina_periodo', {
      p_nomina_id: id,
      p_estado_esperado: payload.estadoEsperado,
      p_estado_destino: payload.estadoDestino,
      p_motivo: payload.motivo ?? null,
      p_id_calculo_periodo: payload.idCalculoPeriodo ?? null,
      p_total_trabajadores: payload.totalTrabajadores ?? null,
      p_total_haberes: payload.totalHaberes ?? null,
      p_total_descuentos: payload.totalDescuentos ?? null,
      p_total_liquido: payload.totalLiquido ?? null,
    });
    throwIfError(error, 'transicionarEstado');
    if (!data) {
      throw new Error('transicionarEstado: BD no retornó la nómina actualizada');
    }
    return rowToNominaPeriodoResumen(data);
  }

  /**
   * Persiste el último paso del Generador visitado (metadata UX, no parte de
   * la máquina de estados). Invoca el RPC dedicado para no contaminar
   * `updated_at` (que sigue reflejando cambios productivos del negocio).
   */
  async actualizarUltimoPasoVisitado(id: string, paso: PayrollStepId): Promise<void> {
    const { error } = await this.supabase.rpc('actualizar_paso_visitado_nomina', {
      p_nomina_id: id,
      p_paso: paso,
    });
    throwIfError(error, 'actualizarUltimoPasoVisitado');
  }

  /**
   * Persiste el máximo paso completado (criterio UI). La RPC es monótona:
   * si el paso actual ya es igual o posterior, no actualiza. No toca
   * `updated_at`, igual que `actualizarUltimoPasoVisitado`.
   */
  async actualizarMaximoPasoCompletado(id: string, paso: PayrollStepId): Promise<void> {
    const { error } = await this.supabase.rpc('actualizar_maximo_paso_completado_nomina', {
      p_nomina_id: id,
      p_paso: paso,
    });
    throwIfError(error, 'actualizarMaximoPasoCompletado');
  }

  async invalidarCalculo(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('nomina_periodo')
      .update({
        calculo_vigente: false,
        id_calculo_periodo_vigente: null,
        validado_at: null,
        aprobado_at: null,
      })
      .eq('id', id);
    throwIfError(error, 'invalidarCalculo');
  }

  async actualizarTotales(id: string, totales: GuardarTotalesPayload): Promise<void> {
    const update: NominaPeriodoUpdate = {};
    if (totales.totalHaberes !== undefined) update.total_haberes = totales.totalHaberes;
    if (totales.totalDescuentos !== undefined) update.total_descuentos = totales.totalDescuentos;
    if (totales.totalLiquido !== undefined) update.total_liquido = totales.totalLiquido;
    if (totales.totalTrabajadores !== undefined) update.total_trabajadores = totales.totalTrabajadores;
    if (totales.totalSegmentos !== undefined) update.total_segmentos = totales.totalSegmentos;
    if (totales.totalIncidenciasCriticas !== undefined) {
      update.total_incidencias_criticas = totales.totalIncidenciasCriticas;
    }
    if (totales.totalAdvertencias !== undefined) update.total_advertencias = totales.totalAdvertencias;

    if (Object.keys(update).length === 0) return;

    const { error } = await this.supabase.from('nomina_periodo').update(update).eq('id', id);
    throwIfError(error, 'actualizarTotales');
  }

  async eliminarBorrador(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('nomina_periodo')
      .delete()
      .eq('id', id)
      .eq('estado', 'borrador');
    throwIfError(error, 'eliminarBorrador');
  }

  // -------------------------------------------------------------------------
  // segmento_nomina
  // -------------------------------------------------------------------------

  async listarSegmentos(nominaPeriodoId: string): Promise<SegmentoNomina[]> {
    const { data, error } = await this.supabase
      .from('segmento_nomina')
      .select('*')
      .eq('id_nomina_periodo', nominaPeriodoId)
      .order('ordinal', { ascending: true });

    throwIfError(error, 'listarSegmentos');
    return (data ?? []).map(rowToSegmentoNomina);
  }

  async obtenerSegmento(id: string): Promise<SegmentoNomina | null> {
    const { data, error } = await this.supabase
      .from('segmento_nomina')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfError(error, 'obtenerSegmento');
    return data ? rowToSegmentoNomina(data) : null;
  }

  async upsertSegmento(segmento: SegmentoNomina, idEmpresa: number): Promise<SegmentoNomina> {
    const insert = segmentoNominaToInsert(segmento, idEmpresa);
    const { data, error } = await this.supabase
      .from('segmento_nomina')
      .upsert(insert, { onConflict: 'id' })
      .select('*')
      .single();

    throwIfError(error, 'upsertSegmento');
    if (!data) {
      throw new Error('upsertSegmento: BD no retornó la fila guardada');
    }
    return rowToSegmentoNomina(data);
  }

  async eliminarSegmento(id: string): Promise<void> {
    const { error } = await this.supabase.from('segmento_nomina').delete().eq('id', id);
    throwIfError(error, 'eliminarSegmento');
  }

  async listarDotacionPaginada(
    nominaPeriodoId: string,
    filtro: FiltroRapidoDotacion,
    paginacion: PaginacionGrilla,
  ): Promise<{ filas: FilaTrabajadorNominaResumen[]; total: number }> {
    const { data, error } = await this.supabase.rpc('listar_dotacion_nomina', {
      p_nomina_id: nominaPeriodoId,
      p_page: paginacion.page,
      p_page_size: paginacion.pageSize,
      p_busqueda: filtro.busqueda ?? null,
      p_estado: filtro.estado ?? null,
      p_segmento_id: filtro.segmentoId ?? null,
      p_con_incidencias: filtro.conIncidencias ?? null,
      p_con_movimientos: filtro.conMovimientos ?? null,
    });
    throwIfError(error, 'listarDotacionPaginada');
    const rows = data ?? [];
    return {
      total: Number(rows[0]?.total_count ?? 0),
      filas: rows.map((row) => ({
        trabajadorId: String(row.trabajador_id),
        nombre: row.nombre,
        rut: row.rut,
        segmentoId: row.segmento_id ?? undefined,
        estado: row.estado as EstadoTrabajadorNomina,
        totalIncidenciasCriticas: Number(row.total_incidencias_criticas),
        totalAdvertencias: Number(row.total_advertencias),
        totalMovimientos: Number(row.total_movimientos),
        tieneDatosBancarios: true,
        tieneDatosPrevisionales: true,
      })),
    };
  }

  // -------------------------------------------------------------------------
  // movimiento_recurrente
  // -------------------------------------------------------------------------

  async listarRecurrentes(idEmpresa: number): Promise<MovimientoRecurrente[]> {
    const { data, error } = await this.supabase
      .from('movimiento_recurrente')
      .select('*')
      .eq('id_empresa', idEmpresa)
      .order('created_at', { ascending: false });
    throwIfError(error, 'listarRecurrentes');
    return (data ?? []).map(rowToMovimientoRecurrente);
  }

  async listarRecurrentesActivos(idEmpresa: number): Promise<MovimientoRecurrente[]> {
    const { data, error } = await this.supabase
      .from('movimiento_recurrente')
      .select('*')
      .eq('id_empresa', idEmpresa)
      .eq('estado', 'activo');
    throwIfError(error, 'listarRecurrentesActivos');
    return (data ?? []).map(rowToMovimientoRecurrente);
  }

  // -------------------------------------------------------------------------
  // movimiento_nomina
  // -------------------------------------------------------------------------

  async listarMovimientos(nominaPeriodoId: string): Promise<MovimientoNomina[]> {
    const { data, error } = await this.supabase
      .from('movimiento_nomina')
      .select('*')
      .eq('id_nomina_periodo', nominaPeriodoId);
    throwIfError(error, 'listarMovimientos');
    return (data ?? []).map(rowToMovimientoNomina);
  }

  async obtenerMovimiento(id: string): Promise<MovimientoNomina | null> {
    const { data, error } = await this.supabase
      .from('movimiento_nomina')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwIfError(error, 'obtenerMovimiento');
    return data ? rowToMovimientoNomina(data) : null;
  }

  async insertarMovimientos(
    movimientos: ReadonlyArray<Omit<MovimientoNomina, 'createdAt' | 'updatedAt'>>,
    idEmpresa: number,
  ): Promise<MovimientoNomina[]> {
    if (movimientos.length === 0) return [];

    const inserts: MovimientoNominaInsert[] = movimientos.map((m) =>
      movimientoNominaToInsert(m, idEmpresa),
    );

    const { data, error } = await this.supabase
      .from('movimiento_nomina')
      .insert(inserts)
      .select('*');

    throwIfError(error, 'insertarMovimientos');
    return (data ?? []).map(rowToMovimientoNomina);
  }

  async actualizarEstadoMovimiento(
    id: string,
    estado: MovimientoNomina['estado'],
  ): Promise<void> {
    const { error } = await this.supabase
      .from('movimiento_nomina')
      .update({ estado })
      .eq('id', id);
    throwIfError(error, 'actualizarEstadoMovimiento');
  }

  // -------------------------------------------------------------------------
  // incidencia_nomina
  // -------------------------------------------------------------------------

  async listarIncidencias(nominaPeriodoId: string): Promise<IncidenciaNomina[]> {
    const { data, error } = await this.supabase
      .from('incidencia_nomina')
      .select('*')
      .eq('id_nomina_periodo', nominaPeriodoId)
      .is('resuelta_at', null);
    throwIfError(error, 'listarIncidencias');
    return (data ?? []).map(rowToIncidenciaNomina);
  }

  async reemplazarIncidencias(
    nominaPeriodoId: string,
    incidencias: ReadonlyArray<IncidenciaNomina>,
  ): Promise<void> {
    const { error: errDel } = await this.supabase
      .from('incidencia_nomina')
      .delete()
      .eq('id_nomina_periodo', nominaPeriodoId);
    throwIfError(errDel, 'reemplazarIncidencias.delete');

    if (incidencias.length === 0) return;

    const inserts = incidencias.map((inc) =>
      incidenciaNominaToInsert({ ...inc, nominaPeriodoId }),
    );
    const { error: errIns } = await this.supabase.from('incidencia_nomina').insert(inserts);
    throwIfError(errIns, 'reemplazarIncidencias.insert');
  }

  // -------------------------------------------------------------------------
  // evento_auditoria_nomina
  // -------------------------------------------------------------------------

  async listarEventosAuditoria(nominaPeriodoId: string): Promise<EventoAuditoriaNomina[]> {
    const { data, error } = await this.supabase
      .from('evento_auditoria_nomina')
      .select('*')
      .eq('id_nomina_periodo', nominaPeriodoId)
      .order('created_at', { ascending: false });
    throwIfError(error, 'listarEventosAuditoria');
    return (data ?? []).map(rowToEventoAuditoria);
  }

  async registrarEventoAuditoria(
    evento: Omit<EventoAuditoriaNomina, 'id' | 'createdAt'>,
  ): Promise<EventoAuditoriaNomina> {
    const { data, error } = await this.supabase
      .from('evento_auditoria_nomina')
      .insert(eventoAuditoriaToInsert(evento))
      .select('*')
      .single();
    throwIfError(error, 'registrarEventoAuditoria');
    if (!data) {
      throw new Error('registrarEventoAuditoria: BD no retornó la fila creada');
    }
    return rowToEventoAuditoria(data);
  }
}
