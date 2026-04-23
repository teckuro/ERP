import { TablesInsert, TablesUpdate } from '../../../core/models/database.types';
import { EmpleadoListado } from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import { formatDate } from './empleado-listado.mapper';
import { RutParts, formatRutParts } from '../utils/empleado-rut';
import {
  mapEmpleadoEstadoToContratoEstado,
  mapEmpleadoEstadoToEstadoFicha,
  mapEmpleadoEstadoToPersonaEstado,
} from './empleado-listado.mapper';

export type PersonaInsert = TablesInsert<'persona'>;
export type PersonaUpdate = TablesUpdate<'persona'>;
export type ContratoInsert = TablesInsert<'contrato'>;
export type RemuneracionInsert = TablesInsert<'remuneracion'>;
export type PrevisionInsert = TablesInsert<'prevision'>;
export type SaludTrabajadorInsert = TablesInsert<'salud_trabajador'>;
export type ApvInsert = TablesInsert<'apv'>;
export type Cuenta2AfpInsert = TablesInsert<'cuenta2_afp'>;
export type CuentaBancariaInsert = TablesInsert<'cuenta_bancaria'>;
export type ContratoCentroCostoInsert = TablesInsert<'contrato_centro_costo'>;
export type SemanaCorridaInsert = TablesInsert<'semana_corrida'>;
export type ZonaExtremaInsert = TablesInsert<'zona_extrema'>;

export function buildPersonaInsert(payload: CrearEmpleadoPayload, rut: RutParts): PersonaInsert {
  const estadoInicial = payload.origenCreacion === 'avanzado' ? 'en_proceso' : payload.estado;

  return {
    rut: rut.rut,
    dv: rut.dv,
    nombres: payload.nombres.trim(),
    apellido_paterno: payload.apellidoPaterno.trim(),
    apellido_materno: payload.apellidoMaterno.trim() || null,
    fecha_nacimiento: payload.fechaNacimiento,
    sexo: payload.sexo,
    estado_civil: payload.estadoCivil,
    id_pais: payload.idPais,
    email: payload.email.trim(),
    telefono: payload.telefono.trim(),
    pasaporte: payload.pasaporte,
    id_comuna: payload.idComuna,
    direccion: payload.direccion.trim(),
    numero_direccion: payload.numeroDireccion,
    departamento_direccion: payload.departamentoDireccion,
    observaciones_direccion: payload.observacionesDireccion,
    id_tramo_carga: payload.idTramoCarga,
    cargas: payload.cargas,
    estado: mapEmpleadoEstadoToPersonaEstado(estadoInicial),
    estado_ficha: mapEmpleadoEstadoToEstadoFicha(estadoInicial),
    apto_para_remuneraciones: false,
  };
}

export function buildPersonaBasicaInsert(
  payload: CrearEmpleadoPayload,
  rut: RutParts,
): PersonaInsert {
  return {
    ...buildPersonaInsert(payload, rut),
    estado: 'EN_PROCESO',
    estado_ficha: 'INCOMPLETO',
    apto_para_remuneraciones: false,
  };
}

export function buildPersonaActivacionUpdate(
  payload: CrearEmpleadoPayload,
  fechaActivacion: string,
): PersonaUpdate {
  return {
    estado: mapEmpleadoEstadoToPersonaEstado(payload.estado),
    estado_ficha: mapEmpleadoEstadoToEstadoFicha(payload.estado),
    apto_para_remuneraciones: payload.origenCreacion === 'avanzado',
    fecha_activacion: payload.origenCreacion === 'avanzado' ? fechaActivacion : null,
  };
}

export function buildContratoInsert(
  payload: CrearEmpleadoPayload,
  personaId: number,
  empresaId: number,
): ContratoInsert {
  return {
    id_persona: personaId,
    id_empresa: empresaId,
    id_sucursal: payload.idSucursal,
    id_departamento_empresa: payload.idDepartamentoEmpresa,
    id_tipo_trabajador: payload.idTipoTrabajador,
    id_tipo_jornada: payload.idTipoJornada,
    codigo_tipo_contrato: payload.tipoContrato,
    cargo: payload.cargo.trim(),
    seguro_cesantia: payload.seguroCesantia,
    fecha_inicio: payload.fechaIngreso,
    fecha_contrato: payload.fechaContrato,
    fecha_termino: payload.fechaTermino,
    estado: mapEmpleadoEstadoToContratoEstado(payload.estado),
  };
}

export function buildRemuneracionInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): RemuneracionInsert {
  return {
    id_contrato: contratoId,
    sueldo_base: payload.sueldoBase,
    sueldo_variable: payload.sueldoVariable,
    id_moneda: payload.idMoneda,
    horas_semanales: payload.horasSemanales,
    dias_semanales: payload.diasSemanales,
    distribucion_jornada: payload.distribucionJornada,
    tiempo_colacion_minutos: payload.tiempoColacionMinutos,
    tipo_gratificacion: payload.tipoGratificacion,
    gratificacion_proporcional: payload.gratificacionProporcional,
    semana_corrida_activa: payload.semanaCorridaActiva,
    zona_extrema_activa: payload.zonaExtremaActiva,
    vigencia_inicio: payload.fechaIngreso,
  };
}

export function buildPrevisionInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): PrevisionInsert {
  return {
    id_contrato: contratoId,
    id_afp: payload.tipoPrevision === 'AFP' ? payload.idAfp : null,
    id_regimen_previsional: payload.idRegimenPrevisional,
    vigencia_inicio: payload.fechaIngreso,
    tipo_prevision: payload.tipoPrevision,
    nombre_entidad_ips: null,
    monto_ips: null,
    nombre_ex_caja: payload.tipoPrevision === 'IPS' ? payload.nombreExCaja : null,
    regimen_ex_caja: payload.tipoPrevision === 'IPS' ? payload.regimenExCaja : null,
    tasa_ex_caja: payload.tipoPrevision === 'IPS' ? payload.tasaExCaja : null,
    observacion_prevision: null,
    vigencia_fin: null,
  };
}

export function buildSaludTrabajadorInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): SaludTrabajadorInsert | null {
  if (payload.tipoPrevision === 'NINGUNA') {
    return null;
  }

  return {
    id_contrato: contratoId,
    id_salud: payload.idSalud!,
    plan_salud: null,
    id_moneda_plan: payload.idMonedaPlan,
    valor_plan: payload.valorPlan ?? 0,
    adicional_auge_ges: payload.adicionalAugeGes ?? 0,
    observaciones_salud: null,
    vigencia_inicio: payload.fechaIngreso,
  };
}

export function buildCuenta2AfpInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): Cuenta2AfpInsert | null {
  if (
    payload.tipoPrevision !== 'AFP' ||
    payload.idMonedaCuenta2 === null ||
    payload.valorCuenta2 === null
  ) {
    return null;
  }

  return {
    id_contrato: contratoId,
    id_moneda: payload.idMonedaCuenta2,
    monto: payload.valorCuenta2,
    vigente: true,
    vigencia_inicio: payload.fechaIngreso,
    vigencia_fin: null,
    observacion: null,
  };
}

export function buildSemanaCorridaInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): SemanaCorridaInsert | null {
  if (!payload.semanaCorridaActiva) {
    return null;
  }

  return {
    id_contrato: contratoId,
    activa: true,
    dias_laborables: payload.semanaCorridaDiasLaborables,
    vigencia_inicio: payload.fechaIngreso,
    vigencia_fin: null,
  };
}

export function buildZonaExtremaInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): ZonaExtremaInsert | null {
  if (!payload.zonaExtremaActiva || payload.zonaExtremaPorcentaje === null) {
    return null;
  }

  return {
    id_contrato: contratoId,
    porcentaje: payload.zonaExtremaPorcentaje,
    territorio: payload.zonaExtremaTerritorio,
    vigencia_inicio: payload.fechaIngreso,
    vigencia_fin: null,
  };
}

export function buildApvInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): ApvInsert | null {
  if (!payload.tieneApv) {
    return null;
  }

  return {
    id_contrato: contratoId,
    id_institucion_apv: payload.idInstitucionApv!,
    id_moneda: payload.idMonedaApv!,
    monto: payload.montoApv!,
    id_forma_pago_apv: payload.idFormaPagoApv!,
    deposito_convenido_apvi: payload.depositoConvenidoApvi!,
    vigencia_inicio: payload.fechaIngreso,
    vigencia_fin: null,
  };
}

export function buildCuentaBancariaInsert(
  payload: CrearEmpleadoPayload,
  personaId: number,
): CuentaBancariaInsert {
  return {
    id_persona: personaId,
    id_banco: payload.idBanco,
    id_tipo_cuenta_bancaria: payload.idTipoCuentaBancaria,
    numero_cuenta: payload.numeroCuenta.trim(),
    vigencia_inicio: payload.fechaIngreso,
  };
}

export function buildContratoCentroCostoInsert(
  payload: CrearEmpleadoPayload,
  contratoId: number,
): ContratoCentroCostoInsert | null {
  if (payload.idCentroCosto === null) {
    return null;
  }

  return {
    id_contrato: contratoId,
    id_centro_costo: payload.idCentroCosto,
    porcentaje: 100,
  };
}

export function mapCreatedEmpleado(
  payload: CrearEmpleadoPayload,
  personaId: number,
  rut: RutParts,
  departamento: string | null,
): EmpleadoListado {
  return {
    id: personaId,
    idContrato: null,
    rut: formatRutParts(rut),
    nombre: `${payload.nombres} ${payload.apellidoPaterno} ${payload.apellidoMaterno}`
      .replace(/\s+/g, ' ')
      .trim(),
    cargo: payload.cargo.trim(),
    departamento: departamento ?? 'Sin centro de costo',
    fechaIngreso: formatDate(payload.fechaIngreso),
    sueldoBase: payload.sueldoBase,
    estado: payload.estado,
    estadoFicha: mapEmpleadoEstadoToEstadoFicha(payload.estado),
    aptoParaRemuneraciones: payload.estado === 'activo',
  };
}
