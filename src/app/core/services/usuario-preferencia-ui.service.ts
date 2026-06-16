import { Injectable } from '@angular/core';

import type { Json } from '../models/database.types';
import { injectSupabase } from './supabase.service';

type PreferenciaUiRpcClient = {
  rpc(
    fn:
      | 'obtener_preferencia_ui'
      | 'preferencia_ui_establecida'
      | 'guardar_preferencia_ui',
    args: { p_clave: string; p_valor?: Json },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Preferencias UI puntuales por usuario (BD `usuario_preferencia_ui`).
 * Transversal: coach marks, hints, paneles, etc. ERP-UI-PREF-01.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioPreferenciaUiService {
  private readonly supabase = injectSupabase() as unknown as PreferenciaUiRpcClient;

  async obtener(clave: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase.rpc('obtener_preferencia_ui', {
      p_clave: clave.trim(),
    });
    if (error) {
      throw new Error(error.message);
    }
    if (data == null || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }
    return data as Record<string, unknown>;
  }

  async estaEstablecida(clave: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('preferencia_ui_establecida', {
      p_clave: clave.trim(),
    });
    if (error) {
      throw new Error(error.message);
    }
    return data === true;
  }

  async guardar(clave: string, valor: Record<string, unknown> = { marcado: true }): Promise<void> {
    const { error } = await this.supabase.rpc('guardar_preferencia_ui', {
      p_clave: clave.trim(),
      p_valor: valor as Json,
    });
    if (error) {
      throw new Error(error.message);
    }
  }
}
