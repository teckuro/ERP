import type { BaseNominaTrazabilidad } from '../models/proceso-mensual.model';
import type { ExpedienteNominaPeriodoView } from './proceso-mensual-expediente-periodo.rules';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import type {
  PayrollMovementDetailRow,
  PayrollRecurrentDetailRow,
  ResultadoPreliminarView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

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
  pendientes: number;
  tieneMovimientos: boolean;
  tieneRecurrentes: boolean;
}

export interface NominaMasivaDetalle {
  idPersona: number | string;
  trabajador: string;
  rut: string;
  estado: NominaMasivaEstado;
  haberes: number | null;
  descuentos: number | null;
  liquidoEstimado: number | null;
  movimientos: PayrollMovementDetailRow[];
  recurrentes: PayrollRecurrentDetailRow[];
  incidencias: IncidenciaPeriodo[];
}

export interface BuildNominaMasivaInput {
  resultadoTrabajadores: ResultadoPreliminarView['trabajadores'];
  expedienteTrabajadores: ExpedienteNominaPeriodoView['trabajadores'];
  baseTrabajadores: BaseNominaTrazabilidad['trabajadores'];
  movementRows: PayrollMovementDetailRow[];
  recurrentRows: PayrollRecurrentDetailRow[];
  incidencias: IncidenciaPeriodo[];
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
  rows: Array<PayrollMovementDetailRow | PayrollRecurrentDetailRow>,
  trabajador: string,
): boolean {
  const nombre = normalizarNombre(trabajador);
  return rows.some((row) => normalizarNombre(row.trabajador) === nombre);
}

function rowsPorTrabajador<T extends PayrollMovementDetailRow | PayrollRecurrentDetailRow>(
  rows: T[],
  trabajador: string,
): T[] {
  const nombre = normalizarNombre(trabajador);
  return rows.filter((row) => normalizarNombre(row.trabajador) === nombre);
}

function mergeFila(map: Map<string, FilaDraft>, fila: FilaDraft): void {
  const clave = clavePersona(fila.idPersona);
  if (!clave) return;
  const existente = map.get(clave);
  if (!existente) {
    map.set(clave, fila);
    return;
  }
  map.set(clave, {
    idPersona: existente.idPersona,
    trabajador: existente.trabajador || fila.trabajador,
    rut: existente.rut || fila.rut,
    estado: mejorEstado(existente.estado, fila.estado),
    haberes: existente.haberes ?? fila.haberes,
    descuentos: existente.descuentos ?? fila.descuentos,
    liquidoEstimado: existente.liquidoEstimado ?? fila.liquidoEstimado,
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

  for (const trabajador of input.resultadoTrabajadores) {
    mergeFila(map, filaDesdeResultado(trabajador));
  }
  for (const trabajador of input.expedienteTrabajadores) {
    mergeFila(map, filaDesdeExpediente(trabajador));
  }
  for (const trabajador of input.baseTrabajadores) {
    mergeFila(map, filaDesdeBase(trabajador));
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
      return {
        ...fila,
        estado,
        pendientes: incidencias.filter((incidencia) => incidencia.severidad !== 'info').length,
        tieneMovimientos: tieneRowsPorTrabajador(input.movementRows, fila.trabajador),
        tieneRecurrentes: tieneRowsPorTrabajador(input.recurrentRows, fila.trabajador),
      };
    })
    .sort((a, b) => a.trabajador.localeCompare(b.trabajador, 'es'));
}

export function buildResumenMasivoNomina(input: BuildNominaMasivaInput): NominaMasivaResumen {
  const filas = buildFilasMasivasTrabajadores(input);
  return {
    totalTrabajadores: filas.length,
    listos: filas.filter((fila) => fila.estado === 'listo').length,
    conObservaciones: filas.filter((fila) => fila.estado === 'observacion').length,
    bloqueados: filas.filter((fila) => fila.estado === 'bloqueado').length,
    conMovimientos: filas.filter((fila) => fila.tieneMovimientos).length,
    conRecurrentes: filas.filter((fila) => fila.tieneRecurrentes).length,
  };
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
    movimientos: rowsPorTrabajador(input.movementRows, fila.trabajador),
    recurrentes: rowsPorTrabajador(input.recurrentRows, fila.trabajador),
    incidencias: incidenciasPorPersona(input.incidencias, fila.idPersona),
  };
}
