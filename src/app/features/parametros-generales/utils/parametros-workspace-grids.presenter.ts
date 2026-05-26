import type { DataGridColumn } from '../../../shared/components/ui/data-grid';
import type {
  AfpParametro,
  ApvApvcFormaPago,
  ApvApvcInstitucion,
  CcafEntidad,
  IsapreParametro,
  Ley16744Parametro,
  OrganismoLey16744,
  ParametroLegal,
  ReformaPrevisionalParametro,
  TablaImpuestoUnicoParametro,
  TrabajoPesadoParametro,
  TramoCargaParametro,
  TramoImpuestoParametro,
} from '../models/parametro-general.model';

export interface GridsParametrosWorkspace {
  tramosCargaColumns: DataGridColumn<TramoCargaParametro>[];
  tablaImpuestoColumns: DataGridColumn<TablaImpuestoUnicoParametro>[];
  tramosImpuestoColumns: DataGridColumn<TramoImpuestoParametro>[];
  isapreColumns: DataGridColumn<IsapreParametro>[];
  afpColumns: DataGridColumn<AfpParametro>[];
  ccafColumns: DataGridColumn<CcafEntidad>[];
  organismosLeyColumns: DataGridColumn<OrganismoLey16744>[];
  ley16744Columns: DataGridColumn<Ley16744Parametro>[];
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
  return numberValue === null
    ? '—'
    : `$ ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(numberValue)}`;
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
        header: 'Desde',
        field: 'desde',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
      {
        id: 'hasta',
        header: 'Hasta',
        field: 'hasta',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
      {
        id: 'valor',
        header: 'Valor',
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
        header: 'Vigencia',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      { id: 'tramo', header: 'Tramo', field: 'tramo', type: 'number', sortable: true, align: 'right' },
      {
        id: 'desde',
        header: 'Desde UTM',
        field: 'desde',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoDecimalGridParametros(v, 2),
      },
      {
        id: 'hasta',
        header: 'Hasta UTM',
        field: 'hasta',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoDecimalGridParametros(v, 2),
      },
      {
        id: 'factor',
        header: 'Factor',
        field: 'factor',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'rebaja',
        header: 'Rebaja UTM',
        field: 'rebaja',
        type: 'number',
        sortable: true,
        align: 'right',
        format: (v) => formatoDecimalGridParametros(v, 4),
      },
    ],
    tramosImpuestoColumns: [
      { id: 'periodo', header: 'Período', field: 'periodo', sortable: true },
      {
        id: 'desde',
        header: 'Desde',
        field: 'desde',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
      {
        id: 'hasta',
        header: 'Hasta',
        field: 'hasta',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
      {
        id: 'factor',
        header: 'Factor',
        field: 'factor',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'rebaja',
        header: 'Rebaja',
        field: 'rebaja',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoMontoGridParametros,
      },
    ],
    isapreColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
      { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
      {
        id: 'porcentajeCotizacion',
        header: 'Cotización',
        field: 'porcentajeCotizacion',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'vigenciaInicio',
        header: 'Inicio',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Fin',
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
        header: 'Obligatoria',
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
        header: 'Empleador',
        field: 'tasaEmpleador',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'vigenciaInicio',
        header: 'Inicio',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Fin',
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
    ley16744Columns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      {
        id: 'cotizacionBasicaEmpleador',
        header: 'Cotización básica',
        field: 'cotizacionBasicaEmpleador',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'descripcionTasaAdicional',
        header: 'Adicional diferenciada',
        field: 'descripcionTasaAdicional',
        sortable: true,
      },
      {
        id: 'vigenciaInicio',
        header: 'Inicio',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Fin',
        field: 'vigenciaFin',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
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
        header: 'Inicio',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Fin',
        field: 'vigenciaFin',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
    ],
    reformaPrevisionalColumns: [
      {
        id: 'vigenciaInicio',
        header: 'Inicio',
        field: 'vigenciaInicio',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
      {
        id: 'vigenciaFin',
        header: 'Fin',
        field: 'vigenciaFin',
        type: 'date',
        sortable: true,
        format: formatoFechaGridParametros,
      },
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
        header: 'CRP',
        field: 'cotizacionRentabilidadProtegida',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'seguroSocialSisCev',
        header: 'Seguro Social / SIS / CEV',
        field: 'seguroSocialSisCev',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'aporteEmpleadorTotal',
        header: 'Total empleador',
        field: 'aporteEmpleadorTotal',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      { id: 'estadoPeriodo', header: 'Estado', sortable: false, format: (_v, row) => estadoPeriodo(row) },
      { id: 'fuente', header: 'Fuente', field: 'fuente', sortable: true },
    ],
    trabajosPesadosColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
      {
        id: 'tasaTrabajador',
        header: 'Trabajador',
        field: 'tasaTrabajador',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'tasaEmpleador',
        header: 'Empleador',
        field: 'tasaEmpleador',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'tasaTotal',
        header: 'Total',
        field: 'tasaTotal',
        type: 'number',
        sortable: true,
        align: 'right',
        format: formatoPorcentajeGridParametros,
      },
      {
        id: 'requiereDictamenCen',
        header: 'Dictamen CEN',
        field: 'requiereDictamenCen',
        sortable: true,
        format: formatoBooleanoGridParametros,
      },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
    apvInstitucionesColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Institucion', field: 'nombre', sortable: true },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
    apvFormasPagoColumns: [
      { id: 'codigo', header: 'Código', field: 'codigo', sortable: true },
      { id: 'nombre', header: 'Forma', field: 'nombre', sortable: true },
      { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: formatoVigenteGridParametros },
    ],
  };
}
