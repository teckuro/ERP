import { Tables } from '../../../core/models/database.types';
import {
  EmpleadoCatalogOption,
  EmpleadoDepartamentoOption,
  EmpleadoMonedaCatalogOption,
  EmpleadoSaludCatalogOption,
  EmpleadoStringCatalogOption,
  RegimenExCajaCatalogOption,
  TramoCargaCatalogOption,
} from '../models/empleado-catalogos.model';
import { TipoContrato } from '../models/empleado.model';

export type DepartamentoEmpresaCatalogRow = Pick<
  Tables<'departamento_empresa'>,
  'id_departamento_empresa' | 'nombre' | 'id_sucursal'
>;

export type TipoTrabajadorCatalogRow = Pick<
  Tables<'tipo_trabajador'>,
  'id_tipo_trabajador' | 'nombre'
>;

export type TipoJornadaCatalogRow = Pick<Tables<'tipo_jornada'>, 'id_tipo_jornada' | 'nombre'>;

export type RegimenPrevisionalCatalogRow = Pick<
  Tables<'regimen_previsional'>,
  'id_regimen' | 'nombre'
>;

export type EntidadPrevisionalIpsCatalogRow = Pick<
  Tables<'entidad_previsional_ips'>,
  'id_entidad_previsional_ips' | 'nombre'
>;

export type ExCajaPrevisionalCatalogRow = Pick<
  Tables<'ex_caja_previsional'>,
  'id_ex_caja_previsional' | 'nombre'
>;

export type RegimenExCajaCatalogRow = Pick<
  Tables<'regimen_ex_caja'>,
  'id_regimen_ex_caja' | 'nombre' | 'id_ex_caja_previsional' | 'tasa_cotizacion_referencia'
>;

export type InstitucionApvCatalogRow = Pick<
  Tables<'institucion_apv'>,
  'id_institucion_apv' | 'nombre'
>;

export type FormaPagoApvCatalogRow = Pick<Tables<'forma_pago_apv'>, 'id_forma_pago_apv' | 'nombre'>;

export type TipoContratoCatalogRow = Pick<Tables<'afc_parametro'>, 'codigo_tipo_contrato'>;

export type MonedaCatalogRow = Pick<Tables<'moneda'>, 'id_moneda' | 'nombre' | 'codigo'>;

export type TramoCargaCatalogRow = Pick<
  Tables<'tramo_carga'>,
  'id_tramo' | 'periodo' | 'desde' | 'hasta' | 'valor' | 'tramo'
>;

export function mapCatalog<T extends { nombre: string }>(
  rows: T[],
  idKey: keyof T & string,
): EmpleadoCatalogOption[] {
  return rows
    .map((row) => ({ value: Number(row[idKey]), label: row.nombre }))
    .filter((row) => Number.isFinite(row.value));
}

export function mapDepartamentosCatalog(
  rows: DepartamentoEmpresaCatalogRow[],
): EmpleadoDepartamentoOption[] {
  return rows.map((row) => ({
    value: row.id_departamento_empresa,
    label: row.nombre,
    idSucursal: row.id_sucursal,
  }));
}

export function mapSaludCatalog<
  T extends { id_salud: number; nombre: string; tipo: string | null },
>(rows: T[]): EmpleadoSaludCatalogOption[] {
  return rows.map((row) => ({
    value: row.id_salud,
    label: row.tipo ? `${row.nombre} (${row.tipo})` : row.nombre,
    tipo: row.tipo,
  }));
}

export function mapMonedaCatalog(rows: MonedaCatalogRow[]): EmpleadoMonedaCatalogOption[] {
  return rows
    .map((row) => ({
      value: row.id_moneda,
      label: row.nombre,
      codigo: row.codigo,
    }))
    .filter((row) => Number.isFinite(row.value));
}

export function mapRegimenExCajaCatalog(
  rows: RegimenExCajaCatalogRow[],
): RegimenExCajaCatalogOption[] {
  return rows.map((row) => ({
    value: row.id_regimen_ex_caja,
    label: row.nombre,
    idExCajaPrevisional: row.id_ex_caja_previsional,
    tasaCotizacionReferencia: row.tasa_cotizacion_referencia,
  }));
}

export function mapTipoContratoCatalog(
  rows: TipoContratoCatalogRow[],
  labelResolver: (value: TipoContrato) => string,
): EmpleadoStringCatalogOption<TipoContrato>[] {
  const uniqueValues = new Set<TipoContrato>();

  for (const row of rows) {
    uniqueValues.add(row.codigo_tipo_contrato);
  }

  return Array.from(uniqueValues)
    .sort((left, right) => labelResolver(left).localeCompare(labelResolver(right), 'es-CL'))
    .map((value) => ({
      value,
      label: labelResolver(value),
    }));
}

export function pickLatestTramosCarga(rows: TramoCargaCatalogRow[]): TramoCargaCatalogOption[] {
  const latestPeriodo = rows[0]?.periodo;

  if (!latestPeriodo) {
    return [];
  }

  return rows
    .filter((row) => row.periodo === latestPeriodo)
    .map((row) => ({
      value: row.id_tramo,
      periodo: row.periodo,
      desde: row.desde,
      hasta: row.hasta,
      valor: row.valor,
      tramo: row.tramo,
    }));
}
