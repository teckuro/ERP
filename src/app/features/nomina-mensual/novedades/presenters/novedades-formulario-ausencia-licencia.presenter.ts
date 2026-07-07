import type { ResumenFormularioMensualUi } from '../models/novedades-formulario-movimiento-mes.model';
import {
  etiquetaMotivoAusencia,
  requiereFolioLicencia,
  resolverCategoriaDesdeMotivo,
  type CodigoMotivoAusencia,
} from '../models/motivo-ausencia.model';
import type { NovedadMensualCategoria, NovedadMensualTipoMovimiento } from '../models/novedad-mensual.model';
import { formatearRangoFechasUi, rangoFechasValido } from '../utils/novedades-ausencia-rango.util';

export interface FormularioAusenciaLicenciaValores {
  idPersona?: number | null;
  codigoMotivoAusencia: string;
  cantidad: number | null;
  fechaEvento: string;
  fechaHasta: string;
  referenciaExterna?: string;
  observacion?: string;
  categoria: NovedadMensualCategoria;
  tipoMovimiento: NovedadMensualTipoMovimiento;
}

export interface ContextoResumenFormularioAusenciaLicencia {
  requiereTrabajador: boolean;
  trabajadorEtiqueta: string;
  periodoEtiqueta: string;
  ocultarPeriodoEnResumen?: boolean;
  tieneContextoTrabajador?: boolean;
}

export function pendientesFormularioAusenciaLicenciaIndividual(
  form: Pick<
    FormularioAusenciaLicenciaValores,
    'idPersona' | 'codigoMotivoAusencia' | 'cantidad' | 'fechaEvento' | 'fechaHasta' | 'referenciaExterna'
  >,
  requiereTrabajador: boolean,
): string[] {
  const pendientes: string[] = [];
  if (requiereTrabajador && form.idPersona == null) {
    pendientes.push('Trabajador');
  }
  if (!form.codigoMotivoAusencia?.trim()) {
    pendientes.push('Motivo');
  }
  if (!form.fechaEvento?.trim()) {
    pendientes.push('Fecha desde');
  }
  if (!form.fechaHasta?.trim()) {
    pendientes.push('Fecha hasta');
  } else if (!rangoFechasValido(form.fechaEvento, form.fechaHasta)) {
    pendientes.push('Rango de fechas');
  } else if (form.cantidad == null || form.cantidad <= 0) {
    pendientes.push('Días en el período');
  }
  if (requiereFolioLicencia(form.codigoMotivoAusencia) && !form.referenciaExterna?.trim()) {
    pendientes.push('Folio de licencia');
  }
  return pendientes;
}

export function formularioAusenciaLicenciaIndividualListo(
  form: Pick<
    FormularioAusenciaLicenciaValores,
    'idPersona' | 'codigoMotivoAusencia' | 'cantidad' | 'fechaEvento' | 'fechaHasta' | 'referenciaExterna'
  >,
  requiereTrabajador: boolean,
): boolean {
  return pendientesFormularioAusenciaLicenciaIndividual(form, requiereTrabajador).length === 0;
}

export function aplicarMotivoAusenciaLicencia(
  codigo: CodigoMotivoAusencia,
): Pick<FormularioAusenciaLicenciaValores, 'codigoMotivoAusencia' | 'categoria' | 'tipoMovimiento'> {
  const resuelto = resolverCategoriaDesdeMotivo(codigo);
  return {
    codigoMotivoAusencia: codigo,
    categoria: resuelto.categoria,
    tipoMovimiento: resuelto.tipoMovimiento,
  };
}

export function resumenFormularioAusenciaLicenciaIndividual(
  form: FormularioAusenciaLicenciaValores,
  ctx: ContextoResumenFormularioAusenciaLicencia,
): ResumenFormularioMensualUi {
  const pendientes = pendientesFormularioAusenciaLicenciaIndividual(form, ctx.requiereTrabajador);
  const listo = pendientes.length === 0;
  const trabajador = ctx.trabajadorEtiqueta.trim();
  const motivo = etiquetaMotivoAusencia(form.codigoMotivoAusencia);
  const rango = formatearRangoFechasUi(form.fechaEvento, form.fechaHasta);
  const dias = form.cantidad == null ? '' : `${form.cantidad} día${form.cantidad === 1 ? '' : 's'}`;

  return {
    principal:
      listo && trabajador && motivo && rango && dias
        ? `${motivo} · ${rango} (${dias}) para ${trabajador}.`
        : '',
    pendientes,
    visible:
      ctx.tieneContextoTrabajador ||
      form.idPersona != null ||
      !!form.codigoMotivoAusencia ||
      !!form.fechaEvento ||
      !!form.fechaHasta,
    mostrarPeriodo: !ctx.ocultarPeriodoEnResumen,
    periodo: ctx.periodoEtiqueta,
  };
}
