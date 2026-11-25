/**
 * ADMIN-01: datos del emisor para el documento de liquidación.
 *
 * Combina la ficha de la empresa activa con la configuración del documento
 * (`empresa_config_documento`: logo, datos visibles y textos de pie). Ante
 * cualquier falta de datos degrada al comportamiento previo (solo razón social).
 */

import { inject, Injectable } from '@angular/core';

import { limpiarAlCambiarUsuario } from '../auth/limpiar-al-cambiar-usuario';
import { EmpresaActivaService } from './empresa-activa.service';
import { injectSupabase } from './supabase.service';

export interface DocumentoLiquidacionEmpresa {
  razonSocial: string;
  rut?: string | null;
  direccion?: string | null;
  logoUrl?: string | null;
  representanteLegal?: string | null;
  textoPie?: string | null;
  nombreFirmaEmpleador?: string | null;
}

interface ConfigDocumentoSnapshot {
  logoUrl: string | null;
  mostrarRut: boolean;
  mostrarDireccion: boolean;
  mostrarRepresentante: boolean;
  textoPie: string | null;
  nombreFirmaEmpleador: string | null;
}

@Injectable({ providedIn: 'root' })
export class DocumentoLiquidacionService {
  private readonly supabase = injectSupabase();
  private readonly empresaActiva = inject(EmpresaActivaService);

  private cache: DocumentoLiquidacionEmpresa | null = null;

  constructor() {
    // Razón social, RUT y logo impresos en la liquidación: nunca de la sesión anterior.
    limpiarAlCambiarUsuario(() => this.limpiar());
  }

  /**
   * Arma el bloque de empresa del documento. `fallbackNombre` cubre el caso
   * sin empresa activa (se mantiene el nombre denormalizado de la nómina).
   */
  async obtenerEmpresaDocumento(fallbackNombre?: string | null): Promise<DocumentoLiquidacionEmpresa> {
    if (this.cache) {
      return this.aplicarFallback(this.cache, fallbackNombre);
    }

    const empresa = await this.empresaActiva.asegurarCargada().catch(() => null);
    if (!empresa) {
      return { razonSocial: fallbackNombre?.trim() || 'Empleador' };
    }

    const [config, detalle] = await Promise.all([
      this.cargarConfig(),
      this.cargarDetalleEmpresa(empresa.idEmpresa),
    ]);

    const resultado: DocumentoLiquidacionEmpresa = {
      razonSocial: empresa.razonSocial || fallbackNombre?.trim() || 'Empleador',
      rut: config.mostrarRut && empresa.rut ? `${empresa.rut}-${empresa.dv}` : null,
      direccion: config.mostrarDireccion ? detalle.direccion : null,
      logoUrl: config.logoUrl,
      representanteLegal: config.mostrarRepresentante ? detalle.representanteLegal : null,
      textoPie: config.textoPie,
      nombreFirmaEmpleador: config.nombreFirmaEmpleador,
    };
    this.cache = resultado;
    return resultado;
  }

  /** Limpia el snapshot (logout o cambios de configuración). */
  limpiar(): void {
    this.cache = null;
  }

  private aplicarFallback(
    empresa: DocumentoLiquidacionEmpresa,
    fallbackNombre?: string | null,
  ): DocumentoLiquidacionEmpresa {
    if (empresa.razonSocial === 'Empleador' && fallbackNombre?.trim()) {
      return { ...empresa, razonSocial: fallbackNombre.trim() };
    }
    return empresa;
  }

  private async cargarConfig(): Promise<ConfigDocumentoSnapshot> {
    const porDefecto: ConfigDocumentoSnapshot = {
      logoUrl: null,
      mostrarRut: true,
      mostrarDireccion: true,
      mostrarRepresentante: false,
      textoPie: null,
      nombreFirmaEmpleador: null,
    };
    try {
      const { data, error } = await this.supabase.rpc('obtener_config_documento_liquidacion');
      if (error) return porDefecto;
      const row = (data ?? [])[0];
      if (!row) return porDefecto;
      return {
        logoUrl: row.logo_url ?? null,
        mostrarRut: row.mostrar_rut,
        mostrarDireccion: row.mostrar_direccion,
        mostrarRepresentante: row.mostrar_representante,
        textoPie: row.texto_pie ?? null,
        nombreFirmaEmpleador: row.nombre_firma_empleador ?? null,
      };
    } catch {
      return porDefecto;
    }
  }

  private async cargarDetalleEmpresa(idEmpresa: number): Promise<{
    direccion: string | null;
    representanteLegal: string | null;
  }> {
    try {
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
    } catch {
      return { direccion: null, representanteLegal: null };
    }
  }
}
