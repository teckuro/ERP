import { EmpleadoCatalogOption, EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import { EmpleadoFormGroup } from '../models/empleado-form.model';
import {
  EmpleadoSexo,
  TipoContrato,
  TipoEstadoCivil,
  TipoGratificacion,
  TipoRegimenPrevisional,
} from '../models/empleado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import {
  CONDICIONES_TRABAJADOR_UI,
  CondicionTrabajadorPayload,
} from '../models/empleado-perfil-laboral.model';
import { normalizeText } from '../utils/empleado-form.helpers';

export function mapEmpleadoFormToPayload(
  form: EmpleadoFormGroup,
  catalogos: EmpleadoFormCatalogos,
): CrearEmpleadoPayload {
  const rawValue = form.getRawValue();
  const tipoPrevision = requireTipoRegimenPrevisional(
    rawValue.previsionSalud.tipoRegimenPrevisional,
  );
  const tieneCuenta2 =
    tipoPrevision === 'AFP' &&
    (rawValue.previsionSalud.idMonedaCuenta2 !== null ||
      rawValue.previsionSalud.valorCuenta2 !== null);
  const requiereSalud = tipoPrevision !== 'NINGUNA';
  const tipoSalud = requiereSalud
    ? resolveTipoSalud(rawValue.previsionSalud.idSalud, catalogos)
    : null;
  const esFonasa = tipoSalud === 'FONASA';
  const tieneApvi = tipoPrevision === 'AFP' && rawValue.previsionSalud.tieneApv;

  return {
    origenCreacion: 'avanzado',
    rut: rawValue.datosPersonales.rut,
    nombres: rawValue.datosPersonales.nombres,
    apellidoPaterno: rawValue.datosPersonales.apellidoPaterno,
    apellidoMaterno: rawValue.datosPersonales.apellidoMaterno,
    fechaNacimiento: rawValue.datosPersonales.fechaNacimiento,
    sexo: requireSexo(rawValue.datosPersonales.sexo),
    estadoCivil: requireEstadoCivil(rawValue.datosPersonales.estadoCivil),
    pasaporte: rawValue.datosPersonales.pasaporte.trim() || null,
    idPais: requireSelection(rawValue.datosPersonales.idPais, 'el pais'),
    email: rawValue.contacto.email,
    telefono: rawValue.contacto.telefono,
    direccion: rawValue.contacto.direccion,
    numeroDireccion: rawValue.contacto.numeroDireccion.trim() || null,
    departamentoDireccion: rawValue.contacto.departamentoDireccion.trim() || null,
    observacionesDireccion: rawValue.contacto.observacionesDireccion.trim() || null,
    idComuna: requireSelection(rawValue.contacto.idComuna, 'la comuna'),
    idSucursal: rawValue.contrato.idSucursal,
    idDepartamentoEmpresa: rawValue.contrato.idDepartamentoEmpresa,
    idCentroCosto: rawValue.contrato.idCentroCosto,
    relacionLaboral: rawValue.contrato.relacionLaboral,
    cargo: rawValue.contrato.cargo,
    fechaContrato: rawValue.contrato.fechaContrato,
    tipoContrato: requireTipoContrato(rawValue.contrato.tipoContrato),
    idTipoTrabajador: requireSelection(rawValue.contrato.idTipoTrabajador, 'el tipo de trabajador'),
    idTipoJornada: requireSelection(rawValue.contrato.idTipoJornada, 'el tipo de jornada'),
    seguroCesantia: rawValue.contrato.seguroCesantia,
    excluidoLimiteJornada: rawValue.contrato.excluidoLimiteJornada,
    causalExclusionJornada: rawValue.contrato.excluidoLimiteJornada
      ? rawValue.contrato.causalExclusionJornada
      : null,
    justificacionExclusionJornada: rawValue.contrato.excluidoLimiteJornada
      ? rawValue.contrato.justificacionExclusionJornada.trim() || null
      : null,
    casaParticularModalidad: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularModalidad
      : null,
    casaParticularLabores: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularLabores.trim() || null
      : null,
    casaParticularDomicilioEspecifico: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularDomicilioEspecifico.trim() || null
      : null,
    casaParticularAsistenciaCuidado: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularAsistenciaCuidado
      : false,
    casaParticularRegistroDtEstado: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularRegistroDtEstado
      : null,
    casaParticularRegistroDtFecha:
      rawValue.contrato.tipoContrato === 'CASA_PARTICULAR' &&
      rawValue.contrato.casaParticularRegistroDtEstado === 'REGISTRADO'
        ? rawValue.contrato.casaParticularRegistroDtFecha || null
        : null,
    casaParticularRegistroDtFolio:
      rawValue.contrato.tipoContrato === 'CASA_PARTICULAR' &&
      rawValue.contrato.casaParticularRegistroDtEstado === 'REGISTRADO'
        ? rawValue.contrato.casaParticularRegistroDtFolio.trim() || null
        : null,
    fechaIngreso: rawValue.contrato.fechaIngreso,
    fechaTermino: rawValue.contrato.fechaTermino || null,
    sueldoBase: rawValue.contrato.sueldoBase ?? 0,
    idMoneda: rawValue.contrato.idMoneda,
    sueldoVariable: rawValue.contrato.sueldoVariable,
    horasSemanales: rawValue.contrato.horasSemanales ?? 0,
    cargas: rawValue.contrato.cargas ?? 0,
    diasSemanales: rawValue.contrato.diasSemanales ?? 0,
    distribucionJornada: rawValue.contrato.distribucionJornada.trim() || null,
    tiempoColacionMinutos: rawValue.contrato.tiempoColacionMinutos,
    tipoGratificacion: requireTipoGratificacion(rawValue.contrato.tipoGratificacion),
    gratificacionProporcional: rawValue.contrato.gratificacionProporcional,
    semanaCorridaActiva: rawValue.contrato.semanaCorridaActiva,
    semanaCorridaDiasLaborables: rawValue.contrato.semanaCorridaActiva
      ? requireNonEmptyArray(
          rawValue.contrato.semanaCorridaDiasLaborables,
          'al menos un dia laborable',
        )
      : [],
    zonaExtremaActiva: rawValue.contrato.zonaExtremaActiva,
    zonaExtremaTerritorio: rawValue.contrato.zonaExtremaActiva
      ? requireText(rawValue.contrato.zonaExtremaTerritorio, 'el territorio de zona extrema')
      : null,
    zonaExtremaPorcentaje: rawValue.contrato.zonaExtremaActiva
      ? requireNumber(rawValue.contrato.zonaExtremaPorcentaje, 'el porcentaje de zona extrema')
      : null,
    estado: 'activo',
    idTramoCarga: rawValue.contrato.idTramoCarga,
    condicionesTrabajador: mapCondicionesTrabajadorFromFormValue(rawValue),
    tipoPrevision,
    idRegimenPrevisional: resolveRegimenPrevisionalId(
      tipoPrevision,
      catalogos.regimenesPrevisionales,
    ),
    idAfp:
      tipoPrevision === 'AFP' ? requireSelection(rawValue.previsionSalud.idAfp, 'la AFP') : null,
    idMonedaCuenta2: tieneCuenta2
      ? requireSelection(rawValue.previsionSalud.idMonedaCuenta2, 'la moneda de Cuenta 2')
      : null,
    valorCuenta2: tieneCuenta2
      ? requireNumber(rawValue.previsionSalud.valorCuenta2, 'el valor de Cuenta 2')
      : null,
    idEntidadPrevisionalIps:
      tipoPrevision === 'IPS'
        ? requireSelection(
            rawValue.previsionSalud.idEntidadPrevisionalIps,
            'la entidad previsional IPS',
          )
        : null,
    idExCajaPrevisional:
      tipoPrevision === 'IPS'
        ? requireSelection(rawValue.previsionSalud.idExCajaPrevisional, 'la Ex-Caja')
        : null,
    idRegimenExCaja:
      tipoPrevision === 'IPS'
        ? requireSelection(rawValue.previsionSalud.idRegimenExCaja, 'el regimen Ex-Caja')
        : null,
    nombreExCaja:
      tipoPrevision === 'IPS'
        ? requireText(rawValue.previsionSalud.nombreExCaja, 'el nombre Ex-Caja')
        : null,
    regimenExCaja:
      tipoPrevision === 'IPS'
        ? requireText(rawValue.previsionSalud.regimenExCaja, 'el regimen Ex-Caja')
        : null,
    tasaExCaja:
      tipoPrevision === 'IPS'
        ? requireNumber(rawValue.previsionSalud.tasaExCaja, 'la tasa Ex-Caja')
        : null,
    idSalud: requiereSalud
      ? requireSelection(rawValue.previsionSalud.idSalud, 'la institucion de salud')
      : null,
    tipoSalud,
    idMonedaPlan: requiereSalud
      ? requireSelection(rawValue.previsionSalud.idMonedaPlan, 'la moneda del plan de salud')
      : null,
    valorPlan: requiereSalud
      ? esFonasa
        ? 0
        : requireNumber(rawValue.previsionSalud.valorPlan, 'el valor del plan de salud')
      : null,
    adicionalAugeGes: requiereSalud && !esFonasa
      ? requireNumber(rawValue.previsionSalud.adicionalAugeGes, 'el adicional plan Auge')
      : requiereSalud
        ? 0
        : null,
    tieneApv: tieneApvi,
    idInstitucionApv: tieneApvi
      ? requireSelection(rawValue.previsionSalud.idInstitucionApv, 'la institucion APVI')
      : null,
    idMonedaApv: tieneApvi
      ? requireSelection(rawValue.previsionSalud.idMonedaApv, 'la moneda APVI')
      : null,
    montoApv: tieneApvi ? requireNumber(rawValue.previsionSalud.montoApv, 'el valor APVI') : null,
    idFormaPagoApv: tieneApvi
      ? requireSelection(rawValue.previsionSalud.idFormaPagoApv, 'la forma de pago APVI')
      : null,
    depositoConvenidoApvi: tieneApvi
      ? requireNumber(rawValue.previsionSalud.depositoConvenidoApvi, 'el deposito convenido APVI')
      : null,
    idBanco: requireSelection(rawValue.bancario.idBanco, 'el banco'),
    idTipoCuentaBancaria: requireSelection(
      rawValue.bancario.idTipoCuentaBancaria,
      'el tipo de cuenta bancaria',
    ),
    numeroCuenta: rawValue.bancario.numeroCuenta,
  };
}

export function mapEmpleadoFormToPayloadBasico(form: EmpleadoFormGroup): CrearEmpleadoPayload {
  const rawValue = form.getRawValue();
  const today = new Date().toISOString().slice(0, 10);

  return {
    origenCreacion: 'basico',
    rut: rawValue.datosPersonales.rut,
    nombres: rawValue.datosPersonales.nombres,
    apellidoPaterno: rawValue.datosPersonales.apellidoPaterno,
    apellidoMaterno: rawValue.datosPersonales.apellidoMaterno,
    fechaNacimiento: rawValue.datosPersonales.fechaNacimiento,
    sexo: requireSexo(rawValue.datosPersonales.sexo),
    estadoCivil: requireEstadoCivil(rawValue.datosPersonales.estadoCivil),
    pasaporte: rawValue.datosPersonales.pasaporte.trim() || null,
    cargas: 0,
    email: rawValue.contacto.email,
    telefono: rawValue.contacto.telefono,
    direccion: rawValue.contacto.direccion,
    numeroDireccion: rawValue.contacto.numeroDireccion.trim() || null,
    departamentoDireccion: rawValue.contacto.departamentoDireccion.trim() || null,
    observacionesDireccion: rawValue.contacto.observacionesDireccion.trim() || null,
    idComuna: rawValue.contacto.idComuna,
    idPais: requireSelection(rawValue.datosPersonales.idPais, 'el pais'),
    idSucursal: null,
    idDepartamentoEmpresa: null,
    idCentroCosto: null,
    relacionLaboral: 'CONTRATO',
    cargo: 'Sin cargo',
    fechaContrato: today,
    tipoContrato: 'INDEFINIDO',
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
    fechaIngreso: today,
    fechaTermino: null,
    sueldoBase: 0,
    idMoneda: null,
    sueldoVariable: false,
    horasSemanales: 0,
    diasSemanales: 0,
    distribucionJornada: null,
    tiempoColacionMinutos: null,
    tipoGratificacion: 'LEGAL_ART_50',
    gratificacionProporcional: false,
    semanaCorridaActiva: false,
    semanaCorridaDiasLaborables: [],
    zonaExtremaActiva: false,
    zonaExtremaTerritorio: null,
    zonaExtremaPorcentaje: null,
    estado: 'en_proceso',
    idTramoCarga: null,
    condicionesTrabajador: [],
    tipoPrevision: 'NINGUNA',
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
  };
}

/**
 * Payload para guardar borrador de creación avanzada: tolera campos incompletos usando
 * defaults de catálogo solo donde la persistencia lo exige (no reemplaza validación final Paso 9).
 */
export function mapEmpleadoFormToPayloadBorrador(
  form: EmpleadoFormGroup,
  catalogos: EmpleadoFormCatalogos,
): CrearEmpleadoPayload {
  const rawValue = form.getRawValue();
  const today = new Date().toISOString().slice(0, 10);

  const pickFirstId = (options: EmpleadoCatalogOption[], label: string): number => {
    const v = options[0]?.value;
    if (typeof v !== 'number' || Number.isNaN(v)) {
      throw new Error(`El catalogo de ${label} no esta disponible para guardar el borrador.`);
    }
    return v;
  };

  const tipoRaw = rawValue.previsionSalud.tipoRegimenPrevisional;
  const tipoPrevision: TipoRegimenPrevisional =
    tipoRaw === 'AFP' || tipoRaw === 'IPS' || tipoRaw === 'NINGUNA' ? tipoRaw : 'NINGUNA';

  const idTipoTrabajador =
    rawValue.contrato.idTipoTrabajador && rawValue.contrato.idTipoTrabajador > 0
      ? rawValue.contrato.idTipoTrabajador
      : pickFirstId(catalogos.tiposTrabajador, 'tipo de trabajador');
  const idTipoJornada =
    rawValue.contrato.idTipoJornada && rawValue.contrato.idTipoJornada > 0
      ? rawValue.contrato.idTipoJornada
      : pickFirstId(catalogos.tiposJornada, 'tipo de jornada');

  const idPais =
    rawValue.datosPersonales.idPais && rawValue.datosPersonales.idPais > 0
      ? rawValue.datosPersonales.idPais
      : pickFirstId(catalogos.paises, 'pais');

  const idComuna =
    rawValue.contacto.idComuna && rawValue.contacto.idComuna > 0
      ? rawValue.contacto.idComuna
      : pickFirstId(catalogos.comunas, 'comuna');

  const idRegimenPrevisional =
    tipoPrevision === 'NINGUNA'
      ? null
      : resolveRegimenPrevisionalId(tipoPrevision, catalogos.regimenesPrevisionales);

  const tieneCuenta2 =
    tipoPrevision === 'AFP' &&
    (rawValue.previsionSalud.idMonedaCuenta2 !== null ||
      rawValue.previsionSalud.valorCuenta2 !== null);
  const requiereSalud = tipoPrevision !== 'NINGUNA';
  const tipoSalud = requiereSalud
    ? resolveTipoSalud(rawValue.previsionSalud.idSalud, catalogos)
    : null;
  const esFonasa = tipoSalud === 'FONASA';
  const tieneApvi = tipoPrevision === 'AFP' && rawValue.previsionSalud.tieneApv === true;

  const idBanco =
    rawValue.bancario.idBanco && rawValue.bancario.idBanco > 0
      ? rawValue.bancario.idBanco
      : pickFirstId(catalogos.bancos, 'banco');
  const idTipoCuentaBancaria =
    rawValue.bancario.idTipoCuentaBancaria && rawValue.bancario.idTipoCuentaBancaria > 0
      ? rawValue.bancario.idTipoCuentaBancaria
      : pickFirstId(catalogos.tiposCuentaBancaria, 'tipo de cuenta');
  const numeroCuentaRaw = rawValue.bancario.numeroCuenta.trim();
  const numeroCuenta =
    numeroCuentaRaw.length > 0
      ? numeroCuentaRaw
      : `DRAFT-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

  const fechaIngreso = rawValue.contrato.fechaIngreso?.trim() ? rawValue.contrato.fechaIngreso : today;
  const fechaContrato = rawValue.contrato.fechaContrato?.trim()
    ? rawValue.contrato.fechaContrato
    : fechaIngreso;

  return {
    origenCreacion: 'avanzado',
    rut: rawValue.datosPersonales.rut,
    nombres: rawValue.datosPersonales.nombres,
    apellidoPaterno: rawValue.datosPersonales.apellidoPaterno,
    apellidoMaterno: rawValue.datosPersonales.apellidoMaterno,
    fechaNacimiento: rawValue.datosPersonales.fechaNacimiento,
    sexo: requireSexo(rawValue.datosPersonales.sexo),
    estadoCivil: requireEstadoCivil(rawValue.datosPersonales.estadoCivil),
    pasaporte: rawValue.datosPersonales.pasaporte.trim() || null,
    idPais,
    email: rawValue.contacto.email,
    telefono: rawValue.contacto.telefono,
    direccion: (rawValue.contacto.direccion || '—').trim() || '—',
    numeroDireccion: rawValue.contacto.numeroDireccion.trim() || null,
    departamentoDireccion: rawValue.contacto.departamentoDireccion.trim() || null,
    observacionesDireccion: rawValue.contacto.observacionesDireccion.trim() || null,
    idComuna,
    idSucursal: rawValue.contrato.idSucursal,
    idDepartamentoEmpresa: rawValue.contrato.idDepartamentoEmpresa,
    idCentroCosto: rawValue.contrato.idCentroCosto,
    relacionLaboral: rawValue.contrato.relacionLaboral,
    cargo: (rawValue.contrato.cargo || 'Sin cargo').trim() || 'Sin cargo',
    fechaContrato,
    tipoContrato: rawValue.contrato.tipoContrato ?? 'INDEFINIDO',
    idTipoTrabajador,
    idTipoJornada,
    seguroCesantia: rawValue.contrato.seguroCesantia,
    excluidoLimiteJornada: rawValue.contrato.excluidoLimiteJornada,
    causalExclusionJornada: rawValue.contrato.excluidoLimiteJornada
      ? rawValue.contrato.causalExclusionJornada
      : null,
    justificacionExclusionJornada: rawValue.contrato.excluidoLimiteJornada
      ? rawValue.contrato.justificacionExclusionJornada.trim() || null
      : null,
    casaParticularModalidad: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularModalidad
      : null,
    casaParticularLabores: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularLabores.trim() || null
      : null,
    casaParticularDomicilioEspecifico: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularDomicilioEspecifico.trim() || null
      : null,
    casaParticularAsistenciaCuidado: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularAsistenciaCuidado
      : false,
    casaParticularRegistroDtEstado: rawValue.contrato.tipoContrato === 'CASA_PARTICULAR'
      ? rawValue.contrato.casaParticularRegistroDtEstado
      : null,
    casaParticularRegistroDtFecha:
      rawValue.contrato.tipoContrato === 'CASA_PARTICULAR' &&
      rawValue.contrato.casaParticularRegistroDtEstado === 'REGISTRADO'
        ? rawValue.contrato.casaParticularRegistroDtFecha || null
        : null,
    casaParticularRegistroDtFolio:
      rawValue.contrato.tipoContrato === 'CASA_PARTICULAR' &&
      rawValue.contrato.casaParticularRegistroDtEstado === 'REGISTRADO'
        ? rawValue.contrato.casaParticularRegistroDtFolio.trim() || null
        : null,
    fechaIngreso,
    fechaTermino: rawValue.contrato.fechaTermino || null,
    sueldoBase: rawValue.contrato.sueldoBase ?? 0,
    idMoneda: rawValue.contrato.idMoneda,
    sueldoVariable: rawValue.contrato.sueldoVariable,
    horasSemanales: rawValue.contrato.horasSemanales ?? 0,
    diasSemanales: rawValue.contrato.diasSemanales ?? 0,
    distribucionJornada: rawValue.contrato.distribucionJornada.trim() || null,
    tiempoColacionMinutos: rawValue.contrato.tiempoColacionMinutos,
    tipoGratificacion: rawValue.contrato.tipoGratificacion ?? 'LEGAL_ART_50',
    gratificacionProporcional: rawValue.contrato.gratificacionProporcional,
    semanaCorridaActiva: rawValue.contrato.semanaCorridaActiva,
    semanaCorridaDiasLaborables: rawValue.contrato.semanaCorridaActiva
      ? rawValue.contrato.semanaCorridaDiasLaborables ?? []
      : [],
    zonaExtremaActiva: rawValue.contrato.zonaExtremaActiva,
    zonaExtremaTerritorio: rawValue.contrato.zonaExtremaActiva
      ? rawValue.contrato.zonaExtremaTerritorio.trim() || null
      : null,
    zonaExtremaPorcentaje: rawValue.contrato.zonaExtremaActiva
      ? rawValue.contrato.zonaExtremaPorcentaje
      : null,
    estado: 'borrador',
    idTramoCarga: rawValue.contrato.idTramoCarga,
    condicionesTrabajador: mapCondicionesTrabajadorFromFormValue(rawValue),
    cargas: rawValue.contrato.cargas ?? 0,
    tipoPrevision,
    idRegimenPrevisional,
    idAfp: tipoPrevision === 'AFP' ? rawValue.previsionSalud.idAfp : null,
    idMonedaCuenta2: tieneCuenta2 ? rawValue.previsionSalud.idMonedaCuenta2 : null,
    valorCuenta2: tieneCuenta2 ? rawValue.previsionSalud.valorCuenta2 : null,
    idEntidadPrevisionalIps:
      tipoPrevision === 'IPS' ? rawValue.previsionSalud.idEntidadPrevisionalIps : null,
    idExCajaPrevisional: tipoPrevision === 'IPS' ? rawValue.previsionSalud.idExCajaPrevisional : null,
    idRegimenExCaja: tipoPrevision === 'IPS' ? rawValue.previsionSalud.idRegimenExCaja : null,
    nombreExCaja: tipoPrevision === 'IPS' ? rawValue.previsionSalud.nombreExCaja || null : null,
    regimenExCaja: tipoPrevision === 'IPS' ? rawValue.previsionSalud.regimenExCaja || null : null,
    tasaExCaja: tipoPrevision === 'IPS' ? rawValue.previsionSalud.tasaExCaja : null,
    idSalud: requiereSalud ? rawValue.previsionSalud.idSalud : null,
    tipoSalud,
    idMonedaPlan: requiereSalud ? rawValue.previsionSalud.idMonedaPlan : null,
    valorPlan: requiereSalud ? (esFonasa ? 0 : rawValue.previsionSalud.valorPlan) : null,
    adicionalAugeGes: requiereSalud ? (esFonasa ? 0 : rawValue.previsionSalud.adicionalAugeGes) : null,
    tieneApv: tieneApvi,
    idInstitucionApv: tieneApvi ? rawValue.previsionSalud.idInstitucionApv : null,
    idMonedaApv: tieneApvi ? rawValue.previsionSalud.idMonedaApv : null,
    montoApv: tieneApvi ? rawValue.previsionSalud.montoApv : null,
    idFormaPagoApv: tieneApvi ? rawValue.previsionSalud.idFormaPagoApv : null,
    depositoConvenidoApvi: tieneApvi ? rawValue.previsionSalud.depositoConvenidoApvi : null,
    idBanco,
    idTipoCuentaBancaria,
    numeroCuenta,
  };
}


export function mapCondicionesTrabajadorFromFormValue(
  rawValue: ReturnType<EmpleadoFormGroup['getRawValue']>,
): CondicionTrabajadorPayload[] {
  const perfil = rawValue.perfilLaboral;
  const vigenciaInicio = perfil.vigenciaInicio || rawValue.contrato.fechaIngreso || new Date().toISOString().slice(0, 10);
  const vigenciaFin = perfil.vigenciaFin.trim() || null;
  const observacion = perfil.observacion.trim() || null;

  return CONDICIONES_TRABAJADOR_UI
    .filter((condition) => perfil[condition.controlName])
    .map((condition) => ({
      codigo: condition.codigo,
      vigenciaInicio,
      vigenciaFin,
      respaldoRegistrado: perfil.respaldoRegistrado,
      observacion,
    }));
}

function resolveRegimenPrevisionalId(
  tipo: TipoRegimenPrevisional,
  regimenesPrevisionales: EmpleadoCatalogOption[],
): number | null {
  if (tipo === 'NINGUNA') {
    return null;
  }

  const regimen = regimenesPrevisionales.find(
    (option) => normalizeText(option.label) === normalizeText(tipo),
  );

  if (!regimen) {
    throw new Error(`No se encontro el catalogo para el regimen ${tipo}.`);
  }

  return regimen.value;
}

function resolveTipoSalud(
  idSalud: number | null,
  catalogos: EmpleadoFormCatalogos,
): 'FONASA' | 'ISAPRE' | string | null {
  const option = catalogos.entidadesSalud.find((item) => item.value === idSalud);
  const raw = `${option?.tipo ?? ''} ${option?.label ?? ''}`;
  const normalized = normalizeText(raw);

  if (normalized.includes('fonasa')) {
    return 'FONASA';
  }

  if (normalized.includes('isapre')) {
    return 'ISAPRE';
  }

  return option?.tipo ?? null;
}

function requireSexo(value: EmpleadoSexo | null): EmpleadoSexo {
  if (value === null) {
    throw new Error('Debes seleccionar el sexo.');
  }

  return value;
}

function requireEstadoCivil(value: TipoEstadoCivil | null): TipoEstadoCivil {
  if (value === null) {
    throw new Error('Debes seleccionar el estado civil.');
  }

  return value;
}

function requireTipoContrato(value: TipoContrato | null): TipoContrato {
  if (value === null) {
    throw new Error('Debes seleccionar el tipo de contrato.');
  }

  return value;
}

function requireTipoGratificacion(value: TipoGratificacion | null): TipoGratificacion {
  if (value === null) {
    throw new Error('Debes seleccionar el tipo de gratificacion.');
  }

  return value;
}

function requireSelection(value: number | null, label: string): number {
  if (value === null) {
    throw new Error(`Debes seleccionar ${label}.`);
  }

  return value;
}

function requireTipoRegimenPrevisional(
  value: TipoRegimenPrevisional | null,
): TipoRegimenPrevisional {
  if (value === null) {
    throw new Error('Debes seleccionar el tipo de regimen previsional.');
  }

  return value;
}

function requireText(value: string, label: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`Debes ingresar ${label}.`);
  }

  return normalized;
}

function requireNumber(value: number | null, label: string): number {
  if (value === null || Number.isNaN(value)) {
    throw new Error(`Debes ingresar ${label}.`);
  }

  return value;
}

function requireNonEmptyArray(value: number[], label: string): number[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Debes seleccionar ${label}.`);
  }

  return value;
}
