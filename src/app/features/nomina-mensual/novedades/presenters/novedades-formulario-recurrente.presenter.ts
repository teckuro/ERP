import type { HaberDescuentoTipoValor } from '../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { PeriodicidadHd } from '../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { ResumenFormularioMensualUi } from '../models/novedades-formulario-movimiento-mes.model';
import { rangoFechasValido } from '../utils/novedades-ausencia-rango.util';

export interface FormularioRecurrenteValores {
  idConcepto: number | null;
  idContrato: number | null;
  tipoValor: HaberDescuentoTipoValor;
  periodicidad: PeriodicidadHd;
  monto: number;
  porcentaje: number;
  vigenciaInicio: string;
  vigenciaFin: string;
  observacion: string;
}

export interface ContextoResumenFormularioRecurrente {
  trabajadorEtiqueta: string;
  conceptoEtiqueta: string;
  periodoEtiqueta: string;
  ocultarPeriodoEnResumen?: boolean;
  tieneContextoTrabajador?: boolean;
}

export const ETIQUETAS_PERIODICIDAD_HD: Record<PeriodicidadHd, string> = {
  MENSUAL: 'Mensual',
  QUINCENAL: 'Quincenal',
  OCASIONAL: 'Ocasional',
  UNICA: 'Una vez',
};

export function etiquetaPeriodicidadHd(periodicidad: PeriodicidadHd): string {
  return ETIQUETAS_PERIODICIDAD_HD[periodicidad] ?? periodicidad;
}

export function formatearValorRecurrente(
  tipoValor: HaberDescuentoTipoValor,
  monto: number,
  porcentaje: number,
): string {
  if (tipoValor === 'FIJO') {
    return monto > 0 ? `CLP ${Number(monto).toLocaleString('es-CL')}` : '';
  }
  return porcentaje > 0 ? `${porcentaje}%` : '';
}

export function formatearRangoVigenciaRecurrente(vigenciaInicio: string, vigenciaFin: string): string {
  const desde = vigenciaInicio?.trim();
  if (!desde) {
    return '';
  }
  const hasta = vigenciaFin?.trim();
  if (!hasta) {
    return `desde ${formatearFechaUi(desde)}`;
  }
  return `${formatearFechaUi(desde)} – ${formatearFechaUi(hasta)}`;
}

function formatearFechaUi(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) {
    return iso;
  }
  return `${day}/${month}/${year}`;
}

export function pendientesFormularioRecurrenteIndividual(
  form: Pick<
    FormularioRecurrenteValores,
    'idConcepto' | 'tipoValor' | 'monto' | 'porcentaje' | 'vigenciaInicio' | 'vigenciaFin' | 'periodicidad'
  >,
): string[] {
  const pendientes: string[] = [];
  if (form.idConcepto == null) {
    pendientes.push('Concepto');
  }
  if (form.tipoValor === 'FIJO') {
    if (form.monto <= 0) {
      pendientes.push('Monto');
    }
  } else if (form.porcentaje <= 0) {
    pendientes.push('Porcentaje');
  }
  if (!form.vigenciaInicio?.trim()) {
    pendientes.push('Desde');
  }
  if (form.vigenciaFin?.trim() && !rangoFechasValido(form.vigenciaInicio, form.vigenciaFin)) {
    pendientes.push('Rango de vigencia');
  }
  return pendientes;
}

export function formularioRecurrenteIndividualListo(
  form: Pick<
    FormularioRecurrenteValores,
    'idConcepto' | 'tipoValor' | 'monto' | 'porcentaje' | 'vigenciaInicio' | 'vigenciaFin' | 'periodicidad'
  >,
): boolean {
  return pendientesFormularioRecurrenteIndividual(form).length === 0;
}

export function resumenFormularioRecurrenteIndividual(
  form: FormularioRecurrenteValores,
  ctx: ContextoResumenFormularioRecurrente,
): ResumenFormularioMensualUi {
  const pendientes = pendientesFormularioRecurrenteIndividual(form);
  const listo = pendientes.length === 0;
  const valor = formatearValorRecurrente(form.tipoValor, form.monto, form.porcentaje);
  const rango = formatearRangoVigenciaRecurrente(form.vigenciaInicio, form.vigenciaFin);
  const periodicidad = etiquetaPeriodicidadHd(form.periodicidad);
  const concepto = ctx.conceptoEtiqueta.trim();
  const trabajador = ctx.trabajadorEtiqueta.trim();

  const detalle = [concepto, valor, rango, periodicidad].filter(Boolean).join(' · ');

  return {
    principal: listo && trabajador && detalle ? `${detalle} para ${trabajador}.` : listo && detalle ? `${detalle}.` : '',
    pendientes,
    visible:
      ctx.tieneContextoTrabajador ||
      form.idConcepto != null ||
      !!valor ||
      !!form.vigenciaInicio ||
      !!form.vigenciaFin,
    mostrarPeriodo: !ctx.ocultarPeriodoEnResumen,
    periodo: ctx.periodoEtiqueta,
  };
}
