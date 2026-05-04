import type { MovimientoVariableEstado } from '../../movimientos-variables/models/movimiento-variable.model';

/** Resultado global de la prevalidacion (sin motor ni liquidaciones). */
export type ProcesoMensualEstado =
  | 'SIN_EVALUAR'
  | 'LISTO_PARA_CALCULO'
  | 'CON_ADVERTENCIAS'
  | 'BLOQUEADO';

export type ProcesoMensualArea =
  | 'PARAMETROS'
  | 'TRABAJADORES'
  | 'CONCEPTOS'
  | 'HABERES_RECURRENTES'
  | 'MOVIMIENTOS_VARIABLES'
  | 'PROCESO';

export type ProcesoMensualSeveridad = 'BLOQUEO' | 'ADVERTENCIA' | 'INFO';

export interface ProcesoMensualMensaje {
  codigo: string;
  area: ProcesoMensualArea;
  severidad: ProcesoMensualSeveridad;
  texto: string;
}

export type ProcesoMensualItemEstado =
  | 'LISTO'
  | 'CON_PROBLEMAS'
  | 'PENDIENTE_INTEGRACION'
  | 'NO_EVALUADO';

export interface ProcesoMensualItem {
  area: ProcesoMensualArea;
  etiqueta: string;
  estado: ProcesoMensualItemEstado;
  detalle?: string;
}

export type ClasificacionParametroGrupo =
  | 'OK'
  | 'FALTANTE'
  | 'PARCIAL'
  | 'PENDIENTE_INTEGRACION'
  | 'NO_APLICA_AUN';

export interface ProcesoMensualGrupoParametro {
  id: string;
  clasificacion: ClasificacionParametroGrupo;
  detalle?: string;
}

export interface ProcesoMensualRecurrentesConteo {
  lectura: 'ok' | 'error';
  error?: string;
  aplicables: number;
  invalidas: number;
  cerradas: number;
  fueraDelMes: number;
}

export interface ProcesoMensualResumen {
  periodo: string;
  hayBloqueos: boolean;
  hayAdvertencias: boolean;
  conteoMovimientosPorEstado: Partial<Record<MovimientoVariableEstado, number>>;
  trabajadoresActivosAptos: number;
  trabajadoresActivosNoAptos: number;
  parametrosOperativos: boolean;
  parametrosGrupos: ProcesoMensualGrupoParametro[];
  recurrentesAplicablesAlPeriodo: number;
  recurrentesInvalidas: number;
  recurrentesCerradas: number;
  recurrentesFueraDelMes: number;
}

export interface ProcesoMensualPrevalidacion {
  periodo: string;
  estado: ProcesoMensualEstado;
  resumen: ProcesoMensualResumen;
  bloqueos: ProcesoMensualMensaje[];
  advertencias: ProcesoMensualMensaje[];
  /** Avisos informativos (no cambian LISTO vs CON_ADVERTENCIAS). */
  informaciones: ProcesoMensualMensaje[];
  items: ProcesoMensualItem[];
}
