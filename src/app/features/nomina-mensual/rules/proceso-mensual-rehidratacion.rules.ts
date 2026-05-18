import type {
  MotorCalculoPeriodoResultado,
  NominaCalculoPeriodoSnapshot,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';

export interface ContextoOperativoPeriodoInput {
  resultado: ProcesoMensualPrevalidacion | null;
  preNomina: ProcesoMensualPreNominaPeriodo | null;
  calculo: MotorCalculoPeriodoResultado | null;
  snapshot: NominaCalculoPeriodoSnapshot | null;
}

export interface ContextoOperativoPeriodo {
  tienePrevalidacion: boolean;
  baseGenerada: boolean;
  calculoGenerado: boolean;
  resultadoGuardado: boolean;
  trabajadoresAptos: number | null;
}

export function inferirContextoOperativoPeriodo(input: ContextoOperativoPeriodoInput): ContextoOperativoPeriodo {
  const conSnapshot = input.snapshot != null;
  return {
    tienePrevalidacion: input.resultado != null || conSnapshot,
    baseGenerada: input.preNomina != null || conSnapshot,
    calculoGenerado: input.calculo != null || conSnapshot,
    resultadoGuardado: conSnapshot,
    trabajadoresAptos: input.resultado?.resumen.trabajadoresActivosAptos ?? input.snapshot?.totalTrabajadores ?? null,
  };
}
