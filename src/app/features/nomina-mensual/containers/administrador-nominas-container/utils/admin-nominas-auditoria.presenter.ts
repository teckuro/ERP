/**
 * Presenter del historial administrativo de una nómina.
 *
 * Convierte los `EventoAuditoriaNomina` (enum técnico) en filas legibles para
 * RRHH: acción humana, usuario resuelto (cuando aplica), fecha formateada y
 * motivo cuando la BD lo registró. No expone IDs internos ni nombres de
 * tablas/funciones.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md` §F17.
 */

import type { EventoAuditoriaNomina } from '../../../models/nomina-periodo.models';

/** Mapa enum técnico → etiqueta humana administrativa. */
const ETIQUETA_ACCION: Record<EventoAuditoriaNomina['accion'], string> = {
  creada: 'Nómina creada',
  dotacion_confirmada: 'Dotación confirmada',
  movimientos_actualizados: 'Movimientos actualizados',
  calculo_invalidado: 'Cálculo invalidado',
  calculada: 'Cálculo registrado',
  validada: 'Validación registrada',
  aprobada: 'Nómina aprobada',
  liquidada: 'Liquidaciones generadas',
  cerrada: 'Nómina cerrada',
  reabierta: 'Nómina reabierta',
  anulada: 'Nómina anulada',
};

export function etiquetaAccionAuditoria(accion: EventoAuditoriaNomina['accion']): string {
  return ETIQUETA_ACCION[accion] ?? 'Movimiento registrado';
}

/** Vista lista para renderizar: una fila por evento, ya ordenada desc. */
export interface FilaHistorialAdministrativo {
  id: string;
  accion: string;
  usuario: string;
  fechaCorta: string;
  fechaLarga: string;
  motivo: string | null;
}

/**
 * Formatea fecha/hora con tolerancia a `Invalid Date`. Devuelve cadena vacía
 * si el ISO es nulo o inválido, para que el binding no muestre `Invalid Date`.
 */
function formatearFechaHoraCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  const hh = fecha.getHours().toString().padStart(2, '0');
  const mm = fecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${anio} ${hh}:${mm}`;
}

function formatearFechaHoraLarga(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  try {
    return fecha.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return formatearFechaHoraCorta(iso);
  }
}

/**
 * Mapea eventos crudos a filas listas para UI. Orden cronológico inverso
 * (más reciente primero). El `usuarioLabelResolver` permite que el container
 * inyecte una función para mapear `usuarioId → nombre` cuando puede resolverse
 * desde el contexto de auth (usuario actual). Cuando no hay match retorna
 * `Usuario no informado`, sin filtrar la fila.
 */
export function mapearHistorialAdministrativo(
  eventos: readonly EventoAuditoriaNomina[],
  usuarioLabelResolver?: (usuarioId: string | undefined) => string | null,
): FilaHistorialAdministrativo[] {
  // Orden cronológico inverso por ISO (más reciente primero). Hacemos copia
  // porque `eventos` puede venir como signal readonly y no podemos mutarlo.
  const ordenados = [...eventos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return ordenados.map<FilaHistorialAdministrativo>((evento) => {
    const usuarioResuelto = usuarioLabelResolver?.(evento.usuarioId) ?? null;
    const usuario = usuarioResuelto && usuarioResuelto.trim().length > 0
      ? usuarioResuelto
      : 'Usuario no informado';
    return {
      id: evento.id,
      accion: etiquetaAccionAuditoria(evento.accion),
      usuario,
      fechaCorta: formatearFechaHoraCorta(evento.createdAt),
      fechaLarga: formatearFechaHoraLarga(evento.createdAt),
      motivo: evento.motivo && evento.motivo.trim().length > 0 ? evento.motivo : null,
    };
  });
}
