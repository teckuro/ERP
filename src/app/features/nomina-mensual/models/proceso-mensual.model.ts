import type { MovimientoVariableEstado } from '../../movimientos-variables/models/movimiento-variable.model';
import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type {
  EmpleadoEstadoFicha,
  EmpleadoFichaDetalle,
  EmpleadoListado,
} from '../../empleados/models/empleado-listado.model';
import type {
  EntradaMensualEstado,
  EntradaMensualOrigen,
  EntradaMensualPeriodo,
  EntradaMensualTipo,
  ResumenEntradasMensualesPeriodo,
} from '../entradas/models/entrada-mensual-periodo.model';
import type {
  AfcParametro,
  AfpParametro,
  IsapreParametro,
  Ley16744Parametro,
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
  TablaImpuestoUnicoParametro,
} from '../../parametros-generales/models/parametro-general.model';

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
  | 'ENTRADAS_MENSUALES'
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
  totalEntradasMensuales?: number;
  resumenEntradasMensuales?: ResumenEntradasMensualesPeriodo;
  conteoEntradasPorEstado?: Partial<Record<EntradaMensualEstado, number>>;
  /** Alias legacy de transicion para la UI existente. */
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

export interface TrabajadorPendienteRevisionPeriodo {
  idPersona: number;
  nombre: string;
  rut: string;
  motivo: string;
  /** Detalle RRHH (1–2 frases) para modal y revisión por trabajador. */
  detalleCorreccion?: string;
  estadoFicha: EmpleadoEstadoFicha;
  aptoParaRemuneraciones: boolean;
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
  entradasMensuales?: EntradaMensualPeriodo[];
  trabajadoresPendientesRevision: TrabajadorPendienteRevisionPeriodo[];
}

export type ProcesoMensualPreNominaEstado =
  | 'NO_GENERABLE'
  | 'GENERADA'
  | 'GENERADA_CON_ADVERTENCIAS';

export type BaseNominaTrabajadorEstado = 'listo' | 'con_observaciones' | 'bloqueado' | 'excluido';

export type BaseNominaParametrosEstado = 'listos' | 'con_observaciones' | 'por_revisar' | 'sin_evaluar';

export interface BaseNominaTrabajadorResumen {
  idPersona: number;
  trabajadorLabel: string;
  rutLabel: string;
  contratoLabel: string;
  estado: BaseNominaTrabajadorEstado;
  asignacionesRecurrentes: number;
  movimientosDelMes: number;
  observacion: string;
}

export interface BaseNominaTrazabilidad {
  trabajadores: BaseNominaTrabajadorResumen[];
  trabajadoresConsiderados: number;
  listosParaCalculo: number;
  conObservaciones: number;
  bloqueados: number;
  excluidos: number;
  asignacionesRecurrentesIncluidas: number;
  movimientosDelMesIncluidos: number;
  parametrosEstado: BaseNominaParametrosEstado;
  observacionParametros: string;
}

export interface ProcesoMensualPreNominaPeriodo {
  periodo: string;
  estado: ProcesoMensualPreNominaEstado;
  generadoEn: string;
  trabajadoresIncluidos: number;
  recurrentesIncluidos: number;
  entradasMensualesAptas?: number;
  entradasMensualesPendientesRevision?: number;
  entradasMensualesBloqueantes?: number;
  /** Alias legacy de transicion para la UI existente. */
  movimientosVariablesValidados: number;
  movimientosVariablesBorrador: number;
  parametrosOperativos: boolean;
  codigosBloqueo: string[];
  codigosAdvertencia: string[];
  origenPrevalidacion: ProcesoMensualEstado;
  trazabilidad?: BaseNominaTrazabilidad;
}

export type MotorCalculoSeveridad = 'BLOQUEO' | 'ADVERTENCIA' | 'INFO';
export type MotorCalculoEstadoTrabajador = 'calculado_preliminar' | 'con_advertencias' | 'con_bloqueos';
export type MotorCalculoEstadoPeriodo = 'sin_calculo' | 'calculado_preliminar' | 'con_bloqueos';

export interface MotorCalculoIssue {
  codigo: string;
  severidad: MotorCalculoSeveridad;
  mensaje: string;
  origen: string;
  entidadId?: number | string | null;
  campo?: string | null;
}

export interface MotorCalculoTrazabilidad {
  codigo: string;
  origen: string;
  tabla: string;
  campo: string;
  valorEntrada: number | string | null;
  formula: string;
  valorResultado: number | string | null;
  vigenciaInicio?: string | null;
  vigenciaFin?: string | null;
  observacion?: string | null;
}

export interface LineaLiquidacionCalculada {
  codigo: string;
  descripcion: string;
  monto: number;
  origen: string;
  imponible?: boolean;
  tributable?: boolean;
}

export interface TrabajadorMotorCalculoSnapshot {
  idPersona: number;
  idContrato: number | null;
  rut: string;
  nombreCompleto: string;
  estado: EmpleadoListado['estado'];
  aptoParaRemuneraciones: boolean;
  sueldoBase: number | null;
  tipoContrato: string | null;
  idAfp: number | null;
  idSalud: number | null;
  valorPlanSalud: number | null;
  horasSemanales: number | null;
  cargasFamiliares: number | null;
  idTramoCarga: number | null;
  tipoGratificacion: string | null;
  gratificacionProporcional: boolean | null;
}

export interface EmpresaLey16744CalculoSnapshot {
  idEmpresaLey16744: number;
  idEmpresa: number | null;
  idOrganismoAdministradorLey16744: number | null;
  tasaAdicionalDiferenciada: number | null;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
}

export interface EntradaMensualMotor {
  idEntrada: string | number;
  origen: EntradaMensualOrigen;
  origenId: string | number | null;
  periodo: string;
  idPersona: number;
  idContrato: number | null;
  idConcepto: number;
  tipoEntrada: EntradaMensualTipo;
  categoria: string | null;
  tipoMovimiento: string | null;
  cantidad: number | null;
  unidad: string | null;
  monto: number | null;
  moneda: string | null;
  estado: EntradaMensualEstado;
  afectaBase: boolean | null;
  metadata: Record<string, unknown>;
}

export interface MotorCalculoInput {
  periodo: string;
  preNomina: ProcesoMensualPreNominaPeriodo;
  prevalidacion: ProcesoMensualPrevalidacion;
  parametrosPeriodo: ParametroGeneral | null;
  catalogos: ParametrosGeneralesCatalogos;
  trabajadores: TrabajadorMotorCalculoSnapshot[];
  recurrentes: HaberDescuentoAsignacionPrevalidacionMensualFila[];
  entradasMensuales: EntradaMensualMotor[];
  empresaLey16744: EmpresaLey16744CalculoSnapshot | null;
}

export interface LiquidacionCalculada {
  periodo: string;
  idPersona: number;
  rut: string;
  nombreCompleto: string;
  haberesImponibles: LineaLiquidacionCalculada[];
  haberesNoImponibles: LineaLiquidacionCalculada[];
  descuentosLegales: LineaLiquidacionCalculada[];
  descuentosVoluntarios: LineaLiquidacionCalculada[];
  baseImponiblePrevisional: number;
  baseTributable: number;
  gratificacionLegal: number;
  asignacionFamiliar: number;
  cotizacionAfp: number;
  cotizacionSalud: number;
  cotizacionAfc: number;
  cotizacionSis: number;
  cotizacionSanna: number;
  cotizacionLey16744: number;
  impuestoUnico: number;
  totalHaberes: number;
  totalDescuentos: number;
  liquidoAPago: number;
  issues: MotorCalculoIssue[];
  trazabilidad: MotorCalculoTrazabilidad[];
  estado: MotorCalculoEstadoTrabajador;
}

export interface MotorCalculoResumenPeriodo {
  totalTrabajadoresCalculados: number;
  totalBloqueados: number;
  totalConAdvertencias: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquidoPreliminar: number;
}

export interface MotorCalculoPeriodoResultado {
  periodo: string;
  estado: MotorCalculoEstadoPeriodo;
  generadoEn: string;
  resumen: MotorCalculoResumenPeriodo;
  liquidaciones: LiquidacionCalculada[];
  issues: MotorCalculoIssue[];
}

export type NominaCalculoSnapshotEstado =
  | 'borrador'
  | 'preliminar'
  | 'recalculado'
  | 'observado'
  | 'listo_para_revision'
  | 'aprobado_para_liquidacion'
  | 'anulado';

export type NominaCalculoSnapshotOrigen = 'preliminar' | 'manual' | 'recalculo';
export type NominaCalculoConceptoTipo = 'haber' | 'descuento' | 'cotizacion' | 'impuesto';
export type EstadoAprobacionOperativaPersistida = 'aprobado_operativamente';
export type NominaCierreOperativoEstado = 'cerrado_operativamente';

export interface AprobacionOperativaPersistida {
  estado: EstadoAprobacionOperativaPersistida;
  fecha: string;
  usuarioId: string | null;
  usuarioLabel: string | null;
  advertencias: string[];
  metadata: Record<string, unknown>;
}

export interface AprobarResultadoPreliminarOperativamenteParams {
  idCalculoPeriodo: number;
  periodo: string;
  advertencias: string[];
}

export interface NominaCierreOperativo {
  estado: NominaCierreOperativoEstado;
  fecha: string;
  usuarioId: string | null;
  usuarioLabel: string;
  observacion: string | null;
  metadata: Record<string, unknown>;
}

export interface CerrarNominaOperativamenteParams {
  idCalculoPeriodo: number;
  periodo: string;
  observacion?: string | null;
}

export interface ReabrirNominaOperativamenteParams {
  idCalculoPeriodo: number;
  periodo: string;
  observacion?: string | null;
  forzar?: boolean;
  metadata?: Record<string, unknown>;
}

export interface NominaCalculoConceptoSnapshot {
  idCalculoConcepto?: number;
  idCalculoTrabajador?: number;
  idConcepto: number | null;
  tipo: NominaCalculoConceptoTipo;
  nombreConceptoSnapshot: string;
  codigoLreSnapshot: string | null;
  monto: number;
  imponible: boolean;
  tributable: boolean;
  afectaLiquido: boolean;
  origen: string;
  trazabilidadJson: Record<string, unknown> | null;
}

export interface NominaCalculoIssueSnapshot {
  idIssue?: number;
  idCalculoPeriodo?: number;
  idCalculoTrabajador?: number | null;
  codigo: string;
  severidad: MotorCalculoSeveridad;
  origen: string;
  mensaje: string;
  campo: string | null;
  entidadId: number | string | null;
}

export interface NominaCalculoTrazabilidadSnapshot {
  idTrazabilidad?: number;
  idCalculoPeriodo?: number;
  idCalculoTrabajador?: number | null;
  codigo: string;
  origen: string;
  tablaFuente: string;
  campoFuente: string;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  valorEntrada: number | string | Record<string, unknown> | unknown[] | null;
  formula: string;
  valorResultado: number | string | Record<string, unknown> | unknown[] | null;
  observacion: string | null;
}

export interface NominaCalculoTrabajadorSnapshot {
  idCalculoTrabajador?: number;
  idCalculoPeriodo?: number;
  idPersona: number;
  rut: string;
  nombreCompletoSnapshot: string;
  estado: MotorCalculoEstadoTrabajador;
  sueldoBase: number;
  baseImponiblePrevisional: number;
  baseTributable: number;
  totalHaberesImponibles: number;
  totalHaberesNoImponibles: number;
  totalDescuentosLegales: number;
  totalDescuentosVoluntarios: number;
  impuestoUnico: number;
  liquidoPreliminar: number;
  cotizacionAfp: number;
  cotizacionSalud: number;
  cotizacionAfc: number;
  cotizacionSis: number;
  cotizacionSanna: number;
  cotizacionLey16744Empleador: number;
  conceptos: NominaCalculoConceptoSnapshot[];
  issues: NominaCalculoIssueSnapshot[];
  trazabilidad: NominaCalculoTrazabilidadSnapshot[];
}

export interface BorradorPersistContext {
  entradasMensuales: EntradaMensualPeriodo[];
  resumenPrevalidacion: ProcesoMensualResumen | null;
  prevalidacionEstado: ProcesoMensualPrevalidacion['estado'] | null;
}

export interface NominaCalculoPeriodoSnapshot {
  idCalculoPeriodo?: number;
  periodo: string;
  idEmpresa: number | null;
  estado: NominaCalculoSnapshotEstado;
  fechaGeneracion: string;
  usuarioGenerador: string | null;
  totalTrabajadores: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquido: number;
  totalBloqueados: number;
  totalAdvertencias: number;
  versionMotor: string;
  hashSnapshot: string | null;
  origen: NominaCalculoSnapshotOrigen;
  activo: boolean;
  reemplazadoPor: number | null;
  aprobacionOperativa: AprobacionOperativaPersistida | null;
  cierreOperativo: NominaCierreOperativo | null;
  trabajadores: NominaCalculoTrabajadorSnapshot[];
  issues: NominaCalculoIssueSnapshot[];
  trazabilidad: NominaCalculoTrazabilidadSnapshot[];
  /** Contexto rehidratable guardado en metadata del período (borrador). */
  borradorPersist?: BorradorPersistContext | null;
}

export interface GuardarSnapshotPreliminarResult {
  ok: boolean;
  snapshot: NominaCalculoPeriodoSnapshot | null;
  reemplazoSnapshotAnterior: boolean;
  hashSnapshot: string | null;
  issues: MotorCalculoIssue[];
}

export interface NominaSnapshotCompletoResumen {
  totalConceptos: number;
  totalObservaciones: number;
  totalTrazas: number;
  totalTrabajadoresSinDetalle: number;
  esActivoVigente: boolean;
  fueReemplazado: boolean;
}

export interface NominaSnapshotCompletoView {
  cabecera: NominaCalculoPeriodoSnapshot;
  trabajadores: NominaCalculoTrabajadorSnapshot[];
  conceptos: NominaCalculoConceptoSnapshot[];
  observaciones: NominaCalculoIssueSnapshot[];
  trazabilidad: NominaCalculoTrazabilidadSnapshot[];
  aprobacionOperativa: AprobacionOperativaPersistida | null;
  cierreOperativo: NominaCierreOperativo | null;
  resumen: NominaSnapshotCompletoResumen;
}

export type MotorCatalogosLegales = {
  afp: AfpParametro[];
  salud: IsapreParametro[];
  afc: AfcParametro[];
  ley16744: Ley16744Parametro[];
  impuestoUnico: TablaImpuestoUnicoParametro[];
};

export function trabajadorSnapshotDesdeFicha(ficha: EmpleadoFichaDetalle): TrabajadorMotorCalculoSnapshot {
  const contrato = ficha.formValue.contrato;
  const previsionSalud = ficha.formValue.previsionSalud;
  const asNumber = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    idPersona: ficha.id,
    idContrato: ficha.idContrato,
    rut: ficha.rut,
    nombreCompleto: ficha.nombre,
    estado: ficha.estado,
    aptoParaRemuneraciones: ficha.aptoParaRemuneraciones,
    sueldoBase: asNumber(contrato['sueldoBase']) ?? ficha.sueldoBase ?? null,
    tipoContrato: asString(contrato['tipoContrato']),
    idAfp: asNumber(previsionSalud['idAfp']),
    idSalud: asNumber(previsionSalud['idSalud']),
    valorPlanSalud: asNumber(previsionSalud['valorPlan']),
    horasSemanales: asNumber(contrato['horasSemanales']) ?? asNumber(contrato['jornadaSemanal']),
    cargasFamiliares: asNumber(contrato['cargasFamiliares']) ?? asNumber(contrato['cargas']),
    idTramoCarga: asNumber(contrato['idTramoCarga']),
    tipoGratificacion: asString(contrato['tipoGratificacion']),
    gratificacionProporcional:
      typeof contrato['gratificacionProporcional'] === 'boolean'
        ? contrato['gratificacionProporcional']
        : null,
  };
}
