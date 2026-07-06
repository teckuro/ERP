import { Injectable } from '@angular/core';

import type { Database, Json } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  PreviredCanalExportacion,
  PreviredExportacionRegistro,
} from '../models/previred-export.model';
import type { CatalogoPreviredEntrada } from '../rules/previred-mapeo.rules';

type Tables = Database['public']['Tables'];
type CatalogoPreviredRow = Tables['catalogo_previred']['Row'];
type PreviredExportacionRow = Tables['nomina_previred_exportacion']['Row'];

export interface RegistrarExportacionPreviredParams {
  idLiquidacionPeriodo: number;
  idNominaPeriodo: string | null;
  totalLineas: number;
  totalTrabajadores: number;
  conceptosSinMapeo: number;
  conceptosSinCodigo: number;
  canal: PreviredCanalExportacion;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class PreviredExportRepository {
  private readonly supabase = injectSupabase();

  async listarCatalogoPrevired(): Promise<CatalogoPreviredEntrada[]> {
    const { data, error } = await this.supabase
      .from('catalogo_previred')
      .select('codigo_lre, codigo_previred, glosa_previred')
      .eq('vigente', true)
      .order('codigo_lre', { ascending: true });

    if (error) {
      if (esTablaInexistente(error)) return [];
      throw new Error('No se pudo consultar el catálogo Previred.');
    }

    return (data ?? []).map(mapCatalogoRow);
  }

  async obtenerUltimaExportacion(
    idLiquidacionPeriodo: number,
  ): Promise<PreviredExportacionRegistro | null> {
    const { data, error } = await this.supabase
      .from('nomina_previred_exportacion')
      .select('*')
      .eq('id_liquidacion_periodo', idLiquidacionPeriodo)
      .order('exportado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (esTablaInexistente(error)) return null;
      throw new Error('No se pudo consultar el historial de exportación Previred.');
    }

    return data ? mapExportacionRow(data) : null;
  }

  async registrarExportacion(
    params: RegistrarExportacionPreviredParams,
  ): Promise<PreviredExportacionRegistro> {
    const { data, error } = await this.supabase.rpc('registrar_exportacion_previred', {
      p_id_liquidacion_periodo: params.idLiquidacionPeriodo,
      p_id_nomina_periodo: params.idNominaPeriodo,
      p_total_lineas: params.totalLineas,
      p_total_trabajadores: params.totalTrabajadores,
      p_conceptos_sin_mapeo: params.conceptosSinMapeo,
      p_conceptos_sin_codigo: params.conceptosSinCodigo,
      p_canal: params.canal,
      p_metadata: (params.metadata ?? {}) as Json,
    });

    if (!error && data) {
      return mapExportacionRow(data as PreviredExportacionRow);
    }

    const rpcMissing =
      error?.code === 'PGRST202'
      || (error?.message ?? '').toLowerCase().includes('could not find the function');

    if (rpcMissing) {
      throw new Error('La exportación no quedó registrada: servicio no desplegado en el entorno.');
    }

    throw new Error('No se pudo registrar la exportación Previred.');
  }
}

function mapCatalogoRow(row: Pick<CatalogoPreviredRow, 'codigo_lre' | 'codigo_previred' | 'glosa_previred'>): CatalogoPreviredEntrada {
  return {
    codigoLre: row.codigo_lre,
    codigoPrevired: row.codigo_previred,
    glosaPrevired: row.glosa_previred,
  };
}

function mapExportacionRow(row: PreviredExportacionRow): PreviredExportacionRegistro {
  return {
    idPreviredExportacion: row.id_previred_exportacion,
    idLiquidacionPeriodo: row.id_liquidacion_periodo,
    idNominaPeriodo: row.id_nomina_periodo,
    periodo: row.periodo,
    versionLiquidacion: Number(row.version_liquidacion ?? 1),
    usuarioLabel: row.usuario_label,
    canal: row.canal as PreviredCanalExportacion,
    totalLineas: Number(row.total_lineas ?? 0),
    totalTrabajadores: Number(row.total_trabajadores ?? 0),
    conceptosSinMapeo: Number(row.conceptos_sin_mapeo ?? 0),
    conceptosSinCodigo: Number(row.conceptos_sin_codigo ?? 0),
    exportadoEn: row.exportado_en,
  };
}

function esTablaInexistente(error: { code?: string; message?: string }): boolean {
  const msg = (error.message ?? '').toLowerCase();
  return error.code === '42P01' || msg.includes('does not exist') || msg.includes('could not find the table');
}
