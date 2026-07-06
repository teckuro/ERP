import type { DataGridColumn } from '../../../shared/components/ui/data-grid/data-grid.types';
import { etiquetaPeriodoDesdeYm } from '../../../core/services/periodo-activo.service';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { ETIQUETAS_ESTADO_NOMINA } from '../../nomina-mensual/presenters/admin-nominas.presenter';
import type { PreviredLineaExport } from '../models/previred-export.model';

export const PERSISTENCIA_GRILLA_PREVIRED_EXPORT = 'previred-export-lineas-grid-v1';

export const COLUMNAS_PREVIRED_EXPORT: DataGridColumn<PreviredLineaExport>[] = [
  {
    id: 'rut',
    header: 'RUT',
    field: 'rut',
    type: 'text',
    width: '9rem',
    minWidth: '8rem',
    priorityResponsive: 'primary',
    hideable: false,
    filterable: true,
  },
  {
    id: 'nombre',
    header: 'Trabajador',
    field: 'nombreTrabajador',
    type: 'text',
    width: '22%',
    minWidth: '12rem',
    priorityResponsive: 'primary',
    filterable: true,
  },
  {
    id: 'codigo',
    header: 'Código',
    field: 'codigoMovimiento',
    type: 'text',
    width: '6.5rem',
    minWidth: '6rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'primary',
    filterable: true,
  },
  {
    id: 'glosa',
    header: 'Glosa',
    field: 'glosa',
    type: 'text',
    width: '28%',
    minWidth: '10rem',
    priorityResponsive: 'secondary',
    filterable: true,
  },
  {
    id: 'tipo',
    header: 'Tipo',
    field: 'tipo',
    type: 'text',
    width: '7rem',
    minWidth: '6rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    filterable: true,
  },
  {
    id: 'monto',
    header: 'Monto',
    field: 'monto',
    type: 'number',
    width: '8rem',
    minWidth: '7rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'primary',
    filterable: false,
  },
];

export function etiquetaOpcionNominaPrevired(nomina: NominaPeriodoResumen): string {
  const periodo = etiquetaPeriodoDesdeYm(nomina.periodo);
  const estado = ETIQUETAS_ESTADO_NOMINA[nomina.estado] ?? nomina.estado;
  return `${periodo} · ${nomina.empresaNombre} (${estado})`;
}

export function formatearMontoPrevired(monto: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(monto);
}

export function formatearFechaExportacionPrevired(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fecha);
}
