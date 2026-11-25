import { Injectable } from '@angular/core';

import { lanzarErrorSupabaseRepositorio } from '../../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../../core/services/supabase.service';
import type {
  ActualizarNovedadMensualInput,
  CambiarEstadoNovedadMensualInput,
  CrearNovedadMensualInput,
  NovedadMensual,
  NovedadMensualEstado,
} from '../models/novedad-mensual.model';
import {
  mapActualizarNovedadMensualToUpdate,
  mapCrearNovedadMensualToInsert,
  mapRowToNovedadMensual,
} from './novedades-mensuales.mapper';

const SELECT_NOVEDAD =
  'id_novedad_remuneracion_periodo, periodo, id_persona, id_contrato, id_concepto, categoria, tipo_movimiento, cantidad, unidad, monto, moneda, origen, fecha_evento, estado, observacion, referencia_externa, codigo_motivo_ausencia, id_licencia, creado_por, aprobado_por, fecha_aprobacion, fecha_creacion, fecha_actualizacion';

@Injectable({ providedIn: 'root' })
export class NovedadesMensualesRepository {
  private readonly supabase = injectSupabase();

  async listarPorPeriodo(periodo: string): Promise<NovedadMensual[]> {
    const { data, error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .select(SELECT_NOVEDAD)
      .eq('periodo', periodo.trim())
      .order('id_novedad_remuneracion_periodo', { ascending: true });

    if (error) lanzarErrorSupabaseRepositorio(error, 'listar novedades del periodo');
    return (data ?? []).map((row) => mapRowToNovedadMensual(row));
  }

  async listarPorPeriodoYPersona(periodo: string, idPersona: number): Promise<NovedadMensual[]> {
    const { data, error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .select(SELECT_NOVEDAD)
      .eq('periodo', periodo.trim())
      .eq('id_persona', idPersona)
      .order('id_novedad_remuneracion_periodo', { ascending: true });

    if (error) lanzarErrorSupabaseRepositorio(error, 'listar novedades del trabajador');
    return (data ?? []).map((row) => mapRowToNovedadMensual(row));
  }

  async obtenerPorId(idNovedad: number): Promise<NovedadMensual | null> {
    const { data, error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .select(SELECT_NOVEDAD)
      .eq('id_novedad_remuneracion_periodo', idNovedad)
      .maybeSingle();

    if (error) lanzarErrorSupabaseRepositorio(error, 'obtener la novedad');
    return data ? mapRowToNovedadMensual(data) : null;
  }

  async crear(input: CrearNovedadMensualInput): Promise<NovedadMensual> {
    const insert = mapCrearNovedadMensualToInsert(input);
    const { data, error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .insert(insert)
      .select(SELECT_NOVEDAD)
      .single();

    if (error) lanzarErrorSupabaseRepositorio(error, 'crear la novedad');
    return mapRowToNovedadMensual(data);
  }

  async actualizar(idNovedad: number, input: ActualizarNovedadMensualInput): Promise<NovedadMensual> {
    const patch = mapActualizarNovedadMensualToUpdate(input);
    const { data, error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .update(patch)
      .eq('id_novedad_remuneracion_periodo', idNovedad)
      .select(SELECT_NOVEDAD)
      .single();

    if (error) lanzarErrorSupabaseRepositorio(error, 'actualizar la novedad');
    return mapRowToNovedadMensual(data);
  }

  async cambiarEstado(
    idNovedad: number,
    estado: NovedadMensualEstado,
    metadata: Omit<CambiarEstadoNovedadMensualInput, 'idNovedad' | 'estado'> = {},
  ): Promise<NovedadMensual> {
    const fechaActualizacion = new Date().toISOString();
    const patch = {
      estado,
      fecha_actualizacion: fechaActualizacion,
      observacion: metadata.observacion?.trim() ? metadata.observacion.trim() : undefined,
      aprobado_por: undefined as string | null | undefined,
      fecha_aprobacion: undefined as string | null | undefined,
    };

    if (estado === 'aprobada' || estado === 'incorporada_a_pre_nomina' || estado === 'calculada') {
      patch.aprobado_por = metadata.aprobadoPor ?? null;
      patch.fecha_aprobacion = fechaActualizacion;
    }

    const { data, error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .update(patch)
      .eq('id_novedad_remuneracion_periodo', idNovedad)
      .select(SELECT_NOVEDAD)
      .single();

    if (error) lanzarErrorSupabaseRepositorio(error, 'cambiar el estado de la novedad');
    return mapRowToNovedadMensual(data);
  }

  async anular(idNovedad: number, observacion?: string | null): Promise<NovedadMensual> {
    return this.cambiarEstado(idNovedad, 'anulada', { observacion });
  }

  async eliminarSoloBorrador(idNovedad: number): Promise<void> {
    const { error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .delete()
      .eq('id_novedad_remuneracion_periodo', idNovedad)
      .eq('estado', 'borrador');

    if (error) lanzarErrorSupabaseRepositorio(error, 'eliminar la novedad en borrador');
  }
}
