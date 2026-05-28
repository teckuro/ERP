import type {
  ClasificacionParametroGrupo,
  ProcesoMensualGrupoParametro,
  ProcesoMensualItem,
  ProcesoMensualMensaje,
  ProcesoMensualPrevalidacion,
  ProcesoMensualEstado,
} from '../models/proceso-mensual.model';
import { limpiarCopyTecnicoNomina } from './proceso-mensual-copy-limpio.rules';
import { mensajeBloqueaGeneracionNomina } from './proceso-mensual-prevalidacion.rules';

export interface DriftParametrosVm {
  huboCambio: boolean;
  regresion: boolean;
}

/** Slice en vivo de PG; no sustituye la prevalidación del período. */
export interface ConsultaParametrosPeriodoVm {
  parametrosOperativos: boolean;
  parametrosGrupos: readonly ProcesoMensualGrupoParametro[];
}

/** Tras base o cálculo: parámetros no re-bloquean generación de nómina (impactan liquidaciones). */
export interface MergeParametrosEnPrevalidacionOpciones {
  aislarGeneracionNomina?: boolean;
}

const AREA_PARAMETROS = 'PARAMETROS' as const;

function esMensajeParametros(mensaje: ProcesoMensualMensaje): boolean {
  return mensaje.area === AREA_PARAMETROS;
}

function separarBloqueosGeneracionNomina(bloqueos: ProcesoMensualMensaje[]): {
  bloqueosGeneracion: ProcesoMensualMensaje[];
  advertenciasDesdeBloqueo: ProcesoMensualMensaje[];
} {
  const bloqueosGeneracion: ProcesoMensualMensaje[] = [];
  const advertenciasDesdeBloqueo: ProcesoMensualMensaje[] = [];
  for (const bloqueo of bloqueos) {
    if (mensajeBloqueaGeneracionNomina(bloqueo)) {
      bloqueosGeneracion.push(bloqueo);
      continue;
    }
    advertenciasDesdeBloqueo.push({
      ...bloqueo,
      severidad: 'ADVERTENCIA',
    });
  }
  return { bloqueosGeneracion, advertenciasDesdeBloqueo };
}

function mergeEstadoFinal(
  bloqueos: ProcesoMensualMensaje[],
  advertencias: ProcesoMensualMensaje[],
): ProcesoMensualEstado {
  if (bloqueos.length > 0) {
    return 'BLOQUEADO';
  }
  if (advertencias.some((a) => a.severidad === 'ADVERTENCIA')) {
    return 'CON_ADVERTENCIAS';
  }
  return 'LISTO_PARA_CALCULO';
}

function hashGruposParametros(grupos: readonly ProcesoMensualGrupoParametro[]): string {
  return grupos.map((g) => `${g.id}:${g.clasificacion}`).join('|');
}

function countBloqueosParametros(prevalidacion: ProcesoMensualPrevalidacion | null): number {
  return (prevalidacion?.bloqueos ?? []).filter(esMensajeParametros).length;
}

export function extraerConsultaParametrosPeriodo(
  consulta: ProcesoMensualPrevalidacion,
): ConsultaParametrosPeriodoVm {
  return {
    parametrosOperativos: consulta.resumen.parametrosOperativos,
    parametrosGrupos: consulta.resumen.parametrosGrupos,
  };
}

export function detectarDriftConsultaParametros(
  antes: ConsultaParametrosPeriodoVm | null,
  despues: ConsultaParametrosPeriodoVm,
): DriftParametrosVm {
  const antesOperativo = antes?.parametrosOperativos ?? null;
  const despuesOperativo = despues.parametrosOperativos;
  const huboCambio =
    hashGruposParametros(antes?.parametrosGrupos ?? []) !== hashGruposParametros(despues.parametrosGrupos)
    || antesOperativo !== despuesOperativo;
  const regresion = antesOperativo === true && despuesOperativo === false;
  return { huboCambio, regresion };
}

/** Diagnóstico persistido por consulta solo-PG (no equivale a verificar período). */
export function esDiagnosticoSoloParametros(prevalidacion: ProcesoMensualPrevalidacion): boolean {
  const items = prevalidacion.items ?? [];
  if (
    items.some((item) =>
      item.area === 'TRABAJADORES'
      || item.area === 'ENTRADAS_MENSUALES'
      || item.area === 'MOVIMIENTOS_VARIABLES'
      || item.area === 'HABERES_RECURRENTES',
    )
  ) {
    return false;
  }
  if ((prevalidacion.entradasMensuales?.length ?? 0) > 0) {
    return false;
  }
  if ((prevalidacion.trabajadoresPendientesRevision?.length ?? 0) > 0) {
    return false;
  }
  return items.length > 0 && items.every((item) => item.area === AREA_PARAMETROS);
}

export function detectarDriftParametros(
  antes: ProcesoMensualPrevalidacion | null,
  despues: ProcesoMensualPrevalidacion,
): DriftParametrosVm {
  const antesOperativo = antes?.resumen.parametrosOperativos ?? null;
  const despuesOperativo = despues.resumen.parametrosOperativos;
  const huboCambio =
    hashGruposParametros(antes?.resumen.parametrosGrupos ?? []) !== hashGruposParametros(despues.resumen.parametrosGrupos)
    || antesOperativo !== despuesOperativo
    || countBloqueosParametros(antes) !== countBloqueosParametros(despues);
  const regresion = antesOperativo === true && despuesOperativo === false;
  return { huboCambio, regresion };
}

/** Consulta PG sin arrastrar bloqueos de trabajadores/movimientos (hechos mínimos en 0). */
export function aislarConsultaSoloParametros(consulta: ProcesoMensualPrevalidacion): ProcesoMensualPrevalidacion {
  const bloqueos = consulta.bloqueos.filter(esMensajeParametros);
  const advertencias = consulta.advertencias.filter(esMensajeParametros);
  const informaciones = consulta.informaciones.filter(esMensajeParametros);
  const itemParametros = consulta.items.find((i) => i.area === AREA_PARAMETROS);
  const { bloqueosGeneracion, advertenciasDesdeBloqueo } = separarBloqueosGeneracionNomina(bloqueos);
  const advertenciasDesdeBloqueoGeneracion = bloqueosGeneracion.map((b) => ({
    ...b,
    severidad: 'ADVERTENCIA' as const,
  }));
  const advertenciasFinales = [
    ...advertencias,
    ...advertenciasDesdeBloqueo,
    ...advertenciasDesdeBloqueoGeneracion,
  ];

  return {
    periodo: consulta.periodo,
    estado: mergeEstadoFinal([], advertenciasFinales),
    resumen: {
      periodo: consulta.periodo,
      hayBloqueos: false,
      hayAdvertencias: advertenciasFinales.some((a) => a.severidad === 'ADVERTENCIA'),
      conteoMovimientosPorEstado: {},
      trabajadoresActivosAptos: 0,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: consulta.resumen.parametrosOperativos,
      parametrosGrupos: consulta.resumen.parametrosGrupos,
      recurrentesAplicablesAlPeriodo: 0,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
    },
    bloqueos: [],
    advertencias: advertenciasFinales,
    informaciones,
    items: itemParametros ? [itemParametros] : [],
    trabajadoresPendientesRevision: [],
  };
}

export function mergeParametrosEnPrevalidacion(
  actual: ProcesoMensualPrevalidacion | null,
  consultaParametros: ProcesoMensualPrevalidacion,
  opciones?: MergeParametrosEnPrevalidacionOpciones,
): ProcesoMensualPrevalidacion {
  const consultaSoloParametros = aislarConsultaSoloParametros(consultaParametros);
  if (!actual) {
    return consultaSoloParametros;
  }

  const aislar = opciones?.aislarGeneracionNomina === true;
  const bloqueosParamConsulta = consultaParametros.bloqueos.filter(esMensajeParametros);
  const bloqueos = aislar
    ? actual.bloqueos.filter((m) => !esMensajeParametros(m))
    : [
        ...actual.bloqueos.filter((m) => !esMensajeParametros(m)),
        ...bloqueosParamConsulta,
      ];
  const advertencias = [
    ...actual.advertencias.filter((m) => !esMensajeParametros(m)),
    ...consultaSoloParametros.advertencias.filter(esMensajeParametros),
    ...(aislar
      ? bloqueosParamConsulta.map((mensaje) => ({
          ...mensaje,
          severidad: 'ADVERTENCIA' as const,
        }))
      : []),
  ];
  const informaciones = [
    ...actual.informaciones.filter((m) => !esMensajeParametros(m)),
    ...consultaSoloParametros.informaciones.filter(esMensajeParametros),
  ];
  const itemParametros = consultaSoloParametros.items.find((i) => i.area === AREA_PARAMETROS);
  const items: ProcesoMensualItem[] = [
    ...actual.items.filter((i) => i.area !== AREA_PARAMETROS),
    ...(itemParametros ? [itemParametros] : []),
  ];

  const { bloqueosGeneracion, advertenciasDesdeBloqueo } = separarBloqueosGeneracionNomina(bloqueos);
  const advertenciasFinales = [...advertencias, ...advertenciasDesdeBloqueo];
  const estado = aislar ? actual.estado : mergeEstadoFinal(bloqueosGeneracion, advertenciasFinales);

  return {
    ...actual,
    estado,
    resumen: {
      ...actual.resumen,
      parametrosOperativos: consultaSoloParametros.resumen.parametrosOperativos,
      parametrosGrupos: consultaSoloParametros.resumen.parametrosGrupos,
      hayBloqueos: bloqueosGeneracion.length > 0,
      hayAdvertencias: advertenciasFinales.some((a) => a.severidad === 'ADVERTENCIA'),
    },
    bloqueos: bloqueosGeneracion,
    advertencias: advertenciasFinales,
    informaciones,
    items,
  };
}

export function etiquetaGrupoParametroUi(id: string): string {
  switch (id) {
    case 'mensuales_uf_utm_sueldo':
      return 'UF, UTM y sueldos mínimos';
    case 'topes_base':
      return 'Topes imponibles y APV';
    case 'tasas_cotizacion':
      return 'Tasas de cotización previsional y salud';
    case 'catalogos_afp_impuesto':
      return 'Vigencias AFP, salud e impuesto único';
    case 'ley_16744':
      return 'Mutual Ley 16.744';
    case 'afc_catalogo':
      return 'Seguro de cesantía (AFC)';
    case 'sis_fila_mensual':
      return 'SIS del período';
    case 'salud_catalogo':
      return 'Catálogo de salud';
    case 'mutualidad_ley16744_ccaf':
      return 'Mutual y CCAF';
    case 'reforma_previsional':
      return 'Reforma previsional';
    default: {
      const limpio = limpiarCopyTecnicoNomina(id);
      return limpio || id.replace(/_/g, ' ');
    }
  }
}

export type ParametroGrupoEstadoTono = 'ok' | 'revision';

export interface ParametroGrupoModalVm {
  id: string;
  label: string;
  estado: string;
  tono: ParametroGrupoEstadoTono;
}

export const LABEL_CONFIGURACION_PERIODO = 'Configuración del período';

/** @deprecated Use GRUPO_CONFIGURACION_PERIODO_ID */
export const GRUPO_CALENDARIO_REMUNERACIONES_ID = 'configuracion_periodo';

export const GRUPO_CONFIGURACION_PERIODO_ID = 'configuracion_periodo';

export function tonoGrupoParametro(clasificacion: ClasificacionParametroGrupo): ParametroGrupoEstadoTono {
  return clasificacion === 'OK' ? 'ok' : 'revision';
}

/** Copy RRHH para estado de configuración del período (modal y resumen). */
export function etiquetaEstadoConfiguracionPeriodoModal(estado: string): string {
  const normalizado = estado.trim().toLowerCase();
  if (
    normalizado === 'listo para liquidar'
    || normalizado === 'cargado'
    || normalizado === 'corregido'
    || normalizado === 'cerrado'
    || normalizado === 'listo'
  ) {
    return 'Listo';
  }
  if (normalizado === 'parcial' || normalizado === 'incompleto') {
    return 'Incompleto';
  }
  if (normalizado === 'pendiente' || normalizado === 'pendiente de completar') {
    return 'Pendiente de completar';
  }
  if (normalizado === 'con error' || normalizado === 'con observaciones') {
    return 'Con observaciones';
  }
  return 'Faltan datos';
}

function configuracionPeriodoOperativa(estadoConfiguracion: string, parametrosOperativos: boolean): boolean {
  if (parametrosOperativos) {
    return true;
  }
  return etiquetaEstadoConfiguracionPeriodoModal(estadoConfiguracion) === 'Listo';
}

/** Lista de grupos del modal: consulta en vivo + configuración del período si bloquea operatividad. */
export function mapParametrosGruposParaModal(input: {
  grupos: readonly ProcesoMensualGrupoParametro[];
  parametrosOperativos: boolean;
  estadoCalendario: string;
}): ParametroGrupoModalVm[] {
  const filas: ParametroGrupoModalVm[] = input.grupos.map((grupo) => ({
    id: grupo.id,
    label: etiquetaGrupoParametroUi(grupo.id),
    estado: etiquetaClasificacionGrupoParametro(grupo.clasificacion),
    tono: tonoGrupoParametro(grupo.clasificacion),
  }));

  if (!configuracionPeriodoOperativa(input.estadoCalendario, input.parametrosOperativos)) {
    const idx = filas.findIndex((f) => f.id === GRUPO_CONFIGURACION_PERIODO_ID);
    const filaConfiguracion: ParametroGrupoModalVm = {
      id: GRUPO_CONFIGURACION_PERIODO_ID,
      label: LABEL_CONFIGURACION_PERIODO,
      estado: etiquetaEstadoConfiguracionPeriodoModal(input.estadoCalendario),
      tono: 'revision',
    };
    if (idx >= 0) {
      filas[idx] = filaConfiguracion;
    } else {
      filas.unshift(filaConfiguracion);
    }
  }

  return filas;
}

export function etiquetaClasificacionGrupoParametro(clasificacion: ClasificacionParametroGrupo): string {
  switch (clasificacion) {
    case 'OK':
      return 'Correcto';
    case 'FALTANTE':
      return 'Por corregir';
    case 'PARCIAL':
      return 'Incompleto';
    case 'PENDIENTE_INTEGRACION':
      return 'Pendiente';
    case 'NO_APLICA_AUN':
      return 'No aplica aún';
    default:
      return clasificacion;
  }
}

export const AVISO_DRIFT_PARAMETROS_CON_BASE =
  'Los parámetros del período cambiaron. Revise antes de recalcular liquidaciones. La base del período se mantiene disponible.';

export const NOTA_SOLO_VERIFICACION_PARAMETROS =
  'Resumen del período. Para cargar oficiales, configurar el mes o reconciliar diferencias, use Abrir parámetros.';

export function buildParametrosOverlayContexto(
  input: {
    parametrosOperativos: boolean;
    parametrosGrupos: readonly ProcesoMensualGrupoParametro[];
    prevalidacion: ProcesoMensualPrevalidacion | null;
  },
): { bajada: string; puntos: string[]; estadoCalendario: string } {
  const { parametrosOperativos, parametrosGrupos, prevalidacion } = input;
  const estadoCalendario = resolverEstadoPeriodoRemuneracionDesdePrevalidacion(prevalidacion);
  const faltantes = parametrosGrupos.filter(
    (g) => g.clasificacion === 'FALTANTE' || g.clasificacion === 'PARCIAL',
  );
  const pendienteIntegracion = parametrosGrupos.some(
    (g) => g.clasificacion === 'PENDIENTE_INTEGRACION',
  );
  const puntos: string[] = [];
  if (pendienteIntegracion) {
    puntos.push('Revise carga oficial del mes o reconciliación con la configuración cliente.');
  }
  for (const grupo of faltantes) {
    puntos.push(`${etiquetaGrupoParametroUi(grupo.id)}: ${etiquetaClasificacionGrupoParametro(grupo.clasificacion)}.`);
  }
  if (parametrosOperativos && puntos.length === 0) {
    return {
      bajada: 'Parámetros del período listos para liquidar.',
      puntos: [],
      estadoCalendario,
    };
  }
  if (!parametrosOperativos && puntos.length === 0 && !configuracionPeriodoOperativa(estadoCalendario, false)) {
    const estado = etiquetaEstadoConfiguracionPeriodoModal(estadoCalendario);
    puntos.push(
      estado === 'Faltan datos'
        ? 'Faltan datos en la configuración del período.'
        : `${LABEL_CONFIGURACION_PERIODO}: ${estado}.`,
    );
  }
  if (puntos.length === 0) {
    return {
      bajada: 'Revise parámetros oficiales, configuración del mes y vigencias antes de liquidar.',
      puntos: [],
      estadoCalendario,
    };
  }
  return {
    bajada: 'Hay pendientes en parámetros del período.',
    puntos,
    estadoCalendario,
  };
}

export interface AccionFooterModalParametrosVm {
  label: string;
  destino: 'validar_periodo' | 'parametros_app';
}

export interface ResolverAccionesFooterModalParametrosInput {
  tienePrevalidacion: boolean;
  baseGenerada: boolean;
  calculoGenerado: boolean;
  resultadoGuardado: boolean;
  parametrosOperativos?: boolean;
  preparacionNominaEnCurso?: boolean;
  flujoPrincipalEnCurso?: boolean;
}

/** Tri-estado para checklist: prioriza consulta PG en vivo sobre prevalidación persistida. */
export function resolveParametrosListosPeriodo(input: {
  consultaParametrosOperativos?: boolean | null;
  prevalidacionParametrosOperativos?: boolean | null;
  persistidoParametrosOperativos?: boolean | null;
}): boolean | null {
  if (input.consultaParametrosOperativos != null) {
    return input.consultaParametrosOperativos;
  }
  if (input.prevalidacionParametrosOperativos != null) {
    return input.prevalidacionParametrosOperativos;
  }
  if (input.persistidoParametrosOperativos != null) {
    return input.persistidoParametrosOperativos;
  }
  return null;
}

export function resolveParametrosOperativosPeriodo(input: {
  parametrosListosDashboard?: boolean | null;
  prevalidacionParametrosOperativos?: boolean | null;
  consultaParametrosOperativos?: boolean | null;
  persistidoParametrosOperativos?: boolean | null;
}): boolean {
  const listos = resolveParametrosListosPeriodo({
    consultaParametrosOperativos: input.consultaParametrosOperativos,
    prevalidacionParametrosOperativos: input.prevalidacionParametrosOperativos,
    persistidoParametrosOperativos:
      input.persistidoParametrosOperativos ?? input.parametrosListosDashboard,
  });
  return listos === true;
}

/** Pie del modal Parámetros: no repetir verificación del período si RRHH ya avanzó en el flujo principal. */
export function resolverAccionesFooterModalParametros(
  ctx: ResolverAccionesFooterModalParametrosInput,
): {
  accionPrincipal?: AccionFooterModalParametrosVm;
  accionSecundaria?: AccionFooterModalParametrosVm;
} {
  const abrirParametros: AccionFooterModalParametrosVm = {
    label: 'Abrir parámetros',
    destino: 'parametros_app',
  };

  if (
    ctx.parametrosOperativos != null
    || ctx.preparacionNominaEnCurso
    || ctx.flujoPrincipalEnCurso
  ) {
    return { accionPrincipal: abrirParametros };
  }

  const yaAvanzoFlujoPrincipal =
    ctx.baseGenerada
    || ctx.calculoGenerado
    || ctx.resultadoGuardado
    || ctx.tienePrevalidacion;

  if (yaAvanzoFlujoPrincipal) {
    return { accionPrincipal: abrirParametros };
  }

  return {
    accionSecundaria: abrirParametros,
    accionPrincipal: { label: 'Verificar período', destino: 'validar_periodo' },
  };
}

/** El shell no debe quedar con CTA de verificación si el flujo ya avanzó (p. ej. borrador generado). */
export function nominaFrameCongeladoObsoleto(
  congelado: { ctaAccion?: string; frame: string },
  actual: { ctaAccion?: string; frame: string },
): boolean {
  if (congelado.ctaAccion === 'validarPeriodo' && actual.ctaAccion !== 'validarPeriodo') {
    return true;
  }
  return congelado.frame === 'sin_generar' && actual.frame !== 'sin_generar';
}

/** Etiqueta RRHH del estado del calendario de remuneraciones del período. */
export function etiquetaEstadoPeriodoRemuneracion(estado: string | null | undefined): string {
  switch (estado?.trim().toLowerCase()) {
    case 'cargado':
      return 'Cargado';
    case 'corregido':
      return 'Corregido';
    case 'cerrado':
      return 'Cerrado';
    case 'parcial':
      return 'Parcial';
    case 'pendiente':
      return 'Pendiente';
    case 'error':
      return 'Con error';
    default:
      return estado?.trim() ? estado.trim() : 'Sin evaluar';
  }
}

export function resolverEstadoPeriodoRemuneracionDesdePrevalidacion(
  prevalidacion: ProcesoMensualPrevalidacion | null,
): string {
  const item = prevalidacion?.items.find((i) => i.area === 'PARAMETROS');
  const detalle = item?.detalle?.trim() ?? '';
  const match = /^Estado período:\s*(.+)$/i.exec(detalle);
  if (match?.[1]) {
    return etiquetaEstadoPeriodoRemuneracion(match[1]);
  }
  if (prevalidacion?.resumen.parametrosOperativos) {
    return 'Listo';
  }
  return 'Faltan datos';
}
