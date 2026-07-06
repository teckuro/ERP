import type { PayrollStepId } from './nomina-mensual-v2.models';
import type { EstadoIntegridadNomina } from './nomina-trazabilidad.models';

export type PasoNominaStepperEstadoVisual =
  | 'activo'
  | 'completo'
  | 'pendiente'
  | 'advertencia'
  | 'bloqueado';

export interface PasoNominaStepperView {
  numero: number;
  clave: PayrollStepId;
  titulo: string;
  accion: string;
  estado: PasoNominaStepperEstadoVisual;
  responsableNombre?: string;
  ultimoEvento?: string;
  fechaUltimoEvento?: string | null;
  integridad: EstadoIntegridadNomina;
  tieneTrazabilidad: boolean;
}

export interface ResumenTrazabilidadPasoActualView {
  paso: PayrollStepId;
  responsableNombre: string;
  responsableTooltip: string;
  ultimoEvento: string;
  fechaUltimoEvento: string;
  integridadLabel: string;
  integridadEstado: EstadoIntegridadNomina;
  iconoIntegridad: string;
  tieneTrazabilidad: boolean;
}
