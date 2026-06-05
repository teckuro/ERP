import type {
  EstadoNomina,
  NominaPeriodoResumen,
  PasoSiguienteNomina,
} from '../models/nomina-periodo.models';

const TRANSICIONES: Record<EstadoNomina, readonly EstadoNomina[]> = {
  borrador: ['dotacion_generada', 'anulada'],
  dotacion_generada: ['en_revision', 'anulada'],
  en_revision: ['calculada', 'anulada'],
  calculada: ['en_revision', 'validada', 'anulada'],
  validada: ['en_revision', 'aprobada', 'anulada'],
  aprobada: ['en_revision', 'cerrada', 'anulada'],
  cerrada: ['reabierta'],
  reabierta: ['en_revision', 'calculada', 'validada', 'aprobada', 'cerrada', 'anulada'],
  anulada: [],
};

export function puedeTransicionarNomina(origen: EstadoNomina, destino: EstadoNomina): boolean {
  return origen === destino || TRANSICIONES[origen].includes(destino);
}

export function exigirTransicionNomina(origen: EstadoNomina, destino: EstadoNomina): void {
  if (!puedeTransicionarNomina(origen, destino)) {
    throw new Error(`Transición de nómina no permitida: ${origen} → ${destino}.`);
  }
}

export function estadoNominaBloqueaEdicion(estado: EstadoNomina): boolean {
  return estado === 'cerrada' || estado === 'anulada';
}

export function proximoPasoNomina(estado: EstadoNomina): PasoSiguienteNomina {
  switch (estado) {
    case 'borrador': return 'parametros';
    case 'dotacion_generada': return 'dotacion';
    case 'en_revision':
    case 'reabierta': return 'movimientos';
    case 'calculada': return 'validacion';
    case 'validada': return 'cierre';
    case 'aprobada': return 'cierre';
    case 'cerrada': return 'liquidaciones';
    case 'anulada': return 'sin_accion';
  }
}

export function nominaRequiereAccion(estado: EstadoNomina): boolean {
  return estado !== 'cerrada' && estado !== 'anulada';
}

export function prioridadNomina(resumen: NominaPeriodoResumen): number {
  if (resumen.totalIncidenciasCriticas > 0) return 0;
  if (resumen.estado === 'aprobada' || resumen.estado === 'reabierta') return 1;
  if (nominaRequiereAccion(resumen.estado)) return 2;
  return 3;
}
