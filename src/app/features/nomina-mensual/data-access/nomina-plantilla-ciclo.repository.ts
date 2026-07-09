/**
 * Repositorio de Plantillas de ciclos.
 *
 * Creado en `NOM-ADMIN-OPS-F03` (2026-06-11).
 *
 * Operaciones:
 *   - listar plantillas (todas / solo activas) por empresa actual (RLS la restringe);
 *   - obtener plantilla por id;
 *   - insertar plantilla nueva (versión 1);
 *   - desactivar plantilla;
 *   - reactivar plantilla (vía update activo=true);
 *   - eliminar plantilla inactiva;
 *   - invocar RPC `previsualizar_cortes_plantilla`;
 *   - invocar RPC `crear_version_plantilla`.
 *
 * Documento rector:
 *   `docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md` §F03.
 */

import { Injectable } from '@angular/core';

import { lanzarErrorSupabaseRepositorio } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import type { Json } from '../../../core/models/database.types';
import type {
  CrearVersionPlantillaPayload,
  NominaPlantillaCiclo,
  NominaPlantillaCicloNueva,
  PreviewCorte,
} from '../models/nomina-plantilla-ciclo.models';
import {
  plantillaNuevaToInsert,
  rowToNominaPlantillaCiclo,
  rowToPreviewCorte,
} from '../mappers/nomina-plantilla-ciclo.mapper';

function throwIfError(error: { message: string } | null, contexto: string): void {
  if (error) {
    lanzarErrorSupabaseRepositorio(error, contexto);
  }
}

export interface ListarPlantillasFiltro {
  readonly soloActivas?: boolean;
  readonly codigo?: string;
}

@Injectable({ providedIn: 'root' })
export class NominaPlantillaCicloRepository {
  private readonly supabase = injectSupabase();

  async listar(filtro: ListarPlantillasFiltro = {}): Promise<NominaPlantillaCiclo[]> {
    let query = this.supabase
      .from('nomina_plantilla_ciclo')
      .select('*')
      .order('codigo', { ascending: true })
      .order('version', { ascending: false });

    if (filtro.soloActivas) {
      query = query.eq('activo', true);
    }
    if (filtro.codigo) {
      query = query.eq('codigo', filtro.codigo);
    }

    const { data, error } = await query;
    throwIfError(error, 'listarPlantillasCiclo');
    return (data ?? []).map(rowToNominaPlantillaCiclo);
  }

  async obtenerPorId(plantillaId: string): Promise<NominaPlantillaCiclo | null> {
    const { data, error } = await this.supabase
      .from('nomina_plantilla_ciclo')
      .select('*')
      .eq('id', plantillaId)
      .maybeSingle();
    throwIfError(error, 'obtenerPlantillaPorId');
    return data ? rowToNominaPlantillaCiclo(data) : null;
  }

  async crearPlantillaNueva(plantilla: NominaPlantillaCicloNueva): Promise<NominaPlantillaCiclo> {
    const insert = plantillaNuevaToInsert(plantilla);
    const { data, error } = await this.supabase
      .from('nomina_plantilla_ciclo')
      .insert(insert)
      .select('*')
      .single();
    throwIfError(error, 'crearPlantillaNueva');
    if (!data) {
      throw new Error('crearPlantillaNueva: insert no devolvió fila');
    }
    return rowToNominaPlantillaCiclo(data);
  }

  async desactivar(plantillaId: string): Promise<void> {
    const { error } = await this.supabase
      .from('nomina_plantilla_ciclo')
      .update({ activo: false })
      .eq('id', plantillaId);
    throwIfError(error, 'desactivarPlantilla');
  }

  async reactivar(plantillaId: string): Promise<void> {
    const { error } = await this.supabase
      .from('nomina_plantilla_ciclo')
      .update({ activo: true })
      .eq('id', plantillaId);
    throwIfError(error, 'reactivarPlantilla');
  }

  async eliminarInactiva(plantillaId: string): Promise<void> {
    // RLS solo permite delete si activo=false. Si la fila está activa, fallará.
    const { error } = await this.supabase
      .from('nomina_plantilla_ciclo')
      .delete()
      .eq('id', plantillaId);
    throwIfError(error, 'eliminarPlantillaInactiva');
  }

  async previsualizarCortes(
    plantillaId: string,
    anio: number,
    cantidad?: number,
  ): Promise<PreviewCorte[]> {
    const args: { p_plantilla_id: string; p_anio: number; p_cantidad?: number } = {
      p_plantilla_id: plantillaId,
      p_anio: anio,
    };
    if (cantidad !== undefined) {
      args.p_cantidad = cantidad;
    }

    const { data, error } = await this.supabase.rpc('previsualizar_cortes_plantilla', args);
    throwIfError(error, 'previsualizarCortesPlantilla');
    return (data ?? []).map(rowToPreviewCorte);
  }

  async crearVersion(payload: CrearVersionPlantillaPayload): Promise<string> {
    const args: {
      p_plantilla_id: string;
      p_nombre?: string;
      p_regla_fecha_pago?: Json;
      p_politica_fin_semana?: string;
      p_regla_anticipo?: Json;
      p_descripcion?: string;
      p_activar?: boolean;
    } = {
      p_plantilla_id: payload.plantillaId,
    };

    if (payload.nombre !== undefined) args.p_nombre = payload.nombre;
    if (payload.reglaFechaPago !== undefined) {
      args.p_regla_fecha_pago = payload.reglaFechaPago as unknown as Json;
    }
    if (payload.politicaFinSemana !== undefined) {
      args.p_politica_fin_semana = payload.politicaFinSemana;
    }
    if (payload.reglaAnticipo !== undefined) {
      args.p_regla_anticipo = payload.reglaAnticipo as unknown as Json;
    }
    if (payload.descripcion !== undefined) args.p_descripcion = payload.descripcion;
    if (payload.activar !== undefined) args.p_activar = payload.activar;

    const { data, error } = await this.supabase.rpc('crear_version_plantilla', args);
    throwIfError(error, 'crearVersionPlantilla');
    if (!data) {
      throw new Error('crearVersionPlantilla: RPC no devolvió id');
    }
    return data;
  }
}
