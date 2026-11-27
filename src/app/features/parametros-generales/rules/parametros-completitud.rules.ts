import type {
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesClienteConfig,
  ParametrosGeneralesClienteConfigUpsert,
  ParametrosTabId,
  PeriodoRemuneracionEstado,
  PeriodoRemuneracionEstadoInfo,
} from '../models/parametro-general.model';
import type { ParametrosAreaId } from '../models/parametros-workspace.vm';
import { etiquetaTabParametros, tituloAreaParametros } from '../utils/parametros-workspace-tabs.presenter';

import {
  etiquetaCampoOficial,
  humanizarFaltaDatoOficial,
} from '../../nomina-mensual/rules/proceso-mensual-copy-limpio.rules';

export type ParametrosCompletitudEstado = PeriodoRemuneracionEstado;
export type ParametrosEstadoVisual =
  | PeriodoRemuneracionEstado
  | 'editando'
  | 'pendiente_reconciliacion'
  | 'oficial_sin_config'
  | 'configuracion_parcial'
  | 'referencia_anterior'
  | 'sin_base';
export type ParametrosConfigClienteBaseOpcion = 'cero' | 'ultima' | 'referencia' | 'oficiales' | 'cancelar';
export type ParametrosCompletitudGrupoId =
  | 'oficialesMensuales'
  | 'configuracionCliente'
  | 'vigencias'
  | 'consistencia'
  | 'tecnico';

export interface ParametrosCompletitudGrupo {
  id: ParametrosCompletitudGrupoId;
  completo: boolean;
  porcentaje: number;
  total: number;
  completos: number;
}

export interface ParametrosDiferenciaCompletitud {
  campo: keyof ParametroGeneral;
  oficial: number | boolean | null;
  cliente: number | boolean | null;
}

export interface ParametrosCompletitudResultado {
  estadoCalculado: ParametrosCompletitudEstado;
  porcentaje: number;
  grupos: Record<ParametrosCompletitudGrupoId, ParametrosCompletitudGrupo>;
  pendientes: string[];
  advertencias: string[];
  errores: string[];
  diferencias: ParametrosDiferenciaCompletitud[];
  reconciliacionPendiente: boolean;
}

/** Ruta visible en el workspace de Parámetros, con los mismos nombres que usa el menú. */
function ubicacionParametros(area: ParametrosAreaId, tab?: ParametrosTabId): string {
  const titulo = tituloAreaParametros(area);
  return tab ? `${titulo} › ${etiquetaTabParametros(tab)}` : titulo;
}

const EN_CONFIG_EMPRESA = ubicacionParametros('configuracionCliente');
const CARGA_OFICIAL = 'Revisa la carga de parámetros oficiales del período.';

/**
 * Mensajes de completitud: dicen qué falta y dónde completarlo.
 * Otros módulos (p. ej. nómina v2) los reconocen comparando contra estas
 * constantes, nunca contra el texto literal.
 */
export const MENSAJES_COMPLETITUD = {
  sinDatosOficiales: `Faltan los datos oficiales del período. Cárgalos en ${ubicacionParametros('datosOficiales', 'valores')}.`,
  sinTramosCarga: `Faltan los tramos de asignación familiar del período. Revísalos en ${ubicacionParametros('datosOficiales', 'tramosCarga')}.`,
  sinTramosImpuesto: `Faltan los tramos del impuesto único. Revísalos en ${ubicacionParametros('datosOficiales', 'impuestoUnico')}.`,
  sinTablaImpuesto: `Falta la tabla de impuesto único del período. Revísala en ${ubicacionParametros('datosOficiales', 'impuestoUnico')}.`,
  sinConfigEmpresa: `Falta la configuración de la empresa para este período. Créala en ${EN_CONFIG_EMPRESA}.`,
  sinGratificacion: `Falta indicar si la empresa paga gratificación legal. Defínelo en ${EN_CONFIG_EMPRESA}.`,
  sinImmGratificacion: `Falta el IMM con que se calcula la gratificación. Ingrésalo en ${EN_CONFIG_EMPRESA}.`,
  sinMetodoAusencias: `Falta elegir cómo se descuentan las ausencias. Defínelo en ${EN_CONFIG_EMPRESA}.`,
  sinCcaf: `Falta seleccionar la CCAF de la empresa. Elígela en ${EN_CONFIG_EMPRESA}.`,
  sinMutual: `Falta seleccionar la mutual de la empresa. Elígela en ${EN_CONFIG_EMPRESA}.`,
  sinAfp: `No hay tasas de AFP vigentes para el período. Revísalas en ${ubicacionParametros('catalogosVigencias', 'prevision')}.`,
  sinSalud: `No hay instituciones de salud vigentes para el período. Revísalas en ${ubicacionParametros('catalogosVigencias', 'salud')}.`,
  sinAfc: `No hay tasas de AFC vigentes para el período. ${CARGA_OFICIAL}`,
  sinReformaPrevisional: `Falta la gradualidad de la reforma previsional que aplica al período. Revísala en ${ubicacionParametros('observacionNormativa', 'reforma')}.`,
  sinTrabajoPesado: `No hay tasas de trabajo pesado vigentes para el período. ${CARGA_OFICIAL}`,
  sinReformaPensiones: `Faltan los parámetros vigentes de la reforma de pensiones. ${CARGA_OFICIAL}`,
  diferenciasOficialEmpresa: `Hay valores de la configuración de la empresa que no coinciden con los oficiales. Revísalos en ${EN_CONFIG_EMPRESA} y decide cuál usar.`,
  fallaTecnica: 'Los parámetros del período no se cargaron bien. Recarga la página y, si el error sigue, avisa a soporte.',
} as const;

/** Inicio de los pendientes por dato faltante: `${PREFIJO_FALTA_CONFIG_EMPRESA}: <dato>. …` */
export const PREFIJO_FALTA_CONFIG_EMPRESA = 'Falta en la configuración de la empresa';

/** Pendiente de un dato operativo de la configuración de la empresa, con su nombre legible. */
export function mensajeFaltaCampoConfigEmpresa(campo: string): string {
  return `${PREFIJO_FALTA_CONFIG_EMPRESA}: ${etiquetaCampoOficial(campo)}. Ingresa el valor en ${EN_CONFIG_EMPRESA}.`;
}

export type OficialComparacionOrigen = 'fila_exacta' | 'ultimo_hasta_periodo' | 'referencia_visual';

export interface OficialParaComparacionResult {
  oficial: ParametroGeneral | null;
  origen: OficialComparacionOrigen | null;
  /** Período real del snapshot usado (si difiere del seleccionado, es referencia). */
  periodoOrigen: string | null;
}

export interface ResolverOficialParaComparacionInput {
  periodoSeleccionado: string;
  filaExacta: ParametroGeneral | null;
  ultimoHastaPeriodo: ParametroGeneral | null;
  referenciaVisual: ParametroGeneral | null;
}

export interface EvaluarCompletitudParametrosInput {
  periodo: string;
  periodoRemuneracion: PeriodoRemuneracionEstadoInfo | null;
  /** Fila exacta del mes en parametros_generales (completitud de oficiales). */
  oficial: ParametroGeneral | null;
  /** Baseline para comparar con configuración cliente (puede ser fila, último del mes o referencia). */
  oficialParaComparacion?: ParametroGeneral | null;
  clienteConfig: ParametrosGeneralesClienteConfig | null;
  catalogos: ParametrosGeneralesCatalogos;
  errorTecnico?: boolean;
}

/** Umbral relativo para marcar desviación fuerte respecto al valor oficial. */
export const UMBRAL_DESVIACION_OFICIAL_RELATIVA = 0.2;

export function resolverOficialParaComparacionCliente(
  input: ResolverOficialParaComparacionInput,
): OficialParaComparacionResult {
  const { periodoSeleccionado, filaExacta, ultimoHastaPeriodo, referenciaVisual } = input;

  if (filaExacta?.periodo === periodoSeleccionado) {
    return {
      oficial: filaExacta,
      origen: 'fila_exacta',
      periodoOrigen: filaExacta.periodo,
    };
  }

  if (ultimoHastaPeriodo?.periodo === periodoSeleccionado) {
    return {
      oficial: ultimoHastaPeriodo,
      origen: 'ultimo_hasta_periodo',
      periodoOrigen: ultimoHastaPeriodo.periodo,
    };
  }

  if (referenciaVisual) {
    return {
      oficial: { ...referenciaVisual, periodo: periodoSeleccionado },
      origen: 'referencia_visual',
      periodoOrigen: referenciaVisual.periodo,
    };
  }

  return { oficial: null, origen: null, periodoOrigen: null };
}

export interface ResolverEstadoVisualParametrosInput {
  estadoCalculado: ParametrosCompletitudEstado;
  oficialActual: boolean;
  clienteConfig: boolean;
  referenciaAnterior: boolean;
  diferencias: boolean;
  editando?: boolean;
  errorTecnico?: boolean;
}

export interface ResolverOpcionesBaseConfigClienteInput {
  ultimaConfigDisponible: boolean;
  referenciaAnteriorDisponible: boolean;
  oficialesActualesDisponibles: boolean;
}

const PESOS: Record<ParametrosCompletitudGrupoId, number> = {
  oficialesMensuales: 35,
  configuracionCliente: 25,
  vigencias: 25,
  consistencia: 10,
  tecnico: 5,
};

const CAMPOS_OFICIALES_OBLIGATORIOS: Array<keyof ParametroGeneral> = [
  'uf',
  'utm',
  'uta',
  'sueldoMinimo18a65',
  'sueldoMinimoMenor18Mayor65',
  'sueldoMinimoCasaParticular',
  'ingresoMinimoNoRemuneracional',
  'topeAfpUf',
  'topeAfp',
  'topeIpsUf',
  'topeIps',
  'topeCesantiaUf',
  'topeCesantia',
  'topeApvMensualUf',
  'topeApvMensual',
  'topeApvAnualUf',
  'topeApvAnual',
  'sis',
  'sanna',
  'saludObligatoria',
  'afcTrabajadorIndefinido',
  'afcEmpleadorIndefinido',
  'afcEmpleadorPlazo',
];

const CAMPOS_CLIENTE_OPERATIVOS: Array<keyof ParametroGeneral> = [
  'uf',
  'utm',
  'uta',
  'sueldoMinimo18a65',
  'sueldoMinimoMenor18Mayor65',
  'sueldoMinimoCasaParticular',
  'ingresoMinimoNoRemuneracional',
  'topeAfpUf',
  'topeAfp',
  'topeIpsUf',
  'topeIps',
  'topeCesantiaUf',
  'topeCesantia',
  'topeApvMensualUf',
  'topeApvMensual',
  'topeApvAnualUf',
  'topeApvAnual',
  'sis',
  'sanna',
  'saludObligatoria',
  'afcTrabajadorIndefinido',
  'afcEmpleadorIndefinido',
  'afcEmpleadorPlazo',
  'trabajoPesadoEmpleador',
  'trabajoPesadoTrabajador',
  'trabajoMenosPesadoEmpleador',
  'trabajoMenosPesadoTrabajador',
];

const CAMPOS_COMPARABLES: Array<keyof ParametroGeneral> = [
  ...CAMPOS_OFICIALES_OBLIGATORIOS,
  'trabajoPesadoEmpleador',
  'trabajoPesadoTrabajador',
  'trabajoMenosPesadoEmpleador',
  'trabajoMenosPesadoTrabajador',
];

export function evaluarCompletitudParametrosMensual(
  input: EvaluarCompletitudParametrosInput,
): ParametrosCompletitudResultado {
  const pendientes: string[] = [];
  const advertencias: string[] = [];
  const errores: string[] = [];

  const oficiales = evaluarOficiales(input, pendientes);
  const config = evaluarConfigCliente(input, pendientes);
  const vigencias = evaluarVigencias(input, pendientes);
  const baselineComparacion = input.oficialParaComparacion ?? input.oficial;
  const diferencias = compararOficialCliente(baselineComparacion, input.clienteConfig);
  const consistenciaEvaluable = Boolean(input.oficial && input.clienteConfig);
  const reconciliacionPendiente = consistenciaEvaluable
    && hayReconciliacionOficialClientePendiente(input.clienteConfig, diferencias);
  const consistencia = consistenciaEvaluable
    ? grupo('consistencia', reconciliacionPendiente ? 0 : 1, 1)
    : grupoNoAplica('consistencia');
  if (reconciliacionPendiente) {
    advertencias.push(MENSAJES_COMPLETITUD.diferenciasOficialEmpresa);
  }

  const tecnicoCompleto = !input.errorTecnico && input.periodoRemuneracion?.estado !== 'error';
  const tecnico = grupo('tecnico', tecnicoCompleto ? 1 : 0, 1);
  if (!tecnicoCompleto) {
    errores.push(MENSAJES_COMPLETITUD.fallaTecnica);
  }

  const grupos = {
    oficialesMensuales: oficiales,
    configuracionCliente: config,
    vigencias,
    consistencia,
    tecnico,
  };

  const gruposEntries = Object.entries(grupos) as Array<[ParametrosCompletitudGrupoId, ParametrosCompletitudGrupo]>;
  const gruposAplicables = gruposEntries.filter(([, g]) => g.total > 0);
  const pesosAplicables = gruposAplicables.reduce((acc, [id]) => acc + PESOS[id], 0);
  const porcentaje = pesosAplicables === 0
    ? 0
    : Math.min(100, Math.round(
      gruposAplicables.reduce((acc, [id, g]) => acc + (g.porcentaje * PESOS[id]) / 100, 0) * (100 / pesosAplicables),
    ));

  const pendientesHumanizados = pendientes.map((p) => {
    const trimmed = p.trim();
    const endsWithDot = trimmed.endsWith('.');
    const isOficialMissingOrZero = /^(Falta dato oficial|Dato oficial en cero):/i.test(trimmed);
    if (!isOficialMissingOrZero) return p;

    const out = humanizarFaltaDatoOficial(trimmed);
    if (!endsWithDot) return out;
    return out.trim().endsWith('.') ? out : `${out.trim()}.`;
  });

  return {
    estadoCalculado: resolverEstado(input.periodoRemuneracion?.estado ?? null, grupos, errores, reconciliacionPendiente),
    porcentaje,
    grupos,
    pendientes: pendientesHumanizados,
    advertencias,
    errores,
    diferencias,
    reconciliacionPendiente,
  };
}

function evaluarOficiales(
  input: EvaluarCompletitudParametrosInput,
  pendientes: string[],
): ParametrosCompletitudGrupo {
  let total = 4 + CAMPOS_OFICIALES_OBLIGATORIOS.length;
  let completos = 0;

  if (input.oficial) {
    completos += 1;
  } else {
    pendientes.push(MENSAJES_COMPLETITUD.sinDatosOficiales);
  }

  completos += contarCampos(input.oficial, CAMPOS_OFICIALES_OBLIGATORIOS, pendientes, (campo) => `Falta dato oficial: ${campo}.`);
  completos += sumaArray(input.catalogos.tramosCarga, MENSAJES_COMPLETITUD.sinTramosCarga, pendientes);
  completos += sumaArray(input.catalogos.tramosImpuesto, MENSAJES_COMPLETITUD.sinTramosImpuesto, pendientes);
  completos += sumaArray(input.catalogos.tablaImpuestoUnico, MENSAJES_COMPLETITUD.sinTablaImpuesto, pendientes);

  return grupo('oficialesMensuales', completos, total);
}

function evaluarConfigCliente(
  input: EvaluarCompletitudParametrosInput,
  pendientes: string[],
): ParametrosCompletitudGrupo {
  let total = 6 + CAMPOS_CLIENTE_OPERATIVOS.length;
  let completos = 0;
  const cfg = input.clienteConfig;

  if (cfg) {
    completos += 1;
  } else {
    pendientes.push(MENSAJES_COMPLETITUD.sinConfigEmpresa);
  }

  completos += cfg?.gratificacion !== null && cfg?.gratificacion !== undefined ? 1 : 0;
  if (cfg?.gratificacion === null || cfg?.gratificacion === undefined) {
    pendientes.push(MENSAJES_COMPLETITUD.sinGratificacion);
  }

  if (cfg?.gratificacion === true) {
    completos += tieneValor(cfg.immGratificacion) ? 1 : 0;
    if (!tieneValor(cfg.immGratificacion)) {
      pendientes.push(MENSAJES_COMPLETITUD.sinImmGratificacion);
    }
  } else {
    completos += 1;
  }

  completos += cfg?.descuentosBasePorDia !== null && cfg?.descuentosBasePorDia !== undefined ? 1 : 0;
  if (cfg?.descuentosBasePorDia === null || cfg?.descuentosBasePorDia === undefined) {
    pendientes.push(MENSAJES_COMPLETITUD.sinMetodoAusencias);
  }

  const requiereCcaf = input.catalogos.ccafEntidades.length > 0;
  completos += !requiereCcaf || cfg?.idCcafEntidad ? 1 : 0;
  if (requiereCcaf && !cfg?.idCcafEntidad) {
    pendientes.push(MENSAJES_COMPLETITUD.sinCcaf);
  }

  const requiereOrganismoLey16744 = input.catalogos.organismosLey16744.length > 0;
  completos += !requiereOrganismoLey16744 || cfg?.idOrganismoAdministradorLey16744 ? 1 : 0;
  if (requiereOrganismoLey16744 && !cfg?.idOrganismoAdministradorLey16744) {
    pendientes.push(MENSAJES_COMPLETITUD.sinMutual);
  }

  completos += contarCampos(cfg, CAMPOS_CLIENTE_OPERATIVOS, pendientes, mensajeFaltaCampoConfigEmpresa);
  return grupo('configuracionCliente', completos, total);
}

function evaluarVigencias(
  input: EvaluarCompletitudParametrosInput,
  pendientes: string[],
): ParametrosCompletitudGrupo {
  const checks = [
    { ok: input.catalogos.afp.length > 0, pendiente: MENSAJES_COMPLETITUD.sinAfp },
    {
      ok: input.catalogos.isapres.length > 0 || input.catalogos.saludInstituciones.length > 0,
      pendiente: MENSAJES_COMPLETITUD.sinSalud,
    },
    { ok: input.catalogos.afcParametros.length > 0, pendiente: MENSAJES_COMPLETITUD.sinAfc },
    {
      ok: tieneVigenciaAplicable(input.catalogos.reformaPrevisional, input.periodo),
      pendiente: MENSAJES_COMPLETITUD.sinReformaPrevisional,
    },
    {
      ok: tieneVigenciaAplicable(input.catalogos.trabajosPesados, input.periodo),
      pendiente: MENSAJES_COMPLETITUD.sinTrabajoPesado,
    },
    {
      ok: input.catalogos.reformaPensiones.length > 0,
      pendiente: MENSAJES_COMPLETITUD.sinReformaPensiones,
    },
  ];

  let completos = 0;
  for (const check of checks) {
    if (check.ok) {
      completos += 1;
    } else {
      pendientes.push(check.pendiente);
    }
  }

  return grupo('vigencias', completos, checks.length);
}

export function compararOficialCliente(
  oficial: ParametroGeneral | null,
  cliente: ParametrosGeneralesClienteConfig | null,
): ParametrosDiferenciaCompletitud[] {
  if (!oficial || !cliente) {
    return [];
  }

  // Un campo solo produce diferencia cuando AMBOS lados tienen valor concreto (number, boolean
  // distinto de null/undefined/'') y no son equivalentes. Si el oficial es null/undefined para un
  // campo concreto (p.ej. `gratificacion` aún no normada para el mes) se considera "sin base de
  // comparación" y no se reporta como diferencia: no se puede afirmar contradicción sin oficial.
  return CAMPOS_COMPARABLES.flatMap((campo) => {
    const oficialValue = normalizable(oficial[campo]) ? oficial[campo] : null;
    const clienteValue = normalizable(cliente[campo]) ? cliente[campo] : null;
    if (!tieneValor(oficialValue) || !tieneValor(clienteValue) || sonEquivalentes(oficialValue, clienteValue)) {
      return [];
    }
    return [{ campo, oficial: oficialValue, cliente: clienteValue }];
  });
}

function tieneVigenciaAplicable(
  rows: Array<{ vigenciaInicio: string | null; vigenciaFin: string | null }>,
  periodo: string,
): boolean {
  const { inicio, fin } = periodoRango(periodo);
  return rows.some((row) => {
    const vigenciaInicio = row.vigenciaInicio ?? '';
    const vigenciaFin = row.vigenciaFin ?? null;
    return vigenciaInicio <= fin && (vigenciaFin === null || vigenciaFin >= inicio);
  });
}

function periodoRango(periodo: string): { inicio: string; fin: string } {
  const [yearRaw, monthRaw] = periodo.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const lastDay = Number.isFinite(year) && Number.isFinite(month) ? new Date(year, month, 0).getDate() : 28;
  return { inicio: `${periodo}-01`, fin: `${periodo}-${String(lastDay).padStart(2, '0')}` };
}

function valorOficialCampoValido(value: unknown): boolean {
  if (!tieneValor(value)) {
    return false;
  }
  if (typeof value === 'number' && Number.isFinite(value) && value <= 0) {
    return false;
  }
  return true;
}

function contarCampos<T extends Partial<Record<keyof ParametroGeneral, unknown>>>(
  source: T | null,
  fields: Array<keyof ParametroGeneral>,
  pendientes: string[],
  mensajeFalta: (campo: string) => string,
): number {
  let out = 0;
  for (const field of fields) {
    const valor = source?.[field];
    if (valorOficialCampoValido(valor)) {
      out += 1;
    } else if (typeof valor === 'number' && Number.isFinite(valor) && valor <= 0) {
      pendientes.push(`Dato oficial en cero: ${String(field)}.`);
    } else {
      pendientes.push(mensajeFalta(String(field)));
    }
  }
  return out;
}

function sumaArray(rows: unknown[], pendiente: string, pendientes: string[]): number {
  if (rows.length > 0) {
    return 1;
  }
  pendientes.push(pendiente);
  return 0;
}

function resolverEstado(
  estadoPeriodo: PeriodoRemuneracionEstado | null,
  grupos: Record<ParametrosCompletitudGrupoId, ParametrosCompletitudGrupo>,
  errores: string[],
  reconciliacionPendiente: boolean,
): ParametrosCompletitudEstado {
  if (errores.length > 0) {
    return 'error';
  }
  if (!grupos.oficialesMensuales.completo && grupos.oficialesMensuales.porcentaje < 50) {
    return 'pendiente';
  }
  if (!grupos.oficialesMensuales.completo || !grupos.configuracionCliente.completo || !grupos.vigencias.completo) {
    return 'parcial';
  }
  // Diferencias se permiten sin bloquear (se manejan en UI)
  // El estado del mes respeta siempre periodo_remuneracion.estado si es cerrado/corregido
  if (reconciliacionPendiente) {
    return 'cargado';
  }
  if (estadoPeriodo === 'cerrado' || estadoPeriodo === 'corregido') {
    return estadoPeriodo;
  }
  return 'cargado';
}

function requiereReconciliacionOficial(cliente: ParametrosGeneralesClienteConfig | null): boolean {
  return cliente?.estadoReconciliacionOficial !== 'cliente_confirmado'
    && cliente?.estadoReconciliacionOficial !== 'actualizado_con_oficiales'
    && cliente?.estadoReconciliacionOficial !== 'revisar_despues';
}

const ESTADOS_DECISION_RECONCILIACION: ReadonlySet<ParametrosGeneralesClienteConfig['estadoReconciliacionOficial']> =
  new Set(['cliente_confirmado', 'revisar_despues', 'actualizado_con_oficiales']);

/** Configuración cliente guardada después de una decisión de reconciliación previa. */
export function configuracionClienteModificadaDespuesDeDecisionReconciliacion(
  cliente: ParametrosGeneralesClienteConfig,
): boolean {
  if (!ESTADOS_DECISION_RECONCILIACION.has(cliente.estadoReconciliacionOficial)) {
    return false;
  }
  const actualizacionTs = cliente.fechaActualizacion;
  if (!actualizacionTs) {
    return false;
  }
  const decisionTs = cliente.fechaReconciliacionOficial;
  if (!decisionTs) {
    return true;
  }
  return new Date(actualizacionTs).getTime() > new Date(decisionTs).getTime();
}

export function diferenciasConDesviacionExtrema(
  diferencias: readonly ParametrosDiferenciaCompletitud[],
  umbral = UMBRAL_DESVIACION_OFICIAL_RELATIVA,
): ParametrosDiferenciaCompletitud[] {
  return diferencias.filter((d) => {
    if (typeof d.oficial !== 'number' || typeof d.cliente !== 'number') {
      return false;
    }
    const base = Math.abs(d.oficial);
    if (base < 0.0001) {
      return false;
    }
    return Math.abs(d.cliente - d.oficial) / base > umbral;
  });
}

export function hayReconciliacionOficialClientePendiente(
  cliente: ParametrosGeneralesClienteConfig | null,
  diferencias: readonly ParametrosDiferenciaCompletitud[],
): boolean {
  if (!cliente || diferencias.length === 0) {
    return false;
  }
  if (requiereReconciliacionOficial(cliente)) {
    return true;
  }
  return configuracionClienteModificadaDespuesDeDecisionReconciliacion(cliente);
}

export function resolverEstadoVisualParametros(input: ResolverEstadoVisualParametrosInput): ParametrosEstadoVisual {
  if (input.errorTecnico) {
    return 'error';
  }
  if (input.editando) {
    return 'editando';
  }
  if (input.oficialActual && input.clienteConfig && input.diferencias) {
    return 'pendiente_reconciliacion';
  }
  if (input.oficialActual && !input.clienteConfig) {
    return 'oficial_sin_config';
  }
  if (!input.oficialActual && input.clienteConfig) {
    return 'configuracion_parcial';
  }
  if (!input.oficialActual && input.referenciaAnterior) {
    return 'referencia_anterior';
  }
  if (!input.oficialActual) {
    return 'sin_base';
  }
  return input.estadoCalculado;
}

export function resolverOpcionesBaseConfigCliente(
  input: ResolverOpcionesBaseConfigClienteInput,
): ParametrosConfigClienteBaseOpcion[] {
  const opciones: ParametrosConfigClienteBaseOpcion[] = ['cero'];
  if (input.ultimaConfigDisponible) {
    opciones.push('ultima');
  }
  if (input.referenciaAnteriorDisponible) {
    opciones.push('referencia');
  }
  if (input.oficialesActualesDisponibles) {
    opciones.push('oficiales');
  }
  opciones.push('cancelar');
  return opciones;
}

export function crearClienteConfigDesdeOficiales(
  oficial: ParametroGeneral,
  actual: ParametrosGeneralesClienteConfig | null,
  periodo: string,
): ParametrosGeneralesClienteConfigUpsert {
  return {
    periodo,
    uf: oficial.uf,
    utm: oficial.utm,
    uta: oficial.uta,
    sueldoMinimo: oficial.sueldoMinimo,
    sueldoMinimo18a65: oficial.sueldoMinimo18a65,
    sueldoMinimoMenor18Mayor65: oficial.sueldoMinimoMenor18Mayor65,
    sueldoMinimoCasaParticular: oficial.sueldoMinimoCasaParticular,
    ingresoMinimoNoRemuneracional: oficial.ingresoMinimoNoRemuneracional,
    topeAfpUf: oficial.topeAfpUf,
    topeAfp: oficial.topeAfp,
    topeIpsUf: oficial.topeIpsUf,
    topeIps: oficial.topeIps,
    topeCesantiaUf: oficial.topeCesantiaUf,
    topeCesantia: oficial.topeCesantia,
    topeApvMensualUf: oficial.topeApvMensualUf,
    topeApvMensual: oficial.topeApvMensual,
    topeApvAnualUf: oficial.topeApvAnualUf,
    topeApvAnual: oficial.topeApvAnual,
    topeDepositoConvenidoAnualUf: oficial.topeDepositoConvenidoAnualUf,
    topeDepositoConvenidoAnual: oficial.topeDepositoConvenidoAnual,
    topeAfpVoluntario: oficial.topeAfpVoluntario,
    sis: oficial.sis,
    sanna: oficial.sanna,
    seguroSocialExpectativaVida: oficial.seguroSocialExpectativaVida,
    aporteEmpleadorAfp: oficial.aporteEmpleadorAfp,
    saludObligatoria: oficial.saludObligatoria,
    saludCcaf: oficial.saludCcaf,
    saludFonasaConCcaf: oficial.saludFonasaConCcaf,
    afcTrabajadorIndefinido: oficial.afcTrabajadorIndefinido,
    afcEmpleadorIndefinido: oficial.afcEmpleadorIndefinido,
    afcEmpleadorPlazo: oficial.afcEmpleadorPlazo,
    afcEmpleadorIndefinidoOnceAnosMas: oficial.afcEmpleadorIndefinidoOnceAnosMas,
    afcEmpleadorCasaParticular: oficial.afcEmpleadorCasaParticular,
    trabajoPesadoEmpleador: oficial.trabajoPesadoEmpleador,
    trabajoPesadoTrabajador: oficial.trabajoPesadoTrabajador,
    trabajoMenosPesadoEmpleador: oficial.trabajoMenosPesadoEmpleador,
    trabajoMenosPesadoTrabajador: oficial.trabajoMenosPesadoTrabajador,
    descuentosBasePorDia: actual?.descuentosBasePorDia ?? false,
    gratificacion: actual?.gratificacion ?? oficial.gratificacion ?? true,
    immGratificacion: actual?.immGratificacion ?? oficial.immGratificacion,
    idCcafEntidad: actual?.idCcafEntidad ?? null,
    idOrganismoAdministradorLey16744: actual?.idOrganismoAdministradorLey16744 ?? null,
  };
}

function grupo(id: ParametrosCompletitudGrupoId, completos: number, total: number): ParametrosCompletitudGrupo {
  const safeTotal = Math.max(total, 1);
  const porcentaje = Math.round((completos / safeTotal) * 100);
  return { id, completo: completos >= safeTotal, porcentaje, total: safeTotal, completos };
}

function grupoNoAplica(id: ParametrosCompletitudGrupoId): ParametrosCompletitudGrupo {
  return { id, completo: true, porcentaje: 0, total: 0, completos: 0 };
}

function tieneValor(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function normalizable(value: unknown): value is number | boolean | null {
  return typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined;
}

function sonEquivalentes(left: number | boolean | null, right: number | boolean | null): boolean {
  if (typeof left === 'number' && typeof right === 'number') {
    return Math.abs(left - right) < 0.0001;
  }
  return left === right;
}

export interface DebeMostrarAvisoDiferenciasOficialesInput {
  periodoRemuneracion: PeriodoRemuneracionEstadoInfo | null;
  oficial: ParametroGeneral | null;
  clienteConfig: ParametrosGeneralesClienteConfig | null;
  diferencias: ParametrosDiferenciaCompletitud[];
}

/** Aviso modal al entrar o guardar cuando hay baseline oficial y diferencias con la config cliente. */
export function debeMostrarAvisoDiferenciasParametrosOficialesMes(
  input: DebeMostrarAvisoDiferenciasOficialesInput,
): boolean {
  if (!input.oficial || !input.clienteConfig || input.diferencias.length === 0) {
    return false;
  }

  if (input.periodoRemuneracion?.estado === 'error') {
    return false;
  }

  return true;
}

export function huellaDiferenciasOficialesCliente(
  diferencias: readonly ParametrosDiferenciaCompletitud[],
): string {
  return [...diferencias]
    .map((d) => `${String(d.campo)}:${String(d.oficial)}:${String(d.cliente)}`)
    .sort()
    .join('|');
}

function debeReabrirAvisoDiferenciasTrasOficialReciente(
  oficial: ParametroGeneral,
  cliente: ParametrosGeneralesClienteConfig,
): boolean {
  if (cliente.estadoReconciliacionOficial === 'actualizado_con_oficiales') {
    return false;
  }
  if (
    cliente.estadoReconciliacionOficial !== 'revisar_despues'
    && cliente.estadoReconciliacionOficial !== 'cliente_confirmado'
  ) {
    return false;
  }
  return oficialActualizadoDespuesDeDecisionReconciliacion(cliente, oficial);
}

function oficialActualizadoDespuesDeDecisionReconciliacion(
  cliente: ParametrosGeneralesClienteConfig,
  oficial: ParametroGeneral,
): boolean {
  const oficialTs = oficial.fechaActualizacion;
  if (!oficialTs) {
    return false;
  }
  const decisionTs = cliente.fechaReconciliacionOficial;
  if (!decisionTs) {
    return true;
  }
  return new Date(oficialTs).getTime() > new Date(decisionTs).getTime();
}
