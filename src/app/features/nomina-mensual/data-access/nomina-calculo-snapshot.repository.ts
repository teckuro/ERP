import { Injectable } from '@angular/core';

import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  NominaCalculoConceptoSnapshot,
  NominaCalculoIssueSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaCalculoTrabajadorSnapshot,
  NominaCalculoTrazabilidadSnapshot,
} from '../models/proceso-mensual.model';

type SupabaseAny = ReturnType<typeof injectSupabase> & { from: (table: string) => any };

@Injectable({ providedIn: 'root' })
export class NominaCalculoSnapshotRepository {
  private readonly supabase = injectSupabase() as SupabaseAny;

  async guardarSnapshotPreliminar(snapshot: NominaCalculoPeriodoSnapshot): Promise<{
    snapshot: NominaCalculoPeriodoSnapshot;
    reemplazoSnapshotAnterior: boolean;
  }> {
    const anterior = await this.obtenerSnapshotActivo(snapshot.periodo, snapshot.idEmpresa);
    if (anterior?.idCalculoPeriodo) {
      await this.marcarInactivo(anterior.idCalculoPeriodo, 'anulado');
    }

    const cabecera = await this.insertarCabecera({
      ...snapshot,
      estado: anterior ? 'recalculado' : snapshot.estado,
      origen: anterior ? 'recalculo' : snapshot.origen,
    });
    const trabajadores = await this.insertarTrabajadores(cabecera.idCalculoPeriodo!, snapshot.trabajadores);
    const idTrabajadorPorPersona = new Map(trabajadores.map((t) => [t.idPersona, t.idCalculoTrabajador!]));

    await this.insertarConceptos(snapshot.trabajadores, idTrabajadorPorPersona);
    await this.insertarIssues(cabecera.idCalculoPeriodo!, snapshot.issues, snapshot.trabajadores, idTrabajadorPorPersona);
    await this.insertarTrazabilidad(cabecera.idCalculoPeriodo!, snapshot.trabajadores, idTrabajadorPorPersona);

    if (anterior?.idCalculoPeriodo) {
      await this.actualizarReemplazo(anterior.idCalculoPeriodo, cabecera.idCalculoPeriodo!);
    }

    return {
      snapshot: { ...snapshot, ...cabecera, trabajadores },
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
    return (data ?? []).map((row: any) => mapTrabajadorRow(row, trabajadores));
  }

  private async insertarConceptos(
    trabajadores: NominaCalculoTrabajadorSnapshot[],
    idTrabajadorPorPersona: Map<number, number>,
  ): Promise<void> {
    const rows = trabajadores.flatMap((t) =>
      t.conceptos.map((c) => ({
        id_calculo_trabajador: idTrabajadorPorPersona.get(t.idPersona),
        id_concepto: c.idConcepto,
        tipo: c.tipo,
        nombre_concepto_snapshot: c.nombreConceptoSnapshot,
        codigo_lre_snapshot: c.codigoLreSnapshot,
        monto: c.monto,
        imponible: c.imponible,
        tributable: c.tributable,
        afecta_liquido: c.afectaLiquido,
        origen: c.origen,
        trazabilidad_json: c.trazabilidadJson,
      })),
    );
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
}

function mapPeriodoRow(row: any): NominaCalculoPeriodoSnapshot {
  return {
    idCalculoPeriodo: row.id_calculo_periodo,
    periodo: row.periodo,
    idEmpresa: row.id_empresa ?? null,
    estado: row.estado,
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
    origen: row.origen,
    activo: row.activo === true,
    reemplazadoPor: row.reemplazado_por ?? null,
    trabajadores: [],
    issues: [],
    trazabilidad: [],
  };
}

function mapTrabajadorRow(row: any, source: NominaCalculoTrabajadorSnapshot[]): NominaCalculoTrabajadorSnapshot {
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
    estado: row.estado,
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

function mapIssueRow(issue: NominaCalculoIssueSnapshot, idCalculoPeriodo: number, idCalculoTrabajador: number | null): Record<string, unknown> {
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
): Record<string, unknown> {
  return {
    id_calculo_periodo: idCalculoPeriodo,
    id_calculo_trabajador: idCalculoTrabajador,
    codigo: traza.codigo,
    origen: traza.origen,
    tabla_fuente: traza.tablaFuente,
    campo_fuente: traza.campoFuente,
    vigencia_inicio: traza.vigenciaInicio,
    vigencia_fin: traza.vigenciaFin,
    valor_entrada: traza.valorEntrada,
    formula: traza.formula,
    valor_resultado: traza.valorResultado,
    observacion: traza.observacion,
  };
}
