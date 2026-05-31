import type { NominaParametrosResumen } from './nomina-parametros-resumen.models';

export const VERSION_MOTOR_PARAMETROS_BASE = 'PARAMETROS-BASE-01';
export const CODIGO_TRAZA_PARAMETROS_BASE = 'PARAMETROS_BASE_SNAPSHOT';
export const TIPO_SNAPSHOT_PARAMETROS_BASE = 'parametrosBase';

export type OrigenBaseParametrosAlAvanzar =
  | 'recienGuardada'
  | 'existenteSinDiferencias'
  | 'existenteMantenidaConDiferencias'
  | 'actualizadaExplicitamente';

export type EstadoParametrosBasePeriodo =
  | 'pendiente'
  | 'guardado'
  | 'conDiferencias'
  | 'actualizado';

export type RamaAccionPreparacionParametros =
  | { tipo: 'guardar'; resumen: NominaParametrosResumen }
  | { tipo: 'continuar'; origen: OrigenBaseParametrosAlAvanzar; idCalculoPeriodoBase: number }
  | {
      tipo: 'diferencias';
      resumen: NominaParametrosResumen;
      idCalculoPeriodoBase: number;
      diferencias: DiferenciaParametroBase[];
    };

export type SeveridadDiferenciaParametroBase = 'informativa' | 'relevante' | 'critica';

export interface DiferenciaParametroBase {
  grupo: string;
  clave: string;
  etiqueta: string;
  valorBase: string | null;
  valorActual: string | null;
  severidad: SeveridadDiferenciaParametroBase;
}

export interface VistaPreviaParametrosBase {
  periodo: string;
  periodoEtiqueta: string;
  seccionesListas: number;
  seccionesTotales: number;
  controlesVerificados: number;
  bloqueos: number;
  requiereRevision: number;
  totalParametrosCongelados: number;
}

export interface ResultadoComparacionParametrosBase {
  hayDiferencias: boolean;
  diferencias: DiferenciaParametroBase[];
  hashBase: string | null;
  hashActual: string | null;
}

export interface EstadoBaseParametrosPeriodoView {
  estado: EstadoParametrosBasePeriodo;
  idCalculoPeriodoBase: number | null;
  fechaBaseGuardada: string | null;
  comparacion: ResultadoComparacionParametrosBase | null;
}

export interface ResumenParametrosBaseMetadata {
  seccionesListas: number;
  seccionesTotales: number;
  controlesVerificados: number;
  bloqueos: number;
  requiereRevision: number;
  origenAlGuardar?: OrigenBaseParametrosAlAvanzar;
}

export interface ParametroBaseCongeladoDetalle {
  grupo: string;
  clave: string;
  valor: string;
  vigencia: string | null;
  origen: string;
}
