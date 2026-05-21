import type { EmpleadoEstado, EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { CrearEmpleadoPayload } from '../../empleados/models/empleado-payload.model';
import {
  evaluarCompletitudYAptitudEmpleado,
  type EvaluacionCompletitudEmpleado,
} from '../../empleados/utils/empleado-completitud.rules';
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

function normalizarTextoBloqueo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Humaniza el primer bloqueo de completitud para copy RRHH (sin tecnicismos). */
export function humanizarBloqueoCompletitudFicha(bloqueo: string): string {
  const normalized = normalizarTextoBloqueo(bloqueo);

  if (normalized.includes('alta avanzada')) {
    return 'Continuar alta avanzada.';
  }
  if (normalized.includes('alta basica') || normalized.includes('alta básica')) {
    return 'Completar la ficha por secciones.';
  }
  if (normalized.includes('rut')) {
    return 'Registrar un RUT válido.';
  }
  if (normalized.includes('nombres') || normalized.includes('apellido') || normalized.includes('pais')) {
    return 'Completar datos personales.';
  }
  if (normalized.includes('contrato') || normalized.includes('fecha de ingreso')) {
    return 'Completar contrato activo.';
  }
  if (normalized.includes('apvi') || normalized.includes('tiene apvi')) {
    return 'Completar APVI o desactivar la opción.';
  }
  if (normalized.includes('cargo') || normalized.includes('sin cargo')) {
    return 'Definir un cargo real.';
  }
  if (normalized.includes('jornada') || normalized.includes('trabajador')) {
    return 'Completar jornada laboral.';
  }
  if (normalized.includes('remuneracion') || normalized.includes('sueldo')) {
    return 'Ingresar sueldo base válido.';
  }
  if (
    normalized.includes('previsional')
    || normalized.includes('prevision')
    || normalized.includes('afp')
    || normalized.includes('salud')
    || normalized.includes('regimen')
    || normalized.includes('institucion de salud')
  ) {
    return 'Completar previsión y salud.';
  }
  if (
    normalized.includes('draft')
    || normalized.includes('temporal')
    || normalized.includes('reemplaza la cuenta')
  ) {
    return 'Reemplazar la cuenta bancaria temporal.';
  }
  if (normalized.includes('banco') || normalized.includes('cuenta bancaria') || normalized.includes('cuenta real')) {
    return 'Registrar cuenta bancaria real.';
  }

  const limpio = bloqueo.trim();
  if (!limpio) {
    return 'Revisar la ficha del trabajador.';
  }
  return limpio.endsWith('.') ? limpio : `${limpio}.`;
}

function evaluarCompletitudDesdeListado(
  empleado: EmpleadoListado,
): EvaluacionCompletitudEmpleado | undefined {
  if (empleado.pasoAltaAvanzada === null) {
    return undefined;
  }
  const payloadMinimo = {
    estado: 'activo',
    origenCreacion: 'avanzado',
  } as CrearEmpleadoPayload;
  return evaluarCompletitudYAptitudEmpleado({
    payload: payloadMinimo,
    pasoAltaAvanzada: empleado.pasoAltaAvanzada,
  });
}

export function buildDetalleCorreccionFicha(
  empleado: EmpleadoListado,
  evaluacion?: EvaluacionCompletitudEmpleado | null,
): string {
  const evaluacionEfectiva = evaluacion ?? evaluarCompletitudDesdeListado(empleado);
  if (evaluacionEfectiva?.bloqueos.length) {
    return humanizarBloqueoCompletitudFicha(evaluacionEfectiva.bloqueos[0]);
  }
  if (empleado.pasoAltaAvanzada !== null) {
    return 'Continuar alta avanzada.';
  }
  if (empleado.estadoFicha === 'BORRADOR') {
    return 'Completar la ficha en borrador.';
  }
  if (empleado.estadoFicha === 'INCOMPLETO') {
    return 'Revisar datos personales, contrato, remuneración, previsión y pago.';
  }
  if (!empleado.aptoParaRemuneraciones) {
    return 'Completar la ficha para habilitar remuneraciones.';
  }
  return 'Revisar la ficha del trabajador.';
}

export function detalleIncidenciaFichaPendiente(trabajador: TrabajadorPendienteRevisionPeriodo): string {
  const detalle = trabajador.detalleCorreccion?.trim();
  if (detalle && detalle !== trabajador.motivo) {
    return `${trabajador.motivo}. ${detalle}`;
  }
  return detalle || trabajador.motivo;
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
      detalleCorreccion: buildDetalleCorreccionFicha(empleado),
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
    detalle: detalleIncidenciaFichaPendiente(t),
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
