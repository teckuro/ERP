import type { DataGridColumn, DataGridFilter } from '../../../shared/components/ui/data-grid';
import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { ConceptoListado, HaberDescuentoAsignacionListado } from '../models/haber-descuento-asignacion.model';
import type { FilaGridHaberDescuento } from '../models/haber-descuento-asignacion-listado.vm';

export function etiquetaEstadoFichaEmpleado(empleado: EmpleadoListado): string {
  switch (empleado.estadoFicha) {
    case 'VALIDO':
      return 'Válido';
    case 'INCOMPLETO':
      return 'En proceso';
    case 'BORRADOR':
      return 'Borrador';
    default:
      return empleado.estadoFicha;
  }
}

export function etiquetaTipoConceptoHd(tipo: string | null): string {
  if (tipo === 'HABER') {
    return 'Haber';
  }
  if (tipo === 'DESCUENTO') {
    return 'Descuento';
  }
  if (tipo === 'APORTE_EMPLEADOR') {
    return 'Aporte empleador';
  }
  return tipo?.trim() ? tipo : '—';
}

export function etiquetaNaturalezaConcepto(n: string | null): string {
  if (n === 'IMPONIBLE') {
    return 'Imponible';
  }
  if (n === 'NO_IMPONIBLE') {
    return 'No imponible';
  }
  return n?.trim() ? n : '—';
}

export function formatPorcentajeAsignacion(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatFechaAsignacion(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (!Number.isFinite(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replaceAll('/', '-');
}

export function etiquetaValorAsignacion(row: HaberDescuentoAsignacionListado): string {
  if (row.tipoValor === 'PORCENTAJE') {
    return row.porcentaje == null ? '—' : `${formatPorcentajeAsignacion(row.porcentaje)} %`;
  }
  return row.monto == null ? '—' : `$ ${Number(row.monto).toLocaleString('es-CL')}`;
}

export function crearColumnasGridHaberDescuento(): DataGridColumn<FilaGridHaberDescuento>[] {
  return [
    {
      id: 'nombreConcepto',
      header: 'Concepto',
      field: 'nombreConcepto',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
      filterable: false,
    },
    {
      id: 'codigoLre',
      header: 'Código LRE',
      field: 'codigoLre',
      type: 'text',
      sortable: true,
      format: (v) => (v == null || v === '' ? '—' : String(v)),
      filterable: false,
    },
    {
      id: 'tipoConcepto',
      header: 'Tipo',
      field: 'tipoConcepto',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'naturalezaConcepto',
      header: 'Naturaleza',
      field: 'naturalezaConcepto',
      type: 'text',
      sortable: true,
      format: (_v, row) => etiquetaNaturalezaConcepto(row.naturalezaConcepto),
      visible: false,
      filterable: false,
    },
    {
      id: 'valorAsignacion',
      header: 'Valor',
      field: 'valorAsignacion',
      type: 'text',
      align: 'right',
      sortable: false,
      filterable: false,
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'monto',
      type: 'text',
      align: 'right',
      sortable: true,
      format: (_v, row) =>
        row.tipoValor === 'PORCENTAJE' || row.monto == null
          ? '—'
          : `$ ${Number(row.monto).toLocaleString('es-CL')}`,
      visible: false,
      filterable: false,
    },
    {
      id: 'porcentaje',
      header: 'Porcentaje',
      field: 'porcentaje',
      type: 'text',
      align: 'right',
      sortable: true,
      format: (_v, row) =>
        row.tipoValor === 'FIJO' || row.porcentaje == null
          ? '—'
          : `${formatPorcentajeAsignacion(row.porcentaje)} %`,
      visible: false,
      filterable: false,
    },
    {
      id: 'periodicidad',
      header: 'Periodicidad',
      field: 'periodicidad',
      type: 'text',
      sortable: true,
      format: (v) => (v == null || v === '' ? '—' : String(v)),
      visible: false,
      filterable: false,
    },
    {
      id: 'vigenciaInicio',
      header: 'Vigencia inicio',
      field: 'vigenciaInicio',
      type: 'text',
      sortable: true,
      format: (v) => formatFechaAsignacion(v),
      filterable: false,
    },
    {
      id: 'vigenciaFin',
      header: 'Vigencia fin',
      field: 'vigenciaFin',
      type: 'text',
      sortable: true,
      format: (v) => formatFechaAsignacion(v),
      filterable: false,
    },
    {
      id: 'estadoVigenciaEtiqueta',
      header: 'Estado vigencia',
      field: 'estadoVigenciaEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
    },
  ];
}

export function crearFiltrosGridHaberDescuento(): DataGridFilter<FilaGridHaberDescuento>[] {
  return [
    {
      id: 'busquedaAsignacion',
      label: 'Buscar concepto',
      field: 'busquedaAsignacion',
      type: 'text',
      operator: 'contains',
      placeholder: 'Nombre, código o LRE',
    },
    {
      id: 'estadoVigencia',
      label: 'Estado de vigencia',
      field: 'estadoVigencia',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todas',
      initialValue: 'OPERATIVAS',
      options: [
        { label: 'Operativas', value: 'OPERATIVAS' },
        { label: 'Activas', value: 'ACTIVA' },
        { label: 'Futuras', value: 'FUTURA' },
        { label: 'Vencidas', value: 'VENCIDA' },
        { label: 'Cerradas', value: 'CERRADA' },
        { label: 'Invalidas', value: 'INVALIDA' },
      ],
      predicate: (row, value) => {
        if (typeof value !== 'string' || value === '') {
          return true;
        }
        if (value === 'OPERATIVAS') {
          return row.estadoVigencia === 'ACTIVA' || row.estadoVigencia === 'FUTURA';
        }
        return row.estadoVigencia === value;
      },
    },
  ];
}

export function aFilasGridHaberDescuento(
  rows: readonly HaberDescuentoAsignacionListado[],
): FilaGridHaberDescuento[] {
  return rows.map((r) => {
    const estadoVigencia = r.estadoVigencia ?? 'INVALIDA';
    return {
      ...r,
      estadoVigencia,
      estadoVigenciaEtiqueta: r.estadoVigenciaEtiqueta ?? 'Invalida',
      valorAsignacion: etiquetaValorAsignacion(r),
      busquedaAsignacion: [r.nombreConcepto, r.codigoConcepto, r.codigoLre ?? ''].join(' ').toLowerCase(),
    };
  });
}

export function normalizarTextoConcepto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function debeMostrarCuotasRecurrente(concepto: ConceptoListado | null): boolean {
  if (!concepto) {
    return false;
  }
  const texto = normalizarTextoConcepto(
    [concepto.codigo, concepto.nombre, concepto.tipo, concepto.naturaleza].filter(Boolean).join(' '),
  );
  return ['prestamo', 'anticipo', 'reintegro', 'cuota', 'pactado'].some((token) => texto.includes(token));
}
