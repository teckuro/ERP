import type { PayrollStepId } from './nomina-mensual-v2.models';

/** Origen interno del evento; no se muestra en UI. */
export type OrigenEventoTrazabilidadNomina = 'local' | 'servidor' | 'mock';

/**
 * Estado de integridad expuesto al frontend.
 * `verificadoServidor` solo cuando venga de RPC/backend real (V11).
 */
export type EstadoIntegridadNomina =
  | 'registrado'
  | 'verificadoServidor'
  | 'pendiente'
  | 'invalidado'
  | 'noDisponible';

export type EstadoAuditoriaPasoNomina =
  | 'pendiente'
  | 'registrado'
  | 'validado'
  | 'aprobado'
  | 'congelado'
  | 'invalidado'
  | 'requiereRevision';

export type TipoEventoTrazabilidadNomina =
  | 'PARAMETROS_VALIDADOS'
  | 'PARAMETROS_CONGELADOS'
  | 'ALCANCE_DEFINIDO'
  | 'EMPLEADOS_VALIDADOS'
  | 'NOVEDADES_REGISTRADAS'
  | 'CALCULO_EJECUTADO'
  | 'PRENOMINA_VALIDADA'
  | 'PRENOMINA_APROBADA'
  | 'LIQUIDACIONES_GENERADAS'
  | 'SNAPSHOT_INVALIDADO'
  | 'RECALCULO_SOLICITADO';

/** DTO seguro para UI — nunca incluye hash completo ni HMAC. */
export interface IntegridadPublicaNomina {
  estadoIntegridad: EstadoIntegridadNomina;
  fingerprintPublico?: string;
  fechaVerificacion?: string | null;
}

export interface ResumenAuditoriaPasoNomina {
  paso: PayrollStepId;
  estado: EstadoAuditoriaPasoNomina;
  accionPrincipal: string;
  usuarioId: string | null;
  usuarioNombre: string;
  fechaAccion: string | null;
  integridad: IntegridadPublicaNomina;
  requiereAprobacion?: boolean;
  aprobadoPor?: string | null;
  fechaAprobacion?: string | null;
}

export interface EventoTrazabilidadNomina {
  idEvento: string;
  periodo: string;
  paso: PayrollStepId;
  tipoEvento: TipoEventoTrazabilidadNomina;
  usuarioId: string | null;
  usuarioNombre: string;
  fechaEvento: string;
  descripcion: string;
  idSnapshotRelacionado?: string;
  integridad: IntegridadPublicaNomina;
  metadataPublica?: Record<string, unknown>;
  /** Solo uso interno; no renderizar en UI. */
  origen: OrigenEventoTrazabilidadNomina;
}

export interface DetalleTrazabilidadPasoNomina {
  paso: PayrollStepId;
  titulo: string;
  estadoActual: string;
  accionPrincipal: string;
  usuarioNombre: string;
  fechaAccion: string | null;
  resumenFuncional: string[];
  integridad: IntegridadPublicaNomina;
  eventosRecientes: EventoTrazabilidadNomina[];
  pasosInvalidados?: PayrollStepId[];
  requisitos?: Array<{ label: string; cumplido: boolean }>;
}

export interface ContextoTrazabilidadPasoNomina {
  periodo: string;
  parametrosResumen?: {
    seccionesListas: number;
    seccionesTotal: number;
    controlesVerificados: number;
    bloqueos: number;
    advertencias: number;
  };
  alcance?: {
    trabajadoresIncluidos: number;
    bloqueados: number;
    advertencias: number;
    tipoAlcance: string;
  };
  empleados?: {
    revisados: number;
    bloqueos: number;
    advertencias: number;
  };
}
