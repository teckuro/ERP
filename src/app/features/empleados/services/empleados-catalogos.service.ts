import { Injectable } from '@angular/core';

import { Tables } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  EmpleadoCatalogOption,
  EmpleadoFormCatalogos,
  EmpleadoDepartamentoOption,
  TramoCargaCatalogOption,
} from '../models/empleado-form.model';

type DepartamentoEmpresaRow = Pick<
  Tables<'departamento_empresa'>,
  'id_departamento_empresa' | 'nombre' | 'id_sucursal'
>;
type TramoCargaRow = Pick<Tables<'tramo_carga'>, 'id_tramo' | 'periodo' | 'desde' | 'hasta' | 'valor' | 'tramo'>;

@Injectable({
  providedIn: 'root',
})
export class EmpleadosCatalogosService {
  private readonly supabase = injectSupabase();

  async obtenerFormulario(): Promise<EmpleadoFormCatalogos> {
    const [
      comunasResult,
      paisesResult,
      centrosCostoResult,
      sucursalesResult,
      departamentosResult,
      tiposTrabajadorResult,
      tiposJornadaResult,
      regimenesResult,
      afpsResult,
      saludResult,
      monedasResult,
      tramosCargaResult,
      institucionesApvResult,
      formasPagoApvResult,
      bancosResult,
      tiposCuentaResult,
    ] = await Promise.all([
      this.supabase.from('comuna').select('id_comuna,nombre').order('nombre', { ascending: true }),
      this.supabase.from('pais').select('id_pais,nombre').order('nombre', { ascending: true }),
      this.supabase.from('centro_costo').select('id_centro_costo,nombre').order('nombre', { ascending: true }),
      this.supabase.from('sucursal').select('id_sucursal,nombre').order('nombre', { ascending: true }),
      this.supabase
        .from('departamento_empresa')
        .select('id_departamento_empresa,nombre,id_sucursal')
        .order('nombre', { ascending: true }),
      this.supabase.from('tipo_trabajador').select('id_tipo_trabajador,nombre').order('nombre', { ascending: true }),
      this.supabase.from('tipo_jornada').select('id_tipo_jornada,nombre').order('nombre', { ascending: true }),
      this.supabase.from('regimen_previsional').select('id_regimen,nombre').order('nombre', { ascending: true }),
      this.supabase.from('afp').select('id_afp,nombre').order('nombre', { ascending: true }),
      this.supabase.from('salud').select('id_salud,nombre,tipo').order('nombre', { ascending: true }),
      this.supabase.from('moneda').select('id_moneda,nombre').order('nombre', { ascending: true }),
      this.supabase
        .from('tramo_carga')
        .select('id_tramo,periodo,desde,hasta,valor,tramo')
        .order('periodo', { ascending: false })
        .order('desde', { ascending: true, nullsFirst: true }),
      this.supabase.from('institucion_apv').select('id_institucion_apv,nombre').order('nombre', { ascending: true }),
      this.supabase.from('forma_pago_apv').select('id_forma_pago_apv,nombre').order('nombre', { ascending: true }),
      this.supabase.from('banco').select('id_banco,nombre').order('nombre', { ascending: true }),
      this.supabase
        .from('tipo_cuenta_bancaria')
        .select('id_tipo_cuenta_bancaria,nombre')
        .order('nombre', { ascending: true }),
    ]);

    if (comunasResult.error) throw this.buildError('No fue posible cargar las comunas.', comunasResult.error.message);
    if (paisesResult.error) throw this.buildError('No fue posible cargar los paises.', paisesResult.error.message);
    if (centrosCostoResult.error) {
      throw this.buildError('No fue posible cargar los centros de costo.', centrosCostoResult.error.message);
    }
    if (sucursalesResult.error) {
      throw this.buildError('No fue posible cargar las sucursales.', sucursalesResult.error.message);
    }
    if (departamentosResult.error) {
      throw this.buildError('No fue posible cargar los departamentos.', departamentosResult.error.message);
    }
    if (tiposTrabajadorResult.error) {
      throw this.buildError('No fue posible cargar los tipos de trabajador.', tiposTrabajadorResult.error.message);
    }
    if (tiposJornadaResult.error) {
      throw this.buildError('No fue posible cargar los tipos de jornada.', tiposJornadaResult.error.message);
    }
    if (regimenesResult.error) {
      throw this.buildError('No fue posible cargar los regimenes previsionales.', regimenesResult.error.message);
    }
    if (afpsResult.error) throw this.buildError('No fue posible cargar las AFP.', afpsResult.error.message);
    if (saludResult.error) {
      throw this.buildError('No fue posible cargar las instituciones de salud.', saludResult.error.message);
    }
    if (monedasResult.error) throw this.buildError('No fue posible cargar las monedas.', monedasResult.error.message);
    if (tramosCargaResult.error) {
      throw this.buildError('No fue posible cargar los tramos de carga.', tramosCargaResult.error.message);
    }
    if (institucionesApvResult.error) {
      throw this.buildError('No fue posible cargar las instituciones APVI.', institucionesApvResult.error.message);
    }
    if (formasPagoApvResult.error) {
      throw this.buildError('No fue posible cargar las formas de pago APVI.', formasPagoApvResult.error.message);
    }
    if (bancosResult.error) throw this.buildError('No fue posible cargar los bancos.', bancosResult.error.message);
    if (tiposCuentaResult.error) {
      throw this.buildError('No fue posible cargar los tipos de cuenta bancaria.', tiposCuentaResult.error.message);
    }

    return {
      comunas: this.mapCatalog(comunasResult.data ?? [], 'id_comuna'),
      paises: this.mapCatalog(paisesResult.data ?? [], 'id_pais'),
      centrosCosto: this.mapCatalog(centrosCostoResult.data ?? [], 'id_centro_costo'),
      sucursales: this.mapCatalog(sucursalesResult.data ?? [], 'id_sucursal'),
      departamentos: this.mapDepartamentos(departamentosResult.data ?? []),
      tiposTrabajador: this.mapCatalog(tiposTrabajadorResult.data ?? [], 'id_tipo_trabajador'),
      tiposJornada: this.mapCatalog(tiposJornadaResult.data ?? [], 'id_tipo_jornada'),
      regimenesPrevisionales: this.mapCatalog(regimenesResult.data ?? [], 'id_regimen'),
      afps: this.mapCatalog(afpsResult.data ?? [], 'id_afp'),
      entidadesSalud: (saludResult.data ?? []).map((row) => ({
        value: row.id_salud,
        label: row.tipo ? `${row.nombre} (${row.tipo})` : row.nombre,
      })),
      monedas: this.mapCatalog(monedasResult.data ?? [], 'id_moneda'),
      tramosCarga: this.pickLatestTramosCarga(tramosCargaResult.data ?? []),
      institucionesApv: this.mapCatalog(institucionesApvResult.data ?? [], 'id_institucion_apv'),
      formasPagoApv: this.mapCatalog(formasPagoApvResult.data ?? [], 'id_forma_pago_apv'),
      bancos: this.mapCatalog(bancosResult.data ?? [], 'id_banco'),
      tiposCuentaBancaria: this.mapCatalog(tiposCuentaResult.data ?? [], 'id_tipo_cuenta_bancaria'),
    };
  }

  private mapCatalog<T extends { nombre: string }>(rows: T[], idKey: keyof T & string): EmpleadoCatalogOption[] {
    return rows
      .map((row) => ({ value: Number(row[idKey]), label: row.nombre }))
      .filter((row) => Number.isFinite(row.value));
  }

  private mapDepartamentos(rows: DepartamentoEmpresaRow[]): EmpleadoDepartamentoOption[] {
    return rows.map((row) => ({
      value: row.id_departamento_empresa,
      label: row.nombre,
      idSucursal: row.id_sucursal,
    }));
  }

  private pickLatestTramosCarga(rows: TramoCargaRow[]): TramoCargaCatalogOption[] {
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

  private buildError(message: string, details?: string): Error {
    return new Error(details ? `${message} ${details}` : message);
  }
}
