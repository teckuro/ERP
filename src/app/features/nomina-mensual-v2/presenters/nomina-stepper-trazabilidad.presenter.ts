import type { PayrollStep, PayrollStepId, PayrollStepStatus } from '../models/nomina-mensual-v2.models';
import { MENSAJE_CALCULO_NO_VIGENTE } from '../containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion';
import type {
  PasoNominaStepperEstadoVisual,
  PasoNominaStepperView,
  ResumenTrazabilidadPasoActualView,
} from '../models/nomina-stepper-trazabilidad.models';
import type {
  EventoTrazabilidadNomina,
  ResumenAuditoriaPasoNomina,
} from '../models/nomina-trazabilidad.models';
import {
  etiquetaIntegridadVisible,
  formatoFechaTrazabilidad,
  obtenerCopyAuditoriaPaso,
  obtenerTituloAccionPaso,
  obtenerTooltipAuditoriaPaso,
  tieneResponsableRegistrado,
  verboResponsablePaso,
} from '../utils/nomina-trazabilidad-presentacion.util';

function mapEstadoStepper(estado: PayrollStepStatus): PasoNominaStepperEstadoVisual {
  switch (estado) {
    case 'active':
      return 'activo';
    case 'completed':
      return 'completo';
    case 'blocked':
      return 'bloqueado';
    case 'warning':
      return 'advertencia';
    case 'pending':
    default:
      return 'pendiente';
  }
}

/** Eventos ya vienen ordenados del más reciente al más antiguo. */
export function obtenerUltimoEventoPaso(
  eventos: readonly EventoTrazabilidadNomina[],
  paso: PayrollStepId,
): EventoTrazabilidadNomina | undefined {
  return eventos.find((evento) => evento.paso === paso);
}

export function construirVistasStepper(
  steps: readonly PayrollStep[],
  _pasoActual: PayrollStepId,
  obtenerEstado: (id: PayrollStepId) => PayrollStepStatus,
  auditoriaPorPaso: Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>>,
  eventos: readonly EventoTrazabilidadNomina[],
): PasoNominaStepperView[] {
  return steps.map((step) => {
    const resumen = auditoriaPorPaso[step.id];
    const evento = obtenerUltimoEventoPaso(eventos, step.id);
    const tiene = tieneResponsableRegistrado(resumen, eventos, step.id);
    return {
      numero: step.number,
      clave: step.id,
      titulo: step.title,
      accion: step.subtitle,
      estado: mapEstadoStepper(obtenerEstado(step.id)),
      responsableNombre: tiene ? resumen?.usuarioNombre : undefined,
      ultimoEvento: evento?.descripcion ?? resumen?.accionPrincipal,
      fechaUltimoEvento: resumen?.fechaAccion ?? evento?.fechaEvento ?? null,
      integridad: resumen?.integridad.estadoIntegridad ?? 'noDisponible',
      tieneTrazabilidad: tiene,
    };
  });
}

export function iconoIntegridad(estado: ResumenTrazabilidadPasoActualView['integridadEstado']): string {
  switch (estado) {
    case 'verificadoServidor':
      return 'shield-check';
    case 'registrado':
      return 'file-clock';
    case 'invalidado':
      return 'shield-alert';
    case 'pendiente':
      return 'clock-3';
    case 'noDisponible':
    default:
      return 'info';
  }
}

export function construirResumenTrazabilidadPasoActual(
  pasoActual: PayrollStepId,
  auditoriaPorPaso: Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>>,
  eventos: readonly EventoTrazabilidadNomina[],
): ResumenTrazabilidadPasoActualView {
  const resumen = auditoriaPorPaso[pasoActual];
  const evento = obtenerUltimoEventoPaso(eventos, pasoActual);
  const tiene = tieneResponsableRegistrado(resumen, eventos, pasoActual);
  const integridadAuditoria = resumen?.integridad.estadoIntegridad;
  const integridadEvento = evento?.integridad.estadoIntegridad;
  const integridadEstado =
    integridadAuditoria && integridadAuditoria !== 'noDisponible'
      ? integridadAuditoria
      : integridadEvento ?? integridadAuditoria ?? 'noDisponible';
  const integridadLabel = etiquetaIntegridadVisible(integridadEstado, evento?.origen);
  const nombreAuditoria =
    resumen?.usuarioNombre && resumen.usuarioNombre !== '—' ? resumen.usuarioNombre : null;
  const nombreEvento =
    evento?.usuarioNombre && evento.usuarioNombre !== '—' ? evento.usuarioNombre : null;
  const nombre = nombreAuditoria ?? nombreEvento ?? 'Sin responsable registrado';

  return {
    paso: pasoActual,
    responsableNombre: tiene ? nombre : 'Sin responsable registrado',
    responsableTooltip: resumen
      ? obtenerTooltipAuditoriaPaso(
          {
            ...resumen,
            accionPrincipal: `${verboResponsablePaso(pasoActual, resumen.estado)} ${nombre}`,
          },
          integridadLabel,
        )
      : 'Sin responsable registrado',
    ultimoEvento: evento?.descripcion ?? obtenerTituloAccionPaso(resumen) ?? 'Sin eventos todavía',
    fechaUltimoEvento: resumen?.fechaAccion
      ? formatoFechaTrazabilidad(resumen.fechaAccion)
      : 'Sin eventos todavía',
    integridadLabel,
    integridadEstado,
    iconoIntegridad: iconoIntegridad(integridadEstado),
    tieneTrazabilidad: tiene,
  };
}

export function tooltipFechaPaso(resumen: ResumenTrazabilidadPasoActualView): string {
  return `Ver fecha del último evento\n${resumen.fechaUltimoEvento}`;
}

export function tooltipIntegridadPaso(resumen: ResumenTrazabilidadPasoActualView): string {
  return `Ver estado de integridad\n${resumen.integridadLabel}`;
}

export function copyResponsableCompacto(resumen: ResumenAuditoriaPasoNomina | undefined): string {
  if (!resumen || resumen.estado === 'pendiente') return 'Sin responsable registrado';
  return obtenerCopyAuditoriaPaso(resumen);
}

export interface OpcionesTooltipPasoStepper {
  congelado: boolean;
  noAccesible: boolean;
  tooltipCongelado: () => string;
  tooltipNoAccesible: (paso: PayrollStepId) => string;
}

/**
 * Tooltip nativo del botón de paso: bloqueos operativos, cálculo no vigente
 * y última acción registrada cuando hay trazabilidad.
 */
export function tooltipPasoStepper(
  vista: PasoNominaStepperView,
  opts: OpcionesTooltipPasoStepper,
): string | null {
  if (opts.congelado) return opts.tooltipCongelado();
  if (opts.noAccesible) return opts.tooltipNoAccesible(vista.clave);
  if (vista.estado === 'advertencia') return MENSAJE_CALCULO_NO_VIGENTE;
  const ultimo = vista.ultimoEvento?.trim();
  if (vista.tieneTrazabilidad && ultimo) return ultimo;
  return null;
}
