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
  completitud: number;
  totalParametros: number;
  parametrosConfigurados: number;
  bloqueos: number;
  requiereRevision: number;
  completos: number;
  puedeContinuar: boolean;
  ultimaActualizacion: string | null;
  areas: ParametroResumenArea[];
  bloqueosActuales: ParametroResumenBloqueo[];
  accesos: ParametroResumenAcceso[];
};
