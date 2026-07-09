import { Injectable } from '@angular/core';

import type { Json } from '../../../core/models/database.types';
import { lanzarErrorSupabaseRepositorio } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import type { ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';

interface DiagnosticoRow {
  id_diagnostico: number;
  periodo: string;
  estado: string;
  verificado_en: string;
  verificado_por: string;
  payload: Json;
  fingerprint: string | null;
  activo: boolean;
}

type DiagnosticoRpcClient = {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

@Injectable({ providedIn: 'root' })
export class NominaPeriodoDiagnosticoRepository {
  private readonly supabase = injectSupabase() as unknown as DiagnosticoRpcClient;

  async guardar(
    periodo: string,
    prevalidacion: ProcesoMensualPrevalidacion,
    fingerprint?: string | null,
  ): Promise<void> {
    const { error } = await this.supabase.rpc('guardar_nomina_periodo_diagnostico', {
      p_periodo: periodo.trim(),
      p_payload: prevalidacion as unknown as Json,
      p_fingerprint: fingerprint ?? null,
    });
    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'guardar el diagnóstico del periodo');
    }
    const { data, error } = await this.supabase.rpc('obtener_nomina_periodo_diagnostico_activo', {
      p_periodo: periodo.trim(),
    });
    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'consultar el diagnóstico del periodo');
    }
      return null;
    }
    const row = data as DiagnosticoRow;
    return this.mapearPayload(row.payload);
  }

  async cerrar(periodo: string, motivo: string): Promise<void> {
    const { error } = await this.supabase.rpc('cerrar_nomina_periodo_diagnostico', {
      p_periodo: periodo.trim(),
      p_motivo: motivo,
    });
    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'cerrar el diagnóstico del periodo');
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }
    const record = payload as Record<string, unknown>;
    if (typeof record['periodo'] !== 'string' || typeof record['estado'] !== 'string') {
      return null;
    }
    const prevalidacion = payload as unknown as ProcesoMensualPrevalidacion;
    return {
      ...prevalidacion,
      trabajadoresPendientesRevision: Array.isArray(record['trabajadoresPendientesRevision'])
        ? (record['trabajadoresPendientesRevision'] as ProcesoMensualPrevalidacion['trabajadoresPendientesRevision'])
        : [],
    };
  }
}
