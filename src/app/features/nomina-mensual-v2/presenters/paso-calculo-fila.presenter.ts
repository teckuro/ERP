/**
 * Presenter del paso "Cálculo" del Generador V2.
 *
 * Convierte una `LiquidacionCalculada` del motor V1 en un viewmodel listo
 * para la grilla unificada (fila por trabajador) con desglose expandible.
 *
 * Preferir lenguaje RRHH. No exponer códigos técnicos del motor en
 * los strings visibles; en su lugar, etiquetar cada concepto y cada bloque
 * en español operativo. La trazabilidad técnica completa queda fuera de
 * este presenter (vive en la liquidación cruda para el modal de
 * previsualización).
 *
 * Sin side-effects ni dependencias de Angular: función pura testeable.
 */

import type {
  DataGridColumn,
  DataGridFilter,
  DataGridFilterValue,
  DataGridServerQuery,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type { FilaCalculoTrabajadorListado, ResumenCalculoNomina } from '../../nomina-mensual/models/nomina-periodo.models';
import type {
  LineaLiquidacionCalculada,
  LiquidacionCalculada,
  MotorCalculoEstadoTrabajador,
} from '../../nomina-mensual/models/proceso-mensual.model';

/** Clave de persistencia local de la grilla del paso Cálculo. */
export const PERSISTENCIA_GRILLA_CALCULO = 'nomina-v2-calculo-grid-v2';

// -----------------------------------------------------------------------------
// Viewmodel
// -----------------------------------------------------------------------------

/**
 * Una línea individual del desglose presentada en el detalle expandible.
 *
 * No es un `LineaLiquidacionCalculada` directo: añade `tasa`, `base` y
 * `etiquetaImponibilidad` que permiten renderizar la fórmula simplificada
 * sin obligar al template a buscar en arrays paralelos.
 */
export interface LineaDesgloseCalculo {
  codigo: string;
  descripcion: string;
  monto: number;
  /**
   * Etiqueta del comportamiento tributario/previsional para chip a la
   * derecha: `Imponible`, `No imponible`, `Tributable`, `No tributable`.
   * Se calcula a partir de `imponible`/`tributable` de la línea origen.
   */
  etiqueta: 'imponible' | 'no_imponible' | 'tributable' | 'no_tributable' | null;
  /** Tasa aplicada (ej. 0.1144 para AFP Cuprum). Null si no aplica. */
  tasa: number | null;
  /** Base sobre la que se aplicó la tasa. Null si no aplica. */
  base: number | null;
}

export interface BloqueBaseLegal {
  baseImponiblePrevisional: number;
  baseTributable: number;
}

export interface BloqueCargosEmpleador {
  sis: number;
  sanna: number;
  ley16744: number;
}

/** Estado-chip presentable al usuario (lenguaje RRHH). */
export type EstadoCalculoChip = {
  variant: 'ok' | 'aviso' | 'bloqueo';
  label: string;
};

/** Una fila de la grilla del paso Cálculo. */
export interface FilaCalculoTrabajador {
  trabajadorId: string;
  idPersona: number;
  rut: string;
  nombre: string;
  /** Etiqueta humana de AFP del trabajador (ej. "Cuprum"). */
  afp: string | null;
  /** Etiqueta humana de salud del trabajador (ej. "Fonasa"). */
  salud: string | null;
  /** Tipo de contrato humano (ej. "Indefinido"). */
  tipoContrato: string | null;
  /** Sueldo base con que entró al cálculo. */
  sueldoBase: number;

  totalHaberes: number;
  totalDescuentos: number;
  liquidoAPago: number;

  bases: BloqueBaseLegal;
  haberes: LineaDesgloseCalculo[];
  descuentosLegales: LineaDesgloseCalculo[];
  descuentosVoluntarios: LineaDesgloseCalculo[];
  cargosEmpleador: BloqueCargosEmpleador;

  estado: EstadoCalculoChip;
  tieneAdvertencias: boolean;
  tieneBloqueos: boolean;
  cuentaIssues: number;

  /** Referencia inmutable a la liquidación cruda para el modal de preview. */
  origen?: LiquidacionCalculada;
  /** BKL-09: fila resumida sin desglose hasta expandir o abrir preview. */
  detalleCargado?: boolean;
  idCalculoTrabajador?: number;
}

/**
 * Stats agregadas para el aside del header (estilo Movimientos).
 *
 * Se calculan en el componente con `computed(...)` a partir del resultado del
 * motor; este presenter solo provee el tipo y un helper.
 */
export interface StatsCalculoCabecera {
  trabajadoresCalculados: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquido: number;
  conAdvertencias: number;
  conBloqueos: number;
}

export function calcularStatsCalculo(
  liquidaciones: readonly LiquidacionCalculada[],
): StatsCalculoCabecera {
  const stats: StatsCalculoCabecera = {
    trabajadoresCalculados: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    conAdvertencias: 0,
    conBloqueos: 0,
  };
  for (const liq of liquidaciones) {
    if (liq.estado !== 'con_bloqueos') stats.trabajadoresCalculados += 1;
    if (liq.estado === 'con_advertencias') stats.conAdvertencias += 1;
    if (liq.estado === 'con_bloqueos') stats.conBloqueos += 1;
    stats.totalHaberes += liq.totalHaberes;
    stats.totalDescuentos += liq.totalDescuentos;
    stats.totalLiquido += liq.liquidoAPago;
  }
  return stats;
}

/** BKL-09: stats desde cabecera persistida (sin liquidaciones en memoria). */
export function statsDesdeResumenCalculo(resumen: ResumenCalculoNomina | null): StatsCalculoCabecera {
  if (!resumen) {
    return {
      trabajadoresCalculados: 0,
      totalHaberes: 0,
      totalDescuentos: 0,
      totalLiquido: 0,
      conAdvertencias: 0,
      conBloqueos: 0,
    };
  }
  return {
    trabajadoresCalculados: resumen.trabajadoresCalculados,
    totalHaberes: resumen.totalHaberes,
    totalDescuentos: resumen.totalDescuentos,
    totalLiquido: resumen.totalLiquido,
    conAdvertencias: resumen.conAdvertencias,
    conBloqueos: resumen.conBloqueos,
  };
}

export function presentarFilaCalculoListado(fila: FilaCalculoTrabajadorListado): FilaCalculoTrabajador {
  const estadoMotor = fila.estado as MotorCalculoEstadoTrabajador;
  const tieneBloqueos = estadoMotor === 'con_bloqueos';
  const tieneAdvertencias = estadoMotor === 'con_advertencias';
  return {
    trabajadorId: fila.trabajadorId,
    idPersona: fila.idPersona,
    rut: fila.rut,
    nombre: fila.nombre,
    afp: null,
    salud: null,
    tipoContrato: null,
    sueldoBase: fila.sueldoBase,
    totalHaberes: fila.totalHaberes,
    totalDescuentos: fila.totalDescuentos,
    liquidoAPago: fila.liquidoAPago,
    bases: {
      baseImponiblePrevisional: fila.baseImponiblePrevisional,
      baseTributable: fila.baseTributable,
    },
    haberes: [],
    descuentosLegales: [],
    descuentosVoluntarios: [],
    cargosEmpleador: {
      sis: fila.cotizacionSis,
      sanna: fila.cotizacionSanna,
      ley16744: fila.cotizacionLey16744,
    },
    estado: presentarEstadoChip(estadoMotor),
    tieneAdvertencias,
    tieneBloqueos,
    cuentaIssues: fila.cuentaIssues,
    detalleCargado: fila.detalleCargado,
    idCalculoTrabajador: fila.idCalculoTrabajador,
  };
}

export function filtroCalculoDesdeGrid(
  filterValues: DataGridServerQuery['filterValues'],
): { busqueda?: string; estado?: string } {
  const busquedaRaw = filterValues['busqueda'];
  const estadoRaw = filterValues['estado'];
  const busqueda =
    typeof busquedaRaw === 'string' && busquedaRaw.trim().length > 0
      ? busquedaRaw.trim()
      : undefined;
  const estado =
    typeof estadoRaw === 'string' && estadoRaw.length > 0 ? estadoRaw : undefined;
  return { busqueda, estado };
}

// -----------------------------------------------------------------------------
// Mapeo principal
// -----------------------------------------------------------------------------

/** Contexto adicional opcional (etiquetas humanas resueltas desde catálogos). */
export interface ContextoFilaCalculo {
  afp?: string | null;
  salud?: string | null;
  tipoContrato?: string | null;
  sueldoBase?: number | null;
}

/**
 * Convierte una liquidación cruda del motor en una `FilaCalculoTrabajador`
 * lista para la grilla.
 */
export function presentarFilaCalculo(
  liq: LiquidacionCalculada,
  ctx: ContextoFilaCalculo = {},
): FilaCalculoTrabajador {
  const sueldoBase =
    ctx.sueldoBase ?? liq.haberesImponibles.find((h) => h.codigo === 'SUELDO_BASE')?.monto ?? 0;

  const haberes: LineaDesgloseCalculo[] = [
    ...liq.haberesImponibles.map((linea) => mapearLineaHaber(linea, true)),
    ...liq.haberesNoImponibles.map((linea) => mapearLineaHaber(linea, false)),
  ];

  const descuentosLegales = mapearDescuentosLegales(liq);
  const descuentosVoluntarios = liq.descuentosVoluntarios.map(mapearLineaDescuento);

  const cuentaIssues = liq.issues.length;
  const tieneBloqueos = liq.estado === 'con_bloqueos';
  const tieneAdvertencias = liq.estado === 'con_advertencias';

  return {
    trabajadorId: String(liq.idPersona),
    idPersona: liq.idPersona,
    rut: liq.rut,
    nombre: liq.nombreCompleto || liq.rut,
    afp: ctx.afp ?? null,
    salud: ctx.salud ?? null,
    tipoContrato: ctx.tipoContrato ?? null,
    sueldoBase,
    totalHaberes: liq.totalHaberes,
    totalDescuentos: liq.totalDescuentos,
    liquidoAPago: liq.liquidoAPago,
    bases: {
      baseImponiblePrevisional: liq.baseImponiblePrevisional,
      baseTributable: liq.baseTributable,
    },
    haberes,
    descuentosLegales,
    descuentosVoluntarios,
    cargosEmpleador: {
      sis: liq.cotizacionSis,
      sanna: liq.cotizacionSanna,
      ley16744: liq.cotizacionLey16744,
    },
    estado: presentarEstadoChip(liq.estado),
    tieneAdvertencias,
    tieneBloqueos,
    cuentaIssues,
    origen: liq,
  };
}

function mapearLineaHaber(
  linea: LineaLiquidacionCalculada,
  imponibleDefault: boolean,
): LineaDesgloseCalculo {
  const imponible = linea.imponible ?? imponibleDefault;
  const tributable = linea.tributable;
  let etiqueta: LineaDesgloseCalculo['etiqueta'] = imponible ? 'imponible' : 'no_imponible';
  if (tributable === false) etiqueta = 'no_tributable';
  return {
    codigo: linea.codigo,
    descripcion: linea.descripcion,
    monto: linea.monto,
    etiqueta,
    tasa: null,
    base: null,
  };
}

function mapearLineaDescuento(linea: LineaLiquidacionCalculada): LineaDesgloseCalculo {
  return {
    codigo: linea.codigo,
    descripcion: linea.descripcion,
    monto: linea.monto,
    etiqueta: null,
    tasa: null,
    base: null,
  };
}

/**
 * Para los descuentos legales, además del nombre y monto, agregamos la
 * tasa y base implícitas a partir de los campos directos de
 * `LiquidacionCalculada` (cotizacionAfp, cotizacionSalud, ...). Si el
 * motor agrega más conceptos legales (p.ej. impuesto único, aportes
 * solidarios) los incluimos preservando el orden del motor.
 */
function mapearDescuentosLegales(liq: LiquidacionCalculada): LineaDesgloseCalculo[] {
  const baseImp = liq.baseImponiblePrevisional;
  const baseTrib = liq.baseTributable;

  return liq.descuentosLegales.map<LineaDesgloseCalculo>((linea) => {
    const monto = linea.monto;
    let tasa: number | null = null;
    let base: number | null = null;
    switch (linea.codigo) {
      case 'AFP':
        tasa = baseImp > 0 ? round4(monto / baseImp) : null;
        base = baseImp;
        break;
      case 'SALUD':
        tasa = baseImp > 0 ? round4(monto / baseImp) : null;
        base = baseImp;
        break;
      case 'AFC':
        // AFC se calcula sobre min(baseImp, topeCesantia). Usamos baseImp
        // como aproximación visible (la tasa efectiva queda correcta).
        tasa = baseImp > 0 ? round4(monto / baseImp) : null;
        base = baseImp;
        break;
      case 'IMPUESTO_UNICO':
        tasa = baseTrib > 0 ? round4(monto / baseTrib) : null;
        base = baseTrib;
        break;
      default:
        // Otros descuentos legales (no estándar): mostrar sin fórmula.
        break;
    }
    return {
      codigo: linea.codigo,
      descripcion: linea.descripcion,
      monto,
      etiqueta: null,
      tasa,
      base,
    };
  });
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

// -----------------------------------------------------------------------------
// Etiquetas humanas (lenguaje RRHH)
// -----------------------------------------------------------------------------

export function presentarEstadoChip(estado: MotorCalculoEstadoTrabajador): EstadoCalculoChip {
  switch (estado) {
    case 'calculado_preliminar':
      return { variant: 'ok', label: 'Calculado' };
    case 'con_advertencias':
      return { variant: 'aviso', label: 'Con advertencias' };
    case 'con_bloqueos':
      return { variant: 'bloqueo', label: 'Con bloqueos' };
    default: {
      const _exhaustive: never = estado;
      return _exhaustive;
    }
  }
}

export function etiquetaImponibilidad(etiqueta: LineaDesgloseCalculo['etiqueta']): string | null {
  switch (etiqueta) {
    case 'imponible':
      return 'Imponible';
    case 'no_imponible':
      return 'No imponible';
    case 'tributable':
      return 'Tributable';
    case 'no_tributable':
      return 'No tributable';
    case null:
      return null;
    default: {
      const _exhaustive: never = etiqueta;
      return _exhaustive;
    }
  }
}

// -----------------------------------------------------------------------------
// Columnas y filtros para la grilla
// -----------------------------------------------------------------------------

export const COLUMNAS_GRILLA_CALCULO: DataGridColumn<FilaCalculoTrabajador>[] = [
  {
    id: 'trabajador',
    header: 'Trabajador',
    field: 'nombre',
    type: 'text',
    minWidth: '18rem',
    priorityResponsive: 'primary',
    hideable: false,
    sortable: true,
    filterable: false,
  },
  {
    id: 'afp',
    header: 'AFP',
    field: 'afp',
    type: 'text',
    width: '7rem',
    minWidth: '6rem',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'salud',
    header: 'Salud',
    field: 'salud',
    type: 'text',
    width: '7rem',
    minWidth: '6rem',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'haberes',
    header: 'Haberes',
    field: 'totalHaberes',
    type: 'number',
    width: '9rem',
    minWidth: '8rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'descuentos',
    header: 'Descuentos',
    field: 'totalDescuentos',
    type: 'number',
    width: '9rem',
    minWidth: '8rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'liquido',
    header: 'Líquido',
    field: 'liquidoAPago',
    type: 'number',
    width: '10rem',
    minWidth: '9rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'primary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'estado',
    header: 'Estado',
    field: 'tieneAdvertencias',
    type: 'text',
    width: '9rem',
    minWidth: '8rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    sortable: false,
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    type: 'text',
    width: '4rem',
    minWidth: '4rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    sortable: false,
    filterable: false,
    hideable: false,
  },
];

type FiltroEstadoCalculoValue = 'ok' | 'aviso' | 'bloqueo';

const OPCIONES_FILTRO_ESTADO_CALCULO: ReadonlyArray<{
  label: string;
  value: FiltroEstadoCalculoValue;
}> = [
  { label: 'Calculado', value: 'ok' },
  { label: 'Con advertencias', value: 'aviso' },
  { label: 'Con bloqueos', value: 'bloqueo' },
];

function predicadoEstadoCalculo(
  fila: FilaCalculoTrabajador,
  valor: FiltroEstadoCalculoValue,
): boolean {
  return fila.estado.variant === valor;
}

function predicadoBusquedaTrabajador(
  fila: FilaCalculoTrabajador,
  valor: DataGridFilterValue,
): boolean {
  const termino = String(valor ?? '').trim().toLowerCase();
  if (!termino) return true;
  const tokens = termino.split(/\s+/).filter(Boolean);
  const texto = `${fila.nombre} ${fila.rut}`.toLowerCase();
  return tokens.every((token) => texto.includes(token));
}

export function construirFiltrosCalculo(
  _filas: readonly FilaCalculoTrabajador[],
): DataGridFilter<FilaCalculoTrabajador>[] {
  return [
    {
      id: 'busqueda',
      label: 'Trabajador',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      matchMode: 'tokens',
      placeholder: 'Nombre o RUT',
      predicate: (row, valor) => predicadoBusquedaTrabajador(row, valor),
    },
    {
      id: 'estado',
      label: 'Estado',
      field: 'estado',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: OPCIONES_FILTRO_ESTADO_CALCULO.map((o) => ({ label: o.label, value: o.value })),
      predicate: (row, valor) => {
        if (typeof valor !== 'string' || valor.length === 0) return true;
        return predicadoEstadoCalculo(row, valor as FiltroEstadoCalculoValue);
      },
    },
  ];
}
