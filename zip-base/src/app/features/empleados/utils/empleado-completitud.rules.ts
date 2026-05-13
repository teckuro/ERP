import { EmpleadoEstadoFicha } from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import { parseRut } from './empleado-rut';

export interface EvaluacionCompletitudEmpleado {
  estadoFicha: EmpleadoEstadoFicha;
  aptoParaRemuneraciones: boolean;
  bloqueos: string[];
  advertencias: string[];
  defaultsTecnicosDetectados: string[];
  seccionesPendientes: string[];
}

export interface EvaluarCompletitudEmpleadoInput {
  payload: CrearEmpleadoPayload;
  pasoAltaAvanzada?: number | null;
}

export class EmpleadoAptitudInvalidaError extends Error {
  constructor(readonly evaluacion: EvaluacionCompletitudEmpleado) {
    super(buildAptitudErrorMessage(evaluacion));
    this.name = 'EmpleadoAptitudInvalidaError';
  }
}

export function evaluarCompletitudYAptitudEmpleado(
  input: EvaluarCompletitudEmpleadoInput,
): EvaluacionCompletitudEmpleado {
  const { payload, pasoAltaAvanzada = null } = input;
  const bloqueos: string[] = [];
  const advertencias: string[] = [];
  const defaultsTecnicosDetectados: string[] = [];
  const seccionesPendientes = new Set<string>();

  const bloquear = (seccion: string, mensaje: string): void => {
    bloqueos.push(mensaje);
    seccionesPendientes.add(seccion);
  };

  const detectarDefault = (seccion: string, codigo: string, mensaje: string): void => {
    defaultsTecnicosDetectados.push(codigo);
    bloquear(seccion, mensaje);
  };

  if (pasoAltaAvanzada !== null) {
    bloquear(
      'alta avanzada',
      'Continua el alta avanzada antes de validar la ficha para remuneraciones.',
    );
  }

  if (payload.origenCreacion === 'basico') {
    bloquear('alta basica', 'Completa la ficha por secciones antes de habilitar remuneraciones.');
  }

  if (payload.estado !== 'activo') {
    bloquear('estado', 'La ficha debe quedar activa antes de habilitar remuneraciones.');
  }

  validarIdentidad(payload, bloquear);
  validarContrato(payload, bloquear, detectarDefault);
  validarJornada(payload, bloquear, detectarDefault);
  validarRemuneracion(payload, bloquear, detectarDefault);
  validarPrevisionSalud(payload, bloquear, detectarDefault);
  validarPago(payload, bloquear, detectarDefault);

  const aptoParaRemuneraciones = bloqueos.length === 0;

  return {
    estadoFicha: aptoParaRemuneraciones ? 'VALIDO' : 'INCOMPLETO',
    aptoParaRemuneraciones,
    bloqueos: unique(bloqueos),
    advertencias: unique(advertencias),
    defaultsTecnicosDetectados: unique(defaultsTecnicosDetectados),
    seccionesPendientes: [...seccionesPendientes],
  };
}

export function assertEmpleadoAptoParaRemuneraciones(
  evaluacion: EvaluacionCompletitudEmpleado,
): void {
  if (!evaluacion.aptoParaRemuneraciones) {
    throw new EmpleadoAptitudInvalidaError(evaluacion);
  }
}

function validarIdentidad(
  payload: CrearEmpleadoPayload,
  bloquear: (seccion: string, mensaje: string) => void,
): void {
  try {
    parseRut(payload.rut);
  } catch {
    bloquear('identidad', 'Ingresa un RUT valido antes de activar la ficha.');
  }

  if (!hasText(payload.nombres)) {
    bloquear('identidad', 'Ingresa los nombres antes de activar la ficha.');
  }

  if (!hasText(payload.apellidoPaterno)) {
    bloquear('identidad', 'Ingresa el apellido paterno antes de activar la ficha.');
  }

  if (!hasText(payload.fechaNacimiento)) {
    bloquear('identidad', 'Ingresa la fecha de nacimiento antes de activar la ficha.');
  }

  if (!isPositiveId(payload.idPais)) {
    bloquear('identidad', 'Selecciona el pais antes de activar la ficha.');
  }
}

function validarContrato(
  payload: CrearEmpleadoPayload,
  bloquear: (seccion: string, mensaje: string) => void,
  detectarDefault: (seccion: string, codigo: string, mensaje: string) => void,
): void {
  if (!hasText(payload.fechaIngreso)) {
    bloquear('contrato', 'Ingresa una fecha de ingreso real antes de activar la ficha.');
  }

  if (!hasText(payload.fechaContrato)) {
    bloquear('contrato', 'Ingresa una fecha de contrato real antes de activar la ficha.');
  }

  if (!hasText(payload.tipoContrato)) {
    bloquear('contrato', 'Selecciona el tipo de contrato antes de activar la ficha.');
  }

  if (!hasText(payload.cargo)) {
    bloquear('contrato', 'Define un cargo real antes de activar la ficha.');
  } else if (normalize(payload.cargo) === normalize('Sin cargo')) {
    detectarDefault('contrato', 'cargo:sin-cargo', 'Define un cargo real antes de activar la ficha.');
  }
}

function validarJornada(
  payload: CrearEmpleadoPayload,
  bloquear: (seccion: string, mensaje: string) => void,
  detectarDefault: (seccion: string, codigo: string, mensaje: string) => void,
): void {
  if (!isPositiveId(payload.idTipoTrabajador)) {
    detectarDefault(
      'jornada',
      'tipo-trabajador:default',
      'Selecciona un tipo de trabajador real antes de activar la ficha.',
    );
  }

  if (!isPositiveId(payload.idTipoJornada)) {
    detectarDefault(
      'jornada',
      'tipo-jornada:default',
      'Selecciona un tipo de jornada real antes de activar la ficha.',
    );
  }

  if (!isPositiveNumber(payload.horasSemanales)) {
    bloquear('jornada', 'Ingresa una jornada semanal valida antes de activar la ficha.');
  }

  if (!isPositiveNumber(payload.diasSemanales)) {
    bloquear('jornada', 'Ingresa dias semanales validos antes de activar la ficha.');
  }
}

function validarRemuneracion(
  payload: CrearEmpleadoPayload,
  bloquear: (seccion: string, mensaje: string) => void,
  detectarDefault: (seccion: string, codigo: string, mensaje: string) => void,
): void {
  if (!isPositiveNumber(payload.sueldoBase)) {
    detectarDefault(
      'remuneracion',
      'sueldo-base:invalido',
      'Ingresa una remuneracion base valida antes de activar la ficha.',
    );
  }

  if (!isPositiveId(payload.idMoneda)) {
    bloquear('remuneracion', 'Selecciona la moneda de remuneracion antes de activar la ficha.');
  }
}

function validarPrevisionSalud(
  payload: CrearEmpleadoPayload,
  bloquear: (seccion: string, mensaje: string) => void,
  detectarDefault: (seccion: string, codigo: string, mensaje: string) => void,
): void {
  if (!hasText(payload.tipoPrevision)) {
    bloquear('prevision y salud', 'Selecciona el regimen previsional antes de activar la ficha.');
    return;
  }

  if (payload.tipoPrevision === 'NINGUNA') {
    bloquear(
      'prevision y salud',
      'La opcion "Sin prevision" no habilita calculo de nomina. Selecciona AFP o IPS antes de validar para remuneraciones.',
    );
    return;
  }

  if (!isPositiveId(payload.idRegimenPrevisional)) {
    bloquear('prevision y salud', 'Selecciona un regimen previsional valido antes de activar la ficha.');
  }

  if (payload.tipoPrevision === 'AFP') {
    if (!isPositiveId(payload.idAfp)) {
      bloquear('prevision y salud', 'Selecciona la AFP antes de activar la ficha.');
    }

    validarSalud(payload, bloquear);
    validarApvi(payload, detectarDefault);
    return;
  }

  if (payload.tipoPrevision === 'IPS') {
    const tieneIpsCatalogo =
      isPositiveId(payload.idEntidadPrevisionalIps) &&
      isPositiveId(payload.idExCajaPrevisional) &&
      isPositiveId(payload.idRegimenExCaja);
    const tieneIpsManual =
      hasText(payload.nombreExCaja) &&
      hasText(payload.regimenExCaja) &&
      isPositiveNumber(payload.tasaExCaja);

    if (!tieneIpsCatalogo && !tieneIpsManual) {
      bloquear('prevision y salud', 'Completa la informacion IPS o Ex-Caja antes de activar la ficha.');
    }

    validarSalud(payload, bloquear);
  }
}

function validarSalud(
  payload: CrearEmpleadoPayload,
  bloquear: (seccion: string, mensaje: string) => void,
): void {
  if (!isPositiveId(payload.idSalud)) {
    bloquear('prevision y salud', 'Selecciona la institucion de salud antes de activar la ficha.');
  }

  if (!isPositiveId(payload.idMonedaPlan)) {
    bloquear('prevision y salud', 'Selecciona la moneda del plan de salud antes de activar la ficha.');
  }

  if (payload.valorPlan === null || Number.isNaN(payload.valorPlan) || payload.valorPlan < 0) {
    bloquear('prevision y salud', 'Ingresa un valor de plan de salud valido antes de activar la ficha.');
  }

  if (
    payload.adicionalAugeGes === null ||
    Number.isNaN(payload.adicionalAugeGes) ||
    payload.adicionalAugeGes < 0
  ) {
    bloquear('prevision y salud', 'Ingresa el adicional Auge/GES antes de activar la ficha.');
  }
}

function validarApvi(
  payload: CrearEmpleadoPayload,
  detectarDefault: (seccion: string, codigo: string, mensaje: string) => void,
): void {
  if (!payload.tieneApv) {
    return;
  }

  const incompleto =
    !isPositiveId(payload.idInstitucionApv) ||
    !isPositiveId(payload.idMonedaApv) ||
    !isPositiveNumber(payload.montoApv) ||
    !isPositiveId(payload.idFormaPagoApv) ||
    payload.depositoConvenidoApvi === null ||
    Number.isNaN(payload.depositoConvenidoApvi) ||
    payload.depositoConvenidoApvi < 0;

  if (incompleto) {
    detectarDefault(
      'APVI',
      'apvi:incompleto',
      'Completa APVI o desactiva la opcion Tiene APVI.',
    );
  }
}

function validarPago(
  payload: CrearEmpleadoPayload,
  bloquear: (seccion: string, mensaje: string) => void,
  detectarDefault: (seccion: string, codigo: string, mensaje: string) => void,
): void {
  if (!isPositiveId(payload.idBanco)) {
    detectarDefault('pago', 'banco:default', 'Selecciona un banco real antes de activar la ficha.');
  }

  if (!isPositiveId(payload.idTipoCuentaBancaria)) {
    detectarDefault(
      'pago',
      'tipo-cuenta:default',
      'Selecciona un tipo de cuenta real antes de activar la ficha.',
    );
  }

  if (!hasText(payload.numeroCuenta)) {
    bloquear('pago', 'Ingresa una cuenta bancaria real antes de activar la ficha.');
  } else if (payload.numeroCuenta.trim().toUpperCase().startsWith('DRAFT-')) {
    detectarDefault(
      'pago',
      'cuenta-bancaria:draft',
      'Reemplaza la cuenta bancaria temporal antes de finalizar.',
    );
  }
}

function buildAptitudErrorMessage(evaluacion: EvaluacionCompletitudEmpleado): string {
  const firstBlock = evaluacion.bloqueos[0];
  if (!firstBlock) {
    return 'La ficha no cumple el contrato de aptitud para remuneraciones.';
  }

  const suffix =
    evaluacion.bloqueos.length > 1
      ? ` Ademas hay ${evaluacion.bloqueos.length - 1} bloqueo(s) pendiente(s).`
      : '';
  return `${firstBlock}${suffix}`;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveId(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
