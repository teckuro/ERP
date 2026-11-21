import type {
  DataGridBulkActionOption,
  DataGridColumn,
  DataGridFilter,
} from '../../../shared/components/ui/data-grid';
import type { EmpleadoEstado, EmpleadoListado } from '../models/empleado-listado.model';

export function etiquetaEstadoEmpleado(estado: EmpleadoEstado): string {
  switch (estado) {
    case 'borrador':
      return 'Borrador';
    case 'en_proceso':
      return 'En proceso';
    case 'activo':
      return 'Activo';
    case 'suspendido':
      return 'Suspendido';
    case 'inactivo':
      return 'Inactivo';
    case 'desvinculado':
      return 'Desvinculado';
    case 'bloqueado':
      return 'Bloqueado';
  }
}

/**
 * Pone en mayúscula solo la primera letra de un cargo o texto corto, sin tocar el resto.
 * Respeta lo que se guardó: «Jefe de Turno» y «Asistente de RR.HH.» se muestran igual.
 */
export function capitalizarTextoEmpleado(value: string): string {
  const texto = value.trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatearFechaIngresoListado(value: string): string {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const date = match
    ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .toLowerCase()
    .replace('.', '')
    .replace(/^(\d{2})\s/, '$1 ');
}

export function crearAccionesMasivasEstadoEmpleado(): DataGridBulkActionOption[] {
  return [
    {
      id: 'set-in-progress',
      label: 'En proceso',
      value: 'en_proceso',
      tone: 'info',
      confirmLabel: 'Pasar a en proceso',
    },
    {
      id: 'activate',
      label: 'Activo',
      value: 'activo',
      tone: 'success',
      confirmLabel: 'Activar seleccion',
    },
    {
      id: 'change-status',
      label: 'Suspendido',
      value: 'suspendido',
      tone: 'warning',
      confirmLabel: 'Suspender seleccion',
    },
    {
      id: 'deactivate',
      label: 'Inactivo',
      value: 'inactivo',
      tone: 'danger',
      confirmLabel: 'Desactivar seleccion',
    },
    {
      id: 'set-unlinked',
      label: 'Desvinculado',
      value: 'desvinculado',
      tone: 'danger',
      confirmLabel: 'Desvincular seleccion',
    },
    {
      id: 'set-blocked',
      label: 'Bloqueado',
      value: 'bloqueado',
      tone: 'blocked',
      confirmLabel: 'Bloquear seleccion',
    },
  ];
}

export function crearColumnasGridTablaEmpleados(): DataGridColumn<EmpleadoListado>[] {
  return [
    {
      id: 'rut',
      header: 'RUT',
      field: 'rut',
      type: 'text',
      width: '5.75rem',
      minWidth: '5.25rem',
      cellClass: 'whitespace-nowrap text-neutral-700',
      priorityResponsive: 'secondary',
      filterable: true,
      showFilterWhenHidden: true,
    },
    {
      id: 'nombre',
      header: 'Empleado',
      field: 'nombre',
      type: 'text',
      width: '14%',
      minWidth: '8.5rem',
      hideable: false,
      priorityResponsive: 'primary',
      filterable: true,
      showFilterWhenHidden: true,
    },
    {
      id: 'cargo',
      header: 'Cargo',
      field: 'cargo',
      type: 'text',
      width: '9%',
      minWidth: '6.5rem',
      cellClass: 'text-neutral-700',
      priorityResponsive: 'tertiary',
      format: (value) => capitalizarTextoEmpleado(String(value ?? '')),
      filterable: true,
      showFilterWhenHidden: true,
    },
    {
      id: 'departamento',
      header: 'Departamento',
      field: 'departamento',
      type: 'text',
      width: '9%',
      minWidth: '6.5rem',
      cellClass: 'text-neutral-700',
      priorityResponsive: 'tertiary',
      filterable: true,
      showFilterWhenHidden: true,
    },
    {
      id: 'fechaIngreso',
      header: 'Fecha ingreso',
      field: 'fechaIngreso',
      type: 'date',
      width: '5.75rem',
      minWidth: '5.4rem',
      cellClass: 'whitespace-nowrap text-neutral-700',
      format: (value) => formatearFechaIngresoListado(String(value ?? '')),
      filterable: true,
      showFilterWhenHidden: true,
    },
    {
      id: 'sueldoBase',
      header: 'Sueldo',
      field: 'sueldoBase',
      type: 'number',
      width: '5.8rem',
      minWidth: '5.35rem',
      align: 'right',
      cellClass: 'whitespace-nowrap font-semibold text-neutral-900',
      format: (value) => `$ ${Number(value).toLocaleString('es-CL')}`,
      filterable: false,
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      type: 'text',
      width: '6.25rem',
      minWidth: '5.75rem',
      hideable: false,
      priorityResponsive: 'secondary',
      format: (value) => etiquetaEstadoEmpleado(value as EmpleadoEstado),
      filterable: true,
      showFilterWhenHidden: true,
    },
    {
      id: 'avance',
      header: 'Completitud',
      align: 'left',
      width: '6rem',
      minWidth: '5.5rem',
      sortable: false,
      hideable: true,
      filterable: false,
    },
    {
      id: 'acciones',
      header: 'Acción',
      align: 'center',
      width: '3.25rem',
      minWidth: '3.25rem',
      sortable: false,
      hideable: false,
      filterable: false,
      cellClass: 'text-neutral-900',
    },
  ];
}

export function crearFiltrosGridTablaEmpleados(
  options: { filtroInicial?: 'incompletas' | 'aptas' | null } = {},
): DataGridFilter<EmpleadoListado>[] {
  const filtroInicial = options.filtroInicial ?? null;

  return [
    {
      id: 'rut',
      label: 'RUT',
      field: 'rut',
      type: 'text',
      operator: 'contains',
      normalize: 'rut',
      placeholder: 'Buscar RUT',
    },
    {
      id: 'nombre',
      label: 'Empleado',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      normalize: 'text',
      matchMode: 'tokens',
      placeholder: 'Buscar empleado',
    },
    {
      id: 'situacionFicha',
      label: 'Situación ficha',
      field: 'estadoFicha',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todas',
      initialValue: filtroInicial ?? undefined,
      options: [
        { label: 'Incompletas / no aptas', value: 'incompletas' },
        { label: 'Aptas para nómina', value: 'aptas' },
      ],
      predicate: (row, value) => {
        if (value === 'incompletas') {
          return (
            row.pasoAltaAvanzada !== null ||
            row.estadoFicha !== 'VALIDO' ||
            !row.aptoParaRemuneraciones
          );
        }
        if (value === 'aptas') {
          return row.estadoFicha === 'VALIDO' && row.aptoParaRemuneraciones;
        }
        return true;
      },
    },
    {
      id: 'estado',
      label: 'Estado',
      field: 'estado',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todo',
      options: [
        { label: 'Borrador', value: 'borrador' },
        { label: 'En proceso', value: 'en_proceso' },
        { label: 'Activo', value: 'activo' },
        { label: 'Suspendido', value: 'suspendido' },
        { label: 'Inactivo', value: 'inactivo' },
        { label: 'Desvinculado', value: 'desvinculado' },
        { label: 'Bloqueado', value: 'bloqueado' },
      ],
    },
    {
      id: 'departamento',
      label: 'Centro de costo',
      field: 'departamento',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos los centros',
    },
    {
      id: 'cargo',
      label: 'Cargo',
      field: 'cargo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos los cargos',
    },
    {
      id: 'fechaIngreso',
      label: 'Fecha de ingreso',
      field: 'fechaIngreso',
      type: 'date-range',
      operator: 'between',
      disallowFuture: true,
    },
  ];
}
