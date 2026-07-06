/**
 * Presenter del Administrador de Nóminas (F2 — NOM-REBUILD-NOMINA-MENSUAL-01).
 *
 * Define columnas + filtros declarativos del `app-data-grid` para
 * `NominaPeriodoResumen[]`. Sin lógica de UI: solo describe la estructura.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import type {
  DataGridColumn,
  DataGridFilter,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type {
  EstadoNomina,
  NaturalezaNomina,
  NominaPeriodoResumen,
  TipoNomina,
} from '../models/nomina-periodo.models';
import {
  nominaRequiereAccion,
  prioridadNomina,
} from '../rules/nomina-periodo-state.rules';

/** Clave de persistencia local de la grilla del Administrador. */
export const PERSISTENCIA_GRILLA_ADMIN = 'admin-nominas-grid-v2';

/**
 * Vista operativa visible en la grilla. Se reduce a 3 opciones para evitar
 * solapamiento con el filtro granular `Estado`:
 *
 *  - `requiere-accion`: nominas que requieren intervencion del RRHH (estado +
 *    flag `requiereAccion`).
 *  - `con-criticas`: nominas con incidencias criticas (independiente del estado).
 *  - `todas`: sin filtro.
 *
 * Valores legacy (`abiertas`, `en-calculo`, `pendientes-cierre`) se mantienen
 * solo como compatibilidad en el predicado (`coincideVistaOperativa`), que
 * degrada a "todas" si llega un valor desconocido desde `localStorage`.
 */
export type VistaOperativaAdminNominas =
  | 'requiere-accion'
  | 'con-criticas'
  | 'todas';

/**
 * Columnas declarativas de la grilla.
 *
 * Orden y jerarquía simplificados en F04/F05 (NOIA-ADM-NOM-BANDEJA-02):
 * `Período · Empresa · Estado · Siguiente acción · Trabajadores · Actualizada · Acciones`.
 *
 * Las columnas `Tipo`, `Segmentos` e `Incidencias` se quitaron de la
 * grilla principal para reducir ruido:
 *   - `tipo`: siempre mensual en el piloto (se mantendrá filtro lateral si
 *     hay más tipos en BD).
 *   - `segmentos`: dato técnico interno, no operativo para RRHH.
 *   - `incidencias`: las críticas suben al chip de "Siguiente acción" y
 *     todos los conteos quedan visibles en el modal de resumen.
 */
export const COLUMNAS_ADMIN_NOMINAS: DataGridColumn<NominaPeriodoResumen>[] = [
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
    width: '22%',
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
    id: 'proximoPaso',
    header: 'Siguiente acción',
    field: 'proximoPaso',
    type: 'text',
    width: '11rem',
    minWidth: '10rem',
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
    id: 'actualizada',
    header: 'Actualizada',
    field: 'updatedAt',
    type: 'date',
    width: '7rem',
    minWidth: '6.5rem',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    width: '11rem',
    minWidth: '10.5rem',
    align: 'center',
    sortable: false,
    hideable: false,
    filterable: false,
    headerClass: 'text-center font-semibold',
    cellClass: 'text-center',
  },
];

/**
 * Etiqueta administrativa por estado de nómina (lenguaje RRHH).
 *
 * Fuente única para todos los chips y banners que exponen un `EstadoNomina`
 * al usuario; previene enums crudos como `dotacion_generada` en la UI.
 */
export const ETIQUETAS_ESTADO_NOMINA: Record<EstadoNomina, string> = {
  borrador: 'Borrador',
  dotacion_generada: 'Dotación lista',
  en_revision: 'En revisión',
  calculada: 'Calculada',
  validada: 'Validada',
  aprobada: 'Aprobada',
  liquidada: 'Liquidada',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
  anulada: 'Anulada',
};

/**
 * Traduce un `EstadoNomina` a etiqueta RRHH legible. Fallback al enum crudo
 * si el estado es desconocido (caso defensivo de migraciones tardías).
 */
export function estadoNominaToLabel(estado: EstadoNomina | null | undefined): string {
  if (!estado) return '';
  return ETIQUETAS_ESTADO_NOMINA[estado] ?? String(estado);
}

const ETIQUETAS_TIPO: Record<TipoNomina, string> = {
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  semanal: 'Semanal',
  extraordinaria: 'Extraordinaria',
};

const ETIQUETAS_NATURALEZA: Record<NaturalezaNomina, string> = {
  liquidacion_legal: 'Liquidación legal',
  anticipo: 'Anticipo',
  pago_extraordinario: 'Pago extraordinario',
  rectificacion: 'Rectificación',
};

function textoBusquedaFila(fila: NominaPeriodoResumen): string {
  return normalizarTextoBusqueda([
    fila.empresaNombre,
    fila.periodo,
    ETIQUETAS_ESTADO_NOMINA[fila.estado],
    ETIQUETAS_TIPO[fila.tipo],
    ETIQUETAS_NATURALEZA[fila.naturaleza],
  ].join(' '));
}

function normalizarTextoBusqueda(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Construye los filtros del data-grid a partir del conjunto cargado.
 *
 * Búsqueda libre (empresa + período) + selects derivados de los datos
 * (período, estado, tipo) + toggle "con incidencias".
 */
export function crearFiltrosAdminNominas(
  resumenes: readonly NominaPeriodoResumen[],
): DataGridFilter<NominaPeriodoResumen>[] {
  const periodos = [...new Set(resumenes.map((r) => r.periodo))].sort().reverse();
  const tipos = [...new Set(resumenes.map((r) => r.tipo))];
  const naturalezas = [...new Set(resumenes.map((r) => r.naturaleza))];
  const estadosPresentes = [...new Set(resumenes.map((r) => r.estado))];
  const contarVista = (vista: VistaOperativaAdminNominas): number =>
    resumenes.filter((fila) => coincideVistaOperativa(fila, vista)).length;

  const filtroVistaOperativa: DataGridFilter<NominaPeriodoResumen> = {
    id: 'vistaOperativa',
    label: 'Vista operativa',
    field: 'estado',
    type: 'select',
    operator: 'equals',
    initialValue: 'requiere-accion',
    emptyLabel: 'Todas las nóminas',
    options: [
      { label: `Requieren acción (${contarVista('requiere-accion')})`, value: 'requiere-accion' },
      { label: `Con críticas (${contarVista('con-criticas')})`, value: 'con-criticas' },
      { label: `Todas (${contarVista('todas')})`, value: 'todas' },
    ],
    predicate: (fila, value) =>
      coincideVistaOperativa(fila, String(value ?? '') as VistaOperativaAdminNominas),
  };

  const filtroBusqueda: DataGridFilter<NominaPeriodoResumen> = {
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
      const tokens = normalizarTextoBusqueda(termino).split(/\s+/).filter(Boolean);
      const texto = textoBusquedaFila(fila);
      return tokens.every((token) => texto.includes(token));
    },
  };

  const filtros: DataGridFilter<NominaPeriodoResumen>[] = [
    filtroVistaOperativa,
    filtroBusqueda,
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
        label: ETIQUETAS_ESTADO_NOMINA[estado],
        value: estado,
      })),
    });
  }

  // Filtro "Tipo" solo si la BD muestra más de un tipo. En el piloto mensual
  // no aparece para no inflar la barra de filtros con una opción única.
  if (tipos.length > 1) {
    filtros.push({
      id: 'tipo',
      label: 'Tipo',
      field: 'tipo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos los tipos',
      options: tipos.map((tipo) => ({
        label: ETIQUETAS_TIPO[tipo],
        value: tipo,
      })),
    });
  }

  if (naturalezas.length > 1) {
    filtros.push({
      id: 'naturaleza',
      label: 'Naturaleza',
      field: 'naturaleza',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todas las naturalezas',
      options: naturalezas.map((naturaleza) => ({
        label: ETIQUETAS_NATURALEZA[naturaleza],
        value: naturaleza,
      })),
    });
  }

  filtros.push({
    id: 'conIncidencias',
    label: 'Incidencias',
    field: 'totalIncidenciasCriticas',
    type: 'select',
    operator: 'equals',
    emptyLabel: 'Todas',
    options: [
      { label: 'Solo con críticas', value: 'criticas' },
      { label: 'Solo con advertencias', value: 'advertencias' },
      { label: 'Sin observaciones', value: 'limpias' },
    ],
    predicate: (fila, value) => {
      const valor = String(value ?? '').trim();
      if (!valor) return true;
      if (valor === 'criticas') return fila.totalIncidenciasCriticas > 0;
      if (valor === 'advertencias') {
        return fila.totalIncidenciasCriticas === 0 && fila.totalAdvertencias > 0;
      }
      if (valor === 'limpias') {
        return fila.totalIncidenciasCriticas === 0 && fila.totalAdvertencias === 0;
      }
      return true;
    },
  });

  return filtros;
}

/**
 * Predicado puro para tests: replica las reglas de los filtros sin pasar
 * por el data-grid.
 */
export interface FiltroAdminNominasInput {
  vistaOperativa?: VistaOperativaAdminNominas;
  busqueda?: string;
  periodo?: string;
  estado?: EstadoNomina;
  tipo?: TipoNomina;
  naturaleza?: NaturalezaNomina;
  observaciones?: 'criticas' | 'advertencias' | 'limpias';
}

export function filtrarResumenes(
  resumenes: readonly NominaPeriodoResumen[],
  filtros: FiltroAdminNominasInput,
): NominaPeriodoResumen[] {
  return resumenes.filter((fila) => {
    if (filtros.vistaOperativa && !coincideVistaOperativa(fila, filtros.vistaOperativa)) {
      return false;
    }
    if (filtros.periodo && fila.periodo !== filtros.periodo) return false;
    if (filtros.estado && fila.estado !== filtros.estado) return false;
    if (filtros.tipo && fila.tipo !== filtros.tipo) return false;
    if (filtros.naturaleza && fila.naturaleza !== filtros.naturaleza) return false;

    if (filtros.observaciones === 'criticas' && fila.totalIncidenciasCriticas === 0) {
      return false;
    }
    if (
      filtros.observaciones === 'advertencias'
      && (fila.totalIncidenciasCriticas > 0 || fila.totalAdvertencias === 0)
    ) {
      return false;
    }
    if (
      filtros.observaciones === 'limpias'
      && (fila.totalIncidenciasCriticas > 0 || fila.totalAdvertencias > 0)
    ) {
      return false;
    }

    if (filtros.busqueda && filtros.busqueda.trim()) {
      const termino = filtros.busqueda.trim();
      const tokens = normalizarTextoBusqueda(termino).split(/\s+/).filter(Boolean);
      const texto = textoBusquedaFila(fila);
      if (!tokens.every((token) => texto.includes(token))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Predicado para la vista operativa.
 *
 * Acepta valores legacy (`abiertas`, `en-calculo`, `pendientes-cierre`) que
 * pueden venir del `localStorage` persistido en versiones anteriores. En esos
 * casos degrada a "todas" para no romper la sesion del usuario.
 */
export function coincideVistaOperativa(
  fila: NominaPeriodoResumen,
  vista: VistaOperativaAdminNominas | '',
): boolean {
  if (!vista || vista === 'todas') return true;
  if (vista === 'requiere-accion') {
    return nominaRequiereAccion(fila.estado) && (fila.requiereAccion ?? true);
  }
  if (vista === 'con-criticas') {
    return fila.totalIncidenciasCriticas > 0;
  }
  return true;
}

export function ordenarResumenesOperativos(
  resumenes: readonly NominaPeriodoResumen[],
): NominaPeriodoResumen[] {
  return [...resumenes].sort((a, b) => {
    const prioridad = prioridadNomina(a) - prioridadNomina(b);
    if (prioridad !== 0) return prioridad;
    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  });
}
