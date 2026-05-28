import type { ProcesoMensualAccionLocal } from '../../../rules/proceso-mensual-estado-operativo.rules';
import { buildNominaWorkspaceTabs, buildNominaWorkspaceTabsVisible } from './proceso-mensual-area-orden.config';

export type ValidacionCalculoEstado = 'pendiente' | 'listo' | 'advertencias' | 'bloqueado';
export type ValidacionOperativaSeveridad = 'bloqueo' | 'advertencia' | 'info';
export type ValidacionAccionLocal = ProcesoMensualAccionLocal;
export type ResultadoPreliminarEstado =
  | 'sin_resultado'
  | 'no_guardado'
  | 'guardado'
  | 'actualizado_sin_guardar'
  | 'error_guardado'
  | 'con_bloqueos';
export type RevisionAprobacionEstado =
  | 'sin_resultado_guardado'
  | 'pendiente_guardado'
  | 'pendiente_revision'
  | 'actualizado_sin_guardar'
  | 'no_apto'
  | 'listo'
  | 'aprobado'
  | 'aprobado_desactualizado';
export type RevisionChecklistEstado = 'Completo' | 'Pendiente' | 'Requiere atencion' | 'No aplica';
export type EtapaOperativaActiva =
  | 'base'
  | 'calculo'
  | 'resultado'
  | 'guardado'
  | 'aprobacion'
  | 'cierre'
  | 'liquidaciones';
export type PasoPeriodoEstado = 'Actual' | 'Completo' | 'Pendiente' | 'Bloqueada';
export type ConfirmacionProcesoMensualTipo =
  | 'guardar_preliminar'
  | 'aprobar_preliminar'
  | 'confirmar_nomina_operativa'
  | 'cerrar_nomina'
  | 'preparar_acta'
  | 'abrir_nomina'
  | 'descartar_nomina'
  | 'forzar_apertura'
  | 'forzar_eliminacion';
export type DetalleOperativoTab = 'resumen' | 'trabajadores' | 'parametros' | 'movimientos_recurrentes' | 'resultado';
export type NominaWorkspaceTab =
  | 'resumen'
  | 'trabajadores'
  | 'parametros'
  | 'movimientos'
  | 'recurrentes'
  | 'liquidaciones'
  | 'historial';

export type NominaWorkspaceTabVisible = 'detalle_mensual' | 'historial';

export type NominaDetalleMensualVista =
  | 'todos'
  | 'trabajadores'
  | 'movimientos'
  | 'liquidaciones'
  | 'pendientes';

export const NOMINA_WORKSPACE_TABS = buildNominaWorkspaceTabs();
export const NOMINA_WORKSPACE_TABS_VISIBLE = buildNominaWorkspaceTabsVisible();
export type NominaVisualFrame =
  | 'sin_generar'
  | 'generando'
  | 'en_revision'
  | 'con_pendientes'
  | 'lista_para_confirmar'
  | 'confirmada'
  | 'liquidaciones_generadas';

export interface ConfirmacionProcesoMensualView {
  tipo: ConfirmacionProcesoMensualTipo;
  titulo: string;
  mensaje: string;
  detalle: string;
  puntos?: string[];
  /** Título del bloque de viñetas en el modal de decisión. */
  puntosTitulo?: string;
  primaryLabel: string;
  secondaryLabel: string;
  advertenciasAprobacion?: string[];
  secciones?: Array<{ titulo: string; items?: string[] }>;
  /** Variante visual del MessageBox (por defecto `decision`). */
  variant?: 'info' | 'decision' | 'warning';
  eyebrow?: string;
  /** Si es `false`, no se muestra el bloque «Próxima acción». */
  mostrarProximaAccion?: boolean;
  proximaAccion?: string;
}

export type InformacionPeriodoDestino =
  | 'parametros'
  | 'parametros_app'
  | 'validar_periodo'
  | 'trabajadores'
  | 'trabajadores_fichas'
  | 'movimientos'
  | 'asignaciones'
  | 'resultado'
  | 'generar_nomina'
  | 'reintentar'
  | 'cerrar';

export interface TrabajadorPendienteInformacionPeriodoView {
  idPersona: number;
  nombre: string;
  rut: string;
  motivo: string;
  detalleCorreccion?: string;
}

/** Conteos visibles tras verificar período (escala nómina grande). */
export type InformacionPeriodoParametroGrupoTono = 'ok' | 'revision';

export interface InformacionPeriodoParametroGrupoView {
  id: string;
  label: string;
  /** Texto accesible del estado del grupo. */
  estado: string;
  tono: InformacionPeriodoParametroGrupoTono;
}

export interface InformacionPeriodoResumenVerificacion {
  trabajadoresPendientes: number;
  criticos: number;
  advertencias: number;
}

export interface InformacionPeriodoSeccionDetalleView {
  titulo: string;
  descripcion: string;
  accionLabel?: string;
  ruta?: string;
}

export interface InformacionPeriodoView {
  tone: 'info' | 'warning' | 'danger' | 'success';
  titulo: string;
  bajada?: string;
  puntos?: string[];
  consultando?: boolean;
  /** Modal abierto desde tile Parámetros: no avanza el flujo de nómina. */
  soloVerificacionParametros?: boolean;
  /** Modal de alertas del expediente (cabecera detalle mensual). */
  soloAlertasExpediente?: boolean;
  alertasExpediente?: ReadonlyArray<NominaDetalleMensualPendienteRow>;
  tipoRemuneracionLabel?: string;
  estadoRemuneracionLabel?: string;
  notaSoloVerificacion?: string;
  parametrosGrupos?: ReadonlyArray<InformacionPeriodoParametroGrupoView>;
  avisoDrift?: string;
  secciones?: Array<{
    titulo: string;
    items: string[];
    detalles?: InformacionPeriodoSeccionDetalleView[];
  }>;
  resumenVerificacion?: InformacionPeriodoResumenVerificacion;
  trabajadoresPendientes?: TrabajadorPendienteInformacionPeriodoView[];
  accionPrincipal?: {
    label: string;
    destino: InformacionPeriodoDestino;
  };
  accionSecundaria?: {
    label: string;
    destino: InformacionPeriodoDestino;
  };
  reintentarAccion?: ValidacionAccionLocal;
}

export type ProcesoMensualOverlay =
  | { kind: 'cerrado' }
  | { kind: 'revision'; tab: DetalleOperativoTab }
  | { kind: 'decision'; view: ConfirmacionProcesoMensualView }
  | { kind: 'informacion'; view: InformacionPeriodoView };

export interface NominaVisualFrameView {
  frame: NominaVisualFrame;
  chip: string;
  titulo: string;
  texto: string;
  info: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaTipo: 'local' | 'ruta' | 'ninguna';
  ctaRuta?: string;
  ctaAccion?: ValidacionAccionLocal;
  secundariaLabel?: string;
  secundariaAccion?: () => void;
}

export interface NominaResumenSuperiorVm {
  trabajadores: string;
  parametros: string;
  movimientos: string;
  recurrentes: string;
  cambios: number;
  bloqueos: number;
}

export type NominaWorkspaceDetailSeverity = 'bloqueo' | 'atencion' | 'listo' | 'neutral';

export interface ValidacionOperativaItemView {
  codigo: string;
  titulo: string;
  descripcion: string;
  severidad: ValidacionOperativaSeveridad;
  accionLabel?: string;
  ruta?: string;
  accionLocal?: ValidacionAccionLocal;
}

export interface ValidacionCalculoPreliminarView {
  estado: ValidacionCalculoEstado;
  estadoLabel: string;
  puedeCalcular: boolean;
  razonDeshabilitado?: string;
  siguienteAccion: {
    label: string;
    descripcion: string;
    ruta?: string;
    accionLocal?: ValidacionAccionLocal;
  };
  bloqueos: ValidacionOperativaItemView[];
  advertencias: ValidacionOperativaItemView[];
  informaciones: ValidacionOperativaItemView[];
}

export interface ResultadoObservacionView {
  codigo: string;
  titulo: string;
  descripcion: string;
  accionLabel?: string;
  ruta?: string;
}

export interface TrabajadorResultadoPreliminarView {
  idPersona: number | string;
  trabajadorLabel: string;
  rutLabel: string;
  estadoLabel: 'Calculado' | 'Con observaciones' | 'Omitido' | 'No calculado';
  haberesLabel: string;
  descuentosLabel: string;
  liquidoLabel: string;
  observacionLabel: string;
  accionLabel?: string;
  ruta?: string;
}

export interface ResultadoPreliminarView {
  estado: ResultadoPreliminarEstado;
  estadoLabel: string;
  descripcionEstado: string;
  resumen: {
    trabajadoresCalculados: number;
    trabajadoresConObservaciones: number;
    trabajadoresOmitidos: number;
    totalHaberes: number | null;
    totalDescuentos: number | null;
    totalLiquido: number | null;
    totalCostoEmpresa: number | null;
  };
  trabajadores: TrabajadorResultadoPreliminarView[];
  bloqueos: ResultadoObservacionView[];
  advertencias: ResultadoObservacionView[];
  informaciones: ResultadoObservacionView[];
  detalleTecnico: {
    versionCalculo: string;
    identificadorTecnico: string;
    generadoEn: string;
  };
  ultimoGuardado?: {
    versionLabel: string;
    fechaGuardadoLabel: string;
    versionCalculoLabel: string;
    identificadorTecnicoLabel: string;
    estadoLabel: string;
    trabajadoresCalculados: number;
    trabajadoresConObservaciones: number;
    trabajadoresOmitidos: number;
    totalLiquidoLabel: string;
    advertenciasLabel: string;
  };
  acciones: {
    puedeRecalcular: boolean;
    puedeGuardarPreliminar: boolean;
    razonNoPuedeGuardar?: string;
    helperGuardar: string;
    modoGuardadoLabel: string;
  };
}

export interface RevisionAprobacionChecklistItemView {
  titulo: string;
  descripcion: string;
  estado: RevisionChecklistEstado;
}

export interface RevisionAprobacionView {
  estado: RevisionAprobacionEstado;
  estadoLabel: string;
  descripcion: string;
  checklist: RevisionAprobacionChecklistItemView[];
  bloqueos: ResultadoObservacionView[];
  advertencias: ResultadoObservacionView[];
  informaciones: ResultadoObservacionView[];
  accionPrincipalLabel: string;
  puedeGuardarActualizado: boolean;
  puedeRecalcular: boolean;
  puedeAprobar: boolean;
  razonNoPuedeAprobar?: string;
  aprobacion: AprobacionOperativaRegistroView | null;
  notaAprobacion: string;
}

export interface AprobacionOperativaRegistroView {
  fechaAprobacionLabel: string;
  usuarioLabel: string;
  versionCalculoLabel: string;
  identificadorTecnicoLabel: string;
  identificadorResultado: string | null;
  idCalculoPeriodo: number | null;
  trabajadoresCalculados: number;
  totalHaberesLabel: string;
  totalDescuentosLabel: string;
  totalLiquidoLabel: string;
  advertencias: string[];
}

export interface CierreOperativoView {
  estadoLabel: string;
  descripcion: string;
  puedeCerrar: boolean;
  razonNoPuedeCerrar?: string;
  fechaCierreLabel?: string;
  usuarioLabel?: string;
  observacionLabel?: string;
  resumen: {
    periodo: string;
    identificadorTecnicoLabel: string;
    versionCalculoLabel: string;
    trabajadoresCalculados: number;
    totalHaberesLabel: string;
    totalDescuentosLabel: string;
    totalLiquidoLabel: string;
    advertenciasLabel: string;
  } | null;
}

export interface PasoPeriodoView {
  numero: string;
  titulo: string;
  estado: PasoPeriodoEstado;
  descripcion: string;
}

export type BitacoraEtapaClave = 'validar' | 'base' | 'calculo' | 'aprobar_cerrar' | 'liquidaciones';
export type BitacoraSubpasoMarca = 'hecho' | 'actual' | 'pendiente';

export interface BitacoraSubpasoVm {
  marca: BitacoraSubpasoMarca;
  etiqueta: string;
}

export interface BitacoraEtapaVm {
  clave: BitacoraEtapaClave;
  etiqueta: string;
  resumen: string;
  activa: boolean;
  completada: boolean;
  bloqueada: boolean;
  subpasos: BitacoraSubpasoVm[];
}

export interface BitacoraRailEtapaVm {
  clave: string;
  etiqueta: string;
  estadoCorto: string;
  marca: 'hecho' | 'actual' | 'pendiente' | 'bloqueado';
  activa: boolean;
}

export interface AlertasPeriodoResumenVm {
  modo: 'evaluando' | 'sin-evaluar' | 'ok' | 'alertas';
  mensaje?: string;
  criticas: number;
  advertencias: number;
  mostrarDetalle: boolean;
  /** Oculto en sidebar hasta existir borrador o snapshot del período. */
  mostrarBloque: boolean;
}

export interface ParaContinuarItemVm {
  titulo: string;
  detalle: string;
}

export interface FilaDetalleTrabajadorNomina {
  trabajador: string;
  rut: string;
  estado: string;
  observacion: string;
  accion: string;
}

export interface FilaDetalleMovimientoNomina {
  trabajador: string;
  concepto: string;
  tipo: string;
  monto: string;
  estado: string;
  accion: string;
}

export interface FilaDetalleRecurrenteNomina {
  trabajador: string;
  concepto: string;
  periodicidad: string;
  monto: string;
  estado: string;
  accion: string;
}

export interface FilaDetalleObservacionNomina {
  severidad: 'Bloqueo' | 'Advertencia' | 'Información';
  ambito: string;
  mensaje: string;
  accion: string;
}

export interface FilaDetalleResultadoNomina {
  trabajador: string;
  haberes: string;
  descuentos: string;
  liquido: string;
  estado: string;
  observacion: string;
}

export interface NominaDetalleMensualTrabajadorRow {
  estado: string;
  trabajador: string;
  situacion: string;
  haberes: string;
  descuentos: string;
  liquidoEstimado: string;
  accion: string;
  idPersona?: number | string;
}

export interface NominaDetalleMensualMovimientoRow {
  estado: string;
  tipo: string;
  trabajador: string;
  concepto: string;
  origenDuracion: string;
  vigencia: string;
  monto: string;
  accion: string;
}

export type NominaDetalleMensualAmbito =
  | 'Trabajador'
  | 'Movimiento'
  | 'Liquidación'
  | 'Parámetro'
  | 'Observación';

export interface NominaDetalleMensualExpedienteRow {
  estado: string;
  ambito: NominaDetalleMensualAmbito;
  trabajador: string;
  conceptoSituacion: string;
  origenDuracion: string;
  vigencia: string;
  monto: string;
  accion: string;
  accionRecomendada?: string;
  severity: NominaWorkspaceDetailSeverity;
  detalleTab?: DetalleOperativoTab;
  ruta?: string;
  accionLocal?: ValidacionAccionLocal;
  idPersona?: number | string;
}

export interface NominaDetalleMensualPendienteRow {
  estado: string;
  ambito: NominaDetalleMensualAmbito;
  trabajador: string;
  situacion: string;
  accionRecomendada: string;
  accion: string;
  severity: NominaWorkspaceDetailSeverity;
  detalleTab?: DetalleOperativoTab;
  ruta?: string;
}

export interface NominaHistorialTablaRow {
  fecha: string;
  etapa: string;
  usuario: string;
  resultado: string;
  detalle: string;
}

export interface ItemSeguimientoNomina {
  titulo: string;
  descripcion: string;
  estado: string;
  estadoClase: string;
  accion: string;
  ruta?: string;
}
