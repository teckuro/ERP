export type ParametroResumenEstado = 'completo' | 'requiereRevision' | 'bloqueo' | 'pendiente';
export type ParametroResumenItemEstado = 'ok' | 'revisar' | 'bloqueo' | 'pendiente';
export type ParametroBloqueoSeveridad = 'bloqueo' | 'revision';

export type ParametroResumenAreaId =
  | 'configuracionCliente'
  | 'datosOficiales'
  | 'catalogosPrevisionales'
  | 'reglasCalculo'
  | 'observacionNormativa';

export type ParametrosMantenedorDestino = {
  area: string;
  tab: string;
};

export type ParametroResumenItem = {
  label: string;
  estado: ParametroResumenItemEstado;
  detalle?: string;
  bloqueaPreparacion?: boolean;
  advertenciaNoBloqueante?: boolean;
};

export type ParametroResumenArea = {
  id: ParametroResumenAreaId;
  titulo: string;
  descripcion: string;
  estado: ParametroResumenEstado;
  icono: string;
  items: ParametroResumenItem[];
  mantenedor: ParametrosMantenedorDestino;
};

export type ParametroResumenBloqueo = {
  id: string;
  severidad: ParametroBloqueoSeveridad;
  titulo: string;
  detalle: string;
  areaId: ParametroResumenAreaId;
  mantenedor: ParametrosMantenedorDestino;
};

export type ParametroResumenAcceso = {
  id: string;
  label: string;
  icono: string;
  mantenedor: ParametrosMantenedorDestino;
};

export type NominaParametrosResumen = {
  periodo: string;
  /** Nómina dueña del resumen (F06). */
  nominaPeriodoId?: string | null;
  fechaInicioRango?: string | null;
  fechaFinRango?: string | null;
  completitud: number;
  /** Porcentaje según visores/secciones visibles (5 cards). */
  completitudSecciones: number;
  seccionesTotales: number;
  seccionesListas: number;
  /** Controles internos agregados de todas las secciones. */
  controlesTotales: number;
  controlesVerificados: number;
  totalParametros: number;
  parametrosConfigurados: number;
  bloqueos: number;
  requiereRevision: number;
  bloqueosPreparacion: number;
  advertenciasOficiales: number;
  completos: number;
  puedeContinuar: boolean;
  puedePreparar: boolean;
  ultimaActualizacion: string | null;
  areas: ParametroResumenArea[];
  bloqueosActuales: ParametroResumenBloqueo[];
  pendientesPreparacion: ParametroResumenBloqueo[];
  advertenciasNoBloqueantes: ParametroResumenBloqueo[];
  accesos: ParametroResumenAcceso[];
};
