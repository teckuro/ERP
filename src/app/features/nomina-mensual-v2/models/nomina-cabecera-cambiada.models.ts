import type { PayrollStepId } from './nomina-mensual-v2.models';

/** Payload emitido por pasos cuando la cabecera de nómina cambia en servidor. */
export type NominaCabeceraCambiadaEvent = {
  registrarPasoCompletado?: PayrollStepId;
  trazabilidad?:
    | { tipo: 'cierre'; motivo: string }
    | { tipo: 'reapertura'; motivo: string };
};
