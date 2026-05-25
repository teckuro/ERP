import type { ParametrosTabId } from '../models/parametro-general.model';
import type { MonthOption, ParametrosTab } from '../models/parametros-workspace.vm';

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
      return 'Prevision';
    case 'reforma':
      return 'Reforma';
  }
}

export function tipoRegistroTabActivo(tabId: ParametrosTabId): string {
  switch (tabId) {
    case 'configCliente':
      return 'Configuracion cliente';
    case 'valores':
    case 'remuneraciones':
      return 'Datos oficiales';
    default:
      return 'Cierre normativo';
  }
}

export function tituloRegistroTabActivo(tabId: ParametrosTabId): string {
  switch (tabId) {
    case 'configCliente':
      return 'Configuracion cliente del periodo';
    case 'valores':
      return 'Valores oficiales del periodo';
    case 'remuneraciones':
      return 'Parametros remuneracionales';
    case 'ccafMutual':
      return 'CCAF, mutuales y Ley 16.744';
    case 'tramosCarga':
      return 'Tramos de cargas familiares';
    case 'impuestoUnico':
      return 'Impuesto unico de segunda categoria';
    case 'salud':
      return 'Instituciones de salud';
    case 'prevision':
      return 'Prevision y AFP';
    case 'reforma':
      return 'Reforma previsional y registros asociados';
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
        ? `Configuracion vigente para ${ctx.periodoLabel}.`
        : `Pendiente para ${ctx.periodoLabel}.`;
    case 'valores':
      return ctx.tieneDatosOficiales ? 'UF, UTM y UTA del periodo.' : 'Carga oficial pendiente.';
    case 'remuneraciones':
      return ctx.tieneDatosOficiales ? 'Montos y topes del periodo.' : 'Carga mensual pendiente.';
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
