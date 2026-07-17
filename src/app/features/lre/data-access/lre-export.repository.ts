import { Injectable } from '@angular/core';

import type { Database, Json } from '../../../core/models/database.types';
import { lanzarErrorSupabaseRepositorio } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  LreCanalExportacion,
  LreExportacionRegistro,
} from '../models/lre-export.model';

type Tables = Database['public']['Tables'];
type LreExportacionRow = Tables['nomina_lre_exportacion']['Row'];

export interface RegistrarExportacionLreParams {
  idLiquidacionPeriodo: number;
  idNominaPeriodo: string | null;
  totalLineas: number;
  totalTrabajadores: number;
  conceptosSinCodigo: number;
  canal: LreCanalExportacion;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class LreExportRepository {
  private readonly supabase = injectSupabase();

  async obtenerUltimaExportacion(
    idLiquidacionPeriodo: number,
  ): Promise<{ registro: LreExportacionRegistro | null; tablaDesplegada: boolean }> {
    const { data, error } = await this.supabase
      .from('nomina_lre_exportacion')
      .select('*')
      .eq('id_liquidacion_periodo', idLiquidacionPeriodo)
      .order('exportado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (esTablaInexistente(error)) {
        return { registro: null, tablaDesplegada: false };
      }
      lanzarErrorSupabaseRepositorio(error, 'consultar el historial de exportación LRE');
    }

    return {
      registro: data ? mapExportacionRow(data) : null,
      tablaDesplegada: true,
    };
  }

  async registrarExportacion(
    params: RegistrarExportacionLreParams,
  ): Promise<LreExportacionRegistro> {
    const { data, error } = await this.supabase.rpc('registrar_exportacion_lre', {
      p_id_liquidacion_periodo: params.idLiquidacionPeriodo,
      p_id_nomina_periodo: params.idNominaPeriodo ?? undefined,
      p_total_lineas: params.totalLineas,
      p_total_trabajadores: params.totalTrabajadores,
      p_conceptos_sin_codigo: params.conceptosSinCodigo,
      p_canal: params.canal,
      p_metadata: (params.metadata ?? {}) as Json,
    });

    if (!error && data) {
      return mapExportacionRow(data as LreExportacionRow);
    }

    const rpcMissing =
      error?.code === 'PGRST202'
      || (error?.message ?? '').toLowerCase().includes('could not find the function');

    if (rpcMissing) {
      throw new Error(
        'La exportación no quedó registrada: servicio LRE no desplegado en el entorno.',
      );
    }

    lanzarErrorSupabaseRepositorio(error, 'registrar la exportación LRE');
  }
}

function mapExportacionRow(row: LreExportacionRow): LreExportacionRegistro {
  return {
    idLreExportacion: row.id_lre_exportacion,
    idLiquidacionPeriodo: row.id_liquidacion_periodo,
    idNominaPeriodo: row.id_nomina_periodo,
    periodo: row.periodo,
    versionLiquidacion: Number(row.version_liquidacion ?? 1),
    usuarioLabel: row.usuario_label,
    canal: row.canal as LreCanalExportacion,
    totalLineas: Number(row.total_lineas ?? 0),
    totalTrabajadores: Number(row.total_trabajadores ?? 0),
    conceptosSinCodigo: Number(row.conceptos_sin_codigo ?? 0),
    exportadoEn: row.exportado_en,
  };
}

function esTablaInexistente(error: {
  code?: string;
  message?: string;
  status?: number;
  statusCode?: number;
}): boolean {
  const msg = (error.message ?? '').toLowerCase();
  const status = error.status ?? error.statusCode;
  return (
    error.code === '42P01'
    || error.code === 'PGRST205'
    || status === 404
    || msg.includes('does not exist')
    || msg.includes('could not find the table')
    || msg.includes('schema cache')
  );
}
