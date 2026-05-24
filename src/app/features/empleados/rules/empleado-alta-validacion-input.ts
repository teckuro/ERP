import type { AltaAplicabilidadItem } from './empleado-alta-aplicabilidad.rules';
import type { InconsistenciaCoherenciaAlta } from './empleado-alta-coherencia.rules';
import {
  evaluarAltaValidacionesVisibles,
  type AltaValidacionPendienteInput,
  type AltaValidacionesInput,
  type AltaValidacionVisible,
} from './empleado-alta-validaciones.rules';
import type {
  EmpleadoFichaDiagnostico,
  EmpleadoFichaValidacionItem,
} from './empleado-ficha-validacion.rules';

export function mapDiagnosticoItemToPendienteInput(
  item: EmpleadoFichaValidacionItem,
): AltaValidacionPendienteInput {
  return {
    id: item.id,
    paso: item.wizardStep,
    area: item.seccion,
    label: item.detalle || item.label,
    controlPath: item.controlPath,
    blocking: item.blocking,
    severity: item.severity,
  };
}

export function buildAltaValidacionInput(args: {
  diagnostico: EmpleadoFichaDiagnostico;
  aplicabilidadItems: readonly AltaAplicabilidadItem[];
  inconsistenciasCoherencia: readonly InconsistenciaCoherenciaAlta[];
}): AltaValidacionesInput {
  const pendientes = args.diagnostico.pendientes
    .filter((item) => item.visible && !item.complete)
    .map(mapDiagnosticoItemToPendienteInput);

  return {
    pendientes,
    elementosAplicabilidad: args.aplicabilidadItems,
    inconsistenciasCoherencia: args.inconsistenciasCoherencia,
  };
}

export interface RevisionNormativaBitacoraAlta {
  id: string;
  origen: 'coherencia' | 'aplicabilidad';
  stepIndex: number;
  titulo: string;
  detalle: string;
  accionRecomendada?: string;
  puedeAplicarCorreccion: boolean;
  bajoRevision: boolean;
  coherenciaIssueId?: string;
}

export function buildRevisionesNormativasConsola(
  validaciones: readonly AltaValidacionVisible[],
  inconsistencias: readonly InconsistenciaCoherenciaAlta[],
  reconocidas: ReadonlySet<string>,
): RevisionNormativaBitacoraAlta[] {
  const coherenciaById = new Map(inconsistencias.map((issue) => [issue.id, issue]));
  const out: RevisionNormativaBitacoraAlta[] = [];

  for (const item of validaciones) {
    if (item.tipo !== 'review' && item.tipo !== 'warning') {
      continue;
    }
    if (item.id.startsWith('pendiente.')) {
      continue;
    }

    if (item.id.startsWith('coherencia.')) {
      const issueId = item.id.slice('coherencia.'.length);
      const issue = coherenciaById.get(issueId);
      if (!issue) {
        continue;
      }
      out.push({
        id: item.id,
        origen: 'coherencia',
        stepIndex: item.paso,
        titulo: item.titulo,
        detalle: item.detalle,
        accionRecomendada: item.accionRecomendada,
        puedeAplicarCorreccion: Boolean(issue.action && !reconocidas.has(issueId)),
        bajoRevision: reconocidas.has(issueId),
        coherenciaIssueId: issueId,
      });
      continue;
    }

    if (item.id.startsWith('aplicabilidad.')) {
      out.push({
        id: item.id,
        origen: 'aplicabilidad',
        stepIndex: item.paso,
        titulo: item.titulo,
        detalle: item.detalle,
        accionRecomendada: item.accionRecomendada,
        puedeAplicarCorreccion: Boolean(item.puedeCorregir),
        bajoRevision: false,
      });
    }
  }

  return out;
}

export function evaluarAltaValidacionesDesdeDiagnostico(
  args: Parameters<typeof buildAltaValidacionInput>[0],
): readonly AltaValidacionVisible[] {
  return evaluarAltaValidacionesVisibles(buildAltaValidacionInput(args));
}
