import { Injectable } from '@angular/core';

import { lanzarErrorSupabaseRepositorio } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import type {
  ConfigDocumentoLiquidacion,
  GuardarPerfilAccesoInput,
  PerfilAcceso,
} from '../models/administracion.model';
import {
  mapGuardarPerfilToRpc,
  mapRowToConfigDocumento,
  mapRowToPerfilAcceso,
  type ConfigDocumentoRow,
  type PerfilAccesoRow,
} from './administracion.mapper';

@Injectable({ providedIn: 'root' })
export class AdministracionRepository {
  private readonly supabase = injectSupabase();

  async listarPerfiles(incluirInactivos = false): Promise<PerfilAcceso[]> {
    const { data, error } = await this.supabase.rpc('listar_perfiles_acceso', {
      p_incluir_inactivos: incluirInactivos,
    });

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'listar los perfiles de acceso');
    }
    return ((data ?? []) as PerfilAccesoRow[]).map(mapRowToPerfilAcceso);
  }

  async guardarPerfil(input: GuardarPerfilAccesoInput): Promise<PerfilAcceso> {
    const { data, error } = await this.supabase.rpc(
      'guardar_perfil_acceso',
      mapGuardarPerfilToRpc(input),
    );

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'guardar el perfil');
    }
    return mapRowToPerfilAcceso(data as PerfilAccesoRow);
  }

  async obtenerConfigDocumento(): Promise<ConfigDocumentoLiquidacion | null> {
    const { data, error } = await this.supabase.rpc('obtener_config_documento_liquidacion');

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'cargar la configuración del documento');
    }
    const row = ((data ?? []) as ConfigDocumentoRow[])[0];
    return row ? mapRowToConfigDocumento(row) : null;
  }

  async guardarConfigDocumento(config: ConfigDocumentoLiquidacion): Promise<ConfigDocumentoLiquidacion> {
    const { data, error } = await this.supabase.rpc('guardar_config_documento_liquidacion', {
      p_logo_url: config.logoUrl ?? '',
      p_mostrar_rut: config.mostrarRut,
      p_mostrar_direccion: config.mostrarDireccion,
      p_mostrar_representante: config.mostrarRepresentante,
      p_texto_pie: config.textoPie ?? '',
      p_nombre_firma_empleador: config.nombreFirmaEmpleador ?? '',
    });

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'guardar la configuración del documento');
    }
    return mapRowToConfigDocumento(data as ConfigDocumentoRow);
  }

  /** Sube el logo al bucket `logos-empresa/<idEmpresa>/...` y retorna la URL pública. */
  async subirLogo(idEmpresa: number, archivo: File): Promise<string> {
    const extension = archivo.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${idEmpresa}/logo-${Date.now()}.${extension}`;

    const { error } = await this.supabase.storage
      .from('logos-empresa')
      .upload(path, archivo, { upsert: true, contentType: archivo.type || undefined });

    if (error) {
      lanzarErrorSupabaseRepositorio(error, 'subir el logo');
    }

    const { data } = this.supabase.storage.from('logos-empresa').getPublicUrl(path);
    return data.publicUrl;
  }

  async obtenerDetalleEmpresaDocumento(idEmpresa: number): Promise<{
    direccion: string | null;
    representanteLegal: string | null;
  }> {
    const { data, error } = await this.supabase
      .from('empresa')
      .select('direccion_linea_1, direccion_linea_2, comuna, ciudad, representante_legal_nombre')
      .eq('id_empresa', idEmpresa)
      .maybeSingle();

    if (error || !data) {
      return { direccion: null, representanteLegal: null };
    }

    const direccion = [data.direccion_linea_1, data.direccion_linea_2, data.comuna, data.ciudad]
      .map((v) => (v ?? '').trim())
      .filter(Boolean)
      .join(', ');

    return {
      direccion: direccion || null,
      representanteLegal: data.representante_legal_nombre?.trim() || null,
    };
  }
}
