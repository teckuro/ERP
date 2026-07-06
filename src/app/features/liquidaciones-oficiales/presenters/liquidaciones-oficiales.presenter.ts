/**
 * Presenter de Liquidaciones oficiales (F18c).
 * Columnas declarativas para `app-data-grid` y etiquetas de selects superiores.
 */

import type {
  DataGridColumn,
  DataGridFilter,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type { LiquidacionTrabajador } from '../models/liquidacion-oficial.model';
import type {
  EstadoNomina,
  NominaPeriodoResumen,
} from '../../nomina-mensual/models/nomina-periodo.models';
import { ETIQUETAS_ESTADO_NOMINA } from '../../nomina-mensual/presenters/admin-nominas.presenter';
import type { FilaLiquidacionInterna } from '../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';
import {
  buildLiquidacionAccionUiView,
  estadoInicialLiquidacionUi,
  type LiquidacionAccionUiEstado,
} from '../rules/liquidaciones-acciones-ui.rules';

const ESTADOS_REVISION_TRABAJADOR: LiquidacionAccionUiEstado[] = [
  'pendiente_autorizar',
  'autorizada',
  'pago_registrado',
  'documento_enviado',
  'rectificacion_solicitada',
];

export const PERSISTENCIA_GRILLA_VERSIONES_LIQ = 'liquidaciones-versiones-grid-v1';
export const PERSISTENCIA_GRILLA_TRABAJADORES_LIQ = 'liquidaciones-trabajadores-grid-v1';
export const PERSISTENCIA_GRILLA_SELECCION_NOMINA_LIQ = 'liquidaciones-seleccion-nomina-grid-v1';

export const COLUMNAS_SELECCION_NOMINA_LIQUIDACION: DataGridColumn<NominaPeriodoResumen>[] = [
  {
    id: 'periodo',
    header: 'Período',
    field: 'periodo',
    type: 'text',
    width: '6.5rem',
    minWidth: '6rem',
    priorityResponsive: 'primary',
    hideable: false,
    filterable: false,
  },
  {
    id: 'empresa',
    header: 'Empresa',
    field: 'empresaNombre',
    type: 'text',
    width: '24%',
    minWidth: '12rem',
    priorityResponsive: 'primary',
    filterable: false,
  },
  {
    id: 'estado',
    header: 'Estado',
    field: 'estado',
    type: 'text',
    width: '9rem',
    minWidth: '8rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'primary',
    filterable: false,
  },
  {
    id: 'trabajadores',
    header: 'Trabajadores',
    field: 'totalTrabajadores',
    type: 'number',
    width: '7rem',
    minWidth: '6rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'secondary',
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acción',
    width: '8.5rem',
    minWidth: '8rem',
    align: 'center',
    sortable: false,
    hideable: false,
    filterable: false,
    headerClass: 'text-center',
    cellClass: 'text-center',
  },
];

export const COLUMNAS_VERSIONES_LIQUIDACION: DataGridColumn<FilaLiquidacionInterna>[] = [
  {
    id: 'version',
    header: 'Versión',
    field: 'version',
    type: 'number',
    width: '6rem',
    minWidth: '5.5rem',
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'clasificacion',
    header: 'Estado',
    field: 'etiquetaClasificacion',
    type: 'text',
    width: '11rem',
    minWidth: '10rem',
    filterable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'trabajadores',
    header: 'Trabajadores',
    field: 'totalTrabajadores',
    type: 'number',
    width: '7rem',
    minWidth: '6rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    filterable: false,
    priorityResponsive: 'secondary',
  },
  {
    id: 'liquido',
    header: 'Líquido',
    field: 'totalLiquido',
    type: 'number',
    width: '8rem',
    minWidth: '7rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    filterable: false,
    priorityResponsive: 'secondary',
  },
  {
    id: 'generada',
    header: 'Generada',
    field: 'fechaGeneracion',
    type: 'text',
    width: '9rem',
    minWidth: '8rem',
    filterable: false,
    priorityResponsive: 'tertiary',
  },
];

export const COLUMNAS_TRABAJADORES_LIQUIDACION: DataGridColumn<LiquidacionTrabajador>[] = [
  {
    id: 'trabajador',
    header: 'Trabajador',
    field: 'nombreTrabajador',
    type: 'text',
    width: '22%',
    minWidth: '12rem',
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'rut',
    header: 'RUT',
    field: 'rut',
    type: 'text',
    width: '8rem',
    minWidth: '7rem',
    filterable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'estado',
    header: 'Estado',
    width: '10rem',
    minWidth: '9rem',
    sortable: false,
    filterable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'haberes',
    header: 'Haberes',
    field: 'totalHaberes',
    type: 'number',
    width: '7rem',
    minWidth: '6rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    filterable: false,
    priorityResponsive: 'secondary',
  },
  {
    id: 'descuentos',
    header: 'Descuentos',
    field: 'totalDescuentos',
    type: 'number',
    width: '7rem',
    minWidth: '6rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    filterable: false,
    priorityResponsive: 'secondary',
  },
  {
    id: 'liquido',
    header: 'Líquido',
    field: 'liquidoPagar',
    type: 'number',
    width: '7rem',
    minWidth: '6rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    filterable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'acciones',
    header: 'Acción',
    width: '10rem',
    minWidth: '9rem',
    align: 'center',
    sortable: false,
    filterable: false,
    hideable: false,
    headerClass: 'text-center',
    cellClass: 'text-center',
  },
];

export function etiquetaOpcionNominaLiquidacion(fila: NominaPeriodoResumen): string {
  const estado = ETIQUETAS_ESTADO_NOMINA[fila.estado] ?? fila.estado;
  return `${fila.periodo} · ${fila.empresaNombre} · ${estado}`;
}

export function etiquetaOpcionVersionLiquidacion(fila: FilaLiquidacionInterna): string {
  return `v${fila.version} · ${fila.etiquetaClasificacion}`;
}

function normalizarTextoBusquedaLiquidacion(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function textoBusquedaNominaLiquidacion(fila: NominaPeriodoResumen): string {
  return normalizarTextoBusquedaLiquidacion([
    fila.empresaNombre,
    fila.periodo,
    ETIQUETAS_ESTADO_NOMINA[fila.estado],
  ].join(' '));
}

/** Filtros del modal de búsqueda de nómina (liquidada/cerrada con comprobantes). */
export function crearFiltrosSeleccionNominaLiquidacion(
  resumenes: readonly NominaPeriodoResumen[],
): DataGridFilter<NominaPeriodoResumen>[] {
  const periodos = [...new Set(resumenes.map((r) => r.periodo))].sort().reverse();
  const estadosPresentes = [...new Set(resumenes.map((r) => r.estado))];

  const filtros: DataGridFilter<NominaPeriodoResumen>[] = [
    {
      id: 'busqueda',
      label: 'Buscar',
      field: 'empresaNombre',
      type: 'text',
      operator: 'contains',
      matchMode: 'tokens',
      placeholder: 'Empresa, período o estado',
      predicate: (fila, value) => {
        const termino = String(value ?? '').trim();
        if (!termino) return true;
        const tokens = normalizarTextoBusquedaLiquidacion(termino).split(/\s+/).filter(Boolean);
        const texto = textoBusquedaNominaLiquidacion(fila);
        return tokens.every((token) => texto.includes(token));
      },
    },
  ];

  if (periodos.length > 1) {
    filtros.push({
      id: 'periodo',
      label: 'Período',
      field: 'periodo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos los períodos',
      options: periodos.map((p) => ({ label: p, value: p })),
    });
  }

  if (estadosPresentes.length > 1) {
    filtros.push({
      id: 'estado',
      label: 'Estado',
      field: 'estado',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos los estados',
      options: estadosPresentes.map((estado) => ({
        label: ETIQUETAS_ESTADO_NOMINA[estado as EstadoNomina],
        value: estado,
      })),
    });
  }

  return filtros;
}

/** Filtros de la grilla de trabajadores liquidados (búsqueda + estado de revisión). */
export function crearFiltrosTrabajadoresLiquidacion(
  estadosAccion: Record<number, LiquidacionAccionUiEstado>,
): DataGridFilter<LiquidacionTrabajador>[] {
  return [
    {
      id: 'busqueda',
      label: 'Buscar',
      field: 'nombreTrabajador',
      type: 'text',
      operator: 'contains',
      matchMode: 'tokens',
      placeholder: 'Nombre, RUT o cargo',
      predicate: (fila, value) => {
        const termino = String(value ?? '').trim();
        if (!termino) return true;
        const tokens = normalizarTextoBusquedaLiquidacion(termino).split(/\s+/).filter(Boolean);
        const texto = normalizarTextoBusquedaLiquidacion(
          [fila.nombreTrabajador, fila.rut ?? '', fila.cargo ?? '', fila.centroCosto ?? ''].join(' '),
        );
        return tokens.every((token) => texto.includes(token));
      },
    },
    {
      id: 'estadoTrabajador',
      label: 'Estado',
      field: 'idLiquidacionTrabajador',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos los estados',
      options: ESTADOS_REVISION_TRABAJADOR.map((estado) => ({
        label: buildLiquidacionAccionUiView(estado).estadoLabel,
        value: estado,
      })),
      predicate: (fila, value) => {
        if (!value) return true;
        const estado =
          estadosAccion[fila.idLiquidacionTrabajador] ?? estadoInicialLiquidacionUi(fila);
        return estado === value;
      },
    },
  ];
}
