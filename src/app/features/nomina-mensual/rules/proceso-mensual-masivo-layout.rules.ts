import type { BaseNominaTrazabilidad } from '../models/proceso-mensual.model';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { aplicarMontosEstimadosDesdeEntradas } from './proceso-mensual-masivo-montos-estimados.rules';
import type { ExpedienteNominaPeriodoView } from './proceso-mensual-expediente-periodo.rules';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import type {
  NominaDetalleMensualMovimientoRow,
  FilaDetalleMovimientoNomina,
  FilaDetalleRecurrenteNomina,
  ResultadoPreliminarView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import { buildNominaDetalleMensualMovimientosRows } from './proceso-mensual-detalle-mensual.rules';
import {
  resolveAccionCorreccionDesdeIncidencia,
  resolveAccionCorreccionFilaMasiva,
  type AccionCorreccionVm,
} from './proceso-mensual-correccion.rules';

export type NominaMasivaFiltro =
  | 'todos'
  | 'bloqueados'
  | 'observaciones'
  | 'listos'
  | 'con_movimientos'
  | 'sin_movimientos'
  | 'con_recurrentes';

export type NominaMasivaEstado = 'listo' | 'observacion' | 'bloqueado' | 'no_calculado';

export interface NominaMasivaResumen {
  totalTrabajadores: number;
  listos: number;
  conObservaciones: number;
  bloqueados: number;
  conMovimientos: number;
  sinMovimientos: number;
  conRecurrentes: number;
}

export interface NominaMasivaFila {
  idPersona: number | string;
  trabajador: string;
  rut: string;
  estado: NominaMasivaEstado;
  haberes: number | null;
  descuentos: number | null;
  liquidoEstimado: number | null;
  /** Montos referenciales desde entradas del mes; no reemplazan el cálculo preliminar. */
  montosEstimadosDesdeEntradas?: boolean;
  pendientes: number;
  /** Alias visible en columna Incidencias. */
  incidenciasCount: number;
  movimientosCount: number;
  tieneMovimientos: boolean;
  tieneRecurrentes: boolean;
}

export interface NominaMasivaAccionRecomendada {
  titulo: string;
  descripcion: string;
  tono: 'listo' | 'atencion' | 'bloqueo' | 'neutral';
  accion?: AccionCorreccionVm;
}

export interface NominaMasivaDetalle {
  idPersona: number | string;
  trabajador: string;
  rut: string;
  estado: NominaMasivaEstado;
  haberes: number | null;
  descuentos: number | null;
  liquidoEstimado: number | null;
  montosEstimadosDesdeEntradas?: boolean;
  movimientos: FilaDetalleMovimientoNomina[];
  recurrentes: FilaDetalleRecurrenteNomina[];
  incidencias: IncidenciaPeriodo[];
}

export interface BuildNominaMasivaInput {
  resultadoTrabajadores: ResultadoPreliminarView['trabajadores'];
  expedienteTrabajadores: ExpedienteNominaPeriodoView['trabajadores'];
  baseTrabajadores: BaseNominaTrazabilidad['trabajadores'];
  filasMovimientos: FilaDetalleMovimientoNomina[];
  filasRecurrentes: FilaDetalleRecurrenteNomina[];
  incidencias: IncidenciaPeriodo[];
  /** True cuando hay cálculo preliminar guardado u oficial; evita mostrar $0 del borrador como monto real. */
  montosOficialesDisponibles: boolean;
  entradasMensuales?: readonly EntradaMensualPeriodo[];
}

interface FilaDraft {
  idPersona: number | string;
  trabajador: string;
  rut: string;
  estado: NominaMasivaEstado;
  haberes: number | null;
  descuentos: number | null;
  liquidoEstimado: number | null;
}

const ESTADO_RANK: Record<NominaMasivaEstado, number> = {
  bloqueado: 0,
  observacion: 1,
  no_calculado: 2,
  listo: 3,
};

function clavePersona(idPersona: number | string | null | undefined): string {
  if (idPersona == null) return '';
  const raw = String(idPersona).trim();
  return raw.startsWith('omitido-') ? raw.slice('omitido-'.length) : raw;
}

function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarRut(texto: string): string {
  return texto.toLowerCase().replace(/[^0-9k]/g, '');
}

function normalizarNombre(texto: string): string {
  return normalizarBusqueda(texto);
}

function montoDesdeLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const normalizado = label.toLowerCase();
  if (normalizado.includes('no disponible')) return null;
  const limpio = label.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.');
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

function mejorEstado(actual: NominaMasivaEstado, candidato: NominaMasivaEstado): NominaMasivaEstado {
  return ESTADO_RANK[candidato] < ESTADO_RANK[actual] ? candidato : actual;
}

function estadoDesdeResultado(estado: ResultadoPreliminarView['trabajadores'][number]['estadoLabel']): NominaMasivaEstado {
  switch (estado) {
    case 'Calculado':
      return 'listo';
    case 'Con observaciones':
      return 'observacion';
    case 'Omitido':
      return 'bloqueado';
    case 'No calculado':
    default:
      return 'no_calculado';
  }
}

function estadoDesdeExpediente(estado: ExpedienteNominaPeriodoView['trabajadores'][number]['estado']): NominaMasivaEstado {
  switch (estado) {
    case 'listo':
      return 'listo';
    case 'con_observaciones':
      return 'observacion';
    case 'bloqueado':
      return 'bloqueado';
    case 'omitido':
    default:
      return 'no_calculado';
  }
}

function estadoDesdeBase(estado: BaseNominaTrazabilidad['trabajadores'][number]['estado']): NominaMasivaEstado {
  switch (estado) {
    case 'listo':
      return 'listo';
    case 'con_observaciones':
      return 'observacion';
    case 'bloqueado':
      return 'bloqueado';
    case 'excluido':
    default:
      return 'no_calculado';
  }
}

function incidenciasPorPersona(incidencias: IncidenciaPeriodo[], idPersona: number | string): IncidenciaPeriodo[] {
  const clave = clavePersona(idPersona);
  if (!clave) return [];
  return incidencias.filter((incidencia) => incidencia.idPersona != null && clavePersona(incidencia.idPersona) === clave);
}

function tieneRowsPorTrabajador(
  rows: Array<FilaDetalleMovimientoNomina | FilaDetalleRecurrenteNomina>,
  trabajador: string,
): boolean {
  const nombre = normalizarNombre(trabajador);
  return rows.some((row) => normalizarNombre(row.trabajador) === nombre);
}

function rowsPorTrabajador<T extends FilaDetalleMovimientoNomina | FilaDetalleRecurrenteNomina>(
  rows: T[],
  trabajador: string,
): T[] {
  const nombre = normalizarNombre(trabajador);
  return rows.filter((row) => normalizarNombre(row.trabajador) === nombre);
}

function mergeMonto(
  existente: number | null,
  candidato: number | null,
  montosOficialesDisponibles: boolean,
): number | null {
  if (existente != null) {
    return existente;
  }
  if (!montosOficialesDisponibles && (candidato == null || candidato === 0)) {
    return null;
  }
  return candidato;
}

function normalizarMontosFila(fila: FilaDraft, montosOficialesDisponibles: boolean): FilaDraft {
  if (montosOficialesDisponibles) {
    return fila;
  }
  return {
    ...fila,
    haberes: fila.haberes === 0 ? null : fila.haberes,
    descuentos: fila.descuentos === 0 ? null : fila.descuentos,
    liquidoEstimado: fila.liquidoEstimado === 0 ? null : fila.liquidoEstimado,
  };
}

function mergeFila(map: Map<string, FilaDraft>, fila: FilaDraft, montosOficialesDisponibles: boolean): void {
  const filaNormalizada = normalizarMontosFila(fila, montosOficialesDisponibles);
  const clave = clavePersona(filaNormalizada.idPersona);
  if (!clave) return;
  const existente = map.get(clave);
  if (!existente) {
    map.set(clave, filaNormalizada);
    return;
  }
  map.set(clave, {
    idPersona: existente.idPersona,
    trabajador: existente.trabajador || filaNormalizada.trabajador,
    rut: existente.rut || filaNormalizada.rut,
    estado: mejorEstado(existente.estado, filaNormalizada.estado),
    haberes: mergeMonto(existente.haberes, filaNormalizada.haberes, montosOficialesDisponibles),
    descuentos: mergeMonto(existente.descuentos, filaNormalizada.descuentos, montosOficialesDisponibles),
    liquidoEstimado: mergeMonto(existente.liquidoEstimado, filaNormalizada.liquidoEstimado, montosOficialesDisponibles),
  });
}

function filaDesdeResultado(trabajador: ResultadoPreliminarView['trabajadores'][number]): FilaDraft {
  return {
    idPersona: clavePersona(trabajador.idPersona) || trabajador.idPersona,
    trabajador: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
    rut: trabajador.rutLabel || 'RUT no disponible',
    estado: estadoDesdeResultado(trabajador.estadoLabel),
    haberes: montoDesdeLabel(trabajador.haberesLabel),
    descuentos: montoDesdeLabel(trabajador.descuentosLabel),
    liquidoEstimado: montoDesdeLabel(trabajador.liquidoLabel),
  };
}

function filaDesdeExpediente(trabajador: ExpedienteNominaPeriodoView['trabajadores'][number]): FilaDraft {
  return {
    idPersona: trabajador.idPersona,
    trabajador: trabajador.nombre || 'Trabajador sin ficha visible',
    rut: trabajador.rut || 'RUT no disponible',
    estado: estadoDesdeExpediente(trabajador.estado),
    haberes: trabajador.totalHaberes,
    descuentos: trabajador.totalDescuentos,
    liquidoEstimado: trabajador.totalLiquido,
  };
}

function filaDesdeBase(trabajador: BaseNominaTrazabilidad['trabajadores'][number]): FilaDraft {
  return {
    idPersona: trabajador.idPersona,
    trabajador: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
    rut: trabajador.rutLabel || 'RUT no disponible',
    estado: estadoDesdeBase(trabajador.estado),
    haberes: null,
    descuentos: null,
    liquidoEstimado: null,
  };
}

export function buildFilasMasivasTrabajadores(input: BuildNominaMasivaInput): NominaMasivaFila[] {
  const map = new Map<string, FilaDraft>();
  const montosOficiales = input.montosOficialesDisponibles;

  for (const trabajador of input.resultadoTrabajadores) {
    mergeFila(map, filaDesdeResultado(trabajador), montosOficiales);
  }
  for (const trabajador of input.expedienteTrabajadores) {
    mergeFila(map, filaDesdeExpediente(trabajador), montosOficiales);
  }
  for (const trabajador of input.baseTrabajadores) {
    mergeFila(map, filaDesdeBase(trabajador), montosOficiales);
  }

  return [...map.values()]
    .map<NominaMasivaFila>((fila) => {
      const incidencias = incidenciasPorPersona(input.incidencias, fila.idPersona);
      const tieneBloqueo = incidencias.some((incidencia) => incidencia.severidad === 'bloqueo');
      const tieneAdvertencia = incidencias.some((incidencia) => incidencia.severidad === 'advertencia');
      const estado = tieneBloqueo
        ? 'bloqueado'
        : tieneAdvertencia && fila.estado === 'listo'
          ? 'observacion'
          : fila.estado;
      const movimientosMes = rowsPorTrabajador(input.filasMovimientos, fila.trabajador);
      const recurrentes = rowsPorTrabajador(input.filasRecurrentes, fila.trabajador);
      const incidenciasCount = incidencias.filter((incidencia) => incidencia.severidad !== 'info').length;
      const filaConMontos = !montosOficiales
        ? aplicarMontosEstimadosDesdeEntradas(fila, input.entradasMensuales)
        : fila;
      return {
        ...filaConMontos,
        estado,
        pendientes: incidenciasCount,
        incidenciasCount,
        movimientosCount: movimientosMes.length + recurrentes.length,
        tieneMovimientos: movimientosMes.length > 0,
        tieneRecurrentes: recurrentes.length > 0,
      };
    })
    .sort((a, b) => a.trabajador.localeCompare(b.trabajador, 'es'));
}

export function buildResumenMasivoDesdeFilas(filas: readonly NominaMasivaFila[]): NominaMasivaResumen {
  return {
    totalTrabajadores: filas.length,
    listos: filas.filter((fila) => fila.estado === 'listo').length,
    conObservaciones: filas.filter((fila) => fila.estado === 'observacion').length,
    bloqueados: filas.filter((fila) => fila.estado === 'bloqueado').length,
    conMovimientos: filas.filter((fila) => fila.tieneMovimientos).length,
    sinMovimientos: filas.filter((fila) => !fila.tieneMovimientos).length,
    conRecurrentes: filas.filter((fila) => fila.tieneRecurrentes).length,
  };
}

export function buildResumenMasivoNomina(input: BuildNominaMasivaInput): NominaMasivaResumen {
  return buildResumenMasivoDesdeFilas(buildFilasMasivasTrabajadores(input));
}

export function filtrarFilasMasivasTrabajadores(
  filas: NominaMasivaFila[],
  filtro: NominaMasivaFiltro,
  busqueda: string,
): NominaMasivaFila[] {
  const texto = normalizarBusqueda(busqueda);
  const rut = normalizarRut(busqueda);
  return filas.filter((fila) => {
    const coincideFiltro = (() => {
      switch (filtro) {
        case 'bloqueados':
          return fila.estado === 'bloqueado';
        case 'observaciones':
          return fila.estado === 'observacion';
        case 'listos':
          return fila.estado === 'listo';
        case 'con_movimientos':
          return fila.tieneMovimientos;
        case 'sin_movimientos':
          return !fila.tieneMovimientos;
        case 'con_recurrentes':
          return fila.tieneRecurrentes;
        case 'todos':
        default:
          return true;
      }
    })();
    if (!coincideFiltro) return false;
    if (!texto && !rut) return true;
    return normalizarBusqueda(fila.trabajador).includes(texto) || (rut.length > 0 && normalizarRut(fila.rut).includes(rut));
  });
}

export function buildMovimientosPanelPorTrabajador(
  detalle: NominaMasivaDetalle,
  periodoEtiqueta: string,
): NominaDetalleMensualMovimientoRow[] {
  return buildNominaDetalleMensualMovimientosRows({
    movimientos: detalle.movimientos,
    recurrentes: detalle.recurrentes,
    periodoEtiqueta,
  });
}

export function buildAccionRecomendadaTrabajador(
  incidencias: IncidenciaPeriodo[],
  estado: NominaMasivaEstado,
  fila?: NominaMasivaFila,
): NominaMasivaAccionRecomendada {
  const bloqueo = incidencias.find((item) => item.severidad === 'bloqueo');
  if (bloqueo) {
    const accion = resolveAccionCorreccionDesdeIncidencia(bloqueo);
    return {
      titulo: 'Revisar bloqueo',
      descripcion: `${bloqueo.titulo}. ${bloqueo.detalle}`,
      tono: 'bloqueo',
      accion: accion ?? undefined,
    };
  }
  const advertencia = incidencias.find((item) => item.severidad === 'advertencia');
  if (advertencia) {
    const accion = resolveAccionCorreccionDesdeIncidencia(advertencia);
    return {
      titulo: 'Pendiente de revisión',
      descripcion: `${advertencia.titulo}. ${advertencia.detalle}`,
      tono: 'atencion',
      accion: accion ?? undefined,
    };
  }
  if (estado === 'bloqueado') {
    return {
      titulo: 'Trabajador bloqueado',
      descripcion: 'Resuelva el bloqueo antes de continuar con la confirmación del período.',
      tono: 'bloqueo',
      accion: fila ? resolveAccionCorreccionFilaMasiva(fila, incidencias) : undefined,
    };
  }
  if (estado === 'observacion') {
    return {
      titulo: 'Revisar observaciones',
      descripcion: 'Revise los datos del trabajador antes de confirmar la nómina.',
      tono: 'atencion',
      accion: fila ? resolveAccionCorreccionFilaMasiva(fila, incidencias) : undefined,
    };
  }
  if (estado === 'no_calculado') {
    return {
      titulo: 'Completar cálculo',
      descripcion: 'Este trabajador aún no tiene una nómina mensual revisada disponible.',
      tono: 'neutral',
      accion: fila ? resolveAccionCorreccionFilaMasiva(fila, incidencias) : undefined,
    };
  }
  const accionListo = fila ? resolveAccionCorreccionFilaMasiva(fila, incidencias) : undefined;
  return {
    titulo: 'Listo para continuar',
    descripcion: 'No hay pendientes visibles para este trabajador en el período.',
    tono: 'listo',
    accion: accionListo,
  };
}

export function buildDetalleMasivoTrabajador(
  input: BuildNominaMasivaInput & { idPersona: number | string | null },
): NominaMasivaDetalle | null {
  if (input.idPersona == null) return null;
  const fila = buildFilasMasivasTrabajadores(input)
    .find((item) => clavePersona(item.idPersona) === clavePersona(input.idPersona));
  if (!fila) return null;
  return {
    idPersona: fila.idPersona,
    trabajador: fila.trabajador,
    rut: fila.rut,
    estado: fila.estado,
    haberes: fila.haberes,
    descuentos: fila.descuentos,
    liquidoEstimado: fila.liquidoEstimado,
    montosEstimadosDesdeEntradas: fila.montosEstimadosDesdeEntradas,
    movimientos: rowsPorTrabajador(input.filasMovimientos, fila.trabajador),
    recurrentes: rowsPorTrabajador(input.filasRecurrentes, fila.trabajador),
    incidencias: incidenciasPorPersona(input.incidencias, fila.idPersona),
  };
}
