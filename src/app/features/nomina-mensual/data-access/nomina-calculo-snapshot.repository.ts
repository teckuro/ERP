import { Injectable, isDevMode } from '@angular/core';

import type { Database, Json } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  AprobacionOperativaPersistida,
  AprobarResultadoPreliminarOperativamenteParams,
  CerrarNominaOperativamenteParams,
  ReabrirNominaOperativamenteParams,
  NominaCalculoConceptoSnapshot,
  NominaCalculoIssueSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaCalculoSnapshotEstado,
  NominaCalculoSnapshotOrigen,
  NominaCierreOperativo,
  NominaSnapshotCompletoView,
  NominaCalculoTrabajadorSnapshot,
  NominaCalculoTrazabilidadSnapshot,
  MotorCalculoEstadoTrabajador,
} from '../models/proceso-mensual.model';

type Tables = Database['public']['Tables'];
type NominaCalculoPeriodoRow = Tables['nomina_calculo_periodo']['Row'];
type NominaCalculoTrabajadorRow = Tables['nomina_calculo_trabajador']['Row'];
type NominaCalculoConceptoRow = Tables['nomina_calculo_concepto']['Row'];
type NominaCalculoIssueRow = Tables['nomina_calculo_issue']['Row'];
type NominaCalculoTrazabilidadRow = Tables['nomina_calculo_trazabilidad']['Row'];
type NominaCalculoConceptoInsert = Tables['nomina_calculo_concepto']['Insert'];
type NominaCalculoIssueInsert = Tables['nomina_calculo_issue']['Insert'];
type NominaCalculoTrazabilidadInsert = Tables['nomina_calculo_trazabilidad']['Insert'];

interface GuardarSnapshotRpcPayload {
  cabecera: Record<string, Json>;
  trabajadores: Array<Record<string, Json>>;
  conceptos: Array<Record<string, Json>>;
  observaciones: Array<Record<string, Json>>;
  trazabilidad: Array<Record<string, Json>>;
}

@Injectable({ providedIn: 'root' })
export class NominaCalculoSnapshotRepository {
  private readonly supabase = injectSupabase();

  async guardarSnapshotPreliminar(snapshot: NominaCalculoPeriodoSnapshot): Promise<{
    snapshot: NominaCalculoPeriodoSnapshot;
    reemplazoSnapshotAnterior: boolean;
  }> {
    const anterior = await this.obtenerSnapshotActivo(snapshot.periodo, snapshot.idEmpresa);
    const payload = buildGuardarSnapshotRpcPayload(snapshot);
    const { data, error } = await this.supabase.rpc('guardar_nomina_calculo_snapshot', {
      p_periodo: snapshot.periodo,
      p_id_empresa: snapshot.idEmpresa as number,
      p_cabecera: payload.cabecera,
      p_trabajadores: payload.trabajadores,
      p_conceptos: payload.conceptos,
      p_observaciones: payload.observaciones,
      p_trazabilidad: payload.trazabilidad,
    });
    if (error || typeof data !== 'number') {
      logGuardarSnapshotRpcError(snapshot, payload, error, data);
      throw new Error('No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.');
    }

    const completo = await this.obtenerSnapshotCompletoPorId(data);
    if (!completo) {
      throw new Error('El resultado se guardo, pero no fue posible consultar el detalle guardado.');
    }

    return {
      snapshot: completo.cabecera,
      reemplazoSnapshotAnterior: !!anterior,
    };
  }

  async obtenerSnapshotActivo(periodo: string, idEmpresa: number | null = null): Promise<NominaCalculoPeriodoSnapshot | null> {
    let query = this.supabase
      .from('nomina_calculo_periodo')
      .select('*')
      .eq('periodo', periodo)
      .eq('activo', true)
      .limit(1);
    query = idEmpresa == null ? query.is('id_empresa', null) : query.eq('id_empresa', idEmpresa);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`No fue posible consultar snapshot activo: ${error.message}`);
    return data ? mapPeriodoRow(data) : null;
  }

  async listarSnapshotsPeriodo(periodo: string): Promise<NominaCalculoPeriodoSnapshot[]> {
    const { data, error } = await this.supabase
      .from('nomina_calculo_periodo')
      .select('*')
      .eq('periodo', periodo)
      .order('fecha_generacion', { ascending: false });
    if (error) throw new Error(`No fue posible listar snapshots del periodo: ${error.message}`);
    return (data ?? []).map(mapPeriodoRow);
  }

  async anularSnapshotActivo(periodo: string, motivo?: string): Promise<void> {
    const activo = await this.obtenerSnapshotActivo(periodo);
    if (!activo?.idCalculoPeriodo) return;
    await this.marcarInactivo(activo.idCalculoPeriodo, 'anulado', motivo);
  }

  async obtenerSnapshotCompletoActivo(periodo: string, idEmpresa: number | null = null): Promise<NominaSnapshotCompletoView | null> {
    const cabecera = await this.obtenerSnapshotActivo(periodo, idEmpresa);
    if (!cabecera?.idCalculoPeriodo) return null;
    return this.obtenerSnapshotCompletoPorId(cabecera.idCalculoPeriodo);
  }

  async obtenerSnapshotCompletoPorId(idCalculoPeriodo: number): Promise<NominaSnapshotCompletoView | null> {
    const { data: cabeceraRow, error: cabeceraError } = await this.supabase
      .from('nomina_calculo_periodo')
      .select('*')
      .eq('id_calculo_periodo', idCalculoPeriodo)
      .maybeSingle();
    if (cabeceraError) throw new Error(`No fue posible consultar el resultado guardado: ${cabeceraError.message}`);
    if (!cabeceraRow) return null;

    const cabecera = mapPeriodoRow(cabeceraRow);
    const trabajadores = await this.obtenerTrabajadoresSnapshot(idCalculoPeriodo);
    const idTrabajadores = trabajadores
      .map((t) => t.idCalculoTrabajador)
      .filter((id): id is number => typeof id === 'number');
    const [conceptos, observaciones, trazabilidad] = await Promise.all([
      this.obtenerConceptosSnapshot(idTrabajadores),
      this.obtenerObservacionesSnapshot(idCalculoPeriodo),
      this.obtenerTrazabilidadSnapshot(idCalculoPeriodo),
    ]);

    const trabajadoresPorId = new Map<number, NominaCalculoTrabajadorSnapshot>(
      trabajadores
        .filter((t): t is NominaCalculoTrabajadorSnapshot & { idCalculoTrabajador: number } =>
          typeof t.idCalculoTrabajador === 'number')
        .map((t) => [t.idCalculoTrabajador, t]),
    );
    for (const concepto of conceptos) {
      const trabajador = typeof concepto.idCalculoTrabajador === 'number'
        ? trabajadoresPorId.get(concepto.idCalculoTrabajador)
        : undefined;
      if (trabajador) trabajador.conceptos.push(concepto);
    }
    for (const observacion of observaciones) {
      const trabajador = typeof observacion.idCalculoTrabajador === 'number'
        ? trabajadoresPorId.get(observacion.idCalculoTrabajador)
        : undefined;
      if (trabajador) trabajador.issues.push(observacion);
    }
    for (const traza of trazabilidad) {
      const trabajador = typeof traza.idCalculoTrabajador === 'number'
        ? trabajadoresPorId.get(traza.idCalculoTrabajador)
        : undefined;
      if (trabajador) trabajador.trazabilidad.push(traza);
    }

    return {
      cabecera: {
        ...cabecera,
        trabajadores,
        issues: observaciones.filter((i) => i.idCalculoTrabajador == null),
        trazabilidad: trazabilidad.filter((t) => t.idCalculoTrabajador == null),
      },
      trabajadores,
      conceptos,
      observaciones,
      trazabilidad,
      aprobacionOperativa: cabecera.aprobacionOperativa,
      cierreOperativo: cabecera.cierreOperativo,
      resumen: {
        totalConceptos: conceptos.length,
        totalObservaciones: observaciones.length,
        totalTrazas: trazabilidad.length,
        totalTrabajadoresSinDetalle: Math.max(0, cabecera.totalTrabajadores - trabajadores.length),
        esActivoVigente: cabecera.activo === true && cabecera.reemplazadoPor == null,
        fueReemplazado: cabecera.activo !== true || cabecera.reemplazadoPor != null,
      },
    };
  }

  async aprobarResultadoPreliminarOperativamente(
    params: AprobarResultadoPreliminarOperativamenteParams,
  ): Promise<NominaCalculoPeriodoSnapshot> {
    const activo = await this.obtenerSnapshotActivo(params.periodo);
    if (!activo?.idCalculoPeriodo || activo.idCalculoPeriodo !== params.idCalculoPeriodo) {
      throw new Error('El resultado preliminar guardado ya no es el vigente. Consulta el ultimo guardado antes de aprobar.');
    }
    if (activo.aprobacionOperativa?.estado === 'aprobado_operativamente') {
      return activo;
    }

    const { data: userData } = await this.supabase.auth.getUser();
    const user = userData.user;
    const fecha = new Date().toISOString();
    const usuarioLabel = user?.email?.trim() || 'Usuario no disponible en esta sesion';
    const metadata = buildAprobacionOperativaMetadata(activo);
    const { data, error } = await this.supabase
      .from('nomina_calculo_periodo')
      .update({
        aprobacion_operativa_estado: 'aprobado_operativamente',
        aprobacion_operativa_fecha: fecha,
        aprobacion_operativa_usuario_id: user?.id ?? null,
        aprobacion_operativa_usuario_label: usuarioLabel,
        aprobacion_operativa_advertencias: params.advertencias,
        aprobacion_operativa_metadata: metadata as Json,
        updated_at: fecha,
      })
      .eq('id_calculo_periodo', params.idCalculoPeriodo)
      .eq('periodo', params.periodo)
      .eq('activo', true)
      .is('reemplazado_por', null)
      .select('*')
      .single();
    if (error) throw new Error(`No se pudo registrar la aprobacion operativa: ${error.message}`);
    return mapPeriodoRow(data);
  }

  async reabrirNominaOperativa(
    params: ReabrirNominaOperativamenteParams & {
      metadata?: Record<string, unknown>;
    },
  ): Promise<NominaCalculoPeriodoSnapshot> {
    const { data, error } = await this.supabase.rpc('reabrir_nomina_operativa', {
      p_id_calculo_periodo: params.idCalculoPeriodo,
      p_periodo: params.periodo,
      p_observacion: params.observacion ?? undefined,
      p_metadata: (params.metadata ?? {}) as Json,
      p_forzar: params.forzar ?? false,
    });
    if (error || !data) {
      throw new Error('No se pudo reabrir operativamente la nomina. No se realizaron cambios parciales.');
    }
    return mapPeriodoRow(data as NominaCalculoPeriodoRow);
  }

  async cerrarNominaOperativa(params: CerrarNominaOperativamenteParams & {
    metadata?: Record<string, unknown>;
  }): Promise<NominaCalculoPeriodoSnapshot> {
    const { data, error } = await this.supabase.rpc('cerrar_nomina_operativa', {
      p_id_calculo_periodo: params.idCalculoPeriodo,
      p_periodo: params.periodo,
      p_observacion: params.observacion ?? undefined,
      p_metadata: (params.metadata ?? {}) as Json,
    });
    if (error || !data) {
      logCerrarNominaOperativaRpcError(params, error);
      throw new Error('No se pudo cerrar operativamente la nomina. No se realizaron cambios parciales.');
    }
    return mapPeriodoRow(data as NominaCalculoPeriodoRow);
  }

  private async insertarCabecera(snapshot: NominaCalculoPeriodoSnapshot): Promise<NominaCalculoPeriodoSnapshot> {
    const { data, error } = await this.supabase
      .from('nomina_calculo_periodo')
      .insert({
        periodo: snapshot.periodo,
        id_empresa: snapshot.idEmpresa,
        estado: snapshot.estado,
        fecha_generacion: snapshot.fechaGeneracion,
        usuario_generador: snapshot.usuarioGenerador,
        total_trabajadores: snapshot.totalTrabajadores,
        total_haberes: snapshot.totalHaberes,
        total_descuentos: snapshot.totalDescuentos,
        total_liquido: snapshot.totalLiquido,
        total_bloqueados: snapshot.totalBloqueados,
        total_advertencias: snapshot.totalAdvertencias,
        version_motor: snapshot.versionMotor,
        hash_snapshot: snapshot.hashSnapshot,
        origen: snapshot.origen,
        activo: true,
      })
      .select('*')
      .single();
    if (error) throw new Error(`No fue posible guardar cabecera de snapshot: ${error.message}`);
    return mapPeriodoRow(data);
  }

  private async insertarTrabajadores(
    idCalculoPeriodo: number,
    trabajadores: NominaCalculoTrabajadorSnapshot[],
  ): Promise<NominaCalculoTrabajadorSnapshot[]> {
    const rows = trabajadores.map((t) => ({
      id_calculo_periodo: idCalculoPeriodo,
      id_persona: t.idPersona,
      rut: t.rut,
      nombre_completo_snapshot: t.nombreCompletoSnapshot,
      estado: t.estado,
      sueldo_base: t.sueldoBase,
      base_imponible_previsional: t.baseImponiblePrevisional,
      base_tributable: t.baseTributable,
      total_haberes_imponibles: t.totalHaberesImponibles,
      total_haberes_no_imponibles: t.totalHaberesNoImponibles,
      total_descuentos_legales: t.totalDescuentosLegales,
      total_descuentos_voluntarios: t.totalDescuentosVoluntarios,
      impuesto_unico: t.impuestoUnico,
      liquido_preliminar: t.liquidoPreliminar,
      cotizacion_afp: t.cotizacionAfp,
      cotizacion_salud: t.cotizacionSalud,
      cotizacion_afc: t.cotizacionAfc,
      cotizacion_sis: t.cotizacionSis,
      cotizacion_sanna: t.cotizacionSanna,
      cotizacion_ley_16744_empleador: t.cotizacionLey16744Empleador,
    }));
    const { data, error } = await this.supabase
      .from('nomina_calculo_trabajador')
      .insert(rows)
      .select('*');
    if (error) throw new Error(`No fue posible guardar trabajadores del snapshot: ${error.message}`);
    return (data ?? []).map((row) => mapTrabajadorRow(row, trabajadores));
  }

  private async insertarConceptos(
    trabajadores: NominaCalculoTrabajadorSnapshot[],
    idTrabajadorPorPersona: Map<number, number>,
  ): Promise<void> {
    const rows: NominaCalculoConceptoInsert[] = trabajadores.flatMap((t) => {
      const idCalculoTrabajador = idTrabajadorPorPersona.get(t.idPersona);
      if (idCalculoTrabajador == null) return [];
      return t.conceptos.map((c): NominaCalculoConceptoInsert => ({
        id_calculo_trabajador: idCalculoTrabajador,
        id_concepto: c.idConcepto,
        tipo: c.tipo,
        nombre_concepto_snapshot: c.nombreConceptoSnapshot,
        codigo_lre_snapshot: c.codigoLreSnapshot,
        monto: c.monto,
        imponible: c.imponible,
        tributable: c.tributable,
        afecta_liquido: c.afectaLiquido,
        origen: c.origen,
        trazabilidad_json: c.trazabilidadJson as Json | null,
      }));
    });
    if (rows.length === 0) return;
    const { error } = await this.supabase.from('nomina_calculo_concepto').insert(rows);
    if (error) throw new Error(`No fue posible guardar conceptos del snapshot: ${error.message}`);
  }

  private async insertarIssues(
    idCalculoPeriodo: number,
    issuesPeriodo: NominaCalculoIssueSnapshot[],
    trabajadores: NominaCalculoTrabajadorSnapshot[],
    idTrabajadorPorPersona: Map<number, number>,
  ): Promise<void> {
    const rows = [
      ...issuesPeriodo.map((i) => mapIssueRow(i, idCalculoPeriodo, null)),
      ...trabajadores.flatMap((t) =>
        t.issues.map((i) => mapIssueRow(i, idCalculoPeriodo, idTrabajadorPorPersona.get(t.idPersona) ?? null)),
      ),
    ];
    if (rows.length === 0) return;
    const { error } = await this.supabase.from('nomina_calculo_issue').insert(rows);
    if (error) throw new Error(`No fue posible guardar issues del snapshot: ${error.message}`);
  }

  private async insertarTrazabilidad(
    idCalculoPeriodo: number,
    trabajadores: NominaCalculoTrabajadorSnapshot[],
    idTrabajadorPorPersona: Map<number, number>,
  ): Promise<void> {
    const rows = trabajadores.flatMap((t) =>
      t.trazabilidad.map((tr) => mapTrazabilidadRow(tr, idCalculoPeriodo, idTrabajadorPorPersona.get(t.idPersona) ?? null)),
    );
    if (rows.length === 0) return;
    const { error } = await this.supabase.from('nomina_calculo_trazabilidad').insert(rows);
    if (error) throw new Error(`No fue posible guardar trazabilidad del snapshot: ${error.message}`);
  }

  private async marcarInactivo(idCalculoPeriodo: number, estado: string, motivo?: string): Promise<void> {
    const { error } = await this.supabase
      .from('nomina_calculo_periodo')
      .update({
        activo: false,
        estado,
        updated_at: new Date().toISOString(),
        observacion_anulacion: motivo ?? null,
      })
      .eq('id_calculo_periodo', idCalculoPeriodo);
    if (error) throw new Error(`No fue posible anular snapshot previo: ${error.message}`);
  }

  private async actualizarReemplazo(idAnterior: number, idNuevo: number): Promise<void> {
    const { error } = await this.supabase
      .from('nomina_calculo_periodo')
      .update({ reemplazado_por: idNuevo, updated_at: new Date().toISOString() })
      .eq('id_calculo_periodo', idAnterior);
    if (error) throw new Error(`No fue posible vincular snapshot reemplazado: ${error.message}`);
  }

  private async obtenerTrabajadoresSnapshot(idCalculoPeriodo: number): Promise<NominaCalculoTrabajadorSnapshot[]> {
    const { data, error } = await this.supabase
      .from('nomina_calculo_trabajador')
      .select('*')
      .eq('id_calculo_periodo', idCalculoPeriodo)
      .order('nombre_completo_snapshot', { ascending: true });
    if (error) throw new Error(`No fue posible consultar trabajadores del resultado guardado: ${error.message}`);
    return (data ?? []).map(mapTrabajadorCompletoRow);
  }

  private async obtenerConceptosSnapshot(idCalculoTrabajadores: number[]): Promise<NominaCalculoConceptoSnapshot[]> {
    if (idCalculoTrabajadores.length === 0) return [];
    const { data, error } = await this.supabase
      .from('nomina_calculo_concepto')
      .select('*')
      .in('id_calculo_trabajador', idCalculoTrabajadores)
      .order('id_calculo_trabajador', { ascending: true });
    if (error) throw new Error(`No fue posible consultar conceptos del resultado guardado: ${error.message}`);
    return (data ?? []).map(mapConceptoCompletoRow);
  }

  private async obtenerObservacionesSnapshot(idCalculoPeriodo: number): Promise<NominaCalculoIssueSnapshot[]> {
    const { data, error } = await this.supabase
      .from('nomina_calculo_issue')
      .select('*')
      .eq('id_calculo_periodo', idCalculoPeriodo)
      .order('severidad', { ascending: true });
    if (error) throw new Error(`No fue posible consultar observaciones del resultado guardado: ${error.message}`);
    return (data ?? []).map(mapIssueCompletoRow);
  }

  private async obtenerTrazabilidadSnapshot(idCalculoPeriodo: number): Promise<NominaCalculoTrazabilidadSnapshot[]> {
    const { data, error } = await this.supabase
      .from('nomina_calculo_trazabilidad')
      .select('*')
      .eq('id_calculo_periodo', idCalculoPeriodo)
      .order('id_trazabilidad', { ascending: true });
    if (error) throw new Error(`No fue posible consultar trazabilidad del resultado guardado: ${error.message}`);
    return (data ?? []).map(mapTrazabilidadCompletaRow);
  }
}

function logGuardarSnapshotRpcError(
  snapshot: NominaCalculoPeriodoSnapshot,
  payload: GuardarSnapshotRpcPayload,
  error: unknown,
  data: unknown,
): void {
  if (!isDevMode()) return;

  console.error('[nomina-snapshot] Error guardando snapshot preliminar', {
    rpc: 'guardar_nomina_calculo_snapshot',
    periodo: snapshot.periodo,
    idEmpresa: snapshot.idEmpresa,
    resumen: {
      trabajadores: payload.trabajadores.length,
      conceptos: payload.conceptos.length,
      observaciones: payload.observaciones.length,
      trazabilidad: payload.trazabilidad.length,
    },
    diagnosticoPayload: diagnoseGuardarSnapshotRpcPayload(payload),
    rpcResultType: typeof data,
    error: sanitizeSupabaseError(error),
  });
}

function logCerrarNominaOperativaRpcError(
  params: CerrarNominaOperativamenteParams,
  error: unknown,
): void {
  if (!isDevMode()) return;

  console.error('[nomina-cierre] Error cerrando nomina operativa', {
    rpc: 'cerrar_nomina_operativa',
    periodo: params.periodo,
    idCalculoPeriodo: params.idCalculoPeriodo,
    error: sanitizeSupabaseError(error),
  });
}

function sanitizeSupabaseError(error: unknown): unknown {
  if (!error || typeof error !== 'object') return error;

  const source = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    name?: unknown;
  };

  return {
    name: source.name,
    code: source.code,
    message: source.message,
    details: source.details,
    hint: source.hint,
  };
}

function diagnoseGuardarSnapshotRpcPayload(payload: GuardarSnapshotRpcPayload): Record<string, number> {
  return {
    cabeceraUndefined: countUndefinedValues(payload.cabecera),
    cabeceraInvalidNumbers: countInvalidNumbers(payload.cabecera),
    trabajadoresUndefined: countUndefinedValues(payload.trabajadores),
    trabajadoresInvalidNumbers: countInvalidNumbers(payload.trabajadores),
    conceptosUndefined: countUndefinedValues(payload.conceptos),
    conceptosInvalidNumbers: countInvalidNumbers(payload.conceptos),
    observacionesUndefined: countUndefinedValues(payload.observaciones),
    observacionesInvalidNumbers: countInvalidNumbers(payload.observaciones),
    trazabilidadUndefined: countUndefinedValues(payload.trazabilidad),
    trazabilidadInvalidNumbers: countInvalidNumbers(payload.trazabilidad),
  };
}

function countUndefinedValues(value: unknown): number {
  if (value === undefined) return 1;
  if (value == null || typeof value !== 'object') return 0;
  if (Array.isArray(value)) return value.reduce((total, item) => total + countUndefinedValues(item), 0);
  return Object.values(value).reduce((total, item) => total + countUndefinedValues(item), 0);
}

function countInvalidNumbers(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? 0 : 1;
  if (value == null || typeof value !== 'object') return 0;
  if (Array.isArray(value)) return value.reduce((total, item) => total + countInvalidNumbers(item), 0);
  return Object.values(value).reduce((total, item) => total + countInvalidNumbers(item), 0);
}

function buildGuardarSnapshotRpcPayload(snapshot: NominaCalculoPeriodoSnapshot): GuardarSnapshotRpcPayload {
  const trabajadores = snapshot.trabajadores.map((trabajador, trabajadorIndex) => ({
    trabajador_index: trabajadorIndex,
    id_persona: trabajador.idPersona,
    rut: trabajador.rut,
    nombre_completo_snapshot: trabajador.nombreCompletoSnapshot,
    estado: trabajador.estado,
    sueldo_base: trabajador.sueldoBase,
    base_imponible_previsional: trabajador.baseImponiblePrevisional,
    base_tributable: trabajador.baseTributable,
    total_haberes_imponibles: trabajador.totalHaberesImponibles,
    total_haberes_no_imponibles: trabajador.totalHaberesNoImponibles,
    total_descuentos_legales: trabajador.totalDescuentosLegales,
    total_descuentos_voluntarios: trabajador.totalDescuentosVoluntarios,
    impuesto_unico: trabajador.impuestoUnico,
    liquido_preliminar: trabajador.liquidoPreliminar,
    cotizacion_afp: trabajador.cotizacionAfp,
    cotizacion_salud: trabajador.cotizacionSalud,
    cotizacion_afc: trabajador.cotizacionAfc,
    cotizacion_sis: trabajador.cotizacionSis,
    cotizacion_sanna: trabajador.cotizacionSanna,
    cotizacion_ley_16744_empleador: trabajador.cotizacionLey16744Empleador,
  })) satisfies Array<Record<string, Json>>;

  const conceptos = snapshot.trabajadores.flatMap((trabajador, trabajadorIndex) =>
    trabajador.conceptos.map((concepto) => ({
      trabajador_index: trabajadorIndex,
      id_concepto: concepto.idConcepto,
      tipo: concepto.tipo,
      nombre_concepto_snapshot: concepto.nombreConceptoSnapshot,
      codigo_lre_snapshot: concepto.codigoLreSnapshot,
      monto: concepto.monto,
      imponible: concepto.imponible,
      tributable: concepto.tributable,
      afecta_liquido: concepto.afectaLiquido,
      origen: concepto.origen,
      trazabilidad_json: concepto.trazabilidadJson as Json | null,
    })),
  ) satisfies Array<Record<string, Json>>;

  const observaciones = [
    ...snapshot.issues.map((issue) => buildIssueRpcPayload(issue, null)),
    ...snapshot.trabajadores.flatMap((trabajador, trabajadorIndex) =>
      trabajador.issues.map((issue) => buildIssueRpcPayload(issue, trabajadorIndex)),
    ),
  ];

  const trazabilidad = [
    ...snapshot.trazabilidad.map((traza) => buildTrazabilidadRpcPayload(traza, null)),
    ...snapshot.trabajadores.flatMap((trabajador, trabajadorIndex) =>
      trabajador.trazabilidad.map((traza) => buildTrazabilidadRpcPayload(traza, trabajadorIndex)),
    ),
  ];

  return {
    cabecera: {
      periodo: snapshot.periodo,
      id_empresa: snapshot.idEmpresa,
      estado: snapshot.estado,
      fecha_generacion: snapshot.fechaGeneracion,
      usuario_generador: snapshot.usuarioGenerador,
      total_trabajadores: snapshot.totalTrabajadores,
      total_haberes: snapshot.totalHaberes,
      total_descuentos: snapshot.totalDescuentos,
      total_liquido: snapshot.totalLiquido,
      total_bloqueados: snapshot.totalBloqueados,
      total_advertencias: snapshot.totalAdvertencias,
      version_motor: snapshot.versionMotor,
      hash_snapshot: snapshot.hashSnapshot,
      origen: snapshot.origen,
    },
    trabajadores,
    conceptos,
    observaciones,
    trazabilidad,
  };
}

function buildIssueRpcPayload(
  issue: NominaCalculoIssueSnapshot,
  trabajadorIndex: number | null,
): Record<string, Json> {
  return {
    trabajador_index: trabajadorIndex,
    codigo: issue.codigo,
    severidad: issue.severidad,
    origen: issue.origen,
    mensaje: issue.mensaje,
    campo: issue.campo,
    entidad_id: issue.entidadId == null ? null : String(issue.entidadId),
  };
}

function buildTrazabilidadRpcPayload(
  traza: NominaCalculoTrazabilidadSnapshot,
  trabajadorIndex: number | null,
): Record<string, Json> {
  return {
    trabajador_index: trabajadorIndex,
    codigo: traza.codigo,
    origen: traza.origen,
    tabla_fuente: traza.tablaFuente,
    campo_fuente: traza.campoFuente,
    vigencia_inicio: normalizeRpcDate(traza.vigenciaInicio),
    vigencia_fin: normalizeRpcDate(traza.vigenciaFin),
    valor_entrada: traza.valorEntrada as Json | null,
    formula: traza.formula,
    valor_resultado: traza.valorResultado as Json | null,
    observacion: traza.observacion,
  };
}

function mapPeriodoRow(row: NominaCalculoPeriodoRow): NominaCalculoPeriodoSnapshot {
  return {
    idCalculoPeriodo: row.id_calculo_periodo,
    periodo: row.periodo,
    idEmpresa: row.id_empresa ?? null,
    estado: parseSnapshotEstado(row.estado),
    fechaGeneracion: row.fecha_generacion,
    usuarioGenerador: row.usuario_generador ?? null,
    totalTrabajadores: Number(row.total_trabajadores ?? 0),
    totalHaberes: Number(row.total_haberes ?? 0),
    totalDescuentos: Number(row.total_descuentos ?? 0),
    totalLiquido: Number(row.total_liquido ?? 0),
    totalBloqueados: Number(row.total_bloqueados ?? 0),
    totalAdvertencias: Number(row.total_advertencias ?? 0),
    versionMotor: row.version_motor,
    hashSnapshot: row.hash_snapshot ?? null,
    origen: parseSnapshotOrigen(row.origen),
    activo: row.activo === true,
    reemplazadoPor: row.reemplazado_por ?? null,
    aprobacionOperativa: mapAprobacionOperativa(row),
    cierreOperativo: mapCierreOperativo(row),
    trabajadores: [],
    issues: [],
    trazabilidad: [],
  };
}

function mapCierreOperativo(row: NominaCalculoPeriodoRow): NominaCierreOperativo | null {
  if (row.cierre_operativo_estado !== 'cerrado_operativamente' || !row.cierre_operativo_fecha) {
    return null;
  }

  return {
    estado: 'cerrado_operativamente',
    fecha: row.cierre_operativo_fecha,
    usuarioId: row.cierre_operativo_usuario_id ?? null,
    usuarioLabel: row.cierre_operativo_usuario_label || 'Usuario no disponible en esta sesion',
    observacion: row.cierre_operativo_observacion ?? null,
    metadata: parseRecord(row.cierre_operativo_metadata),
  };
}

function mapAprobacionOperativa(row: NominaCalculoPeriodoRow): AprobacionOperativaPersistida | null {
  if (row.aprobacion_operativa_estado !== 'aprobado_operativamente' || !row.aprobacion_operativa_fecha) {
    return null;
  }

  return {
    estado: 'aprobado_operativamente',
    fecha: row.aprobacion_operativa_fecha,
    usuarioId: row.aprobacion_operativa_usuario_id ?? null,
    usuarioLabel: row.aprobacion_operativa_usuario_label ?? null,
    advertencias: parseStringArray(row.aprobacion_operativa_advertencias),
    metadata: parseRecord(row.aprobacion_operativa_metadata),
  };
}

function buildAprobacionOperativaMetadata(snapshot: NominaCalculoPeriodoSnapshot): Record<string, unknown> {
  return {
    idCalculoPeriodo: snapshot.idCalculoPeriodo ?? null,
    periodo: snapshot.periodo,
    versionMotor: snapshot.versionMotor,
    hashSnapshot: snapshot.hashSnapshot,
    totalTrabajadores: snapshot.totalTrabajadores,
    totalHaberes: snapshot.totalHaberes,
    totalDescuentos: snapshot.totalDescuentos,
    totalLiquido: snapshot.totalLiquido,
    totalBloqueados: snapshot.totalBloqueados,
    totalAdvertencias: snapshot.totalAdvertencias,
    origen: snapshot.origen,
    notaAlcance: 'Aprobacion operativa interna; no cierra periodo ni emite liquidaciones.',
  };
}

function parseStringArray(value: Json | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseRecord(value: Json | null): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function mapTrabajadorRow(
  row: NominaCalculoTrabajadorRow,
  source: NominaCalculoTrabajadorSnapshot[],
): NominaCalculoTrabajadorSnapshot {
  const original = source.find((t) => t.idPersona === row.id_persona);
  return {
    ...(original ?? {
      conceptos: [],
      issues: [],
      trazabilidad: [],
    }),
    idCalculoTrabajador: row.id_calculo_trabajador,
    idCalculoPeriodo: row.id_calculo_periodo,
    idPersona: row.id_persona,
    rut: row.rut,
    nombreCompletoSnapshot: row.nombre_completo_snapshot,
    estado: parseTrabajadorEstado(row.estado),
    sueldoBase: Number(row.sueldo_base ?? 0),
    baseImponiblePrevisional: Number(row.base_imponible_previsional ?? 0),
    baseTributable: Number(row.base_tributable ?? 0),
    totalHaberesImponibles: Number(row.total_haberes_imponibles ?? 0),
    totalHaberesNoImponibles: Number(row.total_haberes_no_imponibles ?? 0),
    totalDescuentosLegales: Number(row.total_descuentos_legales ?? 0),
    totalDescuentosVoluntarios: Number(row.total_descuentos_voluntarios ?? 0),
    impuestoUnico: Number(row.impuesto_unico ?? 0),
    liquidoPreliminar: Number(row.liquido_preliminar ?? 0),
    cotizacionAfp: Number(row.cotizacion_afp ?? 0),
    cotizacionSalud: Number(row.cotizacion_salud ?? 0),
    cotizacionAfc: Number(row.cotizacion_afc ?? 0),
    cotizacionSis: Number(row.cotizacion_sis ?? 0),
    cotizacionSanna: Number(row.cotizacion_sanna ?? 0),
    cotizacionLey16744Empleador: Number(row.cotizacion_ley_16744_empleador ?? 0),
  };
}

function mapTrabajadorCompletoRow(row: NominaCalculoTrabajadorRow): NominaCalculoTrabajadorSnapshot {
  return {
    idCalculoTrabajador: row.id_calculo_trabajador,
    idCalculoPeriodo: row.id_calculo_periodo,
    idPersona: row.id_persona,
    rut: row.rut,
    nombreCompletoSnapshot: row.nombre_completo_snapshot,
    estado: parseTrabajadorEstado(row.estado),
    sueldoBase: Number(row.sueldo_base ?? 0),
    baseImponiblePrevisional: Number(row.base_imponible_previsional ?? 0),
    baseTributable: Number(row.base_tributable ?? 0),
    totalHaberesImponibles: Number(row.total_haberes_imponibles ?? 0),
    totalHaberesNoImponibles: Number(row.total_haberes_no_imponibles ?? 0),
    totalDescuentosLegales: Number(row.total_descuentos_legales ?? 0),
    totalDescuentosVoluntarios: Number(row.total_descuentos_voluntarios ?? 0),
    impuestoUnico: Number(row.impuesto_unico ?? 0),
    liquidoPreliminar: Number(row.liquido_preliminar ?? 0),
    cotizacionAfp: Number(row.cotizacion_afp ?? 0),
    cotizacionSalud: Number(row.cotizacion_salud ?? 0),
    cotizacionAfc: Number(row.cotizacion_afc ?? 0),
    cotizacionSis: Number(row.cotizacion_sis ?? 0),
    cotizacionSanna: Number(row.cotizacion_sanna ?? 0),
    cotizacionLey16744Empleador: Number(row.cotizacion_ley_16744_empleador ?? 0),
    conceptos: [],
    issues: [],
    trazabilidad: [],
  };
}

function mapConceptoCompletoRow(row: NominaCalculoConceptoRow): NominaCalculoConceptoSnapshot {
  return {
    idCalculoConcepto: row.id_calculo_concepto,
    idCalculoTrabajador: row.id_calculo_trabajador,
    idConcepto: row.id_concepto ?? null,
    tipo: parseConceptoTipo(row.tipo),
    nombreConceptoSnapshot: row.nombre_concepto_snapshot,
    codigoLreSnapshot: row.codigo_lre_snapshot ?? null,
    monto: Number(row.monto ?? 0),
    imponible: row.imponible === true,
    tributable: row.tributable === true,
    afectaLiquido: row.afecta_liquido === true,
    origen: row.origen,
    trazabilidadJson: parseRecord(row.trazabilidad_json),
  };
}

function mapIssueCompletoRow(row: NominaCalculoIssueRow): NominaCalculoIssueSnapshot {
  return {
    idIssue: row.id_issue,
    idCalculoPeriodo: row.id_calculo_periodo,
    idCalculoTrabajador: row.id_calculo_trabajador ?? null,
    codigo: row.codigo,
    severidad: parseIssueSeveridad(row.severidad),
    origen: row.origen,
    mensaje: row.mensaje,
    campo: row.campo ?? null,
    entidadId: row.entidad_id ?? null,
  };
}

function mapTrazabilidadCompletaRow(row: NominaCalculoTrazabilidadRow): NominaCalculoTrazabilidadSnapshot {
  return {
    idTrazabilidad: row.id_trazabilidad,
    idCalculoPeriodo: row.id_calculo_periodo,
    idCalculoTrabajador: row.id_calculo_trabajador ?? null,
    codigo: row.codigo,
    origen: row.origen,
    tablaFuente: row.tabla_fuente,
    campoFuente: row.campo_fuente,
    vigenciaInicio: row.vigencia_inicio ?? null,
    vigenciaFin: row.vigencia_fin ?? null,
    valorEntrada: normalizeJsonValue(row.valor_entrada),
    formula: row.formula,
    valorResultado: normalizeJsonValue(row.valor_resultado),
    observacion: row.observacion ?? null,
  };
}

const SNAPSHOT_ESTADOS: readonly NominaCalculoSnapshotEstado[] = [
  'borrador',
  'preliminar',
  'recalculado',
  'observado',
  'listo_para_revision',
  'aprobado_para_liquidacion',
  'anulado',
];

const SNAPSHOT_ORIGENES: readonly NominaCalculoSnapshotOrigen[] = ['preliminar', 'manual', 'recalculo'];

const TRABAJADOR_ESTADOS: readonly MotorCalculoEstadoTrabajador[] = [
  'calculado_preliminar',
  'con_advertencias',
  'con_bloqueos',
];

const CONCEPTO_TIPOS: readonly NominaCalculoConceptoSnapshot['tipo'][] = ['haber', 'descuento', 'cotizacion', 'impuesto'];

const ISSUE_SEVERIDADES: readonly NominaCalculoIssueSnapshot['severidad'][] = ['BLOQUEO', 'ADVERTENCIA', 'INFO'];

function parseSnapshotEstado(value: string): NominaCalculoSnapshotEstado {
  return SNAPSHOT_ESTADOS.includes(value as NominaCalculoSnapshotEstado)
    ? (value as NominaCalculoSnapshotEstado)
    : 'observado';
}

function parseSnapshotOrigen(value: string): NominaCalculoSnapshotOrigen {
  return SNAPSHOT_ORIGENES.includes(value as NominaCalculoSnapshotOrigen)
    ? (value as NominaCalculoSnapshotOrigen)
    : 'preliminar';
}

function parseTrabajadorEstado(value: string): MotorCalculoEstadoTrabajador {
  return TRABAJADOR_ESTADOS.includes(value as MotorCalculoEstadoTrabajador)
    ? (value as MotorCalculoEstadoTrabajador)
    : 'con_advertencias';
}

function parseConceptoTipo(value: string): NominaCalculoConceptoSnapshot['tipo'] {
  return CONCEPTO_TIPOS.includes(value as NominaCalculoConceptoSnapshot['tipo'])
    ? (value as NominaCalculoConceptoSnapshot['tipo'])
    : 'descuento';
}

function parseIssueSeveridad(value: string): NominaCalculoIssueSnapshot['severidad'] {
  return ISSUE_SEVERIDADES.includes(value as NominaCalculoIssueSnapshot['severidad'])
    ? (value as NominaCalculoIssueSnapshot['severidad'])
    : 'INFO';
}

function normalizeJsonValue(value: Json | null): number | string | Record<string, unknown> | unknown[] | null {
  if (value == null || typeof value === 'number' || typeof value === 'string') return value;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value as Record<string, unknown>;
  return String(value);
}

function mapIssueRow(
  issue: NominaCalculoIssueSnapshot,
  idCalculoPeriodo: number,
  idCalculoTrabajador: number | null,
): NominaCalculoIssueInsert {
  return {
    id_calculo_periodo: idCalculoPeriodo,
    id_calculo_trabajador: idCalculoTrabajador,
    codigo: issue.codigo,
    severidad: issue.severidad,
    origen: issue.origen,
    mensaje: issue.mensaje,
    campo: issue.campo,
    entidad_id: issue.entidadId == null ? null : String(issue.entidadId),
  };
}

function mapTrazabilidadRow(
  traza: NominaCalculoTrazabilidadSnapshot,
  idCalculoPeriodo: number,
  idCalculoTrabajador: number | null,
): NominaCalculoTrazabilidadInsert {
  return {
    id_calculo_periodo: idCalculoPeriodo,
    id_calculo_trabajador: idCalculoTrabajador,
    codigo: traza.codigo,
    origen: traza.origen,
    tabla_fuente: traza.tablaFuente,
    campo_fuente: traza.campoFuente,
    vigencia_inicio: normalizeRpcDate(traza.vigenciaInicio),
    vigencia_fin: normalizeRpcDate(traza.vigenciaFin),
    valor_entrada: traza.valorEntrada as Json | null,
    formula: traza.formula,
    valor_resultado: traza.valorResultado as Json | null,
    observacion: traza.observacion,
  };
}

function normalizeRpcDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? `${value}-01` : value;
  if (!/^\d{4}-(0[1-9]|1[0-2])-[0-9]{2}$/.test(candidate)) return null;
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate ? null : candidate;
}
