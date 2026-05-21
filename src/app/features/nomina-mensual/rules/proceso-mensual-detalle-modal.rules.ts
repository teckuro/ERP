import type {
  DetalleOperativoTab,
  FilaDetalleMovimientoNomina,
  FilaDetalleRecurrenteNomina,
  ItemSeguimientoNomina,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type {
  IncidenciaPeriodo,
  IncidenciasPeriodoView,
} from './proceso-mensual-incidencias-periodo.rules';
import { limpiarCopyTecnicoNomina } from './proceso-mensual-copy-limpio.rules';
import {
  etiquetaAmbitoIncidencia,
} from './proceso-mensual-incidencias-periodo.rules';

export const REVISION_LISTA_MAX_FILAS = 8;

const LISTA_EDITORIAL_MAX_FILAS = REVISION_LISTA_MAX_FILAS;

export function debeUsarDataGridRevision(cantidadFilas: number): boolean {
  return cantidadFilas > REVISION_LISTA_MAX_FILAS;
}
const LISTA_RESUMEN_MAX_INCIDENCIAS = 16;

export const DETALLE_REVISION_MODAL_TITULO = 'Revisión de nómina mensual';

export const RUTA_LIQUIDACIONES_REMUNERACIONES = '/remuneraciones/liquidaciones';

export type DetalleRevisionTabSeveridad = 'neutral' | 'atencion' | 'bloqueo' | 'listo';

export type DetalleRevisionFooterAccion =
  | { kind: 'cerrar'; label: string }
  | { kind: 'tab'; label: string; tab: DetalleOperativoTab }
  | { kind: 'ruta'; label: string; ruta: string };

export interface DetalleRevisionTabMeta {
  id: DetalleOperativoTab;
  label: string;
  severidad: DetalleRevisionTabSeveridad;
  indicador: string | null;
}

export type ExpedienteRevisionCta =
  | { kind: 'none' }
  | { kind: 'tab'; label: string; tab: DetalleOperativoTab }
  | { kind: 'confirmar_nomina'; label: string; disabled: boolean; disabledReason: string | null }
  | { kind: 'navegar'; label: string; ruta: string; disabled: boolean; disabledReason: string | null };

export function buildDetalleRevisionModalLead(input: {
  periodoEtiqueta: string;
  estadoTitulo: string;
}): string {
  return `${input.periodoEtiqueta} · ${input.estadoTitulo} · Revise trabajadores, parámetros y movimientos antes de confirmar la nómina.`;
}

export interface DetalleRevisionListaItem {
  titulo: string;
  descripcion: string;
  estado: string;
  estadoClase: string;
  contexto?: string;
  accion?: string;
  ruta?: string;
  accionTab?: DetalleOperativoTab;
}

export interface DetalleRevisionTabPanel {
  lead: string;
  tituloParametros: string;
  accionParametros?: {
    label: string;
    ruta?: string;
    accionTab?: DetalleOperativoTab;
  };
  emptyTitulo: string;
  emptyDescripcion: string;
  usarGridTrabajadores: boolean;
  usarGridMovimientos: boolean;
  usarGridRecurrentes: boolean;
  usarGridResultado: boolean;
  gridConFiltros: boolean;
  listaParametros: DetalleRevisionListaItem[];
  listaObservaciones: DetalleRevisionListaItem[];
  listaMovimientos: DetalleRevisionListaItem[];
  listaRecurrentes: DetalleRevisionListaItem[];
  listaResultadoSeguimiento: DetalleRevisionListaItem[];
  enlaceResumenIncidencias?: { label: string; count: number };
}

export function humanizarDetalleRevisionTexto(texto: string | null | undefined): string {
  return limpiarCopyTecnicoNomina(texto);
}

export function buildDetalleRevisionHeaderLead(input: {
  tab: DetalleOperativoTab;
  periodoEtiqueta: string;
  estadoTitulo: string;
}): string {
  if (input.tab === 'resumen') {
    return `${input.periodoEtiqueta} · Revise la versión del período y las observaciones antes de confirmar.`;
  }
  switch (input.tab) {
    case 'trabajadores':
      return 'La corrección por trabajador se hace en el panel del período. Aquí solo consulta el resumen agregado.';
    case 'parametros':
      return 'Revise catálogos y valores del período que condicionan la nómina mensual.';
    case 'movimientos_recurrentes':
      return 'Revise movimientos del mes y asignaciones recurrentes considerados.';
    case 'resultado':
      return 'Revise totales preliminares por trabajador de la versión en revisión.';
    default:
      return `${input.periodoEtiqueta} · ${input.estadoTitulo}`;
  }
}

function etiquetaSeveridadIncidencia(severidad: IncidenciaPeriodo['severidad']): string {
  switch (severidad) {
    case 'bloqueo':
      return 'Bloqueo';
    case 'advertencia':
      return 'Advertencia';
    case 'info':
    default:
      return 'Información';
  }
}

function claseSeveridadIncidencia(severidad: IncidenciaPeriodo['severidad']): string {
  switch (severidad) {
    case 'bloqueo':
      return 'payroll-state-chip payroll-state-chip--danger';
    case 'advertencia':
      return 'payroll-state-chip payroll-state-chip--warning';
    case 'info':
    default:
      return 'payroll-state-chip payroll-state-chip--info';
  }
}

function listaItemDesdeIncidencia(inc: IncidenciaPeriodo): DetalleRevisionListaItem {
  const item: DetalleRevisionListaItem = {
    titulo: humanizarDetalleRevisionTexto(inc.titulo),
    descripcion: humanizarDetalleRevisionTexto(inc.detalle),
    estado: etiquetaSeveridadIncidencia(inc.severidad),
    estadoClase: claseSeveridadIncidencia(inc.severidad),
    contexto: etiquetaAmbitoIncidencia(inc.ambito),
  };
  if (inc.accion?.tipo === 'ruta' && inc.accion.destino) {
    item.accion = humanizarDetalleRevisionTexto(inc.accion.label);
    item.ruta = inc.accion.destino;
  } else if (inc.accion?.tipo === 'tab' && inc.accion.destino) {
    item.accion = humanizarDetalleRevisionTexto(inc.accion.label);
    item.accionTab = inc.accion.destino as DetalleOperativoTab;
  } else if (inc.accion?.tipo === 'cerrar') {
    // Cierre del modal: solo el control X del encabezado.
  } else if (inc.accion?.label) {
    item.accion = humanizarDetalleRevisionTexto(inc.accion.label);
  }
  return item;
}

export function incidenciasToDetalleRevisionLista(
  incidencias: IncidenciaPeriodo[],
  cap = LISTA_RESUMEN_MAX_INCIDENCIAS,
): DetalleRevisionListaItem[] {
  return incidencias.slice(0, cap).map(listaItemDesdeIncidencia);
}

export function buildDetalleRevisionObservacionesLista(input: {
  incidencias: IncidenciasPeriodoView;
}): DetalleRevisionListaItem[] {
  return incidenciasToDetalleRevisionLista(input.incidencias.todas);
}

export function buildEnlaceResumenIncidencias(count: number): { label: string; count: number } | undefined {
  if (count <= 0) return undefined;
  return {
    label: count === 1 ? 'Ver en resumen (1)' : `Ver en resumen (${count})`,
    count,
  };
}

function textoPareceRevisado(texto: string): boolean {
  const normalizado = texto.toLowerCase();
  return normalizado.includes('revisad') || normalizado.includes('listo') || normalizado.includes('completo');
}

export function mapParametroItemsParaRevision(
  items: ItemSeguimientoNomina[],
  tabSeveridad: DetalleRevisionTabSeveridad,
): DetalleRevisionListaItem[] {
  const requiereCorreccion = tabSeveridad === 'bloqueo' || tabSeveridad === 'atencion';
  return items.map((item) => {
    const itemHumanizado = {
      titulo: humanizarDetalleRevisionTexto(item.titulo),
      descripcion: humanizarDetalleRevisionTexto(item.descripcion),
      estado: humanizarDetalleRevisionTexto(item.estado),
      estadoClase: item.estadoClase,
      accion: humanizarDetalleRevisionTexto(item.accion),
      ruta: item.ruta,
    };
    if (!requiereCorreccion) {
      return itemHumanizado;
    }
    const estadoConflicto = textoPareceRevisado(`${item.estado} ${item.descripcion} ${item.titulo}`);
    const esBloqueo = tabSeveridad === 'bloqueo' || item.estadoClase.includes('danger');
    return {
      titulo: itemHumanizado.titulo,
      descripcion: itemHumanizado.descripcion,
      estado: estadoConflicto
        ? esBloqueo
          ? 'Requiere revisión'
          : 'Pendiente'
        : itemHumanizado.estado,
      estadoClase: estadoConflicto
        ? esBloqueo
          ? 'payroll-state-chip payroll-state-chip--danger'
          : 'payroll-state-chip payroll-state-chip--warning'
        : item.estadoClase,
      accion: itemHumanizado.accion,
      ruta: item.ruta,
    };
  });
}

function mapMovementRowALista(row: FilaDetalleMovimientoNomina): DetalleRevisionListaItem {
  return {
    titulo: humanizarDetalleRevisionTexto(row.concepto),
    descripcion: humanizarDetalleRevisionTexto(`${row.trabajador} · ${row.tipo} · ${row.monto}`),
    estado: humanizarDetalleRevisionTexto(row.estado),
    estadoClase: row.estado.toLowerCase().includes('revisar') || row.estado.toLowerCase().includes('bloque')
      ? 'payroll-state-chip payroll-state-chip--warning'
      : 'payroll-state-chip payroll-state-chip--info',
    accion: row.accion === 'Sin acción pendiente' ? undefined : humanizarDetalleRevisionTexto(row.accion),
    ruta: '/remuneraciones/novedades-mensuales',
  };
}

export function mapMovimientoRowsALista(rows: FilaDetalleMovimientoNomina[]): DetalleRevisionListaItem[] {
  return rows.map(mapMovementRowALista);
}

function mapRecurrentRowALista(row: FilaDetalleRecurrenteNomina): DetalleRevisionListaItem {
  return {
    titulo: humanizarDetalleRevisionTexto(row.concepto),
    descripcion: humanizarDetalleRevisionTexto(`${row.trabajador} · ${row.periodicidad} · ${row.monto}`),
    estado: humanizarDetalleRevisionTexto(row.estado),
    estadoClase: row.estado.toLowerCase().includes('revisar') || row.estado.toLowerCase().includes('bloque')
      ? 'payroll-state-chip payroll-state-chip--warning'
      : 'payroll-state-chip payroll-state-chip--info',
    accion: row.accion === 'Sin acción pendiente' ? undefined : humanizarDetalleRevisionTexto(row.accion),
    ruta: '/remuneraciones/haberes-descuentos',
  };
}

export function mapRecurrentRowsALista(rows: FilaDetalleRecurrenteNomina[]): DetalleRevisionListaItem[] {
  return rows.map(mapRecurrentRowALista);
}

function mapSeguimientoALista(item: ItemSeguimientoNomina): DetalleRevisionListaItem {
  return {
    titulo: humanizarDetalleRevisionTexto(item.titulo),
    descripcion: humanizarDetalleRevisionTexto(item.descripcion),
    estado: humanizarDetalleRevisionTexto(item.estado),
    estadoClase: item.estadoClase,
    accion: humanizarDetalleRevisionTexto(item.accion),
    ruta: item.ruta,
    accionTab: item.accion === 'Revisar trabajadores'
      ? 'trabajadores'
      : item.accion === 'Ver resumen'
        ? 'resumen'
        : undefined,
  };
}

function buildAccionParametrosAgrupada(
  items: DetalleRevisionListaItem[],
): DetalleRevisionTabPanel['accionParametros'] {
  const accionables = items.filter((item) => item.accion && (item.ruta || item.accionTab));
  if (accionables.length <= 1) return undefined;
  const [primero] = accionables;
  const todosMismaAccion = accionables.every(
    (item) => item.accion === primero.accion && item.ruta === primero.ruta && item.accionTab === primero.accionTab,
  );
  if (!todosMismaAccion || !primero.accion) return undefined;
  return {
    label: primero.accion,
    ruta: primero.ruta,
    accionTab: primero.accionTab,
  };
}

export interface BuildDetalleRevisionTabPanelInput {
  tab: DetalleOperativoTab;
  tabSeveridad: DetalleRevisionTabSeveridad;
  periodoEtiqueta: string;
  estadoTitulo: string;
  incidencias: IncidenciasPeriodoView;
  cantidadFilasTrabajadores: number;
  cantidadFilasMovimientos: number;
  cantidadFilasRecurrentes: number;
  cantidadFilasResultado: number;
  itemsParametros: ItemSeguimientoNomina[];
  itemsSeguimientoResultado: ItemSeguimientoNomina[];
  filasMovimientos: FilaDetalleMovimientoNomina[];
  filasRecurrentes: FilaDetalleRecurrenteNomina[];
}

export function buildDetalleRevisionTabPanel(input: BuildDetalleRevisionTabPanelInput): DetalleRevisionTabPanel {
  const lead = buildDetalleRevisionHeaderLead({
    tab: input.tab,
    periodoEtiqueta: input.periodoEtiqueta,
    estadoTitulo: input.estadoTitulo,
  });

  const incidenciasTabSinResumen = input.tab === 'resumen'
    ? []
    : input.incidencias.porDetalleTab[input.tab];

  const listaObservaciones = input.tab === 'resumen'
    ? buildDetalleRevisionObservacionesLista({ incidencias: input.incidencias })
    : [];

  const parametrosConIncidenciasEnResumen = input.incidencias.porAmbito.parametros.length > 0;
  const listaParametros = input.tab === 'parametros' && !parametrosConIncidenciasEnResumen
    ? mapParametroItemsParaRevision(input.itemsParametros, input.tabSeveridad)
    : input.tab === 'parametros' && parametrosConIncidenciasEnResumen
      ? mapParametroItemsParaRevision(
        input.itemsParametros.filter((item) => !item.estadoClase.includes('danger') && !item.estadoClase.includes('warning')),
        input.tabSeveridad,
      )
    : [];
  const accionParametros = input.tab === 'parametros'
    ? buildAccionParametrosAgrupada(listaParametros)
    : undefined;
  const listaParametrosVisible = accionParametros
    ? listaParametros.map((item) => ({ ...item, accion: undefined, ruta: undefined, accionTab: undefined }))
    : listaParametros;

  const listaMovimientos = mapMovimientoRowsALista(input.filasMovimientos);
  const listaRecurrentes = mapRecurrentRowsALista(input.filasRecurrentes);
  const listaResultadoSeguimiento = input.itemsSeguimientoResultado.map(mapSeguimientoALista);

  const usarGridTrabajadores = false;
  const usarGridMovimientos =
    input.tab === 'movimientos_recurrentes'
    && input.cantidadFilasMovimientos > 0
    && input.cantidadFilasMovimientos > LISTA_EDITORIAL_MAX_FILAS;
  const usarGridRecurrentes =
    input.tab === 'movimientos_recurrentes'
    && input.cantidadFilasRecurrentes > 0
    && input.cantidadFilasRecurrentes > LISTA_EDITORIAL_MAX_FILAS;
  const usarGridResultado = input.tab === 'resultado' && input.cantidadFilasResultado > 0;

  const gridConFiltros =
    (usarGridTrabajadores && input.cantidadFilasTrabajadores > LISTA_EDITORIAL_MAX_FILAS)
    || (usarGridMovimientos && input.cantidadFilasMovimientos > LISTA_EDITORIAL_MAX_FILAS)
    || (usarGridRecurrentes && input.cantidadFilasRecurrentes > LISTA_EDITORIAL_MAX_FILAS)
    || (usarGridResultado && input.cantidadFilasResultado > LISTA_EDITORIAL_MAX_FILAS);

  const enlaceResumenIncidencias = input.tab !== 'resumen'
    ? buildEnlaceResumenIncidencias(incidenciasTabSinResumen.length)
    : undefined;

  const emptyPorTab: Record<DetalleOperativoTab, { titulo: string; descripcion: string }> = {
    resumen: {
      titulo: 'Sin pendientes del período',
      descripcion: 'No hay bloqueos ni advertencias visibles para este período en la versión consultada.',
    },
    trabajadores: {
      titulo: 'Sin trabajadores en la nómina mensual',
      descripcion: 'Genere la nómina mensual o consulte la versión guardada para revisar quiénes entran al cálculo.',
    },
    parametros: {
      titulo: 'Parámetros sin evaluar',
      descripcion: 'Genere la nómina mensual para revisar catálogos y valores mínimos del período.',
    },
    movimientos_recurrentes: {
      titulo: 'Sin movimientos ni recurrentes visibles',
      descripcion: 'Apruebe movimientos del período o revise asignaciones recurrentes antes de continuar.',
    },
    resultado: {
      titulo: 'Sin nómina mensual revisada visible',
      descripcion: 'Revisa y guarda la nómina mensual para ver montos por trabajador.',
    },
  };

  const empty = emptyPorTab[input.tab];

  return {
    lead,
    tituloParametros: input.tabSeveridad === 'bloqueo' || input.tabSeveridad === 'atencion'
      ? 'Parámetros que requieren revisión'
      : 'Parámetros',
    accionParametros,
    emptyTitulo: empty.titulo,
    emptyDescripcion: empty.descripcion,
    usarGridTrabajadores,
    usarGridMovimientos,
    usarGridRecurrentes,
    usarGridResultado,
    gridConFiltros,
    listaParametros: listaParametrosVisible,
    listaObservaciones,
    listaMovimientos: usarGridMovimientos ? [] : listaMovimientos,
    listaRecurrentes: usarGridRecurrentes ? [] : listaRecurrentes,
    listaResultadoSeguimiento,
    enlaceResumenIncidencias,
  };
}

export function buildExpedienteRevisionCtaForTab(
  tab: DetalleOperativoTab,
  input: Parameters<typeof buildExpedienteRevisionCta>[0],
): ExpedienteRevisionCta {
  if (tab !== 'resumen') {
    return { kind: 'none' };
  }
  return buildExpedienteRevisionCta(input);
}

export function buildDetalleRevisionFooterAccion(tab: DetalleOperativoTab): DetalleRevisionFooterAccion {
  switch (tab) {
    case 'resumen':
      return { kind: 'tab', label: 'Ver trabajadores', tab: 'trabajadores' };
    case 'trabajadores':
      return { kind: 'tab', label: 'Ir al detalle del período', tab: 'trabajadores' };
    case 'parametros':
      return { kind: 'ruta', label: 'Revisar parámetros', ruta: '/parametros' };
    case 'movimientos_recurrentes':
      return {
        kind: 'ruta',
        label: 'Revisar movimientos del mes',
        ruta: '/remuneraciones/novedades-mensuales',
      };
    case 'resultado':
      return { kind: 'tab', label: 'Ver resumen operativo', tab: 'resumen' };
    default:
      return { kind: 'cerrar', label: 'Volver a la consola' };
  }
}

function contarIncidenciasTab(
  incidencias: IncidenciasPeriodoView,
  tab: DetalleOperativoTab,
): { bloqueos: number; advertencias: number; total: number } {
  const items = tab === 'resumen'
    ? incidencias.todas
    : incidencias.porDetalleTab[tab];
  let bloqueos = 0;
  let advertencias = 0;
  for (const inc of items) {
    if (inc.severidad === 'bloqueo') bloqueos += 1;
    else if (inc.severidad === 'advertencia') advertencias += 1;
  }
  return { bloqueos, advertencias, total: items.length };
}

export function buildTabMetaFromIncidenciaList(
  items: IncidenciaPeriodo[],
  input: { tieneDatos: boolean; tieneActividadPeriodo: boolean },
): Pick<DetalleRevisionTabMeta, 'severidad' | 'indicador'> {
  let bloqueos = 0;
  let advertencias = 0;
  for (const inc of items) {
    if (inc.severidad === 'bloqueo') {
      bloqueos += 1;
    } else if (inc.severidad === 'advertencia') {
      advertencias += 1;
    }
  }
  const severidad = resolverSeveridadTab({
    bloqueos,
    advertencias,
    tieneDatos: input.tieneDatos,
    tieneActividadPeriodo: input.tieneActividadPeriodo,
  });
  return {
    severidad,
    indicador: indicadorDesdeConteos(severidad, bloqueos, advertencias, items.length),
  };
}

function resolverSeveridadTab(input: {
  bloqueos: number;
  advertencias: number;
  tieneDatos: boolean;
  tieneActividadPeriodo: boolean;
}): DetalleRevisionTabSeveridad {
  if (input.bloqueos > 0) return 'bloqueo';
  if (input.advertencias > 0) return 'atencion';
  if (input.tieneDatos) return 'listo';
  return 'neutral';
}

function indicadorDesdeConteos(
  severidad: DetalleRevisionTabSeveridad,
  bloqueos: number,
  advertencias: number,
  total: number,
): string | null {
  if (severidad === 'bloqueo') {
    const n = bloqueos || total;
    return n === 1 ? '1 bloqueo' : `${n} bloqueos`;
  }
  if (severidad === 'atencion') {
    const n = advertencias || total;
    return n === 1 ? '1 pendiente' : `${n} pendientes`;
  }
  if (severidad === 'listo') return 'Listo';
  return null;
}

function indicadorResumenDesdeSeveridad(severidad: DetalleRevisionTabSeveridad): string | null {
  switch (severidad) {
    case 'bloqueo':
      return 'Requiere revisión';
    case 'atencion':
      return 'Con observaciones';
    case 'listo':
      return 'Listo';
    case 'neutral':
    default:
      return null;
  }
}

export interface BuildDetalleRevisionTabsMetaInput {
  tabs: Array<{ id: DetalleOperativoTab; label: string }>;
  incidencias: IncidenciasPeriodoView;
  cantidadFilasTrabajadores: number;
  cantidadFilasMovimientos: number;
  cantidadFilasRecurrentes: number;
  cantidadFilasResultado: number;
  parametrosListos: boolean | null;
  tieneActividadPeriodo: boolean;
}

export function buildDetalleRevisionTabsMeta(input: BuildDetalleRevisionTabsMetaInput): DetalleRevisionTabMeta[] {
  const incidencias = input.incidencias;
  const resumen = incidencias.resumen;

  return input.tabs.map((tab) => {
    const conteo = contarIncidenciasTab(incidencias, tab.id);

    const tieneDatos = (() => {
      switch (tab.id) {
        case 'resumen':
          return incidencias.todas.length > 0;
        case 'trabajadores':
          return input.cantidadFilasTrabajadores > 0;
        case 'parametros':
          return input.tieneActividadPeriodo && input.parametrosListos === true;
        case 'movimientos_recurrentes':
          return input.cantidadFilasMovimientos > 0 || input.cantidadFilasRecurrentes > 0;
        case 'resultado':
          return input.cantidadFilasResultado > 0;
        default:
          return false;
      }
    })();

    const severidad = tab.id === 'resumen'
      ? resumen.bloqueos > 0
        ? 'bloqueo'
        : resumen.advertencias + resumen.infos > 0
          ? 'atencion'
          : tieneDatos || input.tieneActividadPeriodo
            ? 'listo'
            : 'neutral'
      : resolverSeveridadTab({
        bloqueos: conteo.bloqueos,
        advertencias: conteo.advertencias,
        tieneDatos,
        tieneActividadPeriodo: input.tieneActividadPeriodo,
      });

    return {
      id: tab.id,
      label: tab.label,
      severidad,
      indicador: tab.id === 'resumen'
        ? indicadorResumenDesdeSeveridad(severidad)
        : indicadorDesdeConteos(severidad, conteo.bloqueos, conteo.advertencias, conteo.total),
    };
  });
}

export function claseDetalleRevisionTab(severidad: DetalleRevisionTabSeveridad, activo: boolean): string {
  const base = claseDetalleRevisionTabSeveridad(severidad);
  return activo ? `${base} payroll-operational-tab--active` : base;
}

export function claseDetalleRevisionTabSeveridad(severidad: DetalleRevisionTabSeveridad): string {
  switch (severidad) {
    case 'bloqueo':
      return 'payroll-operational-tab payroll-operational-tab--bloqueo';
    case 'atencion':
      return 'payroll-operational-tab payroll-operational-tab--atencion';
    case 'listo':
      return 'payroll-operational-tab payroll-operational-tab--listo';
    case 'neutral':
    default:
      return 'payroll-operational-tab';
  }
}

export function buildExpedienteRevisionCta(input: {
  accion: 'revisar_trabajadores' | 'confirmar_nomina' | 'generar_liquidaciones' | 'revisar_liquidaciones' | null | undefined;
  label: string | null | undefined;
  puedeConfirmarNomina: boolean;
  motivoNoPuedeConfirmar: string | undefined;
  liquidacionesDisponibles: boolean;
  nominaConfirmada: boolean;
}): ExpedienteRevisionCta {
  if (!input.accion || !input.label) return { kind: 'none' };

  switch (input.accion) {
    case 'revisar_trabajadores':
      return { kind: 'tab', label: input.label, tab: 'trabajadores' };
    case 'confirmar_nomina':
      return {
        kind: 'confirmar_nomina',
        label: input.label,
        disabled: !input.puedeConfirmarNomina,
        disabledReason: input.motivoNoPuedeConfirmar ?? null,
      };
    case 'generar_liquidaciones':
      return {
        kind: 'navegar',
        label: input.label,
        ruta: RUTA_LIQUIDACIONES_REMUNERACIONES,
        disabled: !input.nominaConfirmada,
        disabledReason: input.nominaConfirmada
          ? null
          : 'Confirme la nómina mensual antes de continuar con liquidaciones.',
      };
    case 'revisar_liquidaciones':
      return {
        kind: 'navegar',
        label: input.label,
        ruta: RUTA_LIQUIDACIONES_REMUNERACIONES,
        disabled: !input.liquidacionesDisponibles && !input.nominaConfirmada,
        disabledReason:
          input.liquidacionesDisponibles || input.nominaConfirmada
            ? null
            : 'Las liquidaciones aún no están disponibles para este período.',
      };
    default:
      return { kind: 'none' };
  }
}
