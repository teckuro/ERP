import { Injectable } from '@angular/core';

import { injectSupabase } from '../../../core/services/supabase.service';
import type { GuardarLicenciaMedicaInput, LicenciaMedica } from '../models/licencia-medica.model';
import {
  mapGuardarLicenciaToRpc,
  mapRowToLicenciaIngreso,
  mapRowToLicenciaMedica,
  type LicenciaIngresoRow,
  type LicenciaMedicaRow,
} from './licencias-medicas.mapper';
import type { LicenciaMedicaIngresoCorreo } from '../models/licencia-medica.model';

const SELECT_LICENCIA = `
  id_licencia,
  id_empresa,
  id_persona,
  id_contrato,
  folio,
  tipo,
  fecha_inicio,
  fecha_termino,
  dias,
  estado,
  monto_subsidio,
  observacion,
  origen,
  id_ingreso,
  fecha_creacion,
  persona:persona (
    rut,
    nombres,
    apellido_paterno,
    apellido_materno
  )
`;

function errorSupabase(contexto: string, message: string): Error {
  return new Error(`${contexto}: ${message}`);
}

@Injectable({ providedIn: 'root' })
export class LicenciasMedicasRepository {
  private readonly supabase = injectSupabase();

  async listar(filtros?: {
    estado?: string | null;
    desde?: string | null;
    hasta?: string | null;
  }): Promise<LicenciaMedica[]> {
    const { data, error } = await this.supabase.rpc('listar_licencias_medicas', {
      p_estado: filtros?.estado ?? undefined,
      p_desde: filtros?.desde ?? undefined,
      p_hasta: filtros?.hasta ?? undefined,
    });

    if (error) {
      throw errorSupabase('No fue posible listar licencias médicas', error.message);
    }

    const ids = (data ?? []).map((row: LicenciaMedicaRow) => row.id_licencia);
    if (!ids.length) {
      return [];
    }

    const { data: enriched, error: enrichError } = await this.supabase
      .from('licencia_medica')
      .select(SELECT_LICENCIA)
      .in('id_licencia', ids)
      .order('fecha_creacion', { ascending: false });

    if (enrichError) {
      throw errorSupabase('No fue posible enriquecer licencias médicas', enrichError.message);
    }

    return (enriched ?? []).map((row) => mapRowToLicenciaMedica(row as LicenciaMedicaRow));
  }

  async obtener(idLicencia: number): Promise<LicenciaMedica | null> {
    const { data, error } = await this.supabase
      .from('licencia_medica')
      .select(SELECT_LICENCIA)
      .eq('id_licencia', idLicencia)
      .maybeSingle();

    if (error) {
      throw errorSupabase('No fue posible obtener la licencia médica', error.message);
    }
    return data ? mapRowToLicenciaMedica(data as LicenciaMedicaRow) : null;
  }

  async guardar(input: GuardarLicenciaMedicaInput): Promise<LicenciaMedica> {
    const { data, error } = await this.supabase.rpc(
      'guardar_licencia_medica',
      mapGuardarLicenciaToRpc(input),
    );

    if (error) {
      throw errorSupabase('No fue posible guardar la licencia médica', error.message);
    }

    const guardada = await this.obtener((data as LicenciaMedicaRow).id_licencia);
    if (!guardada) {
      throw new Error('No fue posible recuperar la licencia médica guardada.');
    }
    return guardada;
  }

  async confirmar(idLicencia: number): Promise<LicenciaMedica> {
    const { data, error } = await this.supabase.rpc('confirmar_licencia_medica', {
      p_id_licencia: idLicencia,
    });

    if (error) {
      throw errorSupabase('No fue posible confirmar la licencia médica', error.message);
    }

    const confirmada = await this.obtener((data as LicenciaMedicaRow).id_licencia);
    if (!confirmada) {
      throw new Error('No fue posible recuperar la licencia médica confirmada.');
    }
    return confirmada;
  }

  async marcarVinculadaNomina(idLicencia: number): Promise<LicenciaMedica> {
    const { data, error } = await this.supabase.rpc('marcar_licencia_medica_vinculada_nomina', {
      p_id_licencia: idLicencia,
    });

    if (error) {
      throw errorSupabase('No fue posible marcar la licencia como vinculada', error.message);
    }

    const actualizada = await this.obtener((data as LicenciaMedicaRow).id_licencia);
    if (!actualizada) {
      throw new Error('No fue posible recuperar la licencia médica actualizada.');
    }
    return actualizada;
  }

  async rechazar(idLicencia: number, observacion?: string | null): Promise<LicenciaMedica> {
    return this.guardar({
      idLicencia,
      estado: 'rechazada',
      observacion: observacion ?? undefined,
    });
  }

  async obtenerIngreso(idIngreso: number): Promise<LicenciaMedicaIngresoCorreo | null> {
    const { data, error } = await this.supabase
      .from('licencia_medica_ingreso_correo')
      .select('*')
      .eq('id_ingreso', idIngreso)
      .maybeSingle();

    if (error) {
      throw errorSupabase('No fue posible obtener el ingreso por correo', error.message);
    }
    return data ? mapRowToLicenciaIngreso(data as LicenciaIngresoRow) : null;
  }

  async listarNovedadesPorLicencia(idLicencia: number): Promise<Array<{ periodo: string; idNovedad: number }>> {
    const { data, error } = await this.supabase
      .from('novedad_remuneracion_periodo')
      .select('id_novedad_remuneracion_periodo, periodo')
      .eq('id_licencia', idLicencia);

    if (error) {
      throw errorSupabase('No fue posible listar movimientos vinculados', error.message);
    }

    return (data ?? []).map((row) => ({
      idNovedad: row.id_novedad_remuneracion_periodo as number,
      periodo: String(row.periodo).trim(),
    }));
  }
}
