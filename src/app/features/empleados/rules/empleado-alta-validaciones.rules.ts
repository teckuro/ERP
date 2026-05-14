import {
  AltaAplicabilidadEstado,
  AltaAplicabilidadItem,
} from './empleado-alta-aplicabilidad.rules';
import { AltaCoherenciaIssue } from './empleado-alta-coherencia.rules';

export type AltaValidacionTipo =
  | 'missing_required'
  | 'not_applicable'
  | 'derived'
  | 'review'
  | 'warning'
  | 'blocked';

export interface AltaValidacionVisible {
  id: string;
  paso: number;
  area: string;
  tipo: AltaValidacionTipo;
  titulo: string;
  detalle: string;
  accionRecomendada?: string;
  pasoSugerido?: string;
  controlPath?: string;
  puedeCorregir?: boolean;
}

export interface AltaValidacionPendienteInput {
  id: string;
  paso: number;
  area: string;
  label: string;
  controlPath: string;
  blocking: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface AltaValidacionesInput {
  aplicabilidadItems: readonly AltaAplicabilidadItem[];
  coherenciaIssues: readonly AltaCoherenciaIssue[];
  pendientes: readonly AltaValidacionPendienteInput[];
}

const STEP_LABELS: Record<number, string> = {
  0: 'Datos personales',
  1: 'Domicilio particular',
  2: 'Contrato y organización',
  3: 'Jornada y remuneración',
  4: 'Asignaciones laborales',
  5: 'Previsión y salud',
  6: 'APVI',
  7: 'Bancario',
  8: 'Condiciones especiales',
  9: 'Resumen final',
};

const APLICABILIDAD_VISIBLE: Partial<Record<AltaAplicabilidadEstado, AltaValidacionTipo>> = {
  not_applicable: 'not_applicable',
  derived: 'derived',
  review: 'review',
  warning: 'warning',
  blocked: 'blocked',
};

export function evaluarAltaValidacionesVisibles(
  input: AltaValidacionesInput,
): readonly AltaValidacionVisible[] {
  const pendientes = input.pendientes.map(mapPendiente);
  const aplicabilidad = input.aplicabilidadItems
    .map(mapAplicabilidad)
    .filter((item): item is AltaValidacionVisible => item !== null);
  const coherencia = input.coherenciaIssues.map(mapCoherencia);

  return [...dedupeValidaciones([...pendientes, ...coherencia, ...aplicabilidad])].sort(
    (a, b) => a.paso - b.paso || sortTipo(a.tipo) - sortTipo(b.tipo) || a.titulo.localeCompare(b.titulo),
  );
}

function mapPendiente(item: AltaValidacionPendienteInput): AltaValidacionVisible {
  return {
    id: `pendiente.${item.id}`,
    paso: item.paso,
    area: item.area,
    tipo: item.blocking ? 'missing_required' : item.severity === 'warning' ? 'warning' : 'review',
    titulo: item.blocking ? 'Dato necesario pendiente' : 'Aviso para revisar',
    detalle: item.label,
    accionRecomendada: item.blocking
      ? 'Completa este dato para poder finalizar el alta.'
      : 'Puedes continuar, pero conviene revisarlo antes de finalizar.',
    pasoSugerido: STEP_LABELS[item.paso],
    controlPath: item.controlPath,
    puedeCorregir: item.blocking,
  };
}

function mapAplicabilidad(item: AltaAplicabilidadItem): AltaValidacionVisible | null {
  const tipo = APLICABILIDAD_VISIBLE[item.estado];
  if (!tipo) {
    return null;
  }

  if (item.campo === 'regimenPrevisional' && item.estado === 'review') {
    return {
      id: `aplicabilidad.${item.campo}`,
      paso: item.stepIndex,
      area: item.dominio,
      tipo: 'review',
      titulo: 'Régimen previsional Sin previsión',
      detalle:
        'Qué revisar: La opción “Sin previsión” no habilita el cálculo de nómina para remuneraciones.',
      accionRecomendada:
        'Selecciona AFP o IPS si el trabajador quedará habilitado para remuneraciones. Si corresponde a una excepción respaldada, mantén el caso bajo revisión administrativa.',
      pasoSugerido: 'Previsión y salud',
      controlPath: 'previsionSalud.tipoRegimenPrevisional',
      puedeCorregir: true,
    };
  }

  return {
    id: `aplicabilidad.${item.campo}`,
    paso: item.stepIndex,
    area: item.dominio,
    tipo,
    titulo: tituloAplicabilidad(tipo, item.label),
    detalle: item.motivo,
    accionRecomendada: accionAplicabilidad(tipo),
    pasoSugerido: STEP_LABELS[item.stepIndex],
  };
}

function mapCoherencia(issue: AltaCoherenciaIssue): AltaValidacionVisible {
  return {
    id: `coherencia.${issue.id}`,
    paso: issue.stepIndex,
    area: issue.area,
    tipo: 'review',
    titulo: issue.title,
    detalle: issue.detail,
    accionRecomendada: issue.recommendedActionLabel ?? 'Mantener bajo revisión administrativa.',
    pasoSugerido: STEP_LABELS[issue.stepIndex],
    puedeCorregir: Boolean(issue.action),
  };
}

function tituloAplicabilidad(tipo: AltaValidacionTipo, label: string): string {
  switch (tipo) {
    case 'not_applicable':
      return `${label}: no aplica`;
    case 'derived':
      return `${label}: definido por sistema`;
    case 'review':
      return `${label}: requiere revisión`;
    case 'warning':
      return `${label}: advertencia administrativa`;
    case 'blocked':
      return `${label}: bloqueado por fase`;
    default:
      return label;
  }
}

function accionAplicabilidad(tipo: AltaValidacionTipo): string | undefined {
  switch (tipo) {
    case 'not_applicable':
      return 'No lo completes como error. El sistema lo deja fuera del flujo actual.';
    case 'derived':
      return 'No requiere edición manual. El sistema lo define desde la relación laboral.';
    case 'review':
      return 'Revisa el respaldo administrativo antes de finalizar.';
    case 'warning':
      return 'Puede mantenerse bajo revisión si RRHH lo respalda.';
    case 'blocked':
      return 'Guarda como borrador hasta que la fase correspondiente esté habilitada.';
    default:
      return undefined;
  }
}

function dedupeValidaciones(items: readonly AltaValidacionVisible[]): readonly AltaValidacionVisible[] {
  const seen = new Set<string>();
  const out: AltaValidacionVisible[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    out.push(item);
  }

  return out;
}

function sortTipo(tipo: AltaValidacionTipo): number {
  switch (tipo) {
    case 'missing_required':
      return 0;
    case 'blocked':
      return 1;
    case 'review':
      return 2;
    case 'warning':
      return 3;
    case 'not_applicable':
      return 4;
    case 'derived':
      return 5;
  }
}
