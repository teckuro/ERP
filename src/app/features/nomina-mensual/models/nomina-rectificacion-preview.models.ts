/** Preview F17 — RPC `previsualizar_rectificacion_nomina`. */
export interface RectificacionTrabajadorPreview {
  idPersona: number;
  rut: string;
  nombre: string;
  cargo?: string;
}

export interface RectificacionConflictoPreview {
  motivo: string;
  motivoHumano: string;
  detalle?: Record<string, unknown>;
}

export interface RectificacionPreview {
  nominaOrigenId: string;
  nominaReferenciaId: string;
  periodo: string;
  tipo: string;
  empresaNombre: string;
  versionCalculoOrigen: number;
  fingerprint: string;
  motivo?: string;
  trabajadoresDisponibles: RectificacionTrabajadorPreview[];
  trabajadorIdsSeleccionados: number[];
  conflictos: RectificacionConflictoPreview[];
  totales: {
    disponibles: number;
    seleccionados: number;
    conflictos: number;
  };
  puedeCrear: boolean;
}

export interface ConfirmarRectificacionRequest {
  nominaOrigenId: string;
  fingerprint: string;
  motivo: string;
  trabajadorIds?: number[];
}

export type SiguientePasoRectificacion = 'parameters' | 'dotacion';

export interface ConfirmarRectificacionResultado {
  idNominaPeriodo: string;
  nominaOrigenId: string;
  estado: string;
  versionEstado: number;
  codigoCiclo: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: string;
  naturaleza: string;
  totalTrabajadores: number;
  siguientePaso: SiguientePasoRectificacion;
  motivo: string;
}
