import { Injectable } from '@angular/core';

import { getAppConfig } from '../../config/runtime-config';
import { injectSupabase } from './supabase.service';

export type PreguntorRespuesta = {
  respuesta: string;
};

export class AsistentePreguntorError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AsistentePreguntorError';
  }
}

const DEFAULT_FUNCTION_NAME = 'super-service';

@Injectable({ providedIn: 'root' })
export class AsistentePreguntorService {
  private readonly supabase = injectSupabase();

  private functionName(): string {
    return getAppConfig().asistentePreguntorFunction ?? DEFAULT_FUNCTION_NAME;
  }

  async consultar(pregunta: string): Promise<string> {
    const texto = pregunta.trim();
    if (!texto) {
      throw new AsistentePreguntorError('Escribe una pregunta.');
    }

    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.access_token) {
      throw new AsistentePreguntorError('Debes iniciar sesión para usar el preguntor.');
    }

    const { data, error } = await this.supabase.functions.invoke<PreguntorRespuesta>(
      this.functionName(),
      { body: { pregunta: texto } },
    );

    if (error) {
      throw new AsistentePreguntorError(
        await this.mensajeDesdeError(error),
        error.context?.status,
      );
    }

    const respuesta = data?.respuesta?.trim() ?? '';
    if (!respuesta) {
      throw new AsistentePreguntorError('El asistente devolvió una respuesta vacía.');
    }

    return respuesta;
  }

  private async mensajeDesdeError(error: {
    message: string;
    context?: Response;
  }): Promise<string> {
    const fn = this.functionName();
    const response = error.context;

    if (response) {
      let body: { error?: string; message?: string; code?: string } | null = null;
      try {
        body = (await response.clone().json()) as {
          error?: string;
          message?: string;
          code?: string;
        };
      } catch {
        body = null;
      }

      const detalle = body?.error ?? body?.message;
      if (detalle) {
        return detalle;
      }

      switch (response.status) {
        case 404:
          return (
            `La función "${fn}" no existe en Supabase. ` +
            'Revisa asistentePreguntorFunction en app-config.json (super-service).'
          );
        case 500:
          return (
            `La función "${fn}" falló al ejecutarse (error 500). ` +
            'Edge Functions → super-service → Logs. Pega index.ts de supabase/functions/erp-asistente-preguntor y Deploy.'
          );
        case 503:
          return (
            'Falta NVIDIA_API_KEY en Supabase → Edge Functions → Secrets. ' +
            'No la pongas en index.ts; añade el secret y redeploy.'
          );
        default:
          return `Error del asistente (HTTP ${response.status}). Revisa los logs de "${fn}".`;
      }
    }

    const msg = error.message || '';
    if (msg.includes('Failed to send a request to the Edge Function')) {
      return (
        `No se pudo contactar la función "${fn}". ` +
        'Comprueba que esté desplegada, que app-config.json tenga el nombre correcto y que NVIDIA_API_KEY esté en Secrets.'
      );
    }

    return msg || 'No se pudo obtener respuesta.';
  }
}
