import type { DataGridColumn } from '../../../shared/components/ui/data-grid/data-grid.types';
import { etiquetaPeriodoDesdeYm } from '../../../core/services/periodo-activo.service';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { ETIQUETAS_ESTADO_NOMINA } from '../../nomina-mensual/presenters/admin-nominas.presenter';
import type { LreLineaExport } from '../models/lre-export.model';

export const PERSISTENCIA_GRILLA_LRE_EXPORT = 'lre-export-lineas-grid-v1';

export const COLUMNAS_LRE_EXPORT: DataGridColumn<LreLineaExport>[] = [
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
    header: 'Código LRE',
    field: 'codigoLre',
    type: 'text',
    width: '7rem',
    minWidth: '6rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'primary',
    filterable: true,
  },
  {
    id: 'concepto',
    header: 'Concepto',
    field: 'nombreConcepto',
    type: 'text',
    width: '26%',
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

export function etiquetaOpcionNominaLre(nomina: NominaPeriodoResumen): string {
  const periodo = etiquetaPeriodoDesdeYm(nomina.periodo);
  const estado = ETIQUETAS_ESTADO_NOMINA[nomina.estado] ?? nomina.estado;
  return `${periodo} · ${nomina.empresaNombre} (${estado})`;
}
