import { Tables } from '../../../core/models/database.types';
import {
  EmpleadoCatalogOption,
  EmpleadoDepartamentoOption,
  TramoCargaCatalogOption,
} from '../models/empleado-catalogos.model';

export type DepartamentoEmpresaCatalogRow = Pick<
  Tables<'departamento_empresa'>,
  'id_departamento_empresa' | 'nombre' | 'id_sucursal'
>;

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
>(rows: T[]): EmpleadoCatalogOption[] {
  return rows.map((row) => ({
    value: row.id_salud,
    label: row.tipo ? `${row.nombre} (${row.tipo})` : row.nombre,
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
