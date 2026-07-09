import type { UsuarioResponsableActual } from '../../../core/auth/auth-user-label';
import type { LiquidacionAccionUiTipo } from './liquidaciones-acciones-ui.rules';

export interface LiquidacionRevisionActorMetadata {
  usuarioId: string | null;
  usuarioNombre: string;
  registradoEn: string;
}

/** Bloques denormalizados en metadata del trabajador (fallback local si RPC antigua). */
export function buildMetadataRevisionDesdeAccion(
  accion: LiquidacionAccionUiTipo,
  usuario: UsuarioResponsableActual,
  registradoEn = new Date().toISOString(),
): Record<string, unknown> {
  const actor: LiquidacionRevisionActorMetadata = {
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre.trim(),
    registradoEn,
  };

  switch (accion) {
    case 'autorizar':
      return {
        autorizacion: actor,
        autorizadoPor: actor.usuarioNombre,
      };
    case 'registrar_pago':
      return { pago: actor };
    case 'enviar_documento':
      return { documentoEntrega: actor };
    case 'solicitar_rectificacion':
      return { rectificacionSolicitada: actor };
  }
}
