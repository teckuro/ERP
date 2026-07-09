/**
 * Cliente de la Edge Function `admin-usuarios` (crear/listar/gestionar usuarios).
 * Requiere sesión con rol admin del sistema; la función valida el JWT en servidor.
 */

import { Injectable } from '@angular/core';

import { injectSupabase } from '../../../core/services/supabase.service';
import type { CrearUsuarioInput, UsuarioErp } from '../models/administracion.model';

const FUNCTION_NAME = 'admin-usuarios';

interface AdminUsuariosResponse {
  usuarios?: UsuarioErp[];
  usuario?: UsuarioErp;
  ok?: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsuariosClient {
  private readonly supabase = injectSupabase();

  async listar(): Promise<UsuarioErp[]> {
    const data = await this.invocar({ accion: 'listar' });
    return data.usuarios ?? [];
  }

  async crear(input: CrearUsuarioInput): Promise<UsuarioErp> {
    const data = await this.invocar({
      accion: 'crear',
      email: input.email,
      password: input.password,
      nombre: input.nombre,
      idPerfil: input.idPerfil,
    });
    if (!data.usuario) {
      throw new Error('No fue posible crear el usuario.');
    }
    return data.usuario;
  }

  async asignarPerfil(userId: string, idPerfil: number): Promise<UsuarioErp> {
    const data = await this.invocar({ accion: 'asignar_perfil', userId, idPerfil });
    if (!data.usuario) {
      throw new Error('No fue posible actualizar el perfil del usuario.');
    }
    return data.usuario;
  }

  async desactivar(userId: string): Promise<UsuarioErp> {
    const data = await this.invocar({ accion: 'desactivar', userId });
    if (!data.usuario) {
      throw new Error('No fue posible desactivar el usuario.');
    }
    return data.usuario;
  }

  async reactivar(userId: string): Promise<UsuarioErp> {
    const data = await this.invocar({ accion: 'reactivar', userId });
    if (!data.usuario) {
      throw new Error('No fue posible reactivar el usuario.');
    }
    return data.usuario;
  }

  private async invocar(body: Record<string, unknown>): Promise<AdminUsuariosResponse> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Debes iniciar sesión para administrar usuarios.');
    }

    const { data, error } = await this.supabase.functions.invoke<AdminUsuariosResponse>(
      FUNCTION_NAME,
      { body },
    );

    if (error) {
      throw new Error(await this.mensajeDesdeError(error));
    }
    if (data?.error) {
      throw new Error(data.error);
    }
    return data ?? {};
  }

  private async mensajeDesdeError(error: { message: string; context?: Response }): Promise<string> {
    const response = error.context;
    if (response) {
      try {
        const body = (await response.clone().json()) as { error?: string; message?: string };
        const detalle = body?.error ?? body?.message;
        if (detalle) return detalle;
      } catch {
        /* cuerpo no JSON */
      }
      if (response.status === 404) {
        return 'La administración de usuarios no está disponible en el servidor. Contacta a soporte.';
      }
    }
    return 'No fue posible completar la operación de usuarios.';
  }
}
