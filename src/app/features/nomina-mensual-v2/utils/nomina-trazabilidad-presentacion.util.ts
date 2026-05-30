import type {
  EstadoAuditoriaPasoNomina,
  EstadoIntegridadNomina,
  OrigenEventoTrazabilidadNomina,
} from '../models/nomina-trazabilidad.models';

/** Copy visible de integridad; nunca implica validación en frontend. */
export function etiquetaIntegridadVisible(
  estado: EstadoIntegridadNomina,
  origen?: OrigenEventoTrazabilidadNomina,
): string {
  switch (estado) {
    case 'verificadoServidor':
      return 'Integridad verificada';
    case 'registrado':
      return origen === 'mock' ? 'Referencia demo' : 'Snapshot registrado';
    case 'pendiente':
      return 'Pendiente de verificación servidor';
    case 'invalidado':
      return 'Snapshot invalidado';
    case 'noDisponible':
    default:
      return 'No disponible';
  }
}

export function etiquetaEstadoAuditoriaPaso(estado: EstadoAuditoriaPasoNomina): string {
  switch (estado) {
    case 'congelado':
      return 'Parámetros congelados';
    case 'registrado':
      return 'Registrado';
    case 'validado':
      return 'Validado';
    case 'aprobado':
      return 'Aprobado';
    case 'invalidado':
      return 'Invalidado';
    case 'requiereRevision':
      return 'Requiere revisión';
    case 'pendiente':
    default:
      return 'Pendiente';
  }
}

export function formatoFechaTrazabilidad(iso: string | null | undefined): string {
  if (!iso) return 'Sin registro';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatoHoraCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}
