import { Injectable, inject } from '@angular/core';

import type { Database } from '../../../core/models/database.types';
import { lanzarErrorSupabaseRepositorio } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  mapEmpresaFormToInsert,
  mapEmpresaFormToUpdate,
  mapEmpresaRowToDetalle,
  mapEmpresaRowToListadoFila,
  mapOrganismoRowToCatalogo,
} from '../mappers/empresa.mapper';
import type { EmpresaDetalle, EmpresaFormPayload, EmpresaListadoFila, OrganismoMutualCatalogo } from '../models/empresa.model';

type EmpresaRow = Database['public']['Tables']['empresa']['Row'];

/** Datos de mutual (Ley 16.744) que usa el motor de cálculo de nómina. */
export type EmpresaLey16744Datos = Pick<
  EmpresaRow,
  | 'id_empresa'
  | 'aplica_ley_16744'
  | 'id_organismo_administrador_ley_16744'
  | 'tasa_adicional_diferenciada'
  | 'vigencia_inicio'
  | 'vigencia_fin'
>;
type OrganismoMutualRow = {
  id_organismo_administrador_ley_16744: number;
  codigo: string;
  nombre: string;
  tipo: string;
  vigente: boolean;
};

@Injectable({ providedIn: 'root' })
export class EmpresasRepository {
  private readonly supabase = injectSupabase();

  async obtenerDatosLey16744(idEmpresa: number): Promise<EmpresaLey16744Datos | null> {
    const { data, error } = await this.supabase
      .from('empresa')
      .select(
        'id_empresa, aplica_ley_16744, id_organismo_administrador_ley_16744, tasa_adicional_diferenciada, vigencia_inicio, vigencia_fin',
      )
      .eq('id_empresa', idEmpresa)
      .maybeSingle();

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'consultar los datos de mutual de la empresa');
    }
    return data;
  }

  async listar(): Promise<EmpresaListadoFila[]> {
    const { data, error } = await this.supabase
      .from('empresa')
      .select(
        `
        id_empresa, rut, dv, razon_social, nombre_fantasia, comuna, aplica_ley_16744,
        organismo_administrador_ley_16744 ( nombre )
      `,
      )
      .order('razon_social', { ascending: true });

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'cargar el listado de empresas');
    }

    return (data ?? []).map((row) => mapEmpresaRowToListadoFila(row as EmpresaRow & { organismo_administrador_ley_16744?: { nombre: string } | { nombre: string }[] | null }));
  }

  async obtenerPorId(idEmpresa: number): Promise<EmpresaDetalle | null> {
    const { data, error } = await this.supabase
      .from('empresa')
      .select('*')
      .eq('id_empresa', idEmpresa)
      .maybeSingle();

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'cargar la ficha de empresa');
    }

    return data ? mapEmpresaRowToDetalle(data as EmpresaRow) : null;
  }

  async crear(payload: EmpresaFormPayload): Promise<EmpresaDetalle> {
    const insert = mapEmpresaFormToInsert(payload);
    const { data, error } = await this.supabase.from('empresa').insert(insert).select('*').single();

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'crear la empresa');
    }

    return mapEmpresaRowToDetalle(data as EmpresaRow);
  }

  async actualizar(idEmpresa: number, payload: EmpresaFormPayload): Promise<EmpresaDetalle> {
    const update = mapEmpresaFormToUpdate(payload);
    const { data, error } = await this.supabase
      .from('empresa')
      .update(update)
      .eq('id_empresa', idEmpresa)
      .select('*')
      .single();

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'guardar la empresa');
    }

    return mapEmpresaRowToDetalle(data as EmpresaRow);
  }

  async listarOrganismosMutual(): Promise<OrganismoMutualCatalogo[]> {
    const { data, error } = await this.supabase
      .from('organismo_administrador_ley_16744')
      .select('id_organismo_administrador_ley_16744, codigo, nombre, tipo, vigente')
      .eq('vigente', true)
      .order('nombre', { ascending: true });

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'cargar los organismos mutual');
    }

    return ((data ?? []) as OrganismoMutualRow[]).map((row) => mapOrganismoRowToCatalogo(row));
  }
}
