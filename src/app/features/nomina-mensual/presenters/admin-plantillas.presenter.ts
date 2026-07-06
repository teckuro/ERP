/**
 * Presenter del Administrador de Plantillas de ciclos (F03 — NOM-ADMIN-OPS-F03).
 *
 * Define columnas + filtros declarativos del `app-data-grid` para
 * `NominaPlantillaCiclo[]`. Sin lógica de UI: solo describe la estructura.
 *
 * Documento rector:
 *   `docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md` §F03.
 */

import type {
  DataGridColumn,
  DataGridFilter,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type {
  NaturalezaNomina,
  TipoNomina,
} from '../models/nomina-periodo.models';
import type {
  NominaPlantillaCiclo,
} from '../models/nomina-plantilla-ciclo.models';

/** Clave de persistencia local de la grilla del Administrador de plantillas. */
export const PERSISTENCIA_GRILLA_PLANTILLAS = 'admin-plantillas-ciclos-grid-v1';

/** Etiqueta humana del tipo de plantilla, para la grilla. */
export function tipoPlantillaToLabel(tipo: TipoNomina): string {
  switch (tipo) {
    case 'mensual':
      return 'Mensual';
    case 'quincenal':
      return 'Quincenal';
    case 'semanal':
      return 'Semanal';
    case 'extraordinaria':
      return 'Extraordinaria';
  }
}

/** Etiqueta humana de la naturaleza, para la grilla. */
export function naturalezaPlantillaToLabel(naturaleza: NaturalezaNomina): string {
  switch (naturaleza) {
    case 'liquidacion_legal':
      return 'Liquidación legal';
    case 'anticipo':
      return 'Anticipo';
    case 'pago_extraordinario':
      return 'Pago extraordinario';
    case 'rectificacion':
      return 'Rectificación';
  }
}

/** Etiqueta humana del estado activo/inactivo. */
export function estadoActivoToLabel(activo: boolean): string {
  return activo ? 'Activa' : 'Inactiva';
}

/** Columnas declarativas de la grilla. */
export const COLUMNAS_ADMIN_PLANTILLAS: DataGridColumn<NominaPlantillaCiclo>[] = [
  {
    id: 'codigo',
    header: 'Código',
    field: 'codigo',
    type: 'text',
    width: '10rem',
    minWidth: '8rem',
    priorityResponsive: 'primary',
    hideable: false,
    filterable: false,
  },
  {
    id: 'nombre',
    header: 'Nombre',
    field: 'nombre',
    type: 'text',
    width: '20%',
    minWidth: '14rem',
    priorityResponsive: 'primary',
    filterable: false,
  },
  {
    id: 'tipo',
    header: 'Tipo',
    field: 'tipo',
    type: 'text',
    width: '8rem',
    minWidth: '7rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    filterable: false,
  },
  {
    id: 'naturaleza',
    header: 'Naturaleza',
    field: 'naturaleza',
    type: 'text',
    width: '10rem',
    minWidth: '8rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    filterable: false,
  },
  {
    id: 'reglaFechaPago',
    header: 'Fecha de pago',
    field: 'reglaFechaPago',
    type: 'text',
    width: '14rem',
    minWidth: '12rem',
    priorityResponsive: 'secondary',
    sortable: false,
    filterable: false,
  },
  {
    id: 'politicaFinSemana',
    header: 'Si cae en fin de semana',
    field: 'politicaFinSemana',
    type: 'text',
    width: '12rem',
    minWidth: '10rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'version',
    header: 'Versión',
    field: 'version',
    type: 'number',
    width: '5rem',
    minWidth: '4.5rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'activo',
    header: 'Estado',
    field: 'activo',
    type: 'text',
    width: '8rem',
    minWidth: '7rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'primary',
    sortable: false,
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    field: 'id',
    type: 'text',
    width: '11rem',
    minWidth: '10rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    sortable: false,
    filterable: false,
    priorityResponsive: 'tertiary',
    hideable: false,
  },
];

/**
 * Crea los filtros sobrios del listado. Sin combinaciones esotéricas: tipo,
 * naturaleza, estado.
 */
export function crearFiltrosAdminPlantillas(
  plantillas: readonly NominaPlantillaCiclo[],
): DataGridFilter<NominaPlantillaCiclo>[] {
  const tiposPresentes = Array.from(new Set(plantillas.map((p) => p.tipo)));
  const naturalezasPresentes = Array.from(new Set(plantillas.map((p) => p.naturaleza)));

  return [
    {
      id: 'tipo',
      label: 'Tipo',
      field: 'tipo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos los tipos',
      options: tiposPresentes.map((t) => ({
        label: tipoPlantillaToLabel(t),
        value: t,
      })),
    },
    {
      id: 'naturaleza',
      label: 'Naturaleza',
      field: 'naturaleza',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todas',
      options: naturalezasPresentes.map((n) => ({
        label: naturalezaPlantillaToLabel(n),
        value: n,
      })),
    },
    {
      id: 'estado',
      label: 'Estado',
      field: 'activo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Activas e inactivas',
      options: [
        { label: 'Activas', value: 'true' },
        { label: 'Inactivas', value: 'false' },
      ],
      predicate: (row, value) => {
        if (typeof value !== 'string' || value === '') return true;
        return String(row.activo) === value;
      },
    },
  ];
}

/**
 * Orden estable: primero activas (por código asc), luego inactivas (por código
 * asc, versión desc).
 */
export function ordenarPlantillasOperativas(
  plantillas: readonly NominaPlantillaCiclo[],
): NominaPlantillaCiclo[] {
  return [...plantillas].sort((a, b) => {
    if (a.activo !== b.activo) return a.activo ? -1 : 1;
    if (a.codigo !== b.codigo) return a.codigo.localeCompare(b.codigo);
    return b.version - a.version;
  });
}
