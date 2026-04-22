import { EmpleadoCatalogOption, EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import { EmpleadoFormGroup } from '../models/empleado-form.model';
import { TipoRegimenPrevisional } from '../models/empleado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
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
  const tieneApvi = tipoPrevision === 'AFP' && rawValue.previsionSalud.tieneApv;

  return {
    rut: rawValue.datosPersonales.rut,
    nombres: rawValue.datosPersonales.nombres,
    apellidoPaterno: rawValue.datosPersonales.apellidoPaterno,
    apellidoMaterno: rawValue.datosPersonales.apellidoMaterno,
    fechaNacimiento: rawValue.datosPersonales.fechaNacimiento,
    sexo: rawValue.datosPersonales.sexo,
    estadoCivil: rawValue.datosPersonales.estadoCivil,
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
    cargo: rawValue.contrato.cargo,
    fechaContrato: rawValue.contrato.fechaContrato,
    tipoContrato: rawValue.contrato.tipoContrato,
    idTipoTrabajador: requireSelection(rawValue.contrato.idTipoTrabajador, 'el tipo de trabajador'),
    idTipoJornada: requireSelection(rawValue.contrato.idTipoJornada, 'el tipo de jornada'),
    seguroCesantia: rawValue.contrato.seguroCesantia,
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
    tipoGratificacion: rawValue.contrato.tipoGratificacion,
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
    estado: rawValue.contrato.estado,
    idTramoCarga: rawValue.contrato.idTramoCarga,
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
    idMonedaPlan: requiereSalud
      ? requireSelection(rawValue.previsionSalud.idMonedaPlan, 'la moneda del plan de salud')
      : null,
    valorPlan: requiereSalud
      ? requireNumber(rawValue.previsionSalud.valorPlan, 'el valor del plan de salud')
      : null,
    adicionalAugeGes: requiereSalud
      ? requireNumber(rawValue.previsionSalud.adicionalAugeGes, 'el adicional plan Auge')
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
    rut: rawValue.datosPersonales.rut,
    nombres: rawValue.datosPersonales.nombres,
    apellidoPaterno: rawValue.datosPersonales.apellidoPaterno,
    apellidoMaterno: rawValue.datosPersonales.apellidoMaterno,
    fechaNacimiento: rawValue.datosPersonales.fechaNacimiento,
    sexo: rawValue.datosPersonales.sexo,
    estadoCivil: rawValue.datosPersonales.estadoCivil,
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
    cargo: 'Sin cargo',
    fechaContrato: today,
    tipoContrato: 'INDEFINIDO',
    idTipoTrabajador: 0,
    idTipoJornada: 0,
    seguroCesantia: false,
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
    estado: 'borrador',
    idTramoCarga: null,
    tipoPrevision: 'NINGUNA',
    idRegimenPrevisional: null,
    idAfp: null,
    idMonedaCuenta2: null,
    valorCuenta2: null,
    nombreExCaja: null,
    regimenExCaja: null,
    tasaExCaja: null,
    idSalud: null,
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
