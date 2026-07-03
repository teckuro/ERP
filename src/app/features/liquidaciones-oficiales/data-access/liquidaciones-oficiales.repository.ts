import { Injectable, isDevMode } from '@angular/core';

import type { Database, Json } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  parseEstadoRevisionMetadata,
  type LiquidacionAccionUiEstado,
} from '../rules/liquidaciones-acciones-ui.rules';
import type {
  GenerarLiquidacionesParams,
  LiquidacionConcepto,
  LiquidacionPeriodo,
  LiquidacionTrabajador,
} from '../models/liquidacion-oficial.model';

type Tables = Database['public']['Tables'];
type LiquidacionPeriodoRow = Tables['nomina_liquidacion_periodo']['Row'];
type LiquidacionTrabajadorRow = Tables['nomina_liquidacion_trabajador']['Row'];
type LiquidacionConceptoRow = Tables['nomina_liquidacion_concepto']['Row'];

const ERROR_GENERAR =
  'No se pudieron generar las liquidaciones oficiales. No se realizaron cambios parciales.';

@Injectable({ providedIn: 'root' })
export class LiquidacionesOficialesRepository {
  private readonly supabase = injectSupabase();

  async obtenerLiquidacionPeriodo(
    periodo: string,
    idCalculoPeriodo?: number | null,
  ): Promise<LiquidacionPeriodo | null> {
    let query = this.supabase
      .from('nomina_liquidacion_periodo')
      .select('*')
      .eq('periodo', periodo)
      .eq('activo', true)
      .order('fecha_generacion', { ascending: false })
      .limit(1);
    if (idCalculoPeriodo != null) {
      query = query.eq('id_calculo_periodo', idCalculoPeriodo);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error('No se pudo consultar la liquidacion oficial del periodo.');
    return data ? mapPeriodoRow(data) : null;
  }

  async obtenerLiquidacionesTrabajadores(idLiquidacionPeriodo: number): Promise<LiquidacionTrabajador[]> {
    const { data, error } = await this.supabase
      .from('nomina_liquidacion_trabajador')
      .select('*')
      .eq('id_liquidacion_periodo', idLiquidacionPeriodo)
      .order('nombre_trabajador', { ascending: true });
    if (error) throw new Error('No se pudo consultar el listado de trabajadores liquidados.');
    return (data ?? []).map(mapTrabajadorRow);
  }

  async actualizarEstadoRevisionTrabajador(
    idLiquidacionTrabajador: number,
    estadoRevision: string,
  ): Promise<LiquidacionTrabajador> {
    const rpcResult = await rpcSinTipar(
      this.supabase,
      'actualizar_estado_revision_liquidacion_trabajador',
      {
        p_id_liquidacion_trabajador: idLiquidacionTrabajador,
        p_estado_revision: estadoRevision,
      },
    );

    if (!rpcResult.error && rpcResult.data) {
      return mapTrabajadorRow(rpcResult.data as LiquidacionTrabajadorRow);
    }

    const rpcMissing =
      rpcResult.error?.code === 'PGRST202'
      || (rpcResult.error?.message ?? '').toLowerCase().includes('could not find the function');

    if (!rpcMissing) {
      throw new Error('No se pudo guardar el estado de revisión del trabajador.');
    }

    const { data: actual, error: readError } = await this.supabase
      .from('nomina_liquidacion_trabajador')
      .select('*')
      .eq('id_liquidacion_trabajador', idLiquidacionTrabajador)
      .single();
    if (readError || !actual) {
      throw new Error('No se pudo consultar la liquidación del trabajador.');
    }

    const metadata = {
      ...parseRecord(actual.metadata),
      estadoRevision: estadoRevision,
    };

    const { data, error } = await this.supabase
      .from('nomina_liquidacion_trabajador')
      .update({
        metadata,
        ...( { estado_revision: estadoRevision } as Record<string, unknown> ),
      })
      .eq('id_liquidacion_trabajador', idLiquidacionTrabajador)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('No se pudo guardar el estado de revisión del trabajador.');
    }
    return mapTrabajadorRow(data);
  }

  async obtenerDetalleTrabajador(idLiquidacionTrabajador: number): Promise<LiquidacionConcepto[]> {
    const { data, error } = await this.supabase
      .from('nomina_liquidacion_concepto')
      .select('*')
      .eq('id_liquidacion_trabajador', idLiquidacionTrabajador)
      .order('orden', { ascending: true });
    if (error) throw new Error('No se pudo consultar el detalle de conceptos del trabajador.');
    return (data ?? []).map(mapConceptoRow);
  }

  async generarLiquidacionesOficiales(params: GenerarLiquidacionesParams): Promise<LiquidacionPeriodo> {
    const { data, error } = await this.supabase.rpc('generar_liquidaciones_oficiales', {
      p_id_calculo_periodo: params.idCalculoPeriodo,
      p_periodo: params.periodo,
      p_metadata: (params.metadata ?? {}) as Json,
    });
    if (error || !data) {
      logRpcError(params, error);
      throw new Error(ERROR_GENERAR);
    }
    return mapPeriodoRow(data as LiquidacionPeriodoRow);
  }
}

function mapPeriodoRow(row: LiquidacionPeriodoRow): LiquidacionPeriodo {
  return {
    idLiquidacionPeriodo: row.id_liquidacion_periodo,
    idCalculoPeriodo: row.id_calculo_periodo,
    periodo: row.periodo,
    estado: 'generada',
    fechaGeneracion: row.fecha_generacion,
    usuarioGeneracionId: row.usuario_generacion_id ?? null,
    usuarioGeneracionLabel: row.usuario_generacion_label ?? null,
    totalTrabajadores: Number(row.total_trabajadores ?? 0),
    totalHaberes: Number(row.total_haberes ?? 0),
    totalDescuentos: Number(row.total_descuentos ?? 0),
    totalLiquido: Number(row.total_liquido ?? 0),
    metadata: parseRecord(row.metadata),
  };
}

function parseEstadoRevisionDesdeColumna(
  row: LiquidacionTrabajadorRow,
): LiquidacionAccionUiEstado | null {
  const raw = (row as LiquidacionTrabajadorRow & { estado_revision?: string | null }).estado_revision;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return parseEstadoRevisionMetadata({ estadoRevision: raw });
}

function mapTrabajadorRow(row: LiquidacionTrabajadorRow): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: row.id_liquidacion_trabajador,
    idPersona: row.id_persona ?? null,
    idContrato: row.id_contrato ?? null,
    rut: row.rut ?? null,
    nombreTrabajador: row.nombre_trabajador,
    cargo: row.cargo ?? null,
    centroCosto: row.centro_costo ?? null,
    fechaIngreso: row.fecha_ingreso ?? null,
    diasTrabajados: row.dias_trabajados == null ? null : Number(row.dias_trabajados),
    baseImponible: Number(row.base_imponible ?? 0),
    baseTributable: Number(row.base_tributable ?? 0),
    totalHaberes: Number(row.total_haberes ?? 0),
    totalDescuentos: Number(row.total_descuentos ?? 0),
    totalAportesEmpleadorReferencia: Number(row.total_aportes_empleador_referencia ?? 0),
    liquidoPagar: Number(row.liquido_pagar ?? 0),
    estado: 'generada',
    estadoRevision:
      parseEstadoRevisionDesdeColumna(row)
      ?? parseEstadoRevisionMetadata(parseRecord(row.metadata)),
    observaciones: parseArray(row.observaciones),
    metadata: parseRecord(row.metadata),
  };
}

function mapConceptoRow(row: LiquidacionConceptoRow): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: row.id_liquidacion_concepto,
    idLiquidacionTrabajador: row.id_liquidacion_trabajador,
    idConcepto: row.id_concepto ?? null,
    codigo: row.codigo ?? null,
    codigoLre: row.codigo_lre ?? null,
    nombre: row.nombre,
    tipo: row.tipo,
    clasificacion: row.clasificacion ?? null,
    cantidad: row.cantidad == null ? null : Number(row.cantidad),
    base: row.base == null ? null : Number(row.base),
    tasa: row.tasa == null ? null : Number(row.tasa),
    monto: Number(row.monto ?? 0),
    orden: Number(row.orden ?? 0),
    metadata: parseRecord(row.metadata),
  };
}

function parseRecord(value: Json | null): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function parseArray(value: Json | null): unknown[] {
  return Array.isArray(value) ? value : [];
}

function logRpcError(params: GenerarLiquidacionesParams, error: unknown): void {
  if (!isDevMode()) return;
  console.error('[liquidaciones-oficiales] Error generando liquidaciones oficiales', {
    rpc: 'generar_liquidaciones_oficiales',
    periodo: params.periodo,
    idCalculoPeriodo: params.idCalculoPeriodo,
    error,
  });
}

type RpcSinTiparResultado = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

/** RPC aún no presente en database.types — tipado local hasta regenerar tipos. */
async function rpcSinTipar(
  client: ReturnType<typeof injectSupabase>,
  nombre: string,
  args: Record<string, unknown>,
): Promise<RpcSinTiparResultado> {
  const rpc = client.rpc as unknown as (
    fn: string,
    params: Record<string, unknown>,
  ) => Promise<RpcSinTiparResultado>;
  return rpc(nombre, args);
}
