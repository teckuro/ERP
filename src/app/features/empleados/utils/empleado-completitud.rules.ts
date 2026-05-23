import { EmpleadoEstadoFicha } from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import {
  evaluarDiagnosticoFichaEmpleado,
  snapshotValidacionDesdePayload,
} from '../rules/empleado-diagnostico.rules';

export interface EvaluacionCompletitudEmpleado {
  estadoFicha: EmpleadoEstadoFicha;
  aptoParaRemuneraciones: boolean;
  bloqueos: string[];
  advertencias: string[];
  defaultsTecnicosDetectados: string[];
  seccionesPendientes: string[];
}

export interface EvaluarCompletitudEmpleadoInput {
  payload: CrearEmpleadoPayload;
  pasoAltaAvanzada?: number | null;
}

export class EmpleadoAptitudInvalidaError extends Error {
  constructor(readonly evaluacion: EvaluacionCompletitudEmpleado) {
    super(buildAptitudErrorMessage(evaluacion));
    this.name = 'EmpleadoAptitudInvalidaError';
  }
}

export function evaluarCompletitudYAptitudEmpleado(
  input: EvaluarCompletitudEmpleadoInput,
): EvaluacionCompletitudEmpleado {
  const { payload, pasoAltaAvanzada = null } = input;
  const diagnostico = evaluarDiagnosticoFichaEmpleado(
    snapshotValidacionDesdePayload(payload, pasoAltaAvanzada),
  );
  const aptoParaRemuneraciones = diagnostico.aptoParaRemuneraciones;

  return {
    estadoFicha: aptoParaRemuneraciones ? 'VALIDO' : 'INCOMPLETO',
    aptoParaRemuneraciones,
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

export function assertEmpleadoAptoParaRemuneraciones(
  evaluacion: EvaluacionCompletitudEmpleado,
): void {
  if (!evaluacion.aptoParaRemuneraciones) {
    throw new EmpleadoAptitudInvalidaError(evaluacion);
  }
}

function buildAptitudErrorMessage(evaluacion: EvaluacionCompletitudEmpleado): string {
  const firstBlock = evaluacion.bloqueos[0];
  if (!firstBlock) {
    return 'La ficha no cumple el contrato de aptitud para remuneraciones.';
  }

  const suffix =
    evaluacion.bloqueos.length > 1
      ? ` Ademas hay ${evaluacion.bloqueos.length - 1} bloqueo(s) pendiente(s).`
      : '';
  return `${firstBlock}${suffix}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

