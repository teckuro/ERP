import { EmpleadoFichaDetalle } from '../models/empleado-listado.model';

type FichaFormValue = EmpleadoFichaDetalle['formValue'];

/**
 * Limpia valores persistidos solo por técnica de BD al continuar un borrador avanzado.
 * Persistencia técnica ≠ selección real del usuario.
 */
export function normalizarBorradorAvanzadoParaFormulario(
  formValue: FichaFormValue,
  pasoAltaAvanzada: number | null | undefined,
): FichaFormValue {
  const paso = normalizePaso(pasoAltaAvanzada);
  const datosPersonales = { ...formValue.datosPersonales };
  const contacto = { ...formValue.contacto };
  const contrato = { ...formValue.contrato };
  const perfilLaboral = { ...(formValue.perfilLaboral ?? {}) };
  const previsionSalud = { ...formValue.previsionSalud };
  const bancario = { ...formValue.bancario };

  if (isPlaceholderText(contacto['direccion'])) {
    contacto['direccion'] = '';
  }

  if (paso < 1) {
    contacto['direccion'] = '';
    contacto['numeroDireccion'] = '';
    contacto['departamentoDireccion'] = '';
    contacto['observacionesDireccion'] = '';
    contacto['idComuna'] = null;
  }

  if (isSinCargo(contrato['cargo'])) {
    contrato['cargo'] = '';
  }

  if (isNonPositiveNumber(contrato['sueldoBase'])) {
    contrato['sueldoBase'] = null;
  }

  const contratoPareceTecnico =
    !hasText(contrato['cargo']) &&
    contrato['sueldoBase'] === null &&
    (paso < 2 || hasText(contrato['fechaIngreso']) || hasText(contrato['fechaContrato']));

  if (paso < 2 || contratoPareceTecnico) {
    contrato['idSucursal'] = null;
    contrato['idDepartamentoEmpresa'] = null;
    contrato['idCentroCosto'] = null;
    contrato['cargo'] = '';
    contrato['fechaContrato'] = '';
    contrato['fechaIngreso'] = '';
  }

  /** Tipo de contrato pertenece al paso 2; no limpiar con la misma regla que jornada (paso 3). */
  if (paso < 2 || contratoPareceTecnico) {
    contrato['tipoContrato'] = null;
  }

  /** Campos del panel «Jornada y remuneración» (paso 3). */
  if (paso < 3) {
    contrato['idTipoTrabajador'] = null;
    contrato['idTipoJornada'] = null;
    contrato['tipoGratificacion'] = null;
    contrato['sueldoBase'] = null;
    contrato['idMoneda'] = null;
    contrato['horasSemanales'] = null;
    contrato['diasSemanales'] = null;
    contrato['distribucionJornada'] = '';
    contrato['tiempoColacionMinutos'] = null;
  }

  if (paso < 4) {
    contrato['cargas'] = 0;
    contrato['idTramoCarga'] = null;
    contrato['semanaCorridaActiva'] = false;
    contrato['semanaCorridaDiasLaborables'] = [];
    contrato['zonaExtremaActiva'] = false;
    contrato['zonaExtremaTerritorio'] = '';
    contrato['zonaExtremaPorcentaje'] = null;
    limpiarPerfilLaboral(perfilLaboral);
  }

  if (!hasText(perfilLaboral['vigenciaInicio'])) {
    perfilLaboral['vigenciaInicio'] = hasText(contrato['fechaIngreso'])
      ? contrato['fechaIngreso']
      : new Date().toISOString().slice(0, 10);
  }

  if (previsionSalud['tipoRegimenPrevisional'] === 'NINGUNA' || paso < 5) {
    previsionSalud['tipoRegimenPrevisional'] = null;
    previsionSalud['idAfp'] = null;
    previsionSalud['idMonedaCuenta2'] = null;
    previsionSalud['valorCuenta2'] = null;
    previsionSalud['idEntidadPrevisionalIps'] = null;
    previsionSalud['idExCajaPrevisional'] = null;
    previsionSalud['idRegimenExCaja'] = null;
    previsionSalud['nombreExCaja'] = '';
    previsionSalud['regimenExCaja'] = '';
    previsionSalud['tasaExCaja'] = null;
    previsionSalud['idSalud'] = null;
    previsionSalud['idMonedaPlan'] = null;
    previsionSalud['valorPlan'] = null;
    previsionSalud['adicionalAugeGes'] = null;
    previsionSalud['tieneApv'] = false;
  }

  if (paso < 6) {
    previsionSalud['tieneApv'] = false;
    limpiarCamposApvi(previsionSalud);
  } else if (previsionSalud['tieneApv'] !== true) {
    limpiarCamposApvi(previsionSalud);
  } else if (esApviIncompleto(previsionSalud)) {
    previsionSalud['tieneApv'] = false;
    limpiarCamposApvi(previsionSalud);
  }

  if (isDraftAccount(bancario['numeroCuenta']) || paso < 7) {
    bancario['idBanco'] = null;
    bancario['idTipoCuentaBancaria'] = null;
    bancario['numeroCuenta'] = '';
  }

  if (!hasText(bancario['numeroCuenta'])) {
    bancario['idBanco'] = null;
    bancario['idTipoCuentaBancaria'] = null;
  }

  /** Sin remuneración base real, los IDs de jornada/moneda no deben contarse como elección. */
  if (!isPositiveNumber(contrato['sueldoBase'])) {
    contrato['idTipoTrabajador'] = null;
    contrato['idTipoJornada'] = null;
    contrato['idMoneda'] = null;
    contrato['horasSemanales'] = null;
    contrato['diasSemanales'] = null;
    contrato['distribucionJornada'] = '';
    contrato['tiempoColacionMinutos'] = null;
    contrato['tipoGratificacion'] = null;
  }

  return {
    datosPersonales,
    contacto,
    contrato,
    perfilLaboral,
    previsionSalud,
    bancario,
  };
}


function limpiarPerfilLaboral(perfilLaboral: Record<string, unknown>): void {
  perfilLaboral['pensionado'] = false;
  perfilLaboral['pensionadoInvalidezParcial'] = false;
  perfilLaboral['pensionadoInvalidezTotal'] = false;
  perfilLaboral['exentoCotizacionPension'] = false;
  perfilLaboral['trabajadorAdolescenteProtegido'] = false;
  perfilLaboral['autorizacionMenorRegistrada'] = false;
  perfilLaboral['tecnicoExtranjeroExento'] = false;
  perfilLaboral['discapacidad'] = false;
  perfilLaboral['vigenciaFin'] = '';
  perfilLaboral['respaldoRegistrado'] = false;
  perfilLaboral['observacion'] = '';
}

function limpiarCamposApvi(previsionSalud: Record<string, unknown>): void {
  previsionSalud['idInstitucionApv'] = null;
  previsionSalud['idMonedaApv'] = null;
  previsionSalud['montoApv'] = null;
  previsionSalud['idFormaPagoApv'] = null;
  previsionSalud['depositoConvenidoApvi'] = null;
}

function esApviIncompleto(previsionSalud: Record<string, unknown>): boolean {
  if (previsionSalud['tieneApv'] !== true) {
    return false;
  }

  const deposito = previsionSalud['depositoConvenidoApvi'];
  const depositoInvalido =
    deposito === null ||
    deposito === undefined ||
    (typeof deposito === 'number' && (Number.isNaN(deposito) || deposito < 0));

  return (
    !isPositiveId(previsionSalud['idInstitucionApv']) ||
    !isPositiveId(previsionSalud['idMonedaApv']) ||
    !isPositiveNumber(previsionSalud['montoApv']) ||
    !isPositiveId(previsionSalud['idFormaPagoApv']) ||
    depositoInvalido
  );
}

function normalizePaso(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(0, Math.trunc(value)), 8);
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlaceholderText(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return value.trim() === '-' || value.trim() === '\u2014';
}

function isSinCargo(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return normalize(value) === normalize('Sin cargo');
}

function isDraftAccount(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toUpperCase().startsWith('DRAFT-');
}

function isNonPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value <= 0;
}

function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPositiveId(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
