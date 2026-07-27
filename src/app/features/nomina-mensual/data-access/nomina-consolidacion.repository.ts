import { Injectable } from '@angular/core';

import { lanzarErrorSupabaseRepositorio } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  parseResultadoAplicarConsolidaciones,
  rowToNominaConsolidacion,
  rowToNominaLiquidacionResumen,
} from '../mappers/nomina-consolidacion.mapper';
import type {
  NominaConsolidacion,
  NominaLiquidacionResumen,
  ResultadoAplicarConsolidaciones,
} from '../models/nomina-consolidacion.models';

function throwIfError(error: { message: string } | null, context: string): void {
  if (error) lanzarErrorSupabaseRepositorio(error, context);
}

@Injectable({ providedIn: 'root' })
export class NominaConsolidacionRepository {
  private readonly supabase = injectSupabase();

  async registrarConsolidacionCalculo(nominaOrigenId: string): Promise<NominaConsolidacion | null> {
    const { data, error } = await this.supabase.rpc('registrar_consolidacion_calculo', {
      p_id_nomina_origen: nominaOrigenId,
    });
    throwIfError(error, 'registrarConsolidacionCalculo');
    return data ? rowToNominaConsolidacion(data) : null;
  }

  async listarPendientes(nominaDestinoId: string): Promise<readonly NominaConsolidacion[]> {
    const { data, error } = await this.supabase.rpc('listar_consolidaciones_pendientes', {
      p_id_nomina_destino: nominaDestinoId,
    });
    throwIfError(error, 'listarConsolidacionesPendientes');
    return (data ?? []).map(rowToNominaConsolidacion);
  }

  async vincular(consolidacionId: string, nominaDestinoId: string): Promise<NominaConsolidacion> {
    const { data, error } = await this.supabase.rpc('vincular_consolidacion_nomina', {
      p_id_consolidacion: consolidacionId,
      p_id_nomina_destino: nominaDestinoId,
    });
    throwIfError(error, 'vincularConsolidacion');
    if (!data) throw new Error('vincularConsolidacion: la BD no retornó la consolidación.');
    return rowToNominaConsolidacion(data);
  }

  async desvincular(consolidacionId: string): Promise<NominaConsolidacion> {
    const { data, error } = await this.supabase.rpc('desvincular_consolidacion_nomina', {
      p_id_consolidacion: consolidacionId,
    });
    throwIfError(error, 'desvincularConsolidacion');
    if (!data) throw new Error('desvincularConsolidacion: la BD no retornó la consolidación.');
    return rowToNominaConsolidacion(data);
  }

  async aplicar(nominaDestinoId: string): Promise<ResultadoAplicarConsolidaciones> {
    const { data, error } = await this.supabase.rpc('aplicar_consolidaciones_nomina', {
      p_id_nomina_destino: nominaDestinoId,
    });
    throwIfError(error, 'aplicarConsolidaciones');
    return parseResultadoAplicarConsolidaciones(data);
  }

  async listarLiquidaciones(nominaPeriodoId: string): Promise<readonly NominaLiquidacionResumen[]> {
    const { data, error } = await this.supabase.rpc('listar_liquidaciones_nomina', {
      p_id_nomina_periodo: nominaPeriodoId,
    });
    throwIfError(error, 'listarLiquidacionesNomina');
    return (data ?? []).map(rowToNominaLiquidacionResumen);
  }

  async invalidarLiquidacionesPorReapertura(
    nominaPeriodoId: string,
    motivo: string,
  ): Promise<number> {
    const { data, error } = await this.supabase.rpc('invalidar_liquidaciones_por_reapertura', {
      p_id_nomina_periodo: nominaPeriodoId,
      p_motivo: motivo,
    });
    throwIfError(error, 'invalidarLiquidacionesPorReapertura');
    return Number(data ?? 0);
  }

  async generarLiquidaciones(nominaPeriodoId: string): Promise<NominaLiquidacionResumen> {
    const { data, error } = await this.supabase.rpc('generar_liquidaciones_nomina', {
      p_id_nomina_periodo: nominaPeriodoId,
    });
    throwIfError(error, 'generarLiquidacionesNomina');
    if (!data) throw new Error('generarLiquidacionesNomina: la BD no retornó la liquidación.');
    return rowToNominaLiquidacionResumen(data);
  }
}
