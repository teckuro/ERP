import type { EmpleadoEstado, EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { TrabajadorPendienteRevisionPeriodo } from '../models/proceso-mensual.model';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import type { NominaMasivaFila } from './proceso-mensual-masivo-layout.rules';

export const LIMITE_MODAL_TRABAJADORES_PENDIENTES = 8;
export const CODIGO_INCIDENCIA_FICHA_PENDIENTE = 'FICHA_PENDIENTE_REVISION';

const ETIQUETA_ESTADO_LABORAL: Partial<Record<EmpleadoEstado, string>> = {
  borrador: 'Borrador',
  en_proceso: 'En proceso',
  activo: 'Activo',
  suspendido: 'Suspendido',
  inactivo: 'Inactivo',
  desvinculado: 'Desvinculado',
  bloqueado: 'Bloqueado',
};

export function esTrabajadorActivoPendienteRevision(empleado: EmpleadoListado): boolean {
  return (
    empleado.estado === 'activo'
    && (!empleado.aptoParaRemuneraciones || empleado.estadoFicha !== 'VALIDO')
  );
}

export function motivoTrabajadorPendienteRevision(empleado: EmpleadoListado): string {
  const partes: string[] = [];
  if (empleado.estadoFicha === 'BORRADOR') {
    partes.push('Ficha en borrador');
  } else if (empleado.estadoFicha === 'INCOMPLETO') {
    partes.push('Ficha incompleta');
  }
  if (!empleado.aptoParaRemuneraciones) {
    partes.push('No apto para remuneraciones');
  }
  if (empleado.estado !== 'activo') {
    const etiqueta = ETIQUETA_ESTADO_LABORAL[empleado.estado] ?? empleado.estado;
    partes.push(`Estado laboral: ${etiqueta}`);
  }
  return partes.length ? partes.join(' · ') : 'Revisar ficha';
}

export function buildTrabajadoresPendientesRevision(
  listado: readonly EmpleadoListado[],
): TrabajadorPendienteRevisionPeriodo[] {
  return listado
    .filter(esTrabajadorActivoPendienteRevision)
    .map((empleado) => ({
      idPersona: empleado.id,
      nombre: empleado.nombre?.trim() || 'Sin nombre',
      rut: empleado.rut?.trim() || '—',
      motivo: motivoTrabajadorPendienteRevision(empleado),
      estadoFicha: empleado.estadoFicha,
      aptoParaRemuneraciones: empleado.aptoParaRemuneraciones,
    }))
    .sort((a, b) => {
      const prioridadA = a.aptoParaRemuneraciones ? 1 : 0;
      const prioridadB = b.aptoParaRemuneraciones ? 1 : 0;
      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
}

export function formatTrabajadorPendienteRevisionLinea(trabajador: TrabajadorPendienteRevisionPeriodo): string {
  return `${trabajador.nombre} · ${trabajador.rut} — ${trabajador.motivo}`;
}

export function buildItemsTrabajadoresPendientesModal(
  trabajadores: readonly TrabajadorPendienteRevisionPeriodo[],
  limite = LIMITE_MODAL_TRABAJADORES_PENDIENTES,
): string[] {
  const visibles = trabajadores.slice(0, limite).map(formatTrabajadorPendienteRevisionLinea);
  const restantes = trabajadores.length - limite;
  if (restantes > 0) {
    visibles.push(`… y ${restantes} más en la pestaña Trabajadores`);
  }
  return visibles;
}

export function rutaFichaEmpleadoPendiente(idPersona: number | string): string {
  return `/empleados/${idPersona}`;
}

export function buildFilasMasivasDesdePendientesRevision(
  pendientes: readonly TrabajadorPendienteRevisionPeriodo[],
): NominaMasivaFila[] {
  return pendientes.map((t) => ({
    idPersona: t.idPersona,
    trabajador: t.nombre,
    rut: t.rut,
    estado: 'observacion',
    haberes: null,
    descuentos: null,
    liquidoEstimado: null,
    pendientes: 1,
    incidenciasCount: 1,
    movimientosCount: 0,
    tieneMovimientos: false,
    tieneRecurrentes: false,
  }));
}

export function buildIncidenciasFichaPendiente(
  pendientes: readonly TrabajadorPendienteRevisionPeriodo[],
): IncidenciaPeriodo[] {
  return pendientes.map((t) => ({
    id: CODIGO_INCIDENCIA_FICHA_PENDIENTE,
    severidad: 'advertencia',
    ambito: 'trabajadores',
    titulo: 'Ficha por corregir',
    detalle: t.motivo,
    origen: 'prevalidacion',
    prioridad: 2,
    idPersona: t.idPersona,
    accion: {
      tipo: 'ruta',
      label: 'Completar ficha',
      destino: rutaFichaEmpleadoPendiente(t.idPersona),
    },
  }));
}

export function mergeFilasMasivasConPendientesRevision(
  base: readonly NominaMasivaFila[],
  pendientes: readonly NominaMasivaFila[],
): NominaMasivaFila[] {
  const map = new Map<string, NominaMasivaFila>();
  for (const fila of base) {
    map.set(String(fila.idPersona), fila);
  }
  for (const fila of pendientes) {
    map.set(String(fila.idPersona), fila);
  }
  return [...map.values()].sort((a, b) => a.trabajador.localeCompare(b.trabajador, 'es', { sensitivity: 'base' }));
}
