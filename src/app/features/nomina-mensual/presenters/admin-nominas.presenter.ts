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
  NominaPeriodoResumen,
  TipoNomina,
} from '../models/nomina-periodo.models';
import { prioridadNomina } from '../rules/nomina-periodo-state.rules';

/** Clave de persistencia local de la grilla del Administrador. */
export const PERSISTENCIA_GRILLA_ADMIN = 'admin-nominas-grid-v1';

/** Columnas declarativas de la grilla. */
export const COLUMNAS_ADMIN_NOMINAS: DataGridColumn<NominaPeriodoResumen>[] = [
  {
    id: 'proximoPaso',
    header: 'Siguiente acción',
    field: 'proximoPaso',
    type: 'text',
    width: '9rem',
    minWidth: '8rem',
    priorityResponsive: 'secondary',
    filterable: false,
  },
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
    id: 'tipo',
    header: 'Tipo',
    field: 'tipo',
    type: 'text',
    width: '7rem',
    minWidth: '6rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'tertiary',
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
    id: 'segmentos',
    header: 'Segmentos',
    field: 'totalSegmentos',
    type: 'number',
    width: '6rem',
    minWidth: '5.5rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'incidencias',
    header: 'Incidencias',
    field: 'totalIncidenciasCriticas',
    type: 'number',
    width: '8rem',
    minWidth: '7rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
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
    header: '',
    width: '12rem',
    minWidth: '11rem',
    align: 'right',
    sortable: false,
    hideable: false,
    filterable: false,
    headerClass: 'text-right',
    cellClass: 'text-right',
  },
];

const ETIQUETAS_ESTADO: Record<EstadoNomina, string> = {
  borrador: 'Borrador',
  dotacion_generada: 'Dotación lista',
  en_revision: 'En revisión',
  calculada: 'Calculada',
  validada: 'Validada',
  aprobada: 'Aprobada',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
  anulada: 'Anulada',
};

const ETIQUETAS_TIPO: Record<TipoNomina, string> = {
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  semanal: 'Semanal',
  extraordinaria: 'Extraordinaria',
};

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
  const estadosPresentes = [...new Set(resumenes.map((r) => r.estado))];

  const filtroBusqueda: DataGridFilter<NominaPeriodoResumen> = {
    id: 'busqueda',
    label: 'Buscar',
    field: 'empresaNombre',
    type: 'text',
    operator: 'contains',
    matchMode: 'tokens',
    placeholder: 'Empresa, período o estado',
    predicate: (fila, value) => {
      const termino = String(value ?? '').trim().toLowerCase();
      if (!termino) return true;
      const tokens = termino.split(/\s+/).filter(Boolean);
      const texto = `${fila.empresaNombre} ${fila.periodo} ${ETIQUETAS_ESTADO[fila.estado]} ${ETIQUETAS_TIPO[fila.tipo]}`.toLowerCase();
      return tokens.every((token) => texto.includes(token));
    },
  };

  const filtros: DataGridFilter<NominaPeriodoResumen>[] = [filtroBusqueda];

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
        label: ETIQUETAS_ESTADO[estado],
        value: estado,
      })),
    });
  }

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
  busqueda?: string;
  periodo?: string;
  estado?: EstadoNomina;
  tipo?: TipoNomina;
  observaciones?: 'criticas' | 'advertencias' | 'limpias';
}

export function filtrarResumenes(
  resumenes: readonly NominaPeriodoResumen[],
  filtros: FiltroAdminNominasInput,
): NominaPeriodoResumen[] {
  return resumenes.filter((fila) => {
    if (filtros.periodo && fila.periodo !== filtros.periodo) return false;
    if (filtros.estado && fila.estado !== filtros.estado) return false;
    if (filtros.tipo && fila.tipo !== filtros.tipo) return false;

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
      const termino = filtros.busqueda.trim().toLowerCase();
      const tokens = termino.split(/\s+/).filter(Boolean);
      const texto = `${fila.empresaNombre} ${fila.periodo} ${ETIQUETAS_ESTADO[fila.estado]} ${ETIQUETAS_TIPO[fila.tipo]}`.toLowerCase();
      if (!tokens.every((token) => texto.includes(token))) {
        return false;
      }
    }

    return true;
  });
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
