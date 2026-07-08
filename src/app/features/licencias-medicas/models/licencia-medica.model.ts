export const LICENCIA_MEDICA_TIPOS = ['comun', 'accidente', 'maternal', 'paternal'] as const;
export type LicenciaMedicaTipo = (typeof LICENCIA_MEDICA_TIPOS)[number];

export const LICENCIA_MEDICA_ESTADOS = [
  'pendiente_revision',
  'registrada',
  'vinculada_nomina',
  'rechazada',
] as const;
export type LicenciaMedicaEstado = (typeof LICENCIA_MEDICA_ESTADOS)[number];

export const LICENCIA_MEDICA_ORIGENES = ['correo', 'manual'] as const;
export type LicenciaMedicaOrigen = (typeof LICENCIA_MEDICA_ORIGENES)[number];

export const LICENCIA_INGRESO_ESTADOS = [
  'recibido',
  'pendiente_revision',
  'descartado',
  'procesado',
] as const;
export type LicenciaIngresoEstado = (typeof LICENCIA_INGRESO_ESTADOS)[number];

export interface LicenciaMedica {
  idLicencia: number;
  idEmpresa: number | null;
  idPersona: number | null;
  idContrato: number | null;
  folio: string | null;
  tipo: LicenciaMedicaTipo | null;
  fechaInicio: string | null;
  fechaTermino: string | null;
  dias: number | null;
  estado: LicenciaMedicaEstado | string;
  montoSubsidio: number | null;
  observacion: string | null;
  origen: LicenciaMedicaOrigen;
  idIngreso: number | null;
  fechaCreacion: string;
  nombreTrabajador: string | null;
  rutTrabajador: string | null;
}

export interface LicenciaMedicaIngresoCorreo {
  idIngreso: number;
  idEmpresa: number;
  remitente: string;
  asunto: string | null;
  cuerpoTexto: string | null;
  cuerpoHtml: string | null;
  adjuntos: unknown[];
  messageId: string | null;
  recibidoEn: string;
  idLicencia: number | null;
  estado: LicenciaIngresoEstado | string;
  fechaCreacion: string;
}

export interface GuardarLicenciaMedicaInput {
  idLicencia?: number | null;
  idPersona?: number | null;
  idContrato?: number | null;
  folio?: string | null;
  tipo?: LicenciaMedicaTipo | null;
  fechaInicio?: string | null;
  fechaTermino?: string | null;
  dias?: number | null;
  estado?: LicenciaMedicaEstado | string | null;
  montoSubsidio?: number | null;
  observacion?: string | null;
  origen?: LicenciaMedicaOrigen;
  idIngreso?: number | null;
}
