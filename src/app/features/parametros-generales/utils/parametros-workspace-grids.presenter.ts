import type { DataGridColumn } from '../../../shared/components/ui/data-grid';
import { formatearClp, formatearClpDecimal } from '../../../shared/dominio/moneda';
import type {
  AfpParametro,
  ApvApvcFormaPago,
  ApvApvcInstitucion,
  CcafEntidad,
  IsapreParametro,
  OrganismoLey16744,
  ParametroLegal,
  ReformaPrevisionalParametro,
  TablaImpuestoUnicoParametro,
  TrabajoPesadoParametro,
  TramoCargaParametro,
  TramoImpuestoParametro,
} from '../models/parametro-general.model';

/** Props compartidas de shell grilla (patrón Conceptos / erp-fullscreen-grid-card). */
export const PARAMETROS_DATA_GRID_SHELL = {
  className: 'param-grid',
  cardClassName: 'param-grid-card erp-fullscreen-grid-card',
  gridHeight: '100%' as const,
} as const;

export const PARAMETROS_EMPTY_FILTERED = {
  emptyTitleWhenFiltered: 'No hay registros que coincidan con los filtros aplicados.',
  emptyDescriptionWhenFiltered: 'Ajuste la búsqueda o restablezca los filtros para ampliar el listado.',
} as const;

/** Copy operativo RRHH para grillas de catálogo (tono formal, sin jerga técnica visible). */
export const PARAMETROS_GRID_EMPTY = {
  afp: {
    title: 'Administradoras de fondos de pensiones',
    emptyTitle: 'Sin registros de AFP para el período',
    emptyDescription: 'Seleccione otro período o sincronice la carga normativa del mes.',
  },
  isapre: {
    title: 'Instituciones ISAPRE',
    emptyTitle: 'Sin registros de ISAPRE para el período',
    emptyDescription: 'Seleccione otro período o sincronice la carga normativa del mes.',
  },
  saludInstituciones: {
    title: 'Instituciones de salud',
    emptyTitle: 'Sin instituciones de salud para el período',
    emptyDescription: 'Seleccione otro período o sincronice la carga normativa del mes.',
  },
  ccaf: {
    title: 'Cajas de compensación',
    emptyTitle: 'Sin cajas de compensación en catálogo',
    emptyDescription: 'Revise la carga de maestros o la normativa base del período.',
  },
  mutuales: {
    title: 'Organismos mutual',
    emptyTitle: 'Sin organismos mutual en catálogo',
    emptyDescription: 'Revise la carga de maestros o la normativa Ley 16.744 del período.',
  },
  tramosCarga: {
    title: 'Tramos de asignación familiar',
    emptyTitle: 'Sin tramos de asignación familiar',
    emptyDescription: 'La carga oficial del período aún no está disponible.',
  },
  tablaImpuesto: {
    title: 'Tabla impuesto único (SII)',
    emptyTitle: 'Sin tabla de impuesto único',
    emptyDescription: 'Ejecute la sincronización mensual con fuente SII para el período.',
  },
  reforma: {
    title: 'Gradualidad previsional',
    emptyTitle: 'Sin gradualidad vigente al período',
    emptyDescription: 'Revise las fechas de vigencia de la reforma previsional.',
  },
  listado: {
    title: 'Parámetros por período',
    emptyTitle: 'Sin parámetros registrados',
    emptyDescription: 'Registre un período para cargar indicadores previsionales y tributarios.',
  },
} as const;

export interface GridsParametrosWorkspace {
  tramosCargaColumns: DataGridColumn<TramoCargaParametro>[];
  tablaImpuestoColumns: DataGridColumn<TablaImpuestoUnicoParametro>[];
  tramosImpuestoColumns: DataGridColumn<TramoImpuestoParametro>[];
  isapreColumns: DataGridColumn<IsapreParametro>[];
  afpColumns: DataGridColumn<AfpParametro>[];
  ccafColumns: DataGridColumn<CcafEntidad>[];
  organismosLeyColumns: DataGridColumn<OrganismoLey16744>[];
  parametrosLegalesColumns: DataGridColumn<ParametroLegal>[];
  reformaPrevisionalColumns: DataGridColumn<ReformaPrevisionalParametro>[];
  trabajosPesadosColumns: DataGridColumn<TrabajoPesadoParametro>[];
  apvInstitucionesColumns: DataGridColumn<ApvApvcInstitucion>[];
  apvFormasPagoColumns: DataGridColumn<ApvApvcFormaPago>[];
}

function numeroDesdeDesconocido(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function formatoMontoGridParametros(value: unknown): string {
  const numberValue = numeroDesdeDesconocido(value);
  return numberValue === null ? '—' : formatearClp(numberValue);
}

export function formatoMontoDecimalGridParametros(value: unknown, digits = 2): string {
  const numberValue = numeroDesdeDesconocido(value);
  return numberValue === null ? '—' : formatearClpDecimal(numberValue, digits);
}

export function formatoDecimalGridParametros(value: unknown, digits = 2): string {
  const numberValue = numeroDesdeDesconocido(value);
  return numberValue === null
    ? '—'
    : new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(numberValue);
}

export function formatoEnteroGridParametros(value: unknown): string {
  const numberValue = numeroDesdeDesconocido(value);
  return numberValue === null
    ? '—'
    : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(numberValue);
}

export function formatoPorcentajeGridParametros(value: unknown): string {
  const numberValue = numeroDesdeDesconocido(value);
  return numberValue === null
    ? '—'
    : `${new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(numberValue)} %`;
}

/** Factor impuesto SII: decimal (ej. 0,135), no porcentaje con símbolo %. */
export function formatoFactorImpuestoSiiGridParametros(value: unknown): string {
  return formatoDecimalGridParametros(value, 3);
}

export function formatoFechaGridParametros(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    return '—';
  }
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replaceAll('/', '-');
}

export function formatoBooleanoGridParametros(value: unknown): string {
  return value ? 'Sí' : 'No';
}

export function formatoVigenteGridParametros(value: unknown): string {
  return value ? 'Vigente' : 'Inactivo';
}

export function etiquetaParametroLegal(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function etiquetaEstadoVigenciaPeriodo(
  row: { vigenciaInicio: string | null; vigenciaFin: string | null },
  periodoYm: string,
): string {
  const fechaPeriodo = `${periodoYm}-01`;
  const inicio = row.vigenciaInicio ?? '';
  const fin = row.vigenciaFin ?? null;

  if (inicio && inicio > fechaPeriodo) {
    return 'Futuro';
  }
  if (fin && fin < fechaPeriodo) {
    return 'Histórico';
  }
  return 'Vigente al período';
}

export function crearGridsParametrosWorkspace(periodoYm: () => string): GridsParametrosWorkspace {
  const estadoPeriodo = (row: { vigenciaInicio: string | null; vigenciaFin: string | null }) =>
    etiquetaEstadoVigenciaPeriodo(row, periodoYm());

  return {
    tramosCargaColumns: [
      { id: 'periodo', header: 'Período', field: 'periodo', sortable: true },
      { id: 'tramo', header: 'Tramo', field: 'tramo', sortable: true },
      {
        id: 'desde',
        header: 'Renta desde',
        field: 'desde',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
      {
        id: 'hasta',
        header: 'Renta hasta',
        field: 'hasta',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
      {
        id: 'valor',
        header: 'Monto asignación',
        field: 'valor',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
    ],
    tablaImpuestoColumns: [
      {
        id: 'vigenciaInicio',
        header: 'Vigencia desde',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      { id: 'tramo', header: 'Tramo', field: 'tramo', type: 'number', sortable: true, align: 'right' },
      {
        id: 'desde',
        header: 'Renta desde',
        field: 'desde',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoMontoDecimalGridParametros(v, 2),
      },
      {
        id: 'hasta',
        header: 'Renta hasta',
        field: 'hasta',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoMontoDecimalGridParametros(v, 2),
      },
      {
        id: 'factor',
        header: 'Factor',
        field: 'factor',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoFactorImpuestoSiiGridParametros,
      },
      {
        id: 'rebaja',
        header: 'Rebaja',
        field: 'rebaja',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoMontoDecimalGridParametros(v, 2),
      },
    ],
    tramosImpuestoColumns: [
      { id: 'periodo', header: 'Período', field: 'periodo', sortable: true },
      {
        id: 'desde',
        header: 'Renta desde',
        field: 'desde',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoMontoDecimalGridParametros(v, 2),
      },
      {
        id: 'hasta',
        header: 'Renta hasta',
        field: 'hasta',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoMontoDecimalGridParametros(v, 2),
      },
      {
        id: 'factor',
        header: 'Factor',
        field: 'factor',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoFactorImpuestoSiiGridParametros,
      },
      {
        id: 'rebaja',
        header: 'Rebaja',
        field: 'rebaja',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoMontoDecimalGridParametros(v, 2),
      },
    ],
    isapreColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
      { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
      {
        id: 'porcentajeCotizacion',
        header: 'Cotización (%)',
        field: 'porcentajeCotizacion',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'vigenciaInicio',
        header: 'Vigencia desde',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Vigencia hasta',
        field: 'vigenciaFin',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
    afpColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
      {
        id: 'tasaObligatoria',
        header: 'Tasa obligatoria',
        field: 'tasaObligatoria',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'comision',
        header: 'Comisión',
        field: 'comision',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'sis',
        header: 'SIS',
        field: 'sis',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'tasaEmpleador',
        header: 'Tasa empleador',
        field: 'tasaEmpleador',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'vigenciaInicio',
        header: 'Vigencia desde',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Vigencia hasta',
        field: 'vigenciaFin',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
    ccafColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
      { id: 'fuente', header: 'Fuente', field: 'fuente', sortable: true },
    ],
    organismosLeyColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
      { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
    parametrosLegalesColumns: [
      {
        id: 'nombre',
        header: 'Parámetro',
        field: 'nombre',
        sortable: true,
        format: (value) => etiquetaParametroLegal(String(value ?? '')),
      },
      {
        id: 'valorDecimal',
        header: 'Valor decimal',
        field: 'valorDecimal',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoDecimalGridParametros(v, 4),
      },
      {
        id: 'valorEntero',
        header: 'Valor entero',
        field: 'valorEntero',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoEnteroGridParametros,
      },
      {
        id: 'vigenciaInicio',
        header: 'Vigencia desde',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Vigencia hasta',
        field: 'vigenciaFin',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
    ],
    reformaPrevisionalColumns: [
      {
        id: 'vigenciaInicio',
        header: 'Vigencia desde',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Vigencia hasta',
        field: 'vigenciaFin',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      { id: 'estadoPeriodo', header: 'Estado al período', sortable: false, format: (_v, row) => estadoPeriodo(row) },
      {
        id: 'cuentaCapitalizacionIndividual',
        header: 'Cuenta individual',
        field: 'cuentaCapitalizacionIndividual',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'cotizacionRentabilidadProtegida',
        header: 'Rentabilidad protegida',
        field: 'cotizacionRentabilidadProtegida',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'seguroSocialSisCev',
        header: 'Seguro social',
        field: 'seguroSocialSisCev',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'aporteEmpleadorTotal',
        header: 'Aporte empleador',
        field: 'aporteEmpleadorTotal',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      { id: 'fuente', header: 'Fuente', field: 'fuente', sortable: true },
    ],
    trabajosPesadosColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
      {
        id: 'tasaTrabajador',
        header: 'Tasa trabajador',
        field: 'tasaTrabajador',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'tasaEmpleador',
        header: 'Tasa empleador',
        field: 'tasaEmpleador',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'tasaTotal',
        header: 'Tasa total',
        field: 'tasaTotal',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'requiereDictamenCen',
        header: 'Requiere dictamen CEN',
        field: 'requiereDictamenCen',
        sortable: true,
        format: formatoBooleanoGridParametros,
      },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
    apvInstitucionesColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Institución', field: 'nombre', sortable: true },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
    apvFormasPagoColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Forma de pago', field: 'nombre', sortable: true },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
  };
}
