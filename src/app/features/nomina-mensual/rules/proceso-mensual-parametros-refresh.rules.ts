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
  return items.length === 0 || items.every((item) => item.area === AREA_PARAMETROS);
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

export function tonoGrupoParametro(clasificacion: ClasificacionParametroGrupo): ParametroGrupoEstadoTono {
  return clasificacion === 'OK' ? 'ok' : 'revision';
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
  'Los parámetros del período cambiaron. Revise antes de recalcular liquidaciones; la base del período se mantiene disponible.';

export const NOTA_SOLO_VERIFICACION_PARAMETROS =
  'Solo revisa parámetros. Para avanzar la nómina use el flujo principal.';

export interface AccionFooterModalParametrosVm {
  label: string;
  destino: 'validar_periodo' | 'parametros_app';
}

export interface ResolverAccionesFooterModalParametrosInput {
  tienePrevalidacion: boolean;
  baseGenerada: boolean;
  calculoGenerado: boolean;
  resultadoGuardado: boolean;
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
    return 'Listo para liquidar';
  }
  return 'Por revisar';
}
