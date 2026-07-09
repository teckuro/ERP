import { Injectable } from '@angular/core';

import type { Database, Json } from '../../../core/models/database.types';
import { lanzarErrorSupabaseRepositorio } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  PreviredCanalExportacion,
  PreviredExportacionRegistro,
} from '../models/previred-export.model';
import type { CatalogoPreviredEntrada } from '../rules/previred-mapeo.rules';
import type { CatalogoCampoArchivoEntrada } from '../rules/previred-campo-archivo.rules';
import type {
  PreviredDatosPersonaFactoresRow,
  PreviredParametrosEmpresa,
  PreviredTrabajadorEnriquecido,
} from '../rules/previred-trabajador-datos.rules';
import {
  claveTrabajadorPrevired,
  mapearCodigoCcafPrevired,
  mapearCodigoMutualPrevired,
  mapearFilaPersonaFactores,
} from '../rules/previred-trabajador-datos.rules';

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

  async listarCatalogoPrevired(): Promise<{
    entradas: CatalogoPreviredEntrada[];
    tablaDesplegada: boolean;
  }> {
    const { data, error } = await this.supabase
      .from('catalogo_previred')
      .select('codigo_lre, codigo_previred, glosa_previred')
      .eq('vigente', true)
      .order('codigo_lre', { ascending: true });

    if (error) {
      if (esTablaInexistente(error)) {
        return { entradas: [], tablaDesplegada: false };
      }
      lanzarErrorSupabaseRepositorio(error, 'consultar el catálogo Previred');
    }

    return {
      entradas: (data ?? []).map(mapCatalogoRow),
      tablaDesplegada: true,
    };
  }

  async listarCatalogoCampoArchivo(): Promise<{
    entradas: CatalogoCampoArchivoEntrada[];
    columnaDesplegada: boolean;
  }> {
    const { data, error } = await this.supabase
      .from('catalogo_previred')
      .select('codigo_lre, campo_archivo')
      .eq('vigente', true)
      .order('codigo_lre', { ascending: true });

    if (error) {
      if (esTablaInexistente(error) || esColumnaInexistente(error)) {
        return { entradas: [], columnaDesplegada: false };
      }
      lanzarErrorSupabaseRepositorio(error, 'consultar el catálogo de campos Previred');
    }

    const filas = (data ?? []) as unknown as Array<{
      codigo_lre: string;
      campo_archivo: number | null;
    }>;

    return {
      entradas: filas.map((typed) => ({
          codigoLre: String(typed.codigo_lre),
        campoArchivo: typed.campo_archivo == null ? null : Number(typed.campo_archivo),
        destinoSalud: typed.codigo_lre === '3143' ? ('SALUD_FONASA' as const) : null,
      })),
      columnaDesplegada: true,
    };
  }

  async obtenerTrabajadoresEnriquecidos(
    idsPersona: readonly number[],
    nombresFallback: ReadonlyMap<number, string>,
  ): Promise<{
    porClave: Map<string, PreviredTrabajadorEnriquecido>;
    porPersona: Map<number, PreviredTrabajadorEnriquecido>;
  }> {
    const porClave = new Map<string, PreviredTrabajadorEnriquecido>();
    const porPersona = new Map<number, PreviredTrabajadorEnriquecido>();
    if (idsPersona.length === 0) return { porClave, porPersona };

    const { data, error } = await this.supabase
      .from('vw_persona_factores')
      .select(
        'id_persona, id_contrato, rut, dv, apellido_paterno, apellido_materno, nombres, sexo, id_pais, pais, tipo_prevision, regimen_previsional_nombre, afp_nombre, tipo_jornada_nombre, tipo_trabajador_nombre, salud_tipo, salud_nombre_full, seguro_cesantia, cargas',
      )
      .in('id_persona', [...new Set(idsPersona)]);

    if (error) {
      if (esTablaInexistente(error)) return { porClave, porPersona };
      lanzarErrorSupabaseRepositorio(error, 'enriquecer datos de trabajadores para Previred');
    }

    for (const row of data ?? []) {
      const idPersona = row.id_persona;
      if (idPersona == null) continue;
      const mapeado = mapearFilaPersonaFactores(
        row as PreviredDatosPersonaFactoresRow,
        nombresFallback.get(idPersona) ?? null,
      );
      if (!mapeado) continue;
      porClave.set(claveTrabajadorPrevired(idPersona, mapeado.idContrato), mapeado);
      if (!porPersona.has(idPersona)) {
        porPersona.set(idPersona, mapeado);
      }
    }

    return { porClave, porPersona };
  }

  async obtenerParametrosEmpresaPrevired(periodo: string): Promise<PreviredParametrosEmpresa> {
    const fallback: PreviredParametrosEmpresa = {
      codigoCcaf: '00',
      codigoMutual: '00',
      tasaExpectativaVida: 0.009,
    };

    const { data: params, error: paramsError } = await this.supabase
      .from('parametros_generales_cliente')
      .select(
        'seguro_social_expectativa_vida, id_ccaf_entidad, id_organismo_administrador_ley_16744',
      )
      .eq('periodo', periodo.trim())
      .maybeSingle();

    if (paramsError && !esTablaInexistente(paramsError)) {
      return fallback;
    }

    let codigoCcaf = '00';
    if (params?.id_ccaf_entidad != null) {
      const { data: ccaf } = await this.supabase
        .from('ccaf_entidad')
        .select('codigo')
        .eq('id_ccaf_entidad', params.id_ccaf_entidad)
        .maybeSingle();
      codigoCcaf = mapearCodigoCcafPrevired(ccaf?.codigo ?? null);
    }

    let codigoMutual = '00';
    if (params?.id_organismo_administrador_ley_16744 != null) {
      const { data: mutual } = await this.supabase
        .from('organismo_administrador_ley_16744')
        .select('codigo')
        .eq('id_organismo_administrador_ley_16744', params.id_organismo_administrador_ley_16744)
        .maybeSingle();
      codigoMutual = mapearCodigoMutualPrevired(mutual?.codigo ?? null);
    }

    return {
      codigoCcaf,
      codigoMutual,
      tasaExpectativaVida:
        params?.seguro_social_expectativa_vida == null
          ? 0.009
          : Number(params.seguro_social_expectativa_vida),
    };
  }

  async obtenerUltimaExportacion(
    idLiquidacionPeriodo: number,
  ): Promise<{ registro: PreviredExportacionRegistro | null; tablaDesplegada: boolean }> {
    const { data, error } = await this.supabase
      .from('nomina_previred_exportacion')
      .select('*')
      .eq('id_liquidacion_periodo', idLiquidacionPeriodo)
      .order('exportado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (esTablaInexistente(error)) {
        return { registro: null, tablaDesplegada: false };
      }
      lanzarErrorSupabaseRepositorio(error, 'consultar el historial de exportación Previred');
    }

    return {
      registro: data ? mapExportacionRow(data) : null,
      tablaDesplegada: true,
    };
  }

  async registrarExportacion(
    params: RegistrarExportacionPreviredParams,
  ): Promise<PreviredExportacionRegistro> {
    const { data, error } = await this.supabase.rpc('registrar_exportacion_previred', {
      p_id_liquidacion_periodo: params.idLiquidacionPeriodo,
      p_id_nomina_periodo: params.idNominaPeriodo ?? undefined,
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

    lanzarErrorSupabaseRepositorio(error, 'registrar la exportación Previred');
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

function esColumnaInexistente(error: {
  code?: string;
  message?: string;
}): boolean {
  const msg = (error.message ?? '').toLowerCase();
  return error.code === '42703' || msg.includes('column') && msg.includes('does not exist');
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
