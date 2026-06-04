/**
 * Presenter de la grilla del paso Dotación (F3e-2).
 *
 * Calcula contadores y descripciones operativas a partir de las filas
 * resumidas que entrega `NominaPeriodoService.filtrarDotacion`. No tiene
 * dependencia con Angular: es un módulo puro testeable.
 */

import type {
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
} from '../../nomina-mensual/models/nomina-periodo.models';

export interface DotacionGridStats {
  total: number;
  listos: number;
  conAdvertencias: number;
  conCriticos: number;
  bloqueados: number;
}

export interface DotacionGridResumen {
  filas: FilaTrabajadorNominaResumen[];
  total: number;
  stats: DotacionGridStats;
  hayFiltrosActivos: boolean;
}

const ESTADOS_DOTACION: ReadonlyArray<FilaTrabajadorNominaResumen['estado']> = [
  'listo',
  'advertencia',
  'critico',
  'bloqueado',
];

export function calcularStatsDotacion(filas: FilaTrabajadorNominaResumen[]): DotacionGridStats {
  const stats: DotacionGridStats = {
    total: filas.length,
    listos: 0,
    conAdvertencias: 0,
    conCriticos: 0,
    bloqueados: 0,
  };
  for (const fila of filas) {
    switch (fila.estado) {
      case 'listo':
        stats.listos += 1;
        break;
      case 'advertencia':
        stats.conAdvertencias += 1;
        break;
      case 'critico':
        stats.conCriticos += 1;
        break;
      case 'bloqueado':
        stats.bloqueados += 1;
        break;
    }
  }
  return stats;
}

export function hayFiltrosActivos(filtro: FiltroRapidoDotacion): boolean {
  return Boolean(
    filtro.estado ||
      filtro.segmentoId ||
      filtro.conIncidencias !== undefined ||
      filtro.conMovimientos !== undefined ||
      (filtro.busqueda && filtro.busqueda.trim().length > 0),
  );
}

export function etiquetaEstadoDotacion(estado: FilaTrabajadorNominaResumen['estado']): string {
  switch (estado) {
    case 'listo':
      return 'Listo';
    case 'advertencia':
      return 'Con advertencia';
    case 'critico':
      return 'Con incidencia crítica';
    case 'bloqueado':
      return 'Bloqueado';
    default:
      return estado;
  }
}

export function listaEstadosDotacion(): ReadonlyArray<FilaTrabajadorNominaResumen['estado']> {
  return ESTADOS_DOTACION;
}
