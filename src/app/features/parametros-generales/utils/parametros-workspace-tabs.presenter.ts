import type { ParametrosTabId } from '../models/parametro-general.model';
import type {
  MonthOption,
  ParametrosArea,
  ParametrosAreaId,
  ParametrosTab,
} from '../models/parametros-workspace.vm';

export const MESES_PARAMETROS_WORKSPACE: readonly MonthOption[] = [
  { value: '01', label: 'ENERO' },
  { value: '02', label: 'FEBRERO' },
  { value: '03', label: 'MARZO' },
  { value: '04', label: 'ABRIL' },
  { value: '05', label: 'MAYO' },
  { value: '06', label: 'JUNIO' },
  { value: '07', label: 'JULIO' },
  { value: '08', label: 'AGOSTO' },
  { value: '09', label: 'SEPTIEMBRE' },
  { value: '10', label: 'OCTUBRE' },
  { value: '11', label: 'NOVIEMBRE' },
  { value: '12', label: 'DICIEMBRE' },
];

export const TABS_PARAMETROS_WORKSPACE: readonly ParametrosTab[] = [
  { id: 'configCliente', label: 'Cliente' },
  { id: 'valores', label: 'Información de Valores' },
  { id: 'remuneraciones', label: 'Información de Remuneraciones' },
  { id: 'ccafMutual', label: 'CCAF y Mutual' },
  { id: 'tramosCarga', label: 'Tramos Cargas Familiares' },
  { id: 'impuestoUnico', label: 'Impuesto único' },
  { id: 'salud', label: 'Salud' },
  { id: 'prevision', label: 'Previsión' },
  { id: 'reforma', label: 'Reforma de Pensiones' },
];

export const AREAS_PARAMETROS_WORKSPACE: readonly ParametrosArea[] = [
  {
    id: 'cierrePeriodo',
    label: 'Cierre del período',
    description: 'Estado, pendientes, impacto y acción siguiente.',
    tabIds: [],
  },
  {
    id: 'configuracionCliente',
    label: 'Configuración cliente',
    description: 'Gratificación, ausencias, CCAF, mutual y porcentaje.',
    tabIds: ['configCliente'],
  },
  {
    id: 'datosOficiales',
    label: 'Datos oficiales',
    description: 'Valores, remuneraciones, cargas e impuesto.',
    tabIds: ['valores', 'remuneraciones', 'tramosCarga', 'impuestoUnico'],
  },
  {
    id: 'catalogosVigencias',
    label: 'Catálogos necesarios',
    description: 'Salud, AFP y CCAF/mutual usados para liquidar.',
    tabIds: ['salud', 'prevision', 'ccafMutual'],
  },
  {
    id: 'observacionNormativa',
    label: 'Observación normativa',
    description: 'Reforma de pensiones como referencia de cambios futuros.',
    tabIds: ['reforma'],
  },
];

export function tabsDeAreaParametros(areaId: ParametrosAreaId): readonly ParametrosTab[] {
  const area = AREAS_PARAMETROS_WORKSPACE.find((item) => item.id === areaId);
  if (!area) {
    return [];
  }
  return area.tabIds
    .map((tabId) => TABS_PARAMETROS_WORKSPACE.find((tab) => tab.id === tabId))
    .filter((tab): tab is ParametrosTab => tab !== undefined);
}

export function areaDeTabParametros(tabId: ParametrosTabId): ParametrosAreaId {
  return (
    AREAS_PARAMETROS_WORKSPACE.find((area) => area.tabIds.includes(tabId))?.id ??
    'cierrePeriodo'
  );
}

export function primerTabDeAreaParametros(areaId: ParametrosAreaId): ParametrosTabId | null {
  return tabsDeAreaParametros(areaId)[0]?.id ?? null;
}

export function tituloAreaParametros(areaId: ParametrosAreaId): string {
  switch (areaId) {
    case 'cierrePeriodo':
      return 'Cierre del período';
    case 'configuracionCliente':
      return 'Configuración cliente';
    case 'datosOficiales':
      return 'Datos oficiales';
    case 'catalogosVigencias':
      return 'Catálogos necesarios';
    case 'observacionNormativa':
      return 'Observación normativa';
  }
}

export function tipoAreaParametros(areaId: ParametrosAreaId): string {
  switch (areaId) {
    case 'cierrePeriodo':
      return 'Consola mensual';
    case 'configuracionCliente':
      return 'Política cliente';
    case 'datosOficiales':
      return 'Base normativa';
    case 'catalogosVigencias':
      return 'Catálogos de liquidación';
    case 'observacionNormativa':
      return 'Observación normativa';
  }
}

export function detalleAreaParametros(areaId: ParametrosAreaId): string {
  return AREAS_PARAMETROS_WORKSPACE.find((area) => area.id === areaId)?.description ?? '';
}

export function etiquetaTabParametros(tabId: ParametrosTabId): string {
  switch (tabId) {
    case 'configCliente':
      return 'Cliente';
    case 'valores':
      return 'Valores';
    case 'remuneraciones':
      return 'Remuneraciones';
    case 'ccafMutual':
      return 'CCAF / Mutual';
    case 'tramosCarga':
      return 'Cargas';
    case 'impuestoUnico':
      return 'Impuesto';
    case 'salud':
      return 'Salud';
    case 'prevision':
      return 'Previsión';
    case 'reforma':
      return 'Gradualidad';
  }
}

export function tipoRegistroTabActivo(tabId: ParametrosTabId): string {
  switch (tabId) {
    case 'configCliente':
      return 'Configuración cliente';
    case 'valores':
    case 'remuneraciones':
      return 'Datos oficiales';
    case 'reforma':
      return 'Obs. normativa';
    default:
      return 'Cierre normativo';
  }
}

export function tituloRegistroTabActivo(tabId: ParametrosTabId): string {
  switch (tabId) {
    case 'configCliente':
      return 'Configuración cliente del período';
    case 'valores':
      return 'Valores oficiales del período';
    case 'remuneraciones':
      return 'Parámetros remuneracionales';
    case 'ccafMutual':
      return 'CCAF y mutual';
    case 'tramosCarga':
      return 'Tramos de cargas familiares';
    case 'impuestoUnico':
      return 'Impuesto unico de segunda categoria';
    case 'salud':
      return 'Instituciones de salud';
    case 'prevision':
      return 'Previsión y AFP';
    case 'reforma':
      return 'Gradualidad futura';
  }
}

export interface ContextoDetalleRegistroTabParametros {
  periodoLabel: string;
  tieneConfigCliente: boolean;
  tieneDatosOficiales: boolean;
  conteoCcafMutual: number;
  conteoTramosCarga: number;
  conteoImpuesto: number;
  conteoSalud: number;
  conteoPrevision: number;
  conteoReforma: number;
}

export function detalleRegistroTabActivo(
  tabId: ParametrosTabId,
  ctx: ContextoDetalleRegistroTabParametros,
): string {
  switch (tabId) {
    case 'configCliente':
      return ctx.tieneConfigCliente
        ? `Configuración vigente para ${ctx.periodoLabel}.`
        : `Pendiente para ${ctx.periodoLabel}.`;
    case 'valores':
      return ctx.tieneDatosOficiales ? 'UF, UTM y UTA del período.' : 'Carga oficial pendiente.';
    case 'remuneraciones':
      return ctx.tieneDatosOficiales ? 'Montos y topes del período.' : 'Carga mensual pendiente.';
    case 'ccafMutual':
      return `${ctx.conteoCcafMutual} registros.`;
    case 'tramosCarga':
      return `${ctx.conteoTramosCarga} registros.`;
    case 'impuestoUnico':
      return `${ctx.conteoImpuesto} registros.`;
    case 'salud':
      return `${ctx.conteoSalud} instituciones.`;
    case 'prevision':
      return `${ctx.conteoPrevision} registros.`;
    case 'reforma':
      return `${ctx.conteoReforma} registros.`;
  }
}

export function formatearPeriodoMesAnio(
  periodo: string,
  meses: readonly MonthOption[] = MESES_PARAMETROS_WORKSPACE,
): string {
  const [year, month] = periodo.split('-');
  const monthName = meses.find((item) => item.value === month)?.label ?? month;
  return `${monthName} ${year}`;
}
