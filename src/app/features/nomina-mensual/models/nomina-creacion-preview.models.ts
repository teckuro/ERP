/**
 * Modelos del preview/confirmación de creación de nómina (F04 + F05).
 *
 * Alineados al contrato del roadmap §10.1 — la RPC
 * `previsualizar_creacion_nomina` retorna JSON con esta forma y la RPC
 * `confirmar_creacion_nomina` valida `fingerprint` antes de persistir.
 */

import type { TipoNomina } from './nomina-periodo.models';

/** Motivos canónicos por los que un trabajador queda fuera de la dotación inicial. */
export type MotivoExclusionNomina =
  | 'persona_inactiva'
  | 'ficha_no_apta'
  | 'sin_contrato_vigente'
  | 'contrato_no_activo';

/** Motivos canónicos de conflicto que bloquean la creación. */
export type MotivoConflictoNomina =
  | 'duplicidad_nomina';

export interface NominaCreatePreviewRequest {
  periodo: string;
  tipo: TipoNomina;
}

export interface TrabajadorIncluidoPreview {
  idPersona: number;
  rut: string;
  nombre: string;
  cargo: string | null;
}

export interface TrabajadorExcluidoPreview {
  idPersona: number;
  rut: string;
  nombre: string;
  motivo: MotivoExclusionNomina | string;
  motivoHumano: string;
}

export interface ConflictoCreacionNomina {
  motivo: MotivoConflictoNomina | string;
  motivoHumano: string;
  detalle: Record<string, unknown> | null;
}

export interface TotalesCreacionPreview {
  incluidos: number;
  excluidos: number;
  conflictos: number;
}

export interface NominaCreatePreview {
  periodo: string;
  tipo: TipoNomina;
  naturaleza: string;
  idEmpresa: number;
  empresaNombre: string | null;
  codigoCiclo: string;
  fechaInicio: string;
  fechaFin: string;
  plantillaCicloId: string | null;
  incluidos: TrabajadorIncluidoPreview[];
  excluidos: TrabajadorExcluidoPreview[];
  conflictos: ConflictoCreacionNomina[];
  totales: TotalesCreacionPreview;
  puedeCrear: boolean;
  fingerprint: string;
  generadoEn: string;
}

export interface ConfirmarCreacionRequest {
  periodo: string;
  tipo: TipoNomina;
  fingerprint: string;
}

/** Paso sugerido para llevar al usuario al abrir el Generador tras crear. */
export type SiguientePasoCreacion = 'parameters' | 'dotacion';

export interface ConfirmarCreacionResultado {
  idNominaPeriodo: string;
  estado: string;
  versionEstado: number;
  codigoCiclo: string;
  fechaInicio: string;
  fechaFin: string;
  totalTrabajadores: number;
  siguientePaso: SiguientePasoCreacion;
  /** `true` si el RPC reutilizó una nómina existente por idempotencia. */
  reutilizada: boolean;
}
