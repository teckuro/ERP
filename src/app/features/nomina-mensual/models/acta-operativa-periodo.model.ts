export type ActaOperativaEstado = 'BLOQUEADA' | 'REQUIERE_REVISION' | 'LISTA' | 'PREPARADA';

export type ActaOperativaTone = 'neutral' | 'info' | 'warning' | 'success' | 'error';

export type ActaOperativaDatoEstado = 'listo' | 'pendiente' | 'revision' | 'no-disponible';

export type ActaOperativaEvidenciaEstado = 'incluida' | 'pendiente' | 'revision';

export interface ActaOperativaDato {
  label: string;
  valor: string;
  estado: ActaOperativaDatoEstado;
}

export interface ActaOperativaEvidencia {
  label: string;
  detalle?: string;
  estado: ActaOperativaEvidenciaEstado;
}

export interface ActaOperativaPeriodoViewModel {
  estado: ActaOperativaEstado;
  modoCompacto: boolean;
  titulo: string;
  descripcion: string;
  notaCompacta?: string;
  periodoLabel: string;
  estadoLabel: string;
  estadoTone: ActaOperativaTone;
  accionLabel: string;
  accionDisponible: boolean;
  preparada: boolean;
  contexto: ActaOperativaDato[];
  decision: {
    titulo: string;
    descripcion: string;
  };
  evidencia: ActaOperativaEvidencia[];
  pendientes: string[];
  observaciones: string[];
  alcance: string;
}
