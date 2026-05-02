import { EmpleadoFichaDetalle } from '../models/empleado-listado.model';

type FichaFormValue = EmpleadoFichaDetalle['formValue'];

export function normalizarBorradorAvanzadoParaFormulario(
  formValue: FichaFormValue,
  pasoAltaAvanzada: number | null | undefined,
): FichaFormValue {
  const paso = normalizePaso(pasoAltaAvanzada);
  const datosPersonales = { ...formValue.datosPersonales };
  const contacto = { ...formValue.contacto };
  const contrato = { ...formValue.contrato };
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

  if (paso < 3) {
    contrato['idTipoTrabajador'] = null;
    contrato['idTipoJornada'] = null;
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

  if (paso < 6 || previsionSalud['tieneApv'] !== true) {
    previsionSalud['idInstitucionApv'] = null;
    previsionSalud['idMonedaApv'] = null;
    previsionSalud['montoApv'] = null;
    previsionSalud['idFormaPagoApv'] = null;
    previsionSalud['depositoConvenidoApvi'] = null;
  }

  if (isDraftAccount(bancario['numeroCuenta']) || paso < 7) {
    bancario['idBanco'] = null;
    bancario['idTipoCuentaBancaria'] = null;
    bancario['numeroCuenta'] = '';
  }

  return {
    datosPersonales,
    contacto,
    contrato,
    previsionSalud,
    bancario,
  };
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

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
