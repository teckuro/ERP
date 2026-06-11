/**
 * Mappers BD ↔ modelos TS para Nómina mensual (rebuild Admin + Generador).
 *
 * Creados en `NOM-REBUILD-NOMINA-MENSUAL-01` (F3b, 2026-06-04).
 *
 * Importante: las PKs nuevas (`id`) son UUID en BD y `string` en TS. Las FKs
 * hacia tablas legacy (`id_empresa`, `id_persona`, `id_centro_costo`) son
 * `integer` en BD y los exponemos como `string` en TS (consistencia con F1).
 *
 * Convención de conversión: `String(num)` para BD→TS, `Number(str)` para TS→BD.
 */

import type { Database } from '../../../core/models/database.types';
import type {
  EstadoNomina,
  EventoAuditoriaNomina,
  IncidenciaNomina,
  IncidenciaNominaNueva,
  NaturalezaNomina,
  NominaPeriodo,
  NominaPeriodoResumen,
  SegmentoNomina,
  SegmentoNominaNuevo,
  TipoNomina,
} from '../models/nomina-periodo.models';
import { parsePayrollStepId } from '../models/nomina-periodo.models';
import {
  nominaRequiereAccion,
  proximoPasoNomina,
} from '../rules/nomina-periodo-state.rules';
import type {
  EstadoMovimientoNomina,
  EstadoMovimientoRecurrente,
  MovimientoCategoria,
  MovimientoFrecuencia,
  MovimientoNomina,
  MovimientoNominaNuevo,
  MovimientoRecurrente,
  MovimientoUnidad,
  OrigenMovimientoNomina,
} from '../models/movimiento-nomina.models';

type Tables = Database['public']['Tables'];

export type NominaPeriodoRow = Tables['nomina_periodo']['Row'];
export type NominaPeriodoInsert = Tables['nomina_periodo']['Insert'];
export type NominaPeriodoUpdate = Tables['nomina_periodo']['Update'];

export type SegmentoNominaRow = Tables['segmento_nomina']['Row'];
export type SegmentoNominaInsert = Tables['segmento_nomina']['Insert'];

export type MovimientoRecurrenteRow = Tables['movimiento_recurrente']['Row'];
export type MovimientoRecurrenteInsert = Tables['movimiento_recurrente']['Insert'];

export type MovimientoNominaRow = Tables['movimiento_nomina']['Row'];
export type MovimientoNominaInsert = Tables['movimiento_nomina']['Insert'];

export type IncidenciaNominaRow = Tables['incidencia_nomina']['Row'];
export type IncidenciaNominaInsert = Tables['incidencia_nomina']['Insert'];

export type EventoAuditoriaNominaRow = Tables['evento_auditoria_nomina']['Row'];
export type EventoAuditoriaNominaInsert = Tables['evento_auditoria_nomina']['Insert'];

// ---------------------------------------------------------------------------
// nomina_periodo
// ---------------------------------------------------------------------------

export function rowToNominaPeriodoResumen(
  row: NominaPeriodoRow,
  empresaNombreFallback?: string,
): NominaPeriodoResumen {
  return {
    id: row.id,
    periodo: row.periodo,
    empresaId: String(row.id_empresa),
    empresaNombre: row.empresa_nombre ?? empresaNombreFallback ?? '',
    tipo: row.tipo as TipoNomina,
    estado: row.estado as EstadoNomina,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    naturaleza: row.naturaleza as NaturalezaNomina,
    codigoCiclo: row.codigo_ciclo,
    plantillaCicloId: row.plantilla_ciclo_id ?? undefined,
    nominaOrigenId: row.nomina_origen_id ?? undefined,
    versionEstado: row.version_estado,
    totalTrabajadores: row.total_trabajadores,
    totalSegmentos: row.total_segmentos,
    totalHaberes: Number(row.total_haberes ?? 0),
    totalDescuentos: Number(row.total_descuentos ?? 0),
    totalLiquido: Number(row.total_liquido ?? 0),
    totalIncidenciasCriticas: row.total_incidencias_criticas,
    totalAdvertencias: row.total_advertencias,
    fechaPago: row.fecha_pago ?? undefined,
    proximoPaso: proximoPasoNomina(row.estado as EstadoNomina),
    requiereAccion: nominaRequiereAccion(row.estado as EstadoNomina),
    ultimaActividad: row.updated_at,
    evidenciaCalculo: {
      idCalculoPeriodo: row.id_calculo_periodo_vigente ?? undefined,
      versionCalculo: row.version_calculo,
      calculadoAt: row.calculado_at ?? undefined,
      validadoAt: row.validado_at ?? undefined,
      aprobadoAt: row.aprobado_at ?? undefined,
      calculoVigente: row.calculo_vigente,
    },
    ultimoPasoVisitado: parsePayrollStepId(row.ultimo_paso_visitado),
    pasoVisitadoAt: row.paso_visitado_at ?? null,
    maximoPasoCompletado: parsePayrollStepId(row.maximo_paso_completado),
    maximoPasoCompletadoAt: row.maximo_paso_completado_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at ?? undefined,
  };
}

export function nominaPeriodoToInsert(
  data: Pick<
    NominaPeriodo,
    | 'empresaId'
    | 'empresaNombre'
    | 'periodo'
    | 'tipo'
    | 'fechaInicio'
    | 'fechaFin'
    | 'naturaleza'
    | 'codigoCiclo'
    | 'plantillaCicloId'
    | 'nominaOrigenId'
  >,
): NominaPeriodoInsert {
  return {
    id_empresa: Number(data.empresaId),
    empresa_nombre: data.empresaNombre || null,
    periodo: data.periodo,
    tipo: data.tipo,
    fecha_inicio: data.fechaInicio,
    fecha_fin: data.fechaFin,
    naturaleza: data.naturaleza,
    codigo_ciclo: data.codigoCiclo,
    plantilla_ciclo_id: data.plantillaCicloId ?? null,
    nomina_origen_id: data.nominaOrigenId ?? null,
    estado: 'borrador',
  };
}

export function nominaPeriodoEstadoToUpdate(
  estado: EstadoNomina,
  extra: Partial<NominaPeriodoUpdate> = {},
): NominaPeriodoUpdate {
  const update: NominaPeriodoUpdate = { estado, ...extra };
  if (estado === 'cerrada') {
    update.closed_at = new Date().toISOString();
  }
  return update;
}

// ---------------------------------------------------------------------------
// segmento_nomina
// ---------------------------------------------------------------------------

export function rowToSegmentoNomina(row: SegmentoNominaRow): SegmentoNomina {
  return {
    id: row.id,
    nominaPeriodoId: row.id_nomina_periodo,
    nombre: row.nombre,
    tipo: (row.tipo ?? undefined) as SegmentoNomina['tipo'],
    trabajadorIds: (row.trabajador_ids ?? []).map(String),
    estado: row.estado as SegmentoNomina['estado'],
    totalTrabajadores: row.total_trabajadores,
    totalIncidenciasCriticas: row.total_incidencias_criticas,
    totalAdvertencias: row.total_advertencias,
    ordinal: row.ordinal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Mapea un segmento (nuevo o existente) al payload de inserción/upsert.
 *
 * - Si recibe un `SegmentoNomina` con `id` definido → lo incluye (upsert podrá
 *   ACTUALIZAR esa fila).
 * - Si recibe un `SegmentoNominaNuevo` → omite la clave `id` por completo y la
 *   BD genera el UUID con `default gen_random_uuid()`. NUNCA se manda `id: ''`
 *   ni `id: null`: postgrest-js no transforma `undefined` a "omitir columna"
 *   en inserts batch, así que el frontend nunca debe inventar el UUID.
 */
export function segmentoNominaToInsert(
  segmento: SegmentoNomina | SegmentoNominaNuevo,
  idEmpresa: number,
): SegmentoNominaInsert {
  const idExistente = 'id' in segmento ? segmento.id : undefined;
  return {
    ...(idExistente ? { id: idExistente } : {}),
    id_nomina_periodo: segmento.nominaPeriodoId,
    id_empresa: idEmpresa,
    nombre: segmento.nombre,
    tipo: segmento.tipo ?? null,
    estado: segmento.estado,
    trabajador_ids: segmento.trabajadorIds.map(Number),
    total_trabajadores: segmento.trabajadorIds.length,
    total_incidencias_criticas: segmento.totalIncidenciasCriticas,
    total_advertencias: segmento.totalAdvertencias,
    ordinal: segmento.ordinal,
  };
}

// ---------------------------------------------------------------------------
// movimiento_recurrente
// ---------------------------------------------------------------------------

export function rowToMovimientoRecurrente(row: MovimientoRecurrenteRow): MovimientoRecurrente {
  return {
    id: row.id,
    empresaId: String(row.id_empresa),
    trabajadorId: row.id_persona != null ? String(row.id_persona) : undefined,
    segmentoId: row.id_segmento_nomina ?? undefined,
    centroCostoId: row.id_centro_costo != null ? String(row.id_centro_costo) : undefined,
    cargoId: row.id_cargo != null ? String(row.id_cargo) : undefined,
    tipoContratoId: row.id_tipo_contrato != null ? String(row.id_tipo_contrato) : undefined,
    grupoId: row.id_grupo != null ? String(row.id_grupo) : undefined,
    tipo: row.tipo,
    categoria: row.categoria as MovimientoCategoria,
    monto: row.monto != null ? Number(row.monto) : undefined,
    cantidad: row.cantidad != null ? Number(row.cantidad) : undefined,
    unidad: (row.unidad ?? undefined) as MovimientoUnidad | undefined,
    frecuencia: row.frecuencia as MovimientoFrecuencia,
    activoDesde: row.activo_desde,
    activoHasta: row.activo_hasta ?? undefined,
    estado: row.estado as EstadoMovimientoRecurrente,
    glosa: row.glosa ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function movimientoRecurrenteToInsert(
  mov: Omit<MovimientoRecurrente, 'createdAt' | 'updatedAt'>,
): MovimientoRecurrenteInsert {
  return {
    id: mov.id || undefined,
    id_empresa: Number(mov.empresaId),
    id_persona: mov.trabajadorId ? Number(mov.trabajadorId) : null,
    id_segmento_nomina: mov.segmentoId ?? null,
    id_centro_costo: mov.centroCostoId ? Number(mov.centroCostoId) : null,
    id_cargo: mov.cargoId ? Number(mov.cargoId) : null,
    id_tipo_contrato: mov.tipoContratoId ? Number(mov.tipoContratoId) : null,
    id_grupo: mov.grupoId ? Number(mov.grupoId) : null,
    tipo: mov.tipo,
    categoria: mov.categoria,
    monto: mov.monto ?? null,
    cantidad: mov.cantidad ?? null,
    unidad: mov.unidad ?? null,
    frecuencia: mov.frecuencia,
    activo_desde: mov.activoDesde,
    activo_hasta: mov.activoHasta ?? null,
    estado: mov.estado,
    glosa: mov.glosa ?? null,
  };
}

// ---------------------------------------------------------------------------
// movimiento_nomina
// ---------------------------------------------------------------------------

export function rowToMovimientoNomina(row: MovimientoNominaRow): MovimientoNomina {
  return {
    id: row.id,
    nominaPeriodoId: row.id_nomina_periodo,
    trabajadorId: String(row.id_persona),
    segmentoId: row.id_segmento_nomina ?? undefined,
    tipo: row.tipo,
    categoria: row.categoria as MovimientoCategoria,
    monto: row.monto != null ? Number(row.monto) : undefined,
    cantidad: row.cantidad != null ? Number(row.cantidad) : undefined,
    unidad: (row.unidad ?? undefined) as MovimientoUnidad | undefined,
    origen: row.origen as OrigenMovimientoNomina,
    recurrenteId: row.id_recurrente ?? undefined,
    estado: row.estado as EstadoMovimientoNomina,
    fechaDesde: row.fecha_desde ?? undefined,
    fechaHasta: row.fecha_hasta ?? undefined,
    glosa: row.glosa ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Mapea un movimiento NUEVO al payload de inserción.
 *
 * El tipo `MovimientoNominaNuevo` (sin `id`, `createdAt`, `updatedAt`) refleja
 * que la PK la genera la BD (`default gen_random_uuid()`). Cualquier intento
 * de mandar `id: ''` o `id: null` desde el frontend dispara el NOT NULL
 * constraint en `movimiento_nomina.id`, así que la firma explícita previene
 * ese pie de pistola en tiempo de compilación.
 */
export function movimientoNominaToInsert(
  mov: MovimientoNominaNuevo,
  idEmpresa: number,
): MovimientoNominaInsert {
  return {
    id_nomina_periodo: mov.nominaPeriodoId,
    id_empresa: idEmpresa,
    id_persona: Number(mov.trabajadorId),
    id_segmento_nomina: mov.segmentoId ?? null,
    tipo: mov.tipo,
    categoria: mov.categoria,
    monto: mov.monto ?? null,
    cantidad: mov.cantidad ?? null,
    unidad: mov.unidad ?? null,
    origen: mov.origen,
    id_recurrente: mov.recurrenteId ?? null,
    estado: mov.estado,
    fecha_desde: mov.fechaDesde ?? null,
    fecha_hasta: mov.fechaHasta ?? null,
    glosa: mov.glosa ?? null,
  };
}

// ---------------------------------------------------------------------------
// incidencia_nomina
// ---------------------------------------------------------------------------

export function rowToIncidenciaNomina(row: IncidenciaNominaRow): IncidenciaNomina {
  return {
    id: row.id,
    nominaPeriodoId: row.id_nomina_periodo,
    severidad: row.severidad as IncidenciaNomina['severidad'],
    tipo: row.tipo,
    mensaje: row.mensaje,
    trabajadorId: row.id_persona != null ? String(row.id_persona) : undefined,
    segmentoId: row.id_segmento_nomina ?? undefined,
    bloqueante: row.bloqueante,
  };
}

export function incidenciaNominaToInsert(
  inc: IncidenciaNomina | IncidenciaNominaNueva,
): IncidenciaNominaInsert {
  const idExistente = 'id' in inc ? inc.id : undefined;
  return {
    ...(idExistente ? { id: idExistente } : {}),
    id_nomina_periodo: inc.nominaPeriodoId,
    id_persona: inc.trabajadorId ? Number(inc.trabajadorId) : null,
    id_segmento_nomina: inc.segmentoId ?? null,
    severidad: inc.severidad,
    tipo: inc.tipo,
    mensaje: inc.mensaje,
    bloqueante: inc.bloqueante,
  };
}

// ---------------------------------------------------------------------------
// evento_auditoria_nomina
// ---------------------------------------------------------------------------

export function rowToEventoAuditoria(row: EventoAuditoriaNominaRow): EventoAuditoriaNomina {
  return {
    id: row.id,
    nominaPeriodoId: row.id_nomina_periodo,
    accion: row.accion as EventoAuditoriaNomina['accion'],
    usuarioId: row.id_usuario ?? undefined,
    motivo: row.motivo ?? undefined,
    createdAt: row.created_at,
  };
}

export function eventoAuditoriaToInsert(
  evento: Omit<EventoAuditoriaNomina, 'id' | 'createdAt'>,
): EventoAuditoriaNominaInsert {
  return {
    id_nomina_periodo: evento.nominaPeriodoId,
    accion: evento.accion,
    id_usuario: evento.usuarioId ?? null,
    motivo: evento.motivo ?? null,
  };
}

/**
 * Construye una `NominaPeriodo` completa a partir de la cabecera + sus relaciones cargadas por separado.
 * Útil para consolidar lo que retorna el repositorio en una sola entidad de dominio.
 */
export function ensamblarNominaPeriodo(input: {
  cabecera: NominaPeriodoRow;
  segmentos: SegmentoNominaRow[];
  movimientos: MovimientoNominaRow[];
  incidencias: IncidenciaNominaRow[];
  eventosAuditoria?: EventoAuditoriaNominaRow[];
  trabajadorIds?: string[];
}): NominaPeriodo {
  const segmentos = input.segmentos.map(rowToSegmentoNomina);
  const movimientos = input.movimientos.map(rowToMovimientoNomina);
  const incidencias = input.incidencias.map(rowToIncidenciaNomina);

  const trabajadorIds = input.trabajadorIds
    ?? Array.from(new Set(segmentos.flatMap((s) => s.trabajadorIds)));

  return {
    id: input.cabecera.id,
    periodo: input.cabecera.periodo,
    empresaId: String(input.cabecera.id_empresa),
    empresaNombre: input.cabecera.empresa_nombre ?? '',
    tipo: input.cabecera.tipo as TipoNomina,
    estado: input.cabecera.estado as EstadoNomina,
    fechaInicio: input.cabecera.fecha_inicio,
    fechaFin: input.cabecera.fecha_fin,
    naturaleza: input.cabecera.naturaleza as NaturalezaNomina,
    codigoCiclo: input.cabecera.codigo_ciclo,
    plantillaCicloId: input.cabecera.plantilla_ciclo_id ?? undefined,
    nominaOrigenId: input.cabecera.nomina_origen_id ?? undefined,
    versionEstado: input.cabecera.version_estado,
    segmentos,
    movimientos,
    incidencias,
    trabajadorIds,
    totalHaberes: Number(input.cabecera.total_haberes ?? 0),
    totalDescuentos: Number(input.cabecera.total_descuentos ?? 0),
    totalLiquido: Number(input.cabecera.total_liquido ?? 0),
    fechaPago: input.cabecera.fecha_pago ?? undefined,
    evidenciaCalculo: {
      idCalculoPeriodo: input.cabecera.id_calculo_periodo_vigente ?? undefined,
      versionCalculo: input.cabecera.version_calculo,
      calculadoAt: input.cabecera.calculado_at ?? undefined,
      validadoAt: input.cabecera.validado_at ?? undefined,
      aprobadoAt: input.cabecera.aprobado_at ?? undefined,
      calculoVigente: input.cabecera.calculo_vigente,
    },
    ultimoPasoVisitado: parsePayrollStepId(input.cabecera.ultimo_paso_visitado),
    pasoVisitadoAt: input.cabecera.paso_visitado_at ?? null,
    maximoPasoCompletado: parsePayrollStepId(input.cabecera.maximo_paso_completado),
    maximoPasoCompletadoAt: input.cabecera.maximo_paso_completado_at ?? null,
    eventosAuditoria: input.eventosAuditoria?.map(rowToEventoAuditoria),
    createdAt: input.cabecera.created_at,
    updatedAt: input.cabecera.updated_at,
    closedAt: input.cabecera.closed_at ?? undefined,
  };
}
