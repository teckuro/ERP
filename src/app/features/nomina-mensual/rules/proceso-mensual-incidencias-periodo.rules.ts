import type { DetalleOperativoTab } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import { limpiarCopyTecnicoNomina } from './proceso-mensual-copy-limpio.rules';
import type { ResultadoObservacionView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { ProcesoMensualPendienteVm } from './proceso-mensual-estado-operativo.rules';
import { resolveDetalleTabFromPendiente } from './proceso-mensual-informacion-periodo.rules';

export type IncidenciaPeriodoSeveridad = 'bloqueo' | 'advertencia' | 'info';

export type IncidenciaPeriodoAmbito =
  | 'periodo'
  | 'parametros'
  | 'trabajadores'
  | 'movimientos'
  | 'recurrentes'
  | 'calculo'
  | 'resultado';

export type IncidenciaPeriodoOrigen =
  | 'prevalidacion'
  | 'calculo'
  | 'expediente'
  | 'trabajador';

export interface IncidenciaPeriodoAccion {
  tipo: 'tab' | 'ruta' | 'cerrar';
  label: string;
  destino?: string;
}

export interface IncidenciaPeriodo {
  id: string;
  severidad: IncidenciaPeriodoSeveridad;
  ambito: IncidenciaPeriodoAmbito;
  titulo: string;
  detalle: string;
  origen: IncidenciaPeriodoOrigen;
  accion?: IncidenciaPeriodoAccion;
  prioridad: number;
  idPersona?: number | string;
}

export interface IncidenciasPeriodoResumen {
  bloqueos: number;
  advertencias: number;
  infos: number;
}

export interface IncidenciasPeriodoView {
  todas: IncidenciaPeriodo[];
  porAmbito: Record<IncidenciaPeriodoAmbito, IncidenciaPeriodo[]>;
  porDetalleTab: Record<DetalleOperativoTab, IncidenciaPeriodo[]>;
  resumen: IncidenciasPeriodoResumen;
}

export interface ExpedienteProblemaIncidenciaInput {
  severidad: 'bloqueo' | 'advertencia' | 'info';
  titulo: string;
  detalle: string;
  trabajador?: string | null;
  idPersona?: number | string;
}

export interface BuildIncidenciasPeriodoInput {
  bloqueosOperativos: ProcesoMensualPendienteVm[];
  advertenciasOperativas: ProcesoMensualPendienteVm[];
  informacionesOperativas?: ProcesoMensualPendienteVm[];
  resultadoBloqueos: ResultadoObservacionView[];
  resultadoAdvertencias: ResultadoObservacionView[];
  expedienteProblemas?: ExpedienteProblemaIncidenciaInput[];
}

const AMBITOS_ORDEN: IncidenciaPeriodoAmbito[] = [
  'parametros',
  'trabajadores',
  'movimientos',
  'recurrentes',
  'resultado',
  'calculo',
  'periodo',
];

const DETALLE_TABS: DetalleOperativoTab[] = [
  'resumen',
  'trabajadores',
  'parametros',
  'movimientos_recurrentes',
  'resultado',
];

function severidadDesdePendiente(severidad: ProcesoMensualPendienteVm['severidad']): IncidenciaPeriodoSeveridad {
  if (severidad === 'danger') return 'bloqueo';
  if (severidad === 'warning') return 'advertencia';
  return 'info';
}

function severidadRank(severidad: IncidenciaPeriodoSeveridad): number {
  switch (severidad) {
    case 'bloqueo':
      return 0;
    case 'advertencia':
      return 1;
    case 'info':
    default:
      return 2;
  }
}

function origenRank(origen: IncidenciaPeriodoOrigen): number {
  switch (origen) {
    case 'calculo':
      return 0;
    case 'prevalidacion':
      return 1;
    case 'expediente':
      return 2;
    case 'trabajador':
    default:
      return 3;
  }
}

function ambitoRank(ambito: IncidenciaPeriodoAmbito): number {
  const index = AMBITOS_ORDEN.indexOf(ambito);
  return index === -1 ? AMBITOS_ORDEN.length : index;
}

function prioridadDesdeCodigo(codigo: string): number {
  const normalizado = codigo.toUpperCase();
  if (normalizado.includes('PARAM')) return 10;
  if (normalizado.includes('TRAB') || normalizado.includes('PERSONA')) return 20;
  if (normalizado.includes('MOV') || normalizado.includes('ENTRADA')) return 30;
  if (normalizado.includes('RECURREN')) return 40;
  if (normalizado.includes('CALCUL') || normalizado.includes('RESULT')) return 50;
  if (normalizado.includes('CIERRE') || normalizado.includes('NOMINA')) return 60;
  return 100;
}

/** Advertencias del motor que se repiten por trabajador en snapshot pero son del período. */
export function incidenciaEsAlcancePeriodo(codigo: string): boolean {
  const normalizado = normalizarCodigoIncidencia(codigo).toUpperCase();
  if (
    normalizado.includes('SANNA')
    || normalizado.includes('LEY_16744')
    || normalizado.includes('GRATIF')
    || normalizado.startsWith('PARAM')
    || normalizado.includes('PARAMETROS')
  ) {
    return true;
  }
  return false;
}

export function ambitoDesdeCodigoIncidencia(codigo: string, ruta?: string): IncidenciaPeriodoAmbito {
  const normalizado = codigo.toUpperCase();
  if (
    normalizado.includes('PARAM')
    || normalizado.includes('SANNA')
    || normalizado.includes('LEY_16744')
    || normalizado.includes('GRATIF')
    || normalizado.includes('UF_')
    || normalizado.includes('_UF')
    || normalizado.includes('UTM')
    || normalizado.includes('UTA')
    || normalizado.includes('SIS')
    || normalizado.includes('TOPE')
    || normalizado.includes('SUELDO_MIN')
    || ruta === '/parametros'
  ) {
    return 'parametros';
  }
  if (normalizado.includes('RECURREN') || normalizado.includes('HABER_DESC')) return 'recurrentes';
  if (
    normalizado.includes('MOVIMIENTO')
    || normalizado.includes('ENTRADA')
    || normalizado.includes('MV_')
  ) {
    return 'movimientos';
  }
  if (normalizado.includes('TRAB') || normalizado.includes('PERSONA') || normalizado.includes('FICHA')) {
    return 'trabajadores';
  }
  if (normalizado.includes('CALCUL') || normalizado.includes('GUARD')) return 'calculo';
  if (normalizado.includes('RESULT') || normalizado.includes('LIQUID')) return 'resultado';
  if (normalizado.includes('CIERRE') || normalizado.includes('NOMINA')) return 'periodo';
  return 'periodo';
}

export function etiquetaAmbitoIncidencia(ambito: IncidenciaPeriodoAmbito): string {
  switch (ambito) {
    case 'parametros':
      return 'Parámetros';
    case 'trabajadores':
      return 'Trabajadores';
    case 'movimientos':
      return 'Movimientos del mes';
    case 'recurrentes':
      return 'Recurrentes';
    case 'calculo':
      return 'Cálculo preliminar';
    case 'resultado':
      return 'Resultado';
    case 'periodo':
    default:
      return 'Período';
  }
}

function detalleTabDesdeAmbito(ambito: IncidenciaPeriodoAmbito): DetalleOperativoTab {
  switch (ambito) {
    case 'parametros':
      return 'parametros';
    case 'trabajadores':
      return 'trabajadores';
    case 'movimientos':
    case 'recurrentes':
      return 'movimientos_recurrentes';
    case 'calculo':
    case 'resultado':
      return 'resultado';
    case 'periodo':
    default:
      return 'resumen';
  }
}

function accionDesdePendiente(pendiente: ProcesoMensualPendienteVm): IncidenciaPeriodoAccion | undefined {
  const label = pendiente.accionLabel?.trim();
  if (pendiente.ruta && label) {
    return { tipo: 'ruta', label, destino: pendiente.ruta };
  }
  if (label) {
    const tab = resolveDetalleTabFromPendiente(pendiente);
    return { tipo: 'tab', label, destino: tab };
  }
  return undefined;
}

function accionDesdeResultado(item: ResultadoObservacionView): IncidenciaPeriodoAccion | undefined {
  const label = item.accionLabel?.trim() ?? 'Revisar resultado preliminar';
  if (item.ruta) {
    return { tipo: 'ruta', label, destino: item.ruta };
  }
  return { tipo: 'tab', label, destino: 'resultado' };
}

function origenDesdePendiente(pendiente: ProcesoMensualPendienteVm): IncidenciaPeriodoOrigen {
  const titulo = pendiente.titulo.trim().toLowerCase();
  if (titulo.startsWith('bloqueo del resultado') || titulo.startsWith('advertencia del resultado')) {
    return 'calculo';
  }
  return 'prevalidacion';
}

function mapPendienteToIncidencia(
  pendiente: ProcesoMensualPendienteVm,
  severidad: IncidenciaPeriodoSeveridad,
): IncidenciaPeriodo {
  const ambito = ambitoDesdeCodigoIncidencia(pendiente.codigo, pendiente.ruta);
  return {
    id: pendiente.codigo,
    severidad,
    ambito,
    titulo: pendiente.titulo,
    detalle: pendiente.descripcion || pendiente.titulo,
    origen: origenDesdePendiente(pendiente),
    accion: accionDesdePendiente(pendiente),
    prioridad: prioridadDesdeCodigo(pendiente.codigo),
  };
}

function mapResultadoToIncidencia(
  item: ResultadoObservacionView,
  severidad: IncidenciaPeriodoSeveridad,
): IncidenciaPeriodo {
  const ambito = ambitoDesdeCodigoIncidencia(item.codigo, item.ruta);
  return {
    id: item.codigo,
    severidad,
    ambito,
    titulo: item.titulo,
    detalle: item.descripcion || item.titulo,
    origen: 'calculo',
    accion: accionDesdeResultado(item),
    prioridad: prioridadDesdeCodigo(item.codigo),
  };
}

function mapExpedienteProblemaToIncidencia(problema: ExpedienteProblemaIncidenciaInput): IncidenciaPeriodo {
  const codigo = (problema.titulo ?? '').trim() || 'EXPEDIENTE_OBS';
  const detalle = (problema.detalle ?? '').trim() || codigo;
  const ambitoCodigo = ambitoDesdeCodigoIncidencia(codigo);
  const alcancePeriodo = incidenciaEsAlcancePeriodo(codigo);
  const ambito =
    alcancePeriodo
      ? ambitoCodigo
      : problema.trabajador || problema.idPersona != null
        ? 'trabajadores'
        : ambitoCodigo;
  return {
    id: codigo,
    severidad: problema.severidad,
    ambito,
    titulo: problema.titulo || detalle,
    detalle,
    origen: 'expediente',
    prioridad: prioridadDesdeCodigo(codigo),
    idPersona: alcancePeriodo ? undefined : problema.idPersona,
  };
}

/** Alias de códigos que representan el mismo pendiente entre prevalidación, cálculo y snapshot. */
const CODIGO_INCIDENCIA_CANONICO: Record<string, string> = {
  parametros_sin_fila: 'PARAMETROS_PERIODO',
  parametros_generales: 'PARAMETROS_PERIODO',
  falta_parametros_generales: 'PARAMETROS_PERIODO',
  param_periodo: 'PARAMETROS_PERIODO',
};

function normalizarCodigoIncidencia(codigo: string): string {
  const base = (codigo ?? '').trim();
  if (!base) return '';
  const clave = base.toLowerCase().replace(/-/g, '_');
  return CODIGO_INCIDENCIA_CANONICO[clave] ?? base;
}

const TITULOS_GENERICOS_RESULTADO = new Set([
  'bloqueo del resultado',
  'advertencia del resultado',
]);

function claveIncidencia(inc: IncidenciaPeriodo): string {
  const id = normalizarCodigoIncidencia(inc.id);
  if (id && inc.idPersona != null) {
    return `${id}|${inc.idPersona}`;
  }
  if (id) {
    return id;
  }
  const titulo = limpiarCopyTecnicoNomina(inc.titulo).trim().toLowerCase();
  const detalle = limpiarCopyTecnicoNomina(inc.detalle).trim().toLowerCase();
  return `hash|${titulo}|${detalle}`;
}

/** Misma causa operativa con distinto código técnico (p. ej. prevalidación vs snapshot). */
function huellaMensajeIncidencia(inc: IncidenciaPeriodo): string | null {
  const detalle = limpiarCopyTecnicoNomina(inc.detalle).trim().toLowerCase();
  const cuerpo =
    detalle.length >= 16
      ? detalle
      : limpiarCopyTecnicoNomina(inc.titulo).trim().toLowerCase();
  if (cuerpo.length < 16) return null;
  return `msg|${inc.severidad}|${cuerpo}`;
}

function preferirAmbitoEnMerge(
  actual: IncidenciaPeriodoAmbito,
  candidata: IncidenciaPeriodoAmbito,
): IncidenciaPeriodoAmbito {
  return ambitoRank(candidata) <= ambitoRank(actual) ? candidata : actual;
}

function preferirTituloEnMerge(actual: IncidenciaPeriodo, candidata: IncidenciaPeriodo): string {
  const a = actual.titulo.trim();
  const b = candidata.titulo.trim();
  if (!a) return b;
  if (!b) return a;
  const aGenerico = TITULOS_GENERICOS_RESULTADO.has(a.toLowerCase());
  const bGenerico = TITULOS_GENERICOS_RESULTADO.has(b.toLowerCase());
  if (aGenerico && !bGenerico) return b;
  if (bGenerico && !aGenerico) return a;
  if (actual.origen === 'calculo' && candidata.origen !== 'calculo') return a;
  if (candidata.origen === 'calculo' && actual.origen !== 'calculo') return b;
  return a.length >= b.length ? a : b;
}

function preferirDetalleEnMerge(actual: string, candidata: string): string {
  const a = actual.trim();
  const b = candidata.trim();
  if (!a) return b;
  if (!b) return a;
  return a.length >= b.length ? a : b;
}

function mergeAccion(
  actual?: IncidenciaPeriodoAccion,
  candidata?: IncidenciaPeriodoAccion,
): IncidenciaPeriodoAccion | undefined {
  return actual ?? candidata;
}

function mergeIncidencias(actual: IncidenciaPeriodo, candidata: IncidenciaPeriodo): IncidenciaPeriodo {
  const severidad =
    severidadRank(candidata.severidad) < severidadRank(actual.severidad)
      ? candidata.severidad
      : actual.severidad;
  const origen =
    severidadRank(candidata.severidad) === severidadRank(actual.severidad)
    && origenRank(candidata.origen) < origenRank(actual.origen)
      ? candidata.origen
      : actual.origen;
  const preferirCandidata =
    severidadRank(candidata.severidad) < severidadRank(actual.severidad)
    || (
      severidadRank(candidata.severidad) === severidadRank(actual.severidad)
      && origenRank(candidata.origen) < origenRank(actual.origen)
    );
  const base = preferirCandidata ? candidata : actual;
  const otro = preferirCandidata ? actual : candidata;
  return {
    ...base,
    severidad,
    origen,
    ambito: preferirAmbitoEnMerge(actual.ambito, candidata.ambito),
    titulo: preferirTituloEnMerge(actual, candidata),
    detalle: preferirDetalleEnMerge(actual.detalle, candidata.detalle),
    accion: mergeAccion(actual.accion, candidata.accion),
    prioridad: Math.min(actual.prioridad, candidata.prioridad),
    idPersona: incidenciaEsAlcancePeriodo(base.id) ? undefined : base.idPersona ?? otro.idPersona,
  };
}

export function ordenarIncidencias(incidencias: IncidenciaPeriodo[]): IncidenciaPeriodo[] {
  return [...incidencias].sort((a, b) => {
    const porSeveridad = severidadRank(a.severidad) - severidadRank(b.severidad);
    if (porSeveridad !== 0) return porSeveridad;
    const porAmbito = ambitoRank(a.ambito) - ambitoRank(b.ambito);
    if (porAmbito !== 0) return porAmbito;
    const porAccion = Number(Boolean(b.accion)) - Number(Boolean(a.accion));
    if (porAccion !== 0) return porAccion;
    const porPrioridad = a.prioridad - b.prioridad;
    if (porPrioridad !== 0) return porPrioridad;
    return a.id.localeCompare(b.id);
  });
}

function deduplicarIncidencias(incidencias: IncidenciaPeriodo[]): IncidenciaPeriodo[] {
  const mapa = new Map<string, IncidenciaPeriodo>();
  const huellaACanonica = new Map<string, string>();

  for (const inc of incidencias) {
    const claveId = claveIncidencia(inc);
    const huella = huellaMensajeIncidencia(inc);
    const claveExistente =
      mapa.has(claveId)
        ? claveId
        : huella && huellaACanonica.has(huella)
          ? huellaACanonica.get(huella)!
          : undefined;

    if (claveExistente) {
      mapa.set(claveExistente, mergeIncidencias(mapa.get(claveExistente)!, inc));
      if (huella) {
        huellaACanonica.set(huella, claveExistente);
      }
      continue;
    }

    mapa.set(claveId, inc);
    if (huella) {
      huellaACanonica.set(huella, claveId);
    }
  }

  return ordenarIncidencias([...mapa.values()]);
}

function crearPorAmbito(todas: IncidenciaPeriodo[]): Record<IncidenciaPeriodoAmbito, IncidenciaPeriodo[]> {
  const vacio = Object.fromEntries(
    AMBITOS_ORDEN.map((ambito) => [ambito, [] as IncidenciaPeriodo[]]),
  ) as Record<IncidenciaPeriodoAmbito, IncidenciaPeriodo[]>;
  for (const inc of todas) {
    vacio[inc.ambito].push(inc);
  }
  return vacio;
}

function crearPorDetalleTab(todas: IncidenciaPeriodo[]): Record<DetalleOperativoTab, IncidenciaPeriodo[]> {
  const vacio = Object.fromEntries(
    DETALLE_TABS.map((tab) => [tab, [] as IncidenciaPeriodo[]]),
  ) as Record<DetalleOperativoTab, IncidenciaPeriodo[]>;
  for (const inc of todas) {
    const tab = detalleTabDesdeAmbito(inc.ambito);
    if (tab !== 'resumen') {
      vacio[tab].push(inc);
    }
    vacio.resumen.push(inc);
  }
  for (const tab of DETALLE_TABS) {
    vacio[tab] = ordenarIncidencias(vacio[tab]);
  }
  return vacio;
}

function crearResumen(todas: IncidenciaPeriodo[]): IncidenciasPeriodoResumen {
  return {
    bloqueos: todas.filter((inc) => inc.severidad === 'bloqueo').length,
    advertencias: todas.filter((inc) => inc.severidad === 'advertencia').length,
    infos: todas.filter((inc) => inc.severidad === 'info').length,
  };
}

export function buildIncidenciasPeriodo(input: BuildIncidenciasPeriodoInput): IncidenciasPeriodoView {
  const crudas: IncidenciaPeriodo[] = [
    ...input.bloqueosOperativos.map((item) => mapPendienteToIncidencia(item, 'bloqueo')),
    ...input.advertenciasOperativas.map((item) => mapPendienteToIncidencia(item, 'advertencia')),
    ...(input.informacionesOperativas ?? []).map((item) => mapPendienteToIncidencia(item, 'info')),
    ...input.resultadoBloqueos.map((item) => mapResultadoToIncidencia(item, 'bloqueo')),
    ...input.resultadoAdvertencias.map((item) => mapResultadoToIncidencia(item, 'advertencia')),
    ...(input.expedienteProblemas ?? []).map(mapExpedienteProblemaToIncidencia),
  ];
  const todas = deduplicarIncidencias(crudas);
  return {
    todas,
    porAmbito: crearPorAmbito(todas),
    porDetalleTab: crearPorDetalleTab(todas),
    resumen: crearResumen(todas),
  };
}

/** Proyección a fila de observación legacy (facade / grids). */
export function incidenciasToPayrollObservationRows(
  incidencias: IncidenciaPeriodo[],
): Array<{
  severidad: 'Bloqueo' | 'Advertencia' | 'Información';
  ambito: string;
  mensaje: string;
  accion: string;
}> {
  return incidencias.map((inc) => ({
    severidad:
      inc.severidad === 'bloqueo'
        ? 'Bloqueo'
        : inc.severidad === 'advertencia'
          ? 'Advertencia'
          : 'Información',
    ambito: etiquetaAmbitoIncidencia(inc.ambito),
    mensaje: limpiarCopyTecnicoNomina(inc.detalle || inc.titulo),
    accion: limpiarCopyTecnicoNomina(inc.accion?.label ?? 'Revisar en el período'),
  }));
}
