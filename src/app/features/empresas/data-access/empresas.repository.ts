import { Injectable, inject } from '@angular/core';

import type { Database } from '../../../core/models/database.types';
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
      throw new Error(error.message);
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
      throw new Error(error.message);
    }

    return data ? mapEmpresaRowToDetalle(data as EmpresaRow) : null;
  }

  async crear(payload: EmpresaFormPayload): Promise<EmpresaDetalle> {
    const insert = mapEmpresaFormToInsert(payload);
    const { data, error } = await this.supabase.from('empresa').insert(insert).select('*').single();

    if (error) {
      throw new Error(error.message);
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
      throw new Error(error.message);
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
      throw new Error(error.message);
    }

    return ((data ?? []) as OrganismoMutualRow[]).map((row) => mapOrganismoRowToCatalogo(row));
  }
}
