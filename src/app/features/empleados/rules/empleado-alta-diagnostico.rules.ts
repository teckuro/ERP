import type { EvaluacionCompletitudEmpleado } from '../utils/empleado-completitud.rules';
import { evaluarCompletitudYAptitudEmpleado } from '../utils/empleado-completitud.rules';
import type { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import {
  buildFichaEstadoPanelVm,
  type EstadoTabFichaEmpleado,
  type FaltanteFichaEmpleado,
} from './ficha-empleado-presentacion.rules';
import type { ClaveTabFichaEmpleado } from '../models/ficha-empleado-tabs.config';
import { wizardStepDesdeClaveTab } from '../models/ficha-empleado-tabs.config';
import {
  evaluarDiagnosticoFichaEmpleado,
  type EmpleadoFichaDiagnostico,
  type EmpleadoFichaValidacionFormTab,
  type EmpleadoFichaValidacionItem,
  type EmpleadoFichaValidacionSnapshot,
} from './empleado-diagnostico.rules';

export type { EmpleadoFichaDiagnostico, EmpleadoFichaValidacionSnapshot } from './empleado-diagnostico.rules';
export { evaluarDiagnosticoFichaEmpleado, snapshotValidacionDesdePayload } from './empleado-diagnostico.rules';

export type AltaValidationStepId = EmpleadoFichaValidacionFormTab;

export interface ReglaValidacionAltaEvaluada {
  id: string;
  stepId: AltaValidationStepId;
  wizardStep: number;
  sectionTitle: string;
  label: string;
  detail: string;
  actionLabel?: string;
  severity: 'error' | 'warning' | 'info';
  blocking: boolean;
  complete: boolean;
  visible: boolean;
  sourcePath: string;
  category?: string;
}

export function mapDiagnosticoItemsToEvaluatedRules(
  diagnostico: EmpleadoFichaDiagnostico,
): ReglaValidacionAltaEvaluada[] {
  return diagnostico.items.map((item) => ({
    id: item.id,
    stepId: item.formTab,
    wizardStep: item.wizardStep,
    sectionTitle: item.category ?? item.seccion,
    label: item.label,
    detail: item.detalle,
    actionLabel: item.accion,
    severity: item.severity,
    blocking: item.blocking,
    complete: item.complete,
    visible: item.visible,
    sourcePath: item.controlPath,
    category: item.category,
  }));
}

export function evaluacionCompletitudDesdeDiagnostico(
  diagnostico: EmpleadoFichaDiagnostico,
): EvaluacionCompletitudEmpleado {
  const unique = (values: string[]) => [...new Set(values)];
  return {
    estadoFicha: diagnostico.aptoParaRemuneraciones ? 'VALIDO' : 'INCOMPLETO',
    aptoParaRemuneraciones: diagnostico.aptoParaRemuneraciones,
    bloqueos: unique(diagnostico.bloqueos.map((item) => item.detalle || item.label)),
    advertencias: unique(diagnostico.advertencias.map((item) => item.detalle || item.label)),
    defaultsTecnicosDetectados: unique(
      diagnostico.bloqueos
        .map((item) => item.defaultCode)
        .filter((item): item is string => Boolean(item)),
    ),
    seccionesPendientes: unique(diagnostico.bloqueos.map((item) => item.seccion)),
  };
}

export function estadoTabDesdeDiagnostico(
  tab: ClaveTabFichaEmpleado,
  items: readonly EmpleadoFichaValidacionItem[],
): EstadoTabFichaEmpleado {
  const scoped = items.filter((item) => item.tabFicha === tab && item.visible);
  if (scoped.length === 0) {
    return 'pending';
  }
  if (scoped.some((item) => !item.complete && item.blocking)) {
    return 'blocking';
  }
  if (scoped.some((item) => !item.complete && item.severity === 'warning')) {
    return 'warning';
  }
  if (scoped.every((item) => item.complete)) {
    return 'complete';
  }
  return 'pending';
}

export interface BuildAltaResumenEstadoPanelInput {
  diagnostico: EmpleadoFichaDiagnostico;
  pasoAltaAvanzada: number | null;
  estadoFicha: string;
  estadoLaboral: string;
  aptoParaRemuneracionesRegistro: boolean;
  humanizeBloqueo?: (bloqueo: string) => string;
}

export function buildAltaResumenEstadoPanel(input: BuildAltaResumenEstadoPanelInput) {
  const evaluacion = evaluacionCompletitudDesdeDiagnostico(input.diagnostico);
  const humanize = input.humanizeBloqueo ?? ((value: string) => value);
  return buildFichaEstadoPanelVm({
    evaluacion,
    pasoAltaAvanzada: input.pasoAltaAvanzada,
    estadoFicha: input.estadoFicha,
    estadoLaboral: input.estadoLaboral,
    aptoParaRemuneracionesRegistro: input.aptoParaRemuneracionesRegistro,
    estadoTab: (idTab) => estadoTabDesdeDiagnostico(idTab, input.diagnostico.items),
    humanizeBloqueo: humanize,
  });
}

export function evaluarCompletitudAlta(input: {
  payload: CrearEmpleadoPayload;
  pasoAltaAvanzada?: number | null;
}): EvaluacionCompletitudEmpleado {
  return evaluarCompletitudYAptitudEmpleado(input);
}

function normalizarTextoFaltante(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

/** Resuelve el ítem de diagnóstico que corresponde al mensaje visible en consola o resumen. */
export function diagnosticoItemDesdeFaltanteAlta(
  faltante: FaltanteFichaEmpleado,
  items: readonly EmpleadoFichaValidacionItem[],
): EmpleadoFichaValidacionItem | undefined {
  const msg = normalizarTextoFaltante(faltante.mensaje);
  const byText = items.find(
    (item) =>
      item.visible &&
      !item.complete &&
      (normalizarTextoFaltante(item.detalle) === msg ||
        normalizarTextoFaltante(item.label) === msg ||
        normalizarTextoFaltante(item.detalle).includes(msg) ||
        msg.includes(normalizarTextoFaltante(item.detalle))),
  );
  if (byText) {
    return byText;
  }

  const inTab = items
    .filter(
      (item) =>
        item.tabFicha === faltante.claveBloque && item.visible && !item.complete,
    )
    .sort((a, b) => a.wizardStep - b.wizardStep);
  return inTab[0];
}

export function wizardStepDesdeFaltanteAlta(
  faltante: FaltanteFichaEmpleado,
  items: readonly EmpleadoFichaValidacionItem[],
): number {
  return (
    diagnosticoItemDesdeFaltanteAlta(faltante, items)?.wizardStep ??
    wizardStepDesdeClaveTab(faltante.claveBloque, items)
  );
}
