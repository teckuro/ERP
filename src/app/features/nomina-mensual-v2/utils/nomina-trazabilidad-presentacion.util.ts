import type {
  EstadoAuditoriaPasoNomina,
  EstadoIntegridadNomina,
  EventoTrazabilidadNomina,
  OrigenEventoTrazabilidadNomina,
  ResumenAuditoriaPasoNomina,
} from '../models/nomina-trazabilidad.models';
import type { PayrollStepId } from '../models/nomina-mensual-v2.models';

/** Copy visible de integridad. Nunca implica validación en frontend. */
export function etiquetaIntegridadVisible(
  estado: EstadoIntegridadNomina,
  origen?: OrigenEventoTrazabilidadNomina,
): string {
  switch (estado) {
    case 'verificadoServidor':
      return 'Verificado por servidor';
    case 'registrado':
      return origen === 'mock' ? 'Referencia demo' : 'Registro guardado';
    case 'pendiente':
      return 'Pendiente de verificación del servidor';
    case 'invalidado':
      return 'Registro invalidado';
    case 'noDisponible':
    default:
      return 'Integridad no disponible';
  }
}

const NOMBRES_GENERICOS = new Set(['sistema', 'rrhh', '—', 'â€”', '-']);

export function obtenerInicialesResponsable(usuarioNombre: string | null | undefined): string | undefined {
  if (!usuarioNombre?.trim()) return undefined;
  const limpio = usuarioNombre.trim();
  const lower = limpio.toLowerCase();
  if (lower === 'usuario actual') return 'UA';
  if (limpio.includes('@')) {
    const local = limpio.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
    return local ? local.slice(0, 2).toUpperCase() : 'UA';
  }
  if (NOMBRES_GENERICOS.has(lower)) return undefined;
  const partes = limpio.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0]![0] ?? ''}${partes[1]![0] ?? ''}`.toUpperCase();
  }
  return limpio.slice(0, 2).toUpperCase();
}

export function tieneResponsableRegistrado(
  resumen: ResumenAuditoriaPasoNomina | undefined,
  eventos: readonly EventoTrazabilidadNomina[],
  paso: PayrollStepId,
): boolean {
  if (eventos.some((e) => e.paso === paso && (e.origen === 'local' || e.origen === 'servidor'))) {
    return true;
  }
  return !!(
    resumen
    && resumen.estado !== 'pendiente'
    && resumen.fechaAccion
    && resumen.usuarioNombre
    && !NOMBRES_GENERICOS.has(resumen.usuarioNombre.toLowerCase())
  );
}

export function obtenerTituloAccionPaso(resumen: ResumenAuditoriaPasoNomina | undefined): string {
  if (!resumen || resumen.estado === 'pendiente') return 'Registro pendiente';
  switch (resumen.paso) {
    case 'parameters':
      return resumen.estado === 'congelado' ? 'Parámetros cerrados' : 'Parámetros revisados';
    case 'scope':
      return 'Alcance definido';
    case 'employees':
      return 'Empleados validados';
    case 'validation':
      return 'Prenómina validada';
    case 'approval':
      return resumen.estado === 'aprobado' ? 'Nómina aprobada' : 'Pendiente de aprobación';
    case 'calculation':
      return 'Cálculo ejecutado';
    case 'payslips':
      return 'Liquidaciones generadas';
    default:
      return etiquetaEstadoAuditoriaPaso(resumen.estado);
  }
}

export function obtenerCopyAuditoriaPaso(resumen: ResumenAuditoriaPasoNomina | undefined): string {
  if (!resumen || resumen.estado === 'pendiente') return 'Sin evento registrado';
  const hora = formatoHoraCorta(resumen.fechaAccion);
  const nombre =
    resumen.usuarioNombre && !NOMBRES_GENERICOS.has(resumen.usuarioNombre.toLowerCase())
      ? resumen.usuarioNombre
      : 'Usuario actual';
  return `${nombre} · ${hora}`;
}

export function obtenerTooltipAuditoriaPaso(
  resumen: ResumenAuditoriaPasoNomina | undefined,
  integridadLabel: string,
): string {
  if (!resumen || resumen.estado === 'pendiente') {
    return 'Registro pendiente · Sin evento registrado';
  }
  const titulo = obtenerTituloAccionPaso(resumen);
  const fecha = formatoFechaTrazabilidad(resumen.fechaAccion);
  const nombre =
    resumen.usuarioNombre && !NOMBRES_GENERICOS.has(resumen.usuarioNombre.toLowerCase())
      ? resumen.usuarioNombre
      : 'Usuario actual';
  return `${titulo}\n${nombre} · ${fecha}\n${integridadLabel}`;
}

export function verboResponsablePaso(paso: PayrollStepId, estado: EstadoAuditoriaPasoNomina): string {
  switch (paso) {
    case 'parameters':
      return estado === 'congelado' ? 'Cerrado por' : 'Revisado por';
    case 'scope':
      return 'Definido por';
    case 'employees':
      return 'Validado por';
    case 'validation':
      return 'Validado por';
    case 'approval':
      return estado === 'aprobado' ? 'Aprobado por' : 'Revisado por';
    default:
      return 'Registrado por';
  }
}

export function etiquetaEstadoAuditoriaPaso(estado: EstadoAuditoriaPasoNomina): string {
  switch (estado) {
    case 'congelado':
      return 'Parámetros cerrados';
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
