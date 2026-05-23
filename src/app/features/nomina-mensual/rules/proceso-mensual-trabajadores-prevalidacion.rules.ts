import type { EmpleadoEstado, EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { CrearEmpleadoPayload } from '../../empleados/models/empleado-payload.model';
import {
  evaluarCompletitudYAptitudEmpleado,
  type EvaluacionCompletitudEmpleado,
} from '../../empleados/utils/empleado-completitud.rules';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { entradaBloqueaProceso } from '../entradas/rules/entradas-mensuales-periodo.rules';
import type { TrabajadorPendienteRevisionPeriodo } from '../models/proceso-mensual.model';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import type { NominaMasivaFila } from './proceso-mensual-masivo-layout.rules';

export const LIMITE_MODAL_TRABAJADORES_PENDIENTES = 8;
export const CODIGO_INCIDENCIA_FICHA_PENDIENTE = 'FICHA_PENDIENTE_REVISION';

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

export interface AptitudOperativaNominaTrabajador {
  aptoFicha: boolean;
  listoParaNomina: boolean;
  bloqueadoParaNomina: boolean;
  motivo: string;
  detalleCorreccion: string;
}

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
  return empleado.estado === 'activo' && !evaluarAptitudOperativaNominaTrabajador(empleado).listoParaNomina;
}

function motivoFichaTrabajador(empleado: EmpleadoListado): string {
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

export function motivoTrabajadorPendienteRevision(
  empleado: EmpleadoListado,
  entradasPeriodo: readonly EntradaMensualPeriodo[] = [],
): string {
  const aptitud = evaluarAptitudOperativaNominaTrabajador(empleado, entradasPeriodo);
  return aptitud.motivo || 'Revisar ficha';
}

function normalizarTextoBloqueo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Humaniza el primer bloqueo de completitud para copy RRHH. */
export function humanizarBloqueoCompletitudFicha(bloqueo: string): string {
  const normalized = normalizarTextoBloqueo(bloqueo);

  if (normalized.includes('alta avanzada')) return 'Continuar alta avanzada.';
  if (normalized.includes('alta basica')) return 'Completar la ficha por secciones.';
  if (normalized.includes('rut')) return 'Registrar un RUT valido.';
  if (normalized.includes('nombres') || normalized.includes('apellido') || normalized.includes('pais')) {
    return 'Completar datos personales.';
  }
  if (normalized.includes('contrato') || normalized.includes('fecha de ingreso')) {
    return 'Completar contrato activo.';
  }
  if (normalized.includes('apvi') || normalized.includes('tiene apvi')) {
    return 'Completar APVI o desactivar la opcion.';
  }
  if (normalized.includes('cargo') || normalized.includes('sin cargo')) return 'Definir un cargo real.';
  if (normalized.includes('jornada') || normalized.includes('trabajador')) return 'Completar jornada laboral.';
  if (normalized.includes('remuneracion') || normalized.includes('sueldo')) return 'Ingresar sueldo base valido.';
  if (
    normalized.includes('previsional') ||
    normalized.includes('prevision') ||
    normalized.includes('afp') ||
    normalized.includes('salud') ||
    normalized.includes('regimen') ||
    normalized.includes('institucion de salud')
  ) {
    return 'Completar prevision y salud.';
  }
  if (normalized.includes('draft') || normalized.includes('temporal') || normalized.includes('reemplaza la cuenta')) {
    return 'Reemplazar la cuenta bancaria temporal.';
  }
  if (normalized.includes('banco') || normalized.includes('cuenta bancaria') || normalized.includes('cuenta real')) {
    return 'Registrar cuenta bancaria real.';
  }

  const limpio = bloqueo.trim();
  if (!limpio) return 'Revisar la ficha del trabajador.';
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
    rut: empleado.rut ?? '',
    nombres: empleado.nombre ?? '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'no_informa',
    estadoCivil: 'soltero',
    pasaporte: null,
    cargas: 0,
    email: '',
    telefono: '',
    direccion: '',
    numeroDireccion: null,
    departamentoDireccion: null,
    observacionesDireccion: null,
    idComuna: null,
    idPais: 0,
    idSucursal: null,
    idDepartamentoEmpresa: null,
    idCentroCosto: null,
    cargo: empleado.cargo ?? '',
    fechaContrato: empleado.fechaIngreso ?? '',
    tipoContrato: 'indefinido',
    idTipoTrabajador: 0,
    idTipoJornada: 0,
    seguroCesantia: false,
    excluidoLimiteJornada: false,
    causalExclusionJornada: null,
    justificacionExclusionJornada: null,
    casaParticularModalidad: null,
    casaParticularLabores: null,
    casaParticularDomicilioEspecifico: null,
    casaParticularAsistenciaCuidado: false,
    casaParticularRegistroDtEstado: null,
    casaParticularRegistroDtFecha: null,
    casaParticularRegistroDtFolio: null,
    fechaIngreso: empleado.fechaIngreso ?? '',
    fechaTermino: null,
    sueldoBase: empleado.sueldoBase ?? 0,
    idMoneda: null,
    sueldoVariable: false,
    horasSemanales: 0,
    diasSemanales: 0,
    distribucionJornada: null,
    tiempoColacionMinutos: null,
    tipoGratificacion: 'legal',
    gratificacionProporcional: false,
    semanaCorridaActiva: false,
    semanaCorridaDiasLaborables: [],
    zonaExtremaActiva: false,
    zonaExtremaTerritorio: null,
    zonaExtremaPorcentaje: null,
    idTramoCarga: null,
    condicionesTrabajador: [],
    tipoPrevision: 'afp',
    idRegimenPrevisional: null,
    idAfp: null,
    idMonedaCuenta2: null,
    valorCuenta2: null,
    idEntidadPrevisionalIps: null,
    idExCajaPrevisional: null,
    idRegimenExCaja: null,
    nombreExCaja: null,
    regimenExCaja: null,
    tasaExCaja: null,
    idSalud: null,
    tipoSalud: null,
    idMonedaPlan: null,
    valorPlan: null,
    adicionalAugeGes: null,
    tieneApv: false,
    idInstitucionApv: null,
    idMonedaApv: null,
    montoApv: null,
    idFormaPagoApv: null,
    depositoConvenidoApvi: null,
    idBanco: 0,
    idTipoCuentaBancaria: 0,
    numeroCuenta: '',
  } as unknown as CrearEmpleadoPayload;
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
  const bloqueos = asArray(evaluacionEfectiva?.bloqueos);
  if (bloqueos.length) {
    return humanizarBloqueoCompletitudFicha(bloqueos[0]);
  }
  if (empleado.pasoAltaAvanzada !== null) return 'Continuar alta avanzada.';
  if (empleado.estadoFicha === 'BORRADOR') return 'Completar la ficha en borrador.';
  if (empleado.estadoFicha === 'INCOMPLETO') {
    return 'Revisar datos personales, contrato, remuneracion, prevision y pago.';
  }
  if (!empleado.aptoParaRemuneraciones) return 'Completar la ficha para habilitar remuneraciones.';
  return 'Revisar la ficha del trabajador.';
}

export function evaluarAptitudOperativaNominaTrabajador(
  empleado: EmpleadoListado,
  entradasPeriodo: readonly EntradaMensualPeriodo[] = [],
): AptitudOperativaNominaTrabajador {
  const entradas = asArray(entradasPeriodo);
  const entradasBloqueantes = entradas.filter(entradaBloqueaProceso).length;
  const aptoFicha = empleado.aptoParaRemuneraciones && empleado.estadoFicha === 'VALIDO';
  const motivos: string[] = [];
  const detalles: string[] = [];

  if (empleado.estado !== 'activo') {
    const etiqueta = ETIQUETA_ESTADO_LABORAL[empleado.estado] ?? empleado.estado;
    motivos.push(`Estado laboral: ${etiqueta}`);
    detalles.push('Activar el trabajador antes de incluirlo en nomina.');
  }
  if (!aptoFicha) {
    motivos.push(motivoFichaTrabajador(empleado));
    detalles.push(buildDetalleCorreccionFicha(empleado));
  }
  if (empleado.idContrato == null) {
    motivos.push('Contrato no disponible');
    detalles.push('Registrar o corregir el contrato vigente.');
  }
  if (entradasBloqueantes > 0) {
    motivos.push(`${entradasBloqueantes} entrada(s) bloqueante(s)`);
    detalles.push('Corregir movimientos o recurrentes bloqueantes del periodo.');
  }

  const listoParaNomina =
    empleado.estado === 'activo' &&
    aptoFicha &&
    empleado.idContrato != null &&
    entradasBloqueantes === 0;

  return {
    aptoFicha,
    listoParaNomina,
    bloqueadoParaNomina: !listoParaNomina,
    motivo: motivos.length ? motivos.join(' · ') : '',
    detalleCorreccion: detalles.find((detalle) => detalle.trim()) ?? 'Revisar la ficha del trabajador.',
  };
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
  entradasPeriodo: readonly EntradaMensualPeriodo[] = [],
): TrabajadorPendienteRevisionPeriodo[] {
  const entradasPorPersona = new Map<number, EntradaMensualPeriodo[]>();
  for (const entrada of asArray(entradasPeriodo)) {
    const personaEntradas = entradasPorPersona.get(entrada.idPersona) ?? [];
    personaEntradas.push(entrada);
    entradasPorPersona.set(entrada.idPersona, personaEntradas);
  }

  return asArray(listado)
    .filter((empleado) => empleado.estado === 'activo')
    .map((empleado) => ({
      empleado,
      aptitud: evaluarAptitudOperativaNominaTrabajador(empleado, entradasPorPersona.get(empleado.id) ?? []),
    }))
    .filter(({ aptitud }) => !aptitud.listoParaNomina)
    .map(({ empleado, aptitud }) => ({
      idPersona: empleado.id,
      nombre: empleado.nombre?.trim() || 'Sin nombre',
      rut: empleado.rut?.trim() || '-',
      motivo: aptitud.motivo || motivoTrabajadorPendienteRevision(empleado),
      detalleCorreccion: aptitud.detalleCorreccion,
      estadoFicha: empleado.estadoFicha,
      aptoParaRemuneraciones: empleado.aptoParaRemuneraciones,
      aptoFicha: aptitud.aptoFicha,
      listoParaNomina: aptitud.listoParaNomina,
      bloqueanteParaNomina: aptitud.bloqueadoParaNomina,
      motivoBloqueoNomina: aptitud.motivo,
    }))
    .sort((a, b) => {
      const prioridadA = a.aptoFicha ? 1 : 0;
      const prioridadB = b.aptoFicha ? 1 : 0;
      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
}

export function formatTrabajadorPendienteRevisionLinea(trabajador: TrabajadorPendienteRevisionPeriodo): string {
  return `${trabajador.nombre} · ${trabajador.rut} - ${trabajador.motivo}`;
}

export function buildItemsTrabajadoresPendientesModal(
  trabajadores: readonly TrabajadorPendienteRevisionPeriodo[],
  limite = LIMITE_MODAL_TRABAJADORES_PENDIENTES,
): string[] {
  const trabajadoresLista = asArray(trabajadores);
  const visibles = trabajadoresLista.slice(0, limite).map(formatTrabajadorPendienteRevisionLinea);
  const restantes = trabajadoresLista.length - limite;
  if (restantes > 0) {
    visibles.push(`... y ${restantes} mas en la pestaña Trabajadores`);
  }
  return visibles;
}

export function rutaFichaEmpleadoPendiente(idPersona: number | string): string {
  return `/empleados/${idPersona}`;
}

export function buildFilasMasivasDesdePendientesRevision(
  pendientes: readonly TrabajadorPendienteRevisionPeriodo[],
): NominaMasivaFila[] {
  return asArray(pendientes).map((t) => ({
    idPersona: t.idPersona,
    trabajador: t.nombre,
    rut: t.rut,
    estado: t.bloqueanteParaNomina === false ? 'observacion' : 'bloqueado',
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
  return asArray(pendientes).map((t) => ({
    id: CODIGO_INCIDENCIA_FICHA_PENDIENTE,
    severidad: t.bloqueanteParaNomina === false ? 'advertencia' : 'bloqueo',
    ambito: 'trabajadores',
    titulo: t.bloqueanteParaNomina === false ? 'Ficha por corregir' : 'Trabajador bloqueado para nomina',
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
  for (const fila of asArray(base)) {
    map.set(String(fila.idPersona), fila);
  }
  for (const fila of asArray(pendientes)) {
    map.set(String(fila.idPersona), fila);
  }
  return [...map.values()].sort((a, b) => a.trabajador.localeCompare(b.trabajador, 'es', { sensitivity: 'base' }));
}
