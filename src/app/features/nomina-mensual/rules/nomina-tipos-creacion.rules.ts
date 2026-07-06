import type { NominaFeatureGates } from '../models/nomina-feature-gates.models';
import type { TipoNomina } from '../models/nomina-periodo.models';

export interface OpcionTipoNominaCreacion {
  id: TipoNomina;
  label: string;
  descripcion: string;
}

const OPCION_MENSUAL: OpcionTipoNominaCreacion = {
  id: 'mensual',
  label: 'Mensual',
  descripcion: 'Liquidación legal del mes calendario.',
};

const OPCION_QUINCENAL: OpcionTipoNominaCreacion = {
  id: 'quincenal',
  label: 'Quincenal',
  descripcion: 'Anticipo interno por quincena, consolidable en la mensual.',
};

const OPCION_SEMANAL: OpcionTipoNominaCreacion = {
  id: 'semanal',
  label: 'Semanal',
  descripcion: 'Anticipo interno semanal, consolidable en la mensual.',
};

const OPCION_EXTRAORDINARIA: OpcionTipoNominaCreacion = {
  id: 'extraordinaria',
  label: 'Extraordinaria',
  descripcion: 'Pago extraordinario con efectos explícitos en la mensual.',
};

export function opcionesTipoNominaCreacion(
  gates: NominaFeatureGates,
): readonly OpcionTipoNominaCreacion[] {
  const opciones: OpcionTipoNominaCreacion[] = [OPCION_MENSUAL];
  if (gates.anticipos) {
    opciones.push(OPCION_QUINCENAL, OPCION_SEMANAL);
  }
  if (gates.extraordinaria) {
    opciones.push(OPCION_EXTRAORDINARIA);
  }
  return opciones;
}

export function tipoNominaRequiereCorte(tipo: TipoNomina): boolean {
  return tipo === 'quincenal' || tipo === 'semanal';
}

export function tipoNominaPermitido(tipo: TipoNomina, gates: NominaFeatureGates): boolean {
  return opcionesTipoNominaCreacion(gates).some((op) => op.id === tipo);
}
