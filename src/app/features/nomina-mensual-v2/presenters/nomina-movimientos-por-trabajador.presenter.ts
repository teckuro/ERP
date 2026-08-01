/**
 * Presenter de la grilla unificada del paso Movimientos (fila = trabajador).
 *
 * Sustituye al presenter "Configurados" (`nomina-movimientos-configurados.presenter.ts`)
 * que mostraba una fila por movimiento. El nuevo modelo agrupa por trabajador
 * y los conceptos quedan en el detalle expandible. Alineado con el principio
 * rector de la feature: "trabajo por excepción · el usuario NO revisa todos
 * los trabajadores".
 *
 * Fuente de filas: `NominaPeriodoService.listarMovimientosPorTrabajador()`.
 *
 * Preferir lenguaje RRHH. La columna primaria es "Trabajador" (no "ID"),
 * los subtotales son "$ Haberes" / "$ Descuentos" (no "monto agregado"), los
 * filtros agrupan multi-estado a nivel trabajador ("Con pendientes" en lugar
 * de "Estado individual del movimiento"). Origen e items planos quedan en el
 * detalle expandible del componente, no en el presenter.
 */

import type {
  DataGridColumn,
  DataGridFilter,
  DataGridFilterValue,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type {
  EstadoItemMovimiento,
  FilaTrabajadorMovimientos,
  FiltroMovimientosPorTrabajador,
  ItemMovimientoTrabajador,
  OrigenMovimientoTrabajador,
  ResumenMovimientosNomina,
} from '../../nomina-mensual/models/movimiento-nomina.models';

/** Clave de persistencia local de la grilla por trabajador. */
export const PERSISTENCIA_GRILLA_MOVIMIENTOS_POR_TRABAJADOR =
  'nomina-v2-movimientos-por-trabajador-grid-v1';

/**
 * Stats agregadas globales del paso. La franja del header las muestra con
 * formato sobrio (sin cards). Calculadas sobre `FilaTrabajadorMovimientos[]`
 * para evitar re-recorrer items.
 */
export interface StatsMovimientosPorTrabajador {
  trabajadoresConMovimientos: number;
  trabajadoresConPendientes: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalPendientes: number;
}

export function calcularStatsMovimientosPorTrabajador(
  filas: readonly FilaTrabajadorMovimientos[],
): StatsMovimientosPorTrabajador {
  const stats: StatsMovimientosPorTrabajador = {
    trabajadoresConMovimientos: 0,
    trabajadoresConPendientes: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalPendientes: 0,
  };
  for (const fila of filas) {
    if (fila.items.length > 0) stats.trabajadoresConMovimientos += 1;
    if (fila.cuentaPendientes > 0) stats.trabajadoresConPendientes += 1;
    stats.totalHaberes += fila.totalHaberes;
    stats.totalDescuentos += fila.totalDescuentos;
    stats.totalPendientes += fila.cuentaPendientes;
  }
  return stats;
}

/** BKL-02: stats globales desde RPC `resumen_movimientos_nomina` (sin recorrer filas). */
export function statsDesdeResumenMovimientos(
  resumen: ResumenMovimientosNomina,
): StatsMovimientosPorTrabajador {
  return {
    trabajadoresConMovimientos: resumen.trabajadoresConMovimientos,
    trabajadoresConPendientes: resumen.trabajadoresConPendientes,
    totalHaberes: resumen.totalHaberes,
    totalDescuentos: resumen.totalDescuentos,
    totalPendientes: resumen.totalPendientes,
  };
}

/**
 * BKL-02: traduce los valores de filtros del `app-data-grid` (modo servidor)
 * al filtro que consume la RPC `listar_movimientos_trabajadores_nomina`.
 */
export function filtroMovimientosDesdeGrid(
  values: Record<string, DataGridFilterValue>,
): FiltroMovimientosPorTrabajador {
  const filtro: FiltroMovimientosPorTrabajador = {};
  const buscar = values['buscar'];
  if (typeof buscar === 'string' && buscar.trim()) {
    filtro.busqueda = buscar.trim();
  }
  const estado = values['estado'];
  if (estado === 'con-pendientes' || estado === 'solo-aplicados' || estado === 'con-omitidos') {
    filtro.estado = estado;
  }
  const categoria = values['categoria'];
  if (
    categoria === 'con-haberes' ||
    categoria === 'con-descuentos' ||
    categoria === 'con-ausencias' ||
    categoria === 'con-informativos'
  ) {
    filtro.categoria = categoria;
  }
  return filtro;
}

// -----------------------------------------------------------------------------
// Etiquetas humanas (lenguaje RRHH)
// -----------------------------------------------------------------------------

export function etiquetaEstadoItem(estado: EstadoItemMovimiento): string {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente de cargar';
    case 'aplicado':
      return 'Aplicado este mes';
    case 'omitido':
      return 'Omitido este mes';
    default: {
      const _exhaustive: never = estado;
      return _exhaustive;
    }
  }
}

export function etiquetaOrigenItem(origen: OrigenMovimientoTrabajador): string {
  switch (origen) {
    case 'configurado':
      return 'Configurado en ficha';
    case 'manual':
      return 'Manual del período';
    default: {
      const _exhaustive: never = origen;
      return _exhaustive;
    }
  }
}

// -----------------------------------------------------------------------------
// Columnas
// -----------------------------------------------------------------------------

/**
 * Columnas declarativas para la grilla unificada por trabajador.
 *
 * 5 columnas + 1 de acciones (responsabilidad del componente vía template).
 * El badge ambar "N pendientes" al lado del nombre lo pinta el componente con
 * `appDataGridCell="trabajador"` para no inflar el presenter con HTML.
 */
export const COLUMNAS_MOVIMIENTOS_POR_TRABAJADOR: DataGridColumn<FilaTrabajadorMovimientos>[] = [
  {
    id: 'trabajador',
    header: 'Trabajador',
    field: 'nombre',
    type: 'text',
    minWidth: '16rem',
    priorityResponsive: 'primary',
    hideable: false,
    sortable: true,
    filterable: false,
  },
  {
    id: 'haberes',
    header: 'Haberes',
    field: 'totalHaberes',
    type: 'number',
    width: '9rem',
    minWidth: '7rem',
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
    minWidth: '7rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'ausencias',
    header: 'Ausencias',
    field: 'cuentaAusencias',
    type: 'number',
    width: '7rem',
    minWidth: '6rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'informativos',
    header: 'Informativos',
    field: 'cuentaInformativos',
    type: 'number',
    width: '7rem',
    minWidth: '6rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    type: 'text',
    width: '14rem',
    minWidth: '12rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'secondary',
    sortable: false,
    filterable: false,
    hideable: false,
  },
];

// -----------------------------------------------------------------------------
// Filtros
// -----------------------------------------------------------------------------

type FiltroEstadoValue = 'con-pendientes' | 'solo-aplicados' | 'con-omitidos' | 'todos';
type FiltroCategoriaValue =
  | 'con-haberes'
  | 'con-descuentos'
  | 'con-ausencias'
  | 'con-informativos'
  | 'todos';

export const FILTRO_ESTADO_OPCIONES: ReadonlyArray<{ label: string; value: FiltroEstadoValue }> = [
  { label: 'Con pendientes por cargar', value: 'con-pendientes' },
  { label: 'Solo con aplicados', value: 'solo-aplicados' },
  { label: 'Con omitidos este mes', value: 'con-omitidos' },
];

export const FILTRO_CATEGORIA_OPCIONES: ReadonlyArray<{
  label: string;
  value: FiltroCategoriaValue;
}> = [
  { label: 'Tienen haberes', value: 'con-haberes' },
  { label: 'Tienen descuentos', value: 'con-descuentos' },
  { label: 'Tienen ausencias', value: 'con-ausencias' },
  { label: 'Tienen informativos', value: 'con-informativos' },
];

function predicateEstado(fila: FilaTrabajadorMovimientos, valor: FiltroEstadoValue): boolean {
  switch (valor) {
    case 'con-pendientes':
      return fila.cuentaPendientes > 0;
    case 'solo-aplicados':
      return fila.cuentaAplicados > 0 && fila.cuentaPendientes === 0 && fila.cuentaOmitidos === 0;
    case 'con-omitidos':
      return fila.cuentaOmitidos > 0;
    case 'todos':
      return true;
    default: {
      const _exhaustive: never = valor;
      return _exhaustive;
    }
  }
}

function predicateCategoria(
  fila: FilaTrabajadorMovimientos,
  valor: FiltroCategoriaValue,
): boolean {
  switch (valor) {
    case 'con-haberes':
      return fila.totalHaberes > 0 || fila.items.some((i) => i.categoria === 'haber');
    case 'con-descuentos':
      return fila.totalDescuentos > 0 || fila.items.some((i) => i.categoria === 'descuento');
    case 'con-ausencias':
      return fila.cuentaAusencias > 0;
    case 'con-informativos':
      return fila.cuentaInformativos > 0;
    case 'todos':
      return true;
    default: {
      const _exhaustive: never = valor;
      return _exhaustive;
    }
  }
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Variante para RUTs y códigos: además de quitar tildes y bajar caja,
 * remueve puntos y guiones para que `25050001` matchee `25.050.001-7`.
 */
function normalizarTextoConRut(texto: string): string {
  return normalizarTexto(texto).replace(/[.\-]/g, '');
}

function predicateBuscar(fila: FilaTrabajadorMovimientos, valor: string): boolean {
  const query = valor.trim();
  if (!query) return true;
  const haystack = [
    fila.nombre,
    fila.rut,
    fila.cargo ?? '',
    fila.centroCosto ?? '',
    ...fila.items.map((i) => `${i.concepto} ${i.glosa ?? ''}`),
  ]
    .join(' ');
  const haystackNorm = normalizarTextoConRut(haystack);
  const tokens = normalizarTextoConRut(query).split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystackNorm.includes(t));
}

export function FILTROS_MOVIMIENTOS_POR_TRABAJADOR(
  _filas: readonly FilaTrabajadorMovimientos[],
): DataGridFilter<FilaTrabajadorMovimientos>[] {
  return [
    {
      id: 'estado',
      label: 'Estado',
      field: 'cuentaPendientes',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: FILTRO_ESTADO_OPCIONES.map((o) => ({ label: o.label, value: o.value })),
      predicate: (fila, valor) =>
        typeof valor === 'string'
          ? predicateEstado(fila, valor as FiltroEstadoValue)
          : true,
    },
    {
      id: 'categoria',
      label: 'Tipo de movimiento',
      field: 'totalHaberes',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: FILTRO_CATEGORIA_OPCIONES.map((o) => ({ label: o.label, value: o.value })),
      predicate: (fila, valor) =>
        typeof valor === 'string'
          ? predicateCategoria(fila, valor as FiltroCategoriaValue)
          : true,
    },
    {
      id: 'buscar',
      label: 'Buscar',
      field: 'nombre',
      type: 'text',
      placeholder: 'Nombre, RUT o concepto',
      matchMode: 'tokens',
      normalize: 'text',
      predicate: (fila, valor) =>
        typeof valor === 'string' ? predicateBuscar(fila, valor) : true,
    },
  ];
}

// -----------------------------------------------------------------------------
// Helpers de items (usados por el componente en el detalle expandible)
// -----------------------------------------------------------------------------

/** Filtra solo items pendientes (UI: contador para botón "Cargar N"). */
export function itemsPendientes(items: readonly ItemMovimientoTrabajador[]): ItemMovimientoTrabajador[] {
  return items.filter((i) => i.estado === 'pendiente');
}

/** Devuelve true si el item admite la acción "Eliminar" (solo manuales). */
export function itemAdmiteEliminacion(item: ItemMovimientoTrabajador): boolean {
  return item.origen === 'manual';
}
