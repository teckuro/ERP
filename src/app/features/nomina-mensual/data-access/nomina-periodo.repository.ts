/**
 * Repositorio productivo de la cabecera Nómina mensual (rebuild Admin + Generador).
 *
 * Creado en `NOM-REBUILD-NOMINA-MENSUAL-01` (F3b, 2026-06-04).
 *
 * Operaciones por tabla:
 *   - nomina_periodo: listar / obtener / transicionar estado (RPC).
 *   - segmento_nomina: listar por nómina / upsert / eliminar.
 *   - movimiento_recurrente: listar activos de la empresa.
 *   - movimiento_nomina: listar por nómina / insertar / actualizar estado (omitir).
 *   - incidencia_nomina: listar por nómina / upsert.
 *   - evento_auditoria_nomina: listar por nómina / insertar.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import { Injectable } from '@angular/core';

import { lanzarSiErrorSupabase, mensajeErrorParaUsuario } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  EstadoNomina,
  EventoAuditoriaNomina,
  IncidenciaNomina,
  IncidenciaNominaNueva,
  NominaPeriodo,
  SegmentoNomina,
  SegmentoNominaNuevo,
  DotacionResumenNomina,
  EstadoTrabajadorNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
  FiltroTrabajadoresElegiblesNomina,
  PaginacionGrilla,
  ResumenTrabajadoresElegiblesNomina,
  FiltroCalculoPorTrabajador,
  FilaCalculoTrabajadorListado,
  ResumenCalculoNomina,
} from '../models/nomina-periodo.models';
import type {
  ConfirmarCreacionRequest,
  ConfirmarCreacionResultado,
  NominaCreatePreview,
  NominaCreatePreviewRequest,
  ClasificacionPreviewCreacion,
  TrabajadorExcluidoPreview,
  TrabajadorIncluidoPreview,
} from '../models/nomina-creacion-preview.models';
import type {
  ConfirmarRectificacionRequest,
  ConfirmarRectificacionResultado,
  RectificacionPreview,
} from '../models/nomina-rectificacion-preview.models';
import {
  mapConfirmarRectificacionResultado,
  mapRectificacionPreview,
} from '../mappers/nomina-rectificacion-preview.mapper';
import {
  mapConfirmarCreacionResultado,
  mapNominaCreatePreview,
} from '../mappers/nomina-creacion-preview.mapper';
import type {
  FilaTrabajadorMovimientos,
  FiltroMovimientosPorTrabajador,
  MovimientoNomina,
  MovimientoNominaNuevo,
  MovimientoRecurrente,
  ResumenMovimientosNomina,
} from '../models/movimiento-nomina.models';
import type { PayrollStepId } from '../../nomina-mensual-v2/models/nomina-mensual-v2.models';
import {
  ensamblarNominaPeriodo,
  eventoAuditoriaToInsert,
  incidenciaNominaToInsert,
  movimientoNominaToInsert,
  type MovimientoNominaInsert,
  type NominaPeriodoUpdate,
  rowToEventoAuditoria,
  rowRpcToEventoAuditoria,
  rowToIncidenciaNomina,
  rowToMovimientoNomina,
  rowToMovimientoRecurrente,
  rowToNominaPeriodoResumen,
  rowToSegmentoNomina,
  segmentoNominaToInsert,
} from '../mappers/nomina-periodo.mapper';
import type { NominaPeriodoResumen } from '../models/nomina-periodo.models';

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
  versionEstadoEsperada: number;
  motivo?: string;
  idCalculoPeriodo?: number;
  totalTrabajadores?: number;
  totalHaberes?: number;
  totalDescuentos?: number;
  totalLiquido?: number;
}

export interface PersonaResumenRow {
  id_persona: number;
  rut: string;
  dv: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
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

    lanzarSiErrorSupabase(error, 'listarResumenes');
    return (data ?? []).map((row) => rowToNominaPeriodoResumen(row));
  }

  async obtenerCabecera(id: string): Promise<NominaPeriodoResumen | null> {
    const { data, error } = await this.supabase
      .from('nomina_periodo')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    lanzarSiErrorSupabase(error, 'obtenerCabecera');
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

    lanzarSiErrorSupabase(cab.error, 'obtenerNominaCompleta.cabecera');
    if (!cab.data) return null;
    lanzarSiErrorSupabase(seg.error, 'obtenerNominaCompleta.segmentos');
    lanzarSiErrorSupabase(mov.error, 'obtenerNominaCompleta.movimientos');
    lanzarSiErrorSupabase(inc.error, 'obtenerNominaCompleta.incidencias');

    return ensamblarNominaPeriodo({
      cabecera: cab.data,
      segmentos: seg.data ?? [],
      movimientos: mov.data ?? [],
      incidencias: inc.data ?? [],
    });
  }

  /**
   * Llama a la RPC F04 `previsualizar_creacion_nomina`. Solo lectura; no escribe.
   * La empresa se resuelve en BD desde el JWT (`current_user_empresa_id()`).
   */
  async previsualizarCreacion(
    request: NominaCreatePreviewRequest,
  ): Promise<NominaCreatePreview> {
    const { data, error } = await this.supabase.rpc('previsualizar_creacion_nomina', {
      p_periodo: request.periodo,
      p_tipo: request.tipo,
      p_codigo_ciclo: request.codigoCiclo ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'previsualizarCreacion');
    return mapNominaCreatePreview(data);
  }

  /**
   * Llama a la RPC F05 `confirmar_creacion_nomina`. Crea cabecera, dotación
   * inicial y auditoría en una sola transacción server-side. Valida el
   * `fingerprint` emitido por F04: si difiere, BD rechaza con 40001.
   */
  async confirmarCreacion(
    request: ConfirmarCreacionRequest,
  ): Promise<ConfirmarCreacionResultado> {
    const { data, error } = await this.supabase.rpc('confirmar_creacion_nomina', {
      p_periodo: request.periodo,
      p_tipo: request.tipo,
      p_fingerprint: request.fingerprint,
      p_codigo_ciclo: request.codigoCiclo ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'confirmarCreacion');
    return mapConfirmarCreacionResultado(data);
  }

  async previsualizarRectificacion(args: {
    nominaOrigenId: string;
    trabajadorIds?: number[];
    motivo?: string;
  }): Promise<RectificacionPreview> {
    const { data, error } = await this.supabase.rpc('previsualizar_rectificacion_nomina', {
      p_nomina_origen_id: args.nominaOrigenId,
      p_trabajador_ids: args.trabajadorIds?.length ? args.trabajadorIds : undefined,
      p_motivo: args.motivo ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'previsualizarRectificacion');
    return mapRectificacionPreview(data);
  }

  async confirmarRectificacion(
    request: ConfirmarRectificacionRequest,
  ): Promise<ConfirmarRectificacionResultado> {
    const { data, error } = await this.supabase.rpc('confirmar_rectificacion_nomina', {
      p_nomina_origen_id: request.nominaOrigenId,
      p_fingerprint: request.fingerprint,
      p_motivo: request.motivo,
      p_trabajador_ids: request.trabajadorIds?.length ? request.trabajadorIds : undefined,
    });
    lanzarSiErrorSupabase(error, 'confirmarRectificacion');
    return mapConfirmarRectificacionResultado(data);
  }

  async transicionarEstado(
    id: string,
    payload: TransicionNominaPayload,
  ): Promise<NominaPeriodoResumen> {
    const { data, error } = await this.supabase.rpc('transicionar_nomina_periodo', {
      p_nomina_id: id,
      p_estado_esperado: payload.estadoEsperado,
      p_estado_destino: payload.estadoDestino,
      p_motivo: payload.motivo ?? undefined,
      p_id_calculo_periodo: payload.idCalculoPeriodo ?? undefined,
      p_total_trabajadores: payload.totalTrabajadores ?? undefined,
      p_total_haberes: payload.totalHaberes ?? undefined,
      p_total_descuentos: payload.totalDescuentos ?? undefined,
      p_total_liquido: payload.totalLiquido ?? undefined,
      p_version_estado_esperada: payload.versionEstadoEsperada,
    });
    lanzarSiErrorSupabase(error, 'transicionarEstado');
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
    lanzarSiErrorSupabase(error, 'actualizarUltimoPasoVisitado');
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
    lanzarSiErrorSupabase(error, 'actualizarMaximoPasoCompletado');
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
    lanzarSiErrorSupabase(error, 'invalidarCalculo');
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
    lanzarSiErrorSupabase(error, 'actualizarTotales');
  }

  async actualizarParametros(
    id: string,
    cambios: { fechaPago?: string | null; estado?: EstadoNomina },
  ): Promise<void> {
    const update: NominaPeriodoUpdate = {};
    if (cambios.fechaPago !== undefined) update.fecha_pago = cambios.fechaPago;
    if (cambios.estado !== undefined) update.estado = cambios.estado;
    if (Object.keys(update).length === 0) return;

    const { error } = await this.supabase.from('nomina_periodo').update(update).eq('id', id);
    lanzarSiErrorSupabase(error, 'guardar los parámetros de la nómina');
  }

  /** RUT y nombre de las personas indicadas (para etiquetas de trabajadores en la nómina). */
  async listarPersonasResumidas(idsPersona: number[]): Promise<PersonaResumenRow[]> {
    if (idsPersona.length === 0) return [];
    const { data, error } = await this.supabase
      .from('persona')
      .select('id_persona, rut, dv, nombres, apellido_paterno, apellido_materno')
      .in('id_persona', idsPersona);
    lanzarSiErrorSupabase(error, 'consultar los datos de los trabajadores');
    return data ?? [];
  }

  /**
   * Hard-delete atómico de la nómina y de TODO lo derivado, vía RPC server-side
   * `public.eliminar_nomina_completa(p_nomina_id)` (migración
   * `20260610180000_eliminar_nomina_completa_rpc.sql`).
   *
   * El RPC purga, en una sola transacción y como `security definer`:
   *   - Snapshots de cálculo del período: `nomina_calculo_periodo` y sus hijos
   *     `nomina_calculo_trabajador`, `nomina_calculo_concepto`,
   *     `nomina_calculo_issue`, `nomina_calculo_trazabilidad`,
   *     `nomina_calculo_parametro`.
   *   - La fila de `nomina_periodo` y, por `on delete cascade`,
   *     `segmento_nomina`, `movimiento_nomina`, `incidencia_nomina` y
   *     `evento_auditoria_nomina`.
   *
   * Guardas (todas server-side, dentro del RPC):
   *   - Tenant scope: `id_empresa = current_user_empresa_id()`.
   *   - Estado eliminable: espejo de `puedeEliminar()` en `admin-nominas.rules.ts`
   *     (`borrador | dotacion_generada | en_revision | anulada`).
   *   - Bloqueo si existen `nomina_liquidacion_periodo` o `nomina_preparacion`
   *     referenciando los cálculos del período: los datos productivos NO se
   *     borran por accidente.
   *
   * El RPC retorna un `jsonb` con conteos (`calculos_borrados`,
   * `segmentos_borrados`, `movimientos_borrados`, `incidencias_borradas`),
   * usado para diagnóstico — el repo lo descarta porque la capa de servicio
   * solo necesita confirmación de éxito.
   *
   * Errores del RPC se reciben con código Postgres y mensaje legible (ver
   * `using errcode` en la migración) y se reemiten al usuario tal cual.
   */
  async eliminarNomina(id: string): Promise<void> {
    const { error } = await this.supabase.rpc('eliminar_nomina_completa', {
      p_nomina_id: id,
    });
    if (error) {
      // El RPC ya devuelve mensajes humanos (estado no eliminable, liquidaciones
      // existentes, preparaciones existentes, sin permisos). No anteponemos el
      // prefijo técnico "eliminarNomina:" para que el modal del administrador
      // muestre el texto directo.
      throw new Error(mensajeErrorParaUsuario(error, 'eliminar la nómina'));
    }
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

    lanzarSiErrorSupabase(error, 'listarSegmentos');
    return (data ?? []).map(rowToSegmentoNomina);
  }

  async obtenerSegmento(id: string): Promise<SegmentoNomina | null> {
    const { data, error } = await this.supabase
      .from('segmento_nomina')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    lanzarSiErrorSupabase(error, 'obtenerSegmento');
    return data ? rowToSegmentoNomina(data) : null;
  }

  async upsertSegmento(
    segmento: SegmentoNomina | SegmentoNominaNuevo,
    idEmpresa: number,
  ): Promise<SegmentoNomina> {
    const insert = segmentoNominaToInsert(segmento, idEmpresa);
    const { data, error } = await this.supabase
      .from('segmento_nomina')
      .upsert(insert, { onConflict: 'id' })
      .select('*')
      .single();

    lanzarSiErrorSupabase(error, 'upsertSegmento');
    if (!data) {
      throw new Error('upsertSegmento: BD no retornó la fila guardada');
    }
    return rowToSegmentoNomina(data);
  }

  async eliminarSegmento(id: string): Promise<void> {
    const { error } = await this.supabase.from('segmento_nomina').delete().eq('id', id);
    lanzarSiErrorSupabase(error, 'eliminarSegmento');
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
      p_busqueda: filtro.busqueda ?? undefined,
      p_estado: filtro.estado ?? undefined,
      p_segmento_id: filtro.segmentoId ?? undefined,
      p_con_incidencias: filtro.conIncidencias ?? undefined,
      p_con_movimientos: filtro.conMovimientos ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'listarDotacionPaginada');
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

  /**
   * F07b: ids del universo filtrado de dotación, sin paginar filas completas.
   * Soporta acciones masivas sobre el conjunto filtrado (no solo la página).
   */
  async listarIdsDotacion(
    nominaPeriodoId: string,
    filtro: FiltroRapidoDotacion,
  ): Promise<string[]> {
    const { data, error } = await this.supabase.rpc('listar_ids_dotacion_nomina', {
      p_nomina_id: nominaPeriodoId,
      p_busqueda: filtro.busqueda ?? undefined,
      p_estado: filtro.estado ?? undefined,
      p_segmento_id: filtro.segmentoId ?? undefined,
      p_con_incidencias: filtro.conIncidencias ?? undefined,
      p_con_movimientos: filtro.conMovimientos ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'listarIdsDotacion');
    return (data ?? []).map((row) => String(row.trabajador_id));
  }

  async obtenerResumenDotacion(nominaPeriodoId: string): Promise<DotacionResumenNomina> {
    const { data, error } = await this.supabase.rpc('resumen_dotacion_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'obtenerResumenDotacion');
    const row = (data ?? [])[0];
    return {
      total: Number(row?.total ?? 0),
      listos: Number(row?.listos ?? 0),
      conAdvertencias: Number(row?.con_advertencias ?? 0),
      conCriticos: Number(row?.con_criticos ?? 0),
      bloqueados: Number(row?.bloqueados ?? 0),
    };
  }

  async listarTrabajadoresElegiblesNomina(
    nominaPeriodoId: string,
    filtro: FiltroTrabajadoresElegiblesNomina,
    paginacion: PaginacionGrilla,
  ): Promise<{
    filas: Array<{
      id: string;
      nombre: string;
      rut: string;
      cargo: string;
      departamento: string;
      yaEnNomina: boolean;
    }>;
    total: number;
  }> {
    const { data, error } = await this.supabase.rpc('listar_trabajadores_elegibles_nomina', {
      p_nomina_id: nominaPeriodoId,
      p_page: paginacion.page,
      p_page_size: paginacion.pageSize,
      p_busqueda: filtro.busqueda ?? undefined,
      p_solo_disponibles: filtro.soloDisponibles ?? undefined,
      p_solo_en_nomina: filtro.soloEnNomina ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'listarTrabajadoresElegiblesNomina');
    const rows = data ?? [];
    return {
      total: Number(rows[0]?.total_count ?? 0),
      filas: rows.map((row) => ({
        id: String(row.trabajador_id),
        nombre: row.nombre,
        rut: row.rut,
        cargo: row.cargo,
        departamento: row.departamento,
        yaEnNomina: Boolean(row.ya_en_nomina),
      })),
    };
  }

  async obtenerResumenTrabajadoresElegibles(
    nominaPeriodoId: string,
  ): Promise<ResumenTrabajadoresElegiblesNomina> {
    const { data, error } = await this.supabase.rpc('resumen_trabajadores_elegibles_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'obtenerResumenTrabajadoresElegibles');
    const row = (data ?? [])[0];
    return {
      totalActivos: Number(row?.total_activos ?? 0),
      elegibles: Number(row?.elegibles ?? 0),
      yaEnNomina: Number(row?.ya_en_nomina ?? 0),
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
    lanzarSiErrorSupabase(error, 'listarRecurrentes');
    return (data ?? []).map(rowToMovimientoRecurrente);
  }

  async listarRecurrentesActivos(idEmpresa: number): Promise<MovimientoRecurrente[]> {
    const { data, error } = await this.supabase
      .from('movimiento_recurrente')
      .select('*')
      .eq('id_empresa', idEmpresa)
      .eq('estado', 'activo');
    lanzarSiErrorSupabase(error, 'listarRecurrentesActivos');
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
    lanzarSiErrorSupabase(error, 'listarMovimientos');
    return (data ?? []).map(rowToMovimientoNomina);
  }

  /** BKL-02: movimientos de UN trabajador dentro de la nómina (payload acotado). */
  async listarMovimientosDeTrabajador(
    nominaPeriodoId: string,
    trabajadorId: string,
  ): Promise<MovimientoNomina[]> {
    const { data, error } = await this.supabase
      .from('movimiento_nomina')
      .select('*')
      .eq('id_nomina_periodo', nominaPeriodoId)
      .eq('id_persona', Number(trabajadorId));
    lanzarSiErrorSupabase(error, 'listarMovimientosDeTrabajador');
    return (data ?? []).map(rowToMovimientoNomina);
  }

  /**
   * BKL-02: filas agregadas por trabajador del paso Movimientos, con filtros
   * y paginación resueltos en servidor (RPC `listar_movimientos_trabajadores_nomina`).
   * Las filas llegan sin items (`itemsCargados: false`); estos se hidratan al
   * expandir la fila.
   */
  async listarMovimientosTrabajadoresPaginado(
    nominaPeriodoId: string,
    filtro: FiltroMovimientosPorTrabajador,
    paginacion: PaginacionGrilla,
  ): Promise<{ filas: FilaTrabajadorMovimientos[]; total: number }> {
    const { data, error } = await this.supabase.rpc('listar_movimientos_trabajadores_nomina', {
      p_nomina_id: nominaPeriodoId,
      p_page: paginacion.page,
      p_page_size: paginacion.pageSize,
      p_busqueda: filtro.busqueda ?? undefined,
      p_estado: filtro.estado ?? undefined,
      p_categoria: filtro.categoria ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'listarMovimientosTrabajadoresPaginado');
    const rows = data ?? [];
    return {
      total: Number(rows[0]?.total_count ?? 0),
      filas: rows.map((row) => ({
        trabajadorId: String(row.trabajador_id),
        nombre: row.nombre,
        rut: row.rut,
        cargo: row.cargo || undefined,
        centroCosto: row.departamento || undefined,
        totalHaberes: Number(row.total_haberes ?? 0),
        totalDescuentos: Number(row.total_descuentos ?? 0),
        cuentaAusencias: Number(row.cuenta_ausencias ?? 0),
        cuentaInformativos: Number(row.cuenta_informativos ?? 0),
        cuentaPendientes: Number(row.cuenta_pendientes ?? 0),
        cuentaAplicados: Number(row.cuenta_aplicados ?? 0),
        cuentaOmitidos: Number(row.cuenta_omitidos ?? 0),
        cuentaManualesAplicados: Number(row.cuenta_manuales_aplicados ?? 0),
        items: [],
        itemsCargados: false,
        cuentaItems: Number(row.cuenta_items ?? 0),
      })),
    };
  }

  /** BKL-02: stats globales del paso Movimientos sin cargar filas. */
  async obtenerResumenMovimientos(
    nominaPeriodoId: string,
  ): Promise<ResumenMovimientosNomina> {
    const { data, error } = await this.supabase.rpc('resumen_movimientos_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'obtenerResumenMovimientos');
    const row = (data ?? [])[0];
    return {
      trabajadoresConMovimientos: Number(row?.trabajadores_con_movimientos ?? 0),
      trabajadoresConPendientes: Number(row?.trabajadores_con_pendientes ?? 0),
      totalHaberes: Number(row?.total_haberes ?? 0),
      totalDescuentos: Number(row?.total_descuentos ?? 0),
      totalPendientes: Number(row?.total_pendientes ?? 0),
      totalAplicados: Number(row?.total_aplicados ?? 0),
    };
  }

  async obtenerMovimiento(id: string): Promise<MovimientoNomina | null> {
    const { data, error } = await this.supabase
      .from('movimiento_nomina')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    lanzarSiErrorSupabase(error, 'obtenerMovimiento');
    return data ? rowToMovimientoNomina(data) : null;
  }

  async insertarMovimientos(
    movimientos: ReadonlyArray<MovimientoNominaNuevo>,
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

    lanzarSiErrorSupabase(error, 'insertarMovimientos');
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
    lanzarSiErrorSupabase(error, 'actualizarEstadoMovimiento');
  }

  /**
   * Hard-delete físico de un `movimiento_nomina`. La policy DELETE está
   * abierta a anon + authenticated (fase RLS uniforme del 2026-06-10). El
   * caller debe garantizar que el movimiento es manual antes de invocar.
   */
  async eliminarMovimiento(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('movimiento_nomina')
      .delete()
      .eq('id', id);
    lanzarSiErrorSupabase(error, 'eliminarMovimiento');
  }

  // -------------------------------------------------------------------------
  // incidencia_nomina
  // -------------------------------------------------------------------------

  async listarIncidencias(nominaPeriodoId: string): Promise<IncidenciaNomina[]> {
    const { data, error } = await this.supabase
      .from('incidencia_nomina')
      .select('*')
      .eq('id_nomina_periodo', nominaPeriodoId)
      .eq('estado_decision', 'pendiente');
    lanzarSiErrorSupabase(error, 'listarIncidencias');
    return (data ?? []).map(rowToIncidenciaNomina);
  }

  async sincronizarIncidenciasNomina(nominaPeriodoId: string): Promise<void> {
    const { error } = await this.supabase.rpc('sincronizar_incidencias_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'sincronizarIncidenciasNomina');
  }

  async registrarDecisionIncidencia(
    incidenciaId: string,
    accion: 'resolver' | 'aceptar',
    justificacion?: string,
  ): Promise<IncidenciaNomina> {
    const { data, error } = await this.supabase.rpc('registrar_decision_incidencia', {
      p_id_incidencia: incidenciaId,
      p_accion: accion,
      p_justificacion: justificacion ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'registrarDecisionIncidencia');
    if (!data) {
      throw new Error('registrarDecisionIncidencia: la BD no retornó la incidencia actualizada.');
    }
    return rowToIncidenciaNomina(data);
  }

  async validarNominaRpc(nominaPeriodoId: string): Promise<void> {
    const { error } = await this.supabase.rpc('validar_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'validarNominaRpc');
  }

  async aprobarNominaRpc(nominaPeriodoId: string): Promise<void> {
    const { error } = await this.supabase.rpc('aprobar_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'aprobarNominaRpc');
  }

  async cerrarNominaRpc(nominaPeriodoId: string, motivo?: string): Promise<void> {
    const { error } = await this.supabase.rpc('cerrar_nomina', {
      p_nomina_id: nominaPeriodoId,
      p_motivo: motivo ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'cerrarNominaRpc');
  }

  async reemplazarIncidencias(
    nominaPeriodoId: string,
    incidencias: ReadonlyArray<IncidenciaNomina | IncidenciaNominaNueva>,
  ): Promise<void> {
    const { error: errDel } = await this.supabase
      .from('incidencia_nomina')
      .delete()
      .eq('id_nomina_periodo', nominaPeriodoId);
    lanzarSiErrorSupabase(errDel, 'reemplazarIncidencias.delete');

    if (incidencias.length === 0) return;

    const inserts = incidencias.map((inc) =>
      incidenciaNominaToInsert({ ...inc, nominaPeriodoId }),
    );
    const { error: errIns } = await this.supabase.from('incidencia_nomina').insert(inserts);
    lanzarSiErrorSupabase(errIns, 'reemplazarIncidencias.insert');
  }

  // -------------------------------------------------------------------------
  // evento_auditoria_nomina
  // -------------------------------------------------------------------------

  async listarEventosAuditoria(nominaPeriodoId: string): Promise<EventoAuditoriaNomina[]> {
    const { data, error } = await this.supabase.rpc('listar_eventos_auditoria_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'listarEventosAuditoria');
    return (data ?? []).map(rowRpcToEventoAuditoria);
  }

  /** BKL-09: stats de cabecera del cálculo vigente sin cargar filas. */
  async obtenerResumenCalculo(nominaPeriodoId: string): Promise<ResumenCalculoNomina | null> {
    const { data, error } = await this.supabase.rpc('resumen_calculo_nomina', {
      p_nomina_id: nominaPeriodoId,
    });
    lanzarSiErrorSupabase(error, 'obtenerResumenCalculo');
    const row = (data ?? [])[0];
    if (!row) return null;
    return {
      idCalculoPeriodo: row.id_calculo_periodo ?? undefined,
      trabajadoresCalculados: Number(row.trabajadores_calculados ?? 0),
      totalHaberes: Number(row.total_haberes ?? 0),
      totalDescuentos: Number(row.total_descuentos ?? 0),
      totalLiquido: Number(row.total_liquido ?? 0),
      conAdvertencias: Number(row.con_advertencias ?? 0),
      conBloqueos: Number(row.con_bloqueos ?? 0),
    };
  }

  /** BKL-09: página de filas del paso Cálculo desde snapshot persistido. */
  async listarCalculoTrabajadoresPaginado(
    nominaPeriodoId: string,
    filtro: FiltroCalculoPorTrabajador,
    paginacion: PaginacionGrilla,
  ): Promise<{ filas: FilaCalculoTrabajadorListado[]; total: number }> {
    const { data, error } = await this.supabase.rpc('listar_calculo_trabajadores_nomina', {
      p_nomina_id: nominaPeriodoId,
      p_page: paginacion.page,
      p_page_size: paginacion.pageSize,
      p_busqueda: filtro.busqueda ?? undefined,
      p_estado: filtro.estado ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'listarCalculoTrabajadoresPaginado');
    const rows = data ?? [];
    return {
      total: Number(rows[0]?.total_count ?? 0),
      filas: rows.map((row) => ({
        idCalculoTrabajador: Number(row.id_calculo_trabajador),
        trabajadorId: String(row.id_persona),
        idPersona: Number(row.id_persona),
        rut: row.rut,
        nombre: row.nombre,
        estado: row.estado,
        sueldoBase: Number(row.sueldo_base ?? 0),
        totalHaberes: Number(row.total_haberes ?? 0),
        totalDescuentos: Number(row.total_descuentos ?? 0),
        liquidoAPago: Number(row.liquido_preliminar ?? 0),
        baseImponiblePrevisional: Number(row.base_imponible_previsional ?? 0),
        baseTributable: Number(row.base_tributable ?? 0),
        cotizacionSis: Number(row.cotizacion_sis ?? 0),
        cotizacionSanna: Number(row.cotizacion_sanna ?? 0),
        cotizacionLey16744: Number(row.cotizacion_ley_16744_empleador ?? 0),
        cuentaIssues: Number(row.cuenta_issues ?? 0),
        detalleCargado: false,
      })),
    };
  }

  /** BKL-10: página de trabajadores incluidos/excluidos del preview F04. */
  async listarPreviewCreacionTrabajadores(
    periodo: string,
    tipo: NominaPeriodo['tipo'],
    clasificacion: ClasificacionPreviewCreacion,
    paginacion: PaginacionGrilla,
    busqueda?: string,
    codigoCiclo?: string | null,
  ): Promise<{
    filas: TrabajadorIncluidoPreview[] | TrabajadorExcluidoPreview[];
    total: number;
  }> {
    const { data, error } = await this.supabase.rpc('listar_preview_creacion_trabajadores', {
      p_periodo: periodo,
      p_tipo: tipo,
      p_clasificacion: clasificacion,
      p_page: paginacion.page,
      p_page_size: paginacion.pageSize,
      p_busqueda: busqueda ?? undefined,
      p_codigo_ciclo: codigoCiclo ?? undefined,
    });
    lanzarSiErrorSupabase(error, 'listarPreviewCreacionTrabajadores');
    const rows = data ?? [];
    const total = Number(rows[0]?.total_count ?? 0);
    if (clasificacion === 'incluidos') {
      return {
        total,
        filas: rows.map((row) => ({
          idPersona: Number(row.id_persona),
          rut: row.rut,
          nombre: row.nombre,
          cargo: row.cargo || null,
        })),
      };
    }
    return {
      total,
      filas: rows.map((row) => ({
        idPersona: Number(row.id_persona),
        rut: row.rut,
        nombre: row.nombre,
        motivo: row.motivo ?? '',
        motivoHumano: row.motivo_humano ?? '',
      })),
    };
  }

  async registrarEventoAuditoria(
    evento: Omit<EventoAuditoriaNomina, 'id' | 'createdAt'>,
  ): Promise<EventoAuditoriaNomina> {
    const { data, error } = await this.supabase
      .from('evento_auditoria_nomina')
      .insert(eventoAuditoriaToInsert(evento))
      .select('*')
      .single();
    lanzarSiErrorSupabase(error, 'registrarEventoAuditoria');
    if (!data) {
      throw new Error('registrarEventoAuditoria: BD no retornó la fila creada');
    }
    return rowToEventoAuditoria(data);
  }
}
