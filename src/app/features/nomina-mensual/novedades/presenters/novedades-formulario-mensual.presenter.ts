import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';

import type { FormularioMovimientoMesValores, ResumenFormularioMensualUi } from '../models/novedades-formulario-movimiento-mes.model';

export interface AvisoFormularioPendienteUi {
  titulo: string;
  mensaje: string;
  secciones: MessageBoxSection[];
}

export interface ContextoResumenFormularioIndividual {
  requiereTrabajador: boolean;
  trabajadorEtiqueta: string;
  periodoEtiqueta: string;
  tipoEtiqueta: string;
  conceptoEtiqueta: string;
  montoFormateado: string;
  /** Ocultar meta de período cuando ya está en header/identidad. */
  ocultarPeriodoEnResumen?: boolean;
  tieneContextoTrabajador?: boolean;
}

export interface ContextoResumenFormularioMasivo {
  cantidadTrabajadores: number;
  periodoEtiqueta: string;
  tipoEtiqueta: string;
  conceptoEtiqueta: string;
  montoFormateado: string;
}

export function pendientesFormularioMensualIndividual(
  form: Pick<FormularioMovimientoMesValores, 'idPersona' | 'idConcepto' | 'monto'>,
  requiereTrabajador: boolean,
): string[] {
  const pendientes: string[] = [];
  if (requiereTrabajador && form.idPersona == null) {
    pendientes.push('Trabajador');
  }
  if (form.idConcepto == null) {
    pendientes.push('Concepto');
  }
  if (form.monto == null) {
    pendientes.push('Monto');
  }
  return pendientes;
}

export function formularioMensualIndividualListo(
  form: Pick<FormularioMovimientoMesValores, 'idPersona' | 'idConcepto' | 'monto'>,
  requiereTrabajador: boolean,
): boolean {
  return pendientesFormularioMensualIndividual(form, requiereTrabajador).length === 0;
}

export function pendientesFormularioMasivo(
  form: Pick<FormularioMovimientoMesValores, 'idConcepto' | 'monto'>,
): string[] {
  const pendientes: string[] = [];
  if (form.idConcepto == null) {
    pendientes.push('Concepto');
  }
  if (form.monto == null) {
    pendientes.push('Monto');
  }
  return pendientes;
}

export function pendientesFormularioMasivoCompleto(
  form: Pick<FormularioMovimientoMesValores, 'idConcepto' | 'monto'>,
  cantidadTrabajadores: number,
): string[] {
  const pendientes = pendientesFormularioMasivo(form);
  if (cantidadTrabajadores === 0) {
    pendientes.unshift('Trabajadores seleccionados');
  }
  return pendientes;
}

export function avisoFormularioPendienteUi(pendientes: string[]): AvisoFormularioPendienteUi {
  const cantidad = pendientes.length;
  return {
    titulo: cantidad === 1 ? 'Falta un dato obligatorio' : 'Faltan datos obligatorios',
    mensaje:
      cantidad === 1
        ? 'Complete el campo indicado antes de guardar.'
        : `Complete ${cantidad} campos antes de guardar.`,
    secciones: [
      {
        title: 'Pendiente',
        items: pendientes,
        tone: 'attention',
      },
    ],
  };
}

export function formularioMasivoListo(
  form: Pick<FormularioMovimientoMesValores, 'idConcepto' | 'monto'>,
  cantidadTrabajadores: number,
): boolean {
  return cantidadTrabajadores > 0 && pendientesFormularioMasivo(form).length === 0;
}

export function resumenFormularioMensualIndividual(
  form: FormularioMovimientoMesValores,
  ctx: ContextoResumenFormularioIndividual,
): ResumenFormularioMensualUi {
  const pendientes = pendientesFormularioMensualIndividual(form, ctx.requiereTrabajador);
  const listo = pendientes.length === 0;
  const trabajador = ctx.trabajadorEtiqueta.trim();

  return {
    principal:
      listo && trabajador
        ? `${ctx.tipoEtiqueta} de ${ctx.montoFormateado} para ${trabajador}.`
        : '',
    pendientes,
    visible:
      ctx.tieneContextoTrabajador ||
      form.idPersona != null ||
      form.idConcepto != null ||
      form.monto != null,
    mostrarPeriodo: !ctx.ocultarPeriodoEnResumen,
    periodo: ctx.periodoEtiqueta,
  };
}

export function resumenFormularioMasivo(
  form: FormularioMovimientoMesValores,
  ctx: ContextoResumenFormularioMasivo,
): ResumenFormularioMensualUi {
  const pendientes = pendientesFormularioMasivo(form);
  const listo = formularioMasivoListo(form, ctx.cantidadTrabajadores);
  const destino =
    ctx.cantidadTrabajadores === 1
      ? '1 trabajador'
      : `${ctx.cantidadTrabajadores} trabajadores`;

  return {
    principal: listo ? `${ctx.tipoEtiqueta} de ${ctx.montoFormateado} para ${destino}.` : '',
    pendientes,
    visible: ctx.cantidadTrabajadores > 0 || form.idConcepto != null || form.monto != null,
    mostrarPeriodo: false,
    periodo: ctx.periodoEtiqueta,
  };
}

export function formatearMontoFormulario(monto: number | null, moneda = 'CLP'): string {
  if (monto == null) {
    return '';
  }
  return `${moneda} ${Number(monto).toLocaleString('es-CL')}`;
}
