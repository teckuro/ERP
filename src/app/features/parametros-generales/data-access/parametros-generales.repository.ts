import { Injectable } from '@angular/core';

import { Tables, TablesInsert } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  AfcParametro,
  AfpParametro,
  IsapreParametro,
  ParametroGeneral,
  ParametroLegal,
  ParametroGeneralUpsert,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesFiltro,
  TablaImpuestoUnicoParametro,
  TramoCargaParametro,
  TramoImpuestoParametro,
  ApvApvcFormaPago,
  ApvApvcInstitucion,
  CcafEntidad,
  Ley16744Parametro,
  OrganismoLey16744,
  ReformaPrevisionalParametro,
  TrabajoPesadoParametro,
} from '../models/parametro-general.model';

type ParametroGeneralRow = Tables<'parametros_generales'>;
type ParametroGeneralInsert = TablesInsert<'parametros_generales'>;
type AfcRow = Tables<'afc_parametro'>;
type AfpRow = Tables<'afp'>;
type SaludRow = Tables<'salud'>;
type TramoCargaRow = Tables<'tramo_carga'>;
type TramoImpuestoRow = Tables<'tramo_impuesto'>;
type TablaImpuestoUnicoRow = Tables<'tabla_impuesto_unico'>;
type ParametroLegalRow = Tables<'parametros_legales'>;

type ParametroGeneralSupabaseRow = Omit<
  ParametroGeneralRow,
  | 'afc_empleador_indefinido'
  | 'afc_empleador_plazo'
  | 'afc_trabajador_indefinido'
  | 'ingreso_minimo_no_remuneracional'
  | 'imm_gratificacion'
  | 'salud_ccaf'
  | 'salud_fonasa_con_ccaf'
  | 'salud_obligatoria'
  | 'sanna'
  | 'sis'
  | 'sueldo_minimo'
  | 'sueldo_minimo18_65'
  | 'sueldo_minimo_casa_particular'
  | 'sueldo_minimo_menor18_mayor65'
  | 'tope_afp_uf'
  | 'tope_afp'
  | 'tope_afpvoluntario'
  | 'tope_apv_anual'
  | 'tope_apv_anual_uf'
  | 'tope_apv_mensual'
  | 'tope_apv_mensual_uf'
  | 'tope_cesantia'
  | 'tope_cesantia_uf'
  | 'tope_deposito_convenido_anual'
  | 'tope_deposito_convenido_anual_uf'
  | 'tope_ips_uf'
  | 'tope_ips'
  | 'uta'
  | 'uf'
  | 'utm'
> & {
  afc_empleador_indefinido: number | string | null;
  afc_empleador_plazo: number | string | null;
  afc_trabajador_indefinido: number | string | null;
  ingreso_minimo_no_remuneracional: number | string | null;
  imm_gratificacion: number | string | null;
  salud_ccaf: number | string | null;
  salud_fonasa_con_ccaf: number | string | null;
  salud_obligatoria: number | string | null;
  sanna: number | string | null;
  sis: number | string | null;
  sueldo_minimo: number | string | null;
  sueldo_minimo18_65: number | string | null;
  sueldo_minimo_casa_particular: number | string | null;
  sueldo_minimo_menor18_mayor65: number | string | null;
  tope_afp_uf: number | string | null;
  tope_afp: number | string | null;
  tope_afpvoluntario: number | string | null;
  tope_apv_anual: number | string | null;
  tope_apv_anual_uf: number | string | null;
  tope_apv_mensual: number | string | null;
  tope_apv_mensual_uf: number | string | null;
  tope_cesantia: number | string | null;
  tope_cesantia_uf: number | string | null;
  tope_deposito_convenido_anual: number | string | null;
  tope_deposito_convenido_anual_uf: number | string | null;
  tope_ips_uf: number | string | null;
  tope_ips: number | string | null;
  uta: number | string | null;
  uf: number | string | null;
  utm: number | string | null;
};

interface TrabajoPesadoRow {
  id_trabajo_pesado_parametro: number;
  codigo: string;
  nombre: string;
  tasa_trabajador: number;
  tasa_empleador: number;
  tasa_total: number;
  requiere_dictamen_cen: boolean;
  fuente: string | null;
  vigente: boolean;
  vigencia_inicio: string;
  vigencia_fin: string | null;
}

interface ReformaPrevisionalRow {
  id_reforma_previsional_parametro: number;
  vigencia_inicio: string;
  vigencia_fin: string | null;
  aporte_empleador_total: number;
  cuenta_capitalizacion_individual: number;
  fapp_seguro_social: number;
  fuente: string | null;
}

interface Ley16744ParametroRow {
  id_ley_16744_parametro: number;
  codigo: string;
  cotizacion_basica_empleador: number;
  descripcion_tasa_adicional: string | null;
  fuente_financiamiento: string | null;
  fuente_organismos: string | null;
  vigente: boolean;
  vigencia_inicio: string;
  vigencia_fin: string | null;
}

interface OrganismoLey16744Row {
  id_organismo_administrador_ley_16744: number;
  codigo: string;
  nombre: string;
  tipo: string;
  vigente: boolean;
}

interface CcafEntidadRow {
  id_ccaf_entidad: number;
  codigo: string;
  nombre: string;
  vigente: boolean;
  fuente: string | null;
}

interface ApvInstitucionRow {
  id_institucion_apv: number;
  codigo: string | null;
  nombre: string;
  vigente: boolean;
}

interface ApvFormaPagoRow {
  id_forma_pago_apv: number;
  codigo: string | null;
  nombre: string;
  vigente: boolean;
}

@Injectable({ providedIn: 'root' })
export class ParametrosGeneralesRepository {
  private readonly supabase = injectSupabase();
  private readonly supabaseUntyped = this.supabase as any;
  private readonly legalConfigNames = [
    'UF',
    'UTM',
    'UTA',
    'SIS',
    'SANNA',
    'TOPE_AFP_UF',
    'TOPE_AFP_PESOS',
    'TOPE_INP_UF',
    'TOPE_INP_PESOS',
    'TOPE_AFC_UF',
    'TOPE_AFC_PESOS',
    'SUELDO_MINIMO',
    'SUELDO_MINIMO_18_65',
    'SUELDO_MINIMO_TPC',
    'SUELDO_MINIMO_NO_REM',
    'SALUD_CCAF',
    'SALUD_FONASA',
    'SALUD_OBLIGATORIA',
    'SALUD_FONASA_CON_CCAF',
    'AFC_EMPLEADOR_INDEFINIDO_11_ANOS_MAS',
    'TOPE_APV_MENSUAL_UF',
    'TOPE_APV_MENSUAL_PESOS',
    'TOPE_APV_ANUAL_UF',
    'TOPE_APV_ANUAL_PESOS',
    'TOPE_DEPOSITO_CONVENIDO_ANUAL_UF',
    'TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS',
  ] as const;

  async listar(filtro?: ParametrosGeneralesFiltro): Promise<ParametroGeneral[]> {
    let query = this.supabaseUntyped
      .from('parametros_generales')
      .select(
        [
          'periodo',
          'uf',
          'utm',
          'uta',
          'sueldo_minimo',
          'sueldo_minimo18_65',
          'sueldo_minimo_menor18_mayor65',
          'sueldo_minimo_casa_particular',
          'ingreso_minimo_no_remuneracional',
          'gratificacion',
          'imm_gratificacion',
          'tope_afp_uf',
          'tope_afp',
          'tope_ips_uf',
          'tope_ips',
          'tope_cesantia_uf',
          'tope_cesantia',
          'tope_apv_mensual_uf',
          'tope_apv_mensual',
          'tope_apv_anual_uf',
          'tope_apv_anual',
          'tope_deposito_convenido_anual_uf',
          'tope_deposito_convenido_anual',
          'tope_afpvoluntario',
          'sis',
          'sanna',
          'salud_obligatoria',
          'salud_ccaf',
          'salud_fonasa_con_ccaf',
          'dsctosbpordia',
          'afc_trabajador_indefinido',
          'afc_empleador_indefinido',
          'afc_empleador_plazo',
          'fecha_actualizacion',
        ].join(','),
      )
      .order('periodo', { ascending: false });

    if (filtro?.periodo) {
      query = query.eq('periodo', filtro.periodo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = ((data ?? []) as ParametroGeneralSupabaseRow[]).map((row) => this.toModel(row));
    return this.hydrateConfigurables(rows);
  }

  async obtenerUltimoHastaPeriodo(periodo: string): Promise<ParametroGeneral | null> {
    const { data, error } = await this.supabaseUntyped
      .from('parametros_generales')
      .select(
        [
          'periodo',
          'uf',
          'utm',
          'uta',
          'sueldo_minimo',
          'sueldo_minimo18_65',
          'sueldo_minimo_menor18_mayor65',
          'sueldo_minimo_casa_particular',
          'ingreso_minimo_no_remuneracional',
          'gratificacion',
          'imm_gratificacion',
          'tope_afp_uf',
          'tope_afp',
          'tope_ips_uf',
          'tope_ips',
          'tope_cesantia_uf',
          'tope_cesantia',
          'tope_apv_mensual_uf',
          'tope_apv_mensual',
          'tope_apv_anual_uf',
          'tope_apv_anual',
          'tope_deposito_convenido_anual_uf',
          'tope_deposito_convenido_anual',
          'tope_afpvoluntario',
          'sis',
          'sanna',
          'salud_obligatoria',
          'salud_ccaf',
          'salud_fonasa_con_ccaf',
          'dsctosbpordia',
          'afc_trabajador_indefinido',
          'afc_empleador_indefinido',
          'afc_empleador_plazo',
          'fecha_actualizacion',
        ].join(','),
      )
      .lte('periodo', periodo)
      .order('periodo', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const row = ((data ?? []) as ParametroGeneralSupabaseRow[])[0] ?? null;
    if (!row) {
      return null;
    }

    const [hydrated] = await this.hydrateConfigurables([this.toModel(row)]);
    return hydrated ?? null;
  }

  async guardar(payload: ParametroGeneralUpsert): Promise<ParametroGeneral> {
    const { data, error } = await this.supabase
      .from('parametros_generales')
      .upsert(this.toRow(payload), { onConflict: 'periodo' })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await this.guardarConfigurables(payload);

    const [hydrated] = await this.hydrateConfigurables([this.toModel(data)]);
    return hydrated ?? this.toModel(data);
  }

  async listarCatalogos(): Promise<ParametrosGeneralesCatalogos> {
    const afp = await this.safeListWithError(() => this.listarAfp());
    const isapres = await this.safeListWithError(() => this.listarIsapres());
    const saludInstituciones = await this.safeListWithError(() => this.listarSaludInstituciones());
    const tramosCarga = await this.safeListWithError(() => this.listarTramosCarga());
    const tramosImpuesto = await this.safeListWithError(() => this.listarTramosImpuesto());
    const tablaImpuestoUnico = await this.safeListWithError(() => this.listarTablaImpuestoUnico());
    const reformaPensiones = await this.safeListWithError(() => this.listarParametrosLegales());
    const trabajosPesados = await this.safeListWithError(() => this.listarTrabajosPesados());
    const reformaPrevisional = await this.safeListWithError(() => this.listarReformaPrevisional());
    const ley16744Parametros = await this.safeListWithError(() => this.listarLey16744Parametros());
    const organismosLey16744 = await this.safeListWithError(() => this.listarOrganismosLey16744());
    const ccafEntidades = await this.safeListWithError(() => this.listarCcafEntidades());
    const apvInstituciones = await this.safeListWithError(() => this.listarApvInstituciones());
    const apvFormasPago = await this.safeListWithError(() => this.listarApvFormasPago());
    const afcParametros = await this.safeListWithError(() => this.listarAfcParametros());

    const result: ParametrosGeneralesCatalogos = {
      afp: afp.data,
      isapres: isapres.data,
      saludInstituciones: saludInstituciones.data,
      tramosCarga: tramosCarga.data,
      tramosImpuesto: tramosImpuesto.data,
      tablaImpuestoUnico: tablaImpuestoUnico.data,
      reformaPensiones: reformaPensiones.data,
      trabajosPesados: trabajosPesados.data,
      reformaPrevisional: reformaPrevisional.data,
      ley16744Parametros: ley16744Parametros.data,
      organismosLey16744: organismosLey16744.data,
      ccafEntidades: ccafEntidades.data,
      apvInstituciones: apvInstituciones.data,
      apvFormasPago: apvFormasPago.data,
      afcParametros: afcParametros.data,
    };

    const anyCatalogData =
      result.afp.length > 0 ||
      result.isapres.length > 0 ||
      result.saludInstituciones.length > 0 ||
      result.tramosCarga.length > 0 ||
      result.tramosImpuesto.length > 0 ||
      result.tablaImpuestoUnico.length > 0 ||
      result.reformaPensiones.length > 0 ||
      result.trabajosPesados.length > 0 ||
      result.reformaPrevisional.length > 0 ||
      result.ley16744Parametros.length > 0 ||
      result.organismosLey16744.length > 0 ||
      result.ccafEntidades.length > 0 ||
      result.apvInstituciones.length > 0 ||
      result.apvFormasPago.length > 0 ||
      result.afcParametros.length > 0;

    const errors = [
      this.prefixError('afp', afp.error),
      this.prefixError('isapre', isapres.error),
      this.prefixError('salud', saludInstituciones.error),
      this.prefixError('tramo_carga', tramosCarga.error),
      this.prefixError('tramo_impuesto', tramosImpuesto.error),
      this.prefixError('tabla_impuesto_unico', tablaImpuestoUnico.error),
      this.prefixError('parametros_legales', reformaPensiones.error),
      this.prefixError('trabajo_pesado_parametro', trabajosPesados.error),
      this.prefixError('reforma_previsional_parametro', reformaPrevisional.error),
      this.prefixError('ley_16744_parametros', ley16744Parametros.error),
      this.prefixError('organismo_administrador_ley_16744', organismosLey16744.error),
      this.prefixError('ccaf_entidad', ccafEntidades.error),
      this.prefixError('institucion_apv', apvInstituciones.error),
      this.prefixError('forma_pago_apv', apvFormasPago.error),
      this.prefixError('afc_parametro', afcParametros.error),
    ].filter(Boolean) as string[];

    if (!anyCatalogData && errors.length > 0) {
      throw new Error(`No fue posible cargar catalogos desde Supabase: ${errors.join(' | ')}`);
    }

    return result;
  }

  private async safeList<T>(loader: () => Promise<T[]>): Promise<T[]> {
    try {
      return await loader();
    } catch {
      return [];
    }
  }

  private async safeListWithError<T>(
    loader: () => Promise<T[]>,
  ): Promise<{ data: T[]; error: string | null }> {
    try {
      return { data: await loader(), error: null };
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '').trim()
          : '';
      return { data: [], error: message || 'Error desconocido' };
    }
  }

  private prefixError(source: string, message: string | null): string | null {
    if (!message) {
      return null;
    }
    return `${source}: ${message}`;
  }

  private periodoToVigenciaInicio(periodo: string): string {
    return `${periodo}-01`;
  }

  private async hydrateConfigurables(rows: ParametroGeneral[]): Promise<ParametroGeneral[]> {
    if (rows.length === 0) {
      return rows;
    }

    return Promise.all(rows.map((row) => this.hydrateConfigurable(row)));
  }

  private async hydrateConfigurable(row: ParametroGeneral): Promise<ParametroGeneral> {
    const vigenciaInicio = this.periodoToVigenciaInicio(row.periodo);
    const [legales, afcParametros, trabajosPesados, reformaPrevisional] = await Promise.all([
      this.listarParametrosLegalesPorVigencia(vigenciaInicio),
      this.listarAfcParametrosPorVigencia(vigenciaInicio),
      this.listarTrabajosPesadosVigentes(vigenciaInicio),
      this.listarReformaPrevisionalVigente(vigenciaInicio),
    ]);

    const legalMap = new Map(legales.map((item) => [item.nombre, item]));
    const legalNumber = (name: string): number | null => {
      const value = legalMap.get(name);
      return this.toNumber(value?.valorDecimal ?? value?.valorEntero ?? null);
    };
    const afcByContrato = new Map(afcParametros.map((item) => [item.codigoTipoContrato, item]));
    const trabajoByCodigo = new Map(trabajosPesados.map((item) => [item.codigo, item]));
    const indefinido = afcByContrato.get('INDEFINIDO');
    const plazo = afcByContrato.get('PLAZO_FIJO') ?? afcByContrato.get('OBRA_SERVICIO');
    const casaParticular = afcByContrato.get('CASA_PARTICULAR');
    const pesado = trabajoByCodigo.get('PESADO');
    const menosPesado = trabajoByCodigo.get('MENOS_PESADO');
    const saludCcaf = legalNumber('SALUD_CCAF');
    const saludFonasa = legalNumber('SALUD_FONASA');
    const saludObligatoria = legalNumber('SALUD_OBLIGATORIA') ?? this.sumNullable(saludCcaf, saludFonasa);
    const saludFonasaConCcaf = legalNumber('SALUD_FONASA_CON_CCAF') ?? this.sumNullable(saludCcaf, saludFonasa);

    return {
      ...row,
      // Fuente de verdad: parametros_generales. Legales solo fallback si viene NULL.
      uf: row.uf ?? legalNumber('UF'),
      utm: row.utm ?? legalNumber('UTM'),
      uta: row.uta ?? legalNumber('UTA'),
      sis: row.sis ?? legalNumber('SIS'),
      sanna: row.sanna ?? legalNumber('SANNA'),
      sueldoMinimo: row.sueldoMinimo ?? legalNumber('SUELDO_MINIMO'),
      sueldoMinimo18a65: row.sueldoMinimo18a65 ?? legalNumber('SUELDO_MINIMO'),
      sueldoMinimoMenor18Mayor65: row.sueldoMinimoMenor18Mayor65 ?? legalNumber('SUELDO_MINIMO_18_65'),
      sueldoMinimoCasaParticular: row.sueldoMinimoCasaParticular ?? legalNumber('SUELDO_MINIMO_TPC'),
      ingresoMinimoNoRemuneracional: row.ingresoMinimoNoRemuneracional ?? legalNumber('SUELDO_MINIMO_NO_REM'),
      topeAfpUf: row.topeAfpUf ?? legalNumber('TOPE_AFP_UF'),
      topeAfp: row.topeAfp ?? legalNumber('TOPE_AFP_PESOS'),
      topeIpsUf: row.topeIpsUf ?? legalNumber('TOPE_INP_UF'),
      topeIps: row.topeIps ?? legalNumber('TOPE_INP_PESOS'),
      topeCesantiaUf: row.topeCesantiaUf ?? legalNumber('TOPE_AFC_UF'),
      topeCesantia: row.topeCesantia ?? legalNumber('TOPE_AFC_PESOS'),
      topeApvMensualUf: row.topeApvMensualUf ?? legalNumber('TOPE_APV_MENSUAL_UF'),
      topeApvMensual: row.topeApvMensual ?? legalNumber('TOPE_APV_MENSUAL_PESOS'),
      topeAfpVoluntario: row.topeAfpVoluntario ?? legalNumber('TOPE_APV_MENSUAL_PESOS'),
      topeApvAnualUf: row.topeApvAnualUf ?? legalNumber('TOPE_APV_ANUAL_UF'),
      topeApvAnual: row.topeApvAnual ?? legalNumber('TOPE_APV_ANUAL_PESOS'),
      topeDepositoConvenidoAnualUf:
        row.topeDepositoConvenidoAnualUf ?? legalNumber('TOPE_DEPOSITO_CONVENIDO_ANUAL_UF'),
      topeDepositoConvenidoAnual:
        row.topeDepositoConvenidoAnual ?? legalNumber('TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS'),
      saludObligatoria: row.saludObligatoria ?? saludObligatoria,
      saludCcaf: row.saludCcaf ?? saludCcaf,
      saludFonasaConCcaf: row.saludFonasaConCcaf ?? saludFonasaConCcaf,
      afcTrabajadorIndefinido: indefinido?.tasaTrabajador ?? row.afcTrabajadorIndefinido,
      afcEmpleadorIndefinido: indefinido?.tasaEmpleador ?? row.afcEmpleadorIndefinido,
      afcEmpleadorPlazo: plazo?.tasaEmpleador ?? row.afcEmpleadorPlazo,
      afcEmpleadorIndefinidoOnceAnosMas: legalNumber('AFC_EMPLEADOR_INDEFINIDO_11_ANOS_MAS'),
      afcEmpleadorCasaParticular: casaParticular?.tasaEmpleador ?? null,
      trabajoPesadoEmpleador: pesado?.tasaEmpleador ?? null,
      trabajoPesadoTrabajador: pesado?.tasaTrabajador ?? null,
      trabajoMenosPesadoEmpleador: menosPesado?.tasaEmpleador ?? null,
      trabajoMenosPesadoTrabajador: menosPesado?.tasaTrabajador ?? null,
      seguroSocialExpectativaVida: reformaPrevisional?.fappSeguroSocial ?? null,
      aporteEmpleadorAfp: reformaPrevisional?.cuentaCapitalizacionIndividual ?? null,
    };
  }

  private sumNullable(left: number | null, right: number | null): number | null {
    if (left === null || right === null) {
      return null;
    }

    return left + right;
  }

  private async listarParametrosLegalesPorVigencia(vigenciaInicio: string): Promise<ParametroLegal[]> {
    const { data, error } = await this.supabaseUntyped
      .from('parametros_legales')
      .select('*')
      .eq('vigencia_inicio', vigenciaInicio)
      .in('nombre', [...this.legalConfigNames]);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ParametroLegalRow[]).map((item) => this.toParametroLegal(item));
  }

  private async listarAfcParametrosPorVigencia(vigenciaInicio: string): Promise<AfcParametro[]> {
    const { data, error } = await this.supabase
      .from('afc_parametro')
      .select('*')
      .eq('vigencia_inicio', vigenciaInicio);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => this.toAfcParametro(item));
  }

  private async listarTrabajosPesadosVigentes(vigenciaInicio: string): Promise<TrabajoPesadoParametro[]> {
    const { data, error } = await this.supabaseUntyped
      .from('trabajo_pesado_parametro')
      .select('*')
      .lte('vigencia_inicio', vigenciaInicio)
      .order('vigencia_inicio', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as TrabajoPesadoRow[])
      .filter((item) => item.vigencia_fin === null || item.vigencia_fin >= vigenciaInicio)
      .map((item) => this.toTrabajoPesado(item));
  }

  private async listarReformaPrevisionalVigente(vigenciaInicio: string): Promise<ReformaPrevisionalParametro | null> {
    const { data, error } = await this.supabaseUntyped
      .from('reforma_previsional_parametro')
      .select('*')
      .lte('vigencia_inicio', vigenciaInicio)
      .order('vigencia_inicio', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const row = ((data ?? []) as ReformaPrevisionalRow[]).find(
      (item) => item.vigencia_fin === null || item.vigencia_fin >= vigenciaInicio,
    );
    return row ? this.toReformaPrevisional(row) : null;
  }

  private async guardarConfigurables(payload: ParametroGeneralUpsert): Promise<void> {
    const vigenciaInicio = this.periodoToVigenciaInicio(payload.periodo);
    await Promise.all([
      this.guardarParametrosLegales(payload, vigenciaInicio),
      this.guardarAfcParametros(payload, vigenciaInicio),
      this.guardarTrabajosPesados(payload, vigenciaInicio),
      this.guardarReformaPrevisional(payload, vigenciaInicio),
    ]);
  }

  private async guardarParametrosLegales(payload: ParametroGeneralUpsert, vigenciaInicio: string): Promise<void> {
    const rows = [
      this.legalRow('UF', payload.uf, null, vigenciaInicio),
      this.legalRow('UTM', null, payload.utm, vigenciaInicio),
      this.legalRow('UTA', null, payload.uta, vigenciaInicio),
      this.legalRow('SIS', payload.sis, null, vigenciaInicio),
      this.legalRow('SANNA', payload.sanna, null, vigenciaInicio),
      this.legalRow('SUELDO_MINIMO', null, payload.sueldoMinimo18a65 ?? payload.sueldoMinimo, vigenciaInicio),
      this.legalRow('SUELDO_MINIMO_18_65', null, payload.sueldoMinimoMenor18Mayor65 ?? payload.sueldoMinimo18a65, vigenciaInicio),
      this.legalRow('SUELDO_MINIMO_TPC', null, payload.sueldoMinimoCasaParticular, vigenciaInicio),
      this.legalRow('SUELDO_MINIMO_NO_REM', null, payload.ingresoMinimoNoRemuneracional, vigenciaInicio),
      this.legalRow('TOPE_AFP_UF', payload.topeAfpUf, null, vigenciaInicio),
      this.legalRow('TOPE_AFP_PESOS', null, payload.topeAfp, vigenciaInicio),
      this.legalRow('TOPE_INP_UF', payload.topeIpsUf, null, vigenciaInicio),
      this.legalRow('TOPE_INP_PESOS', null, payload.topeIps, vigenciaInicio),
      this.legalRow('TOPE_AFC_UF', payload.topeCesantiaUf, null, vigenciaInicio),
      this.legalRow('TOPE_AFC_PESOS', null, payload.topeCesantia, vigenciaInicio),
      this.legalRow('TOPE_APV_MENSUAL_UF', payload.topeApvMensualUf, null, vigenciaInicio),
      this.legalRow('TOPE_APV_MENSUAL_PESOS', null, payload.topeApvMensual, vigenciaInicio),
      this.legalRow('TOPE_APV_ANUAL_UF', payload.topeApvAnualUf, null, vigenciaInicio),
      this.legalRow('TOPE_APV_ANUAL_PESOS', null, payload.topeApvAnual, vigenciaInicio),
      this.legalRow('TOPE_DEPOSITO_CONVENIDO_ANUAL_UF', payload.topeDepositoConvenidoAnualUf, null, vigenciaInicio),
      this.legalRow('TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS', null, payload.topeDepositoConvenidoAnual, vigenciaInicio),
      this.legalRow('SALUD_OBLIGATORIA', payload.saludObligatoria, null, vigenciaInicio),
      this.legalRow('SALUD_CCAF', payload.saludCcaf, null, vigenciaInicio),
      this.legalRow('SALUD_FONASA_CON_CCAF', payload.saludFonasaConCcaf, null, vigenciaInicio),
      this.legalRow('AFC_EMPLEADOR_INDEFINIDO_11_ANOS_MAS', payload.afcEmpleadorIndefinidoOnceAnosMas, null, vigenciaInicio),
    ].filter((row) => row.valor_decimal !== null || row.valor_entero !== null);

    const { error: deleteError } = await this.supabaseUntyped
      .from('parametros_legales')
      .delete()
      .eq('vigencia_inicio', vigenciaInicio)
      .in('nombre', rows.map((row) => row.nombre));

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (rows.length === 0) {
      return;
    }

    const { error } = await this.supabaseUntyped.from('parametros_legales').insert(rows);
    if (error) {
      throw new Error(error.message);
    }
  }

  private legalRow(nombre: string, valorDecimal: number | null, valorEntero: number | null, vigenciaInicio: string) {
    return {
      nombre,
      valor_decimal: valorDecimal,
      valor_entero: valorEntero,
      vigencia_inicio: vigenciaInicio,
      vigencia_fin: null,
    };
  }

  private async guardarAfcParametros(payload: ParametroGeneralUpsert, vigenciaInicio: string): Promise<void> {
    const rows = [
      this.afcRow('INDEFINIDO', true, true, payload.afcTrabajadorIndefinido, payload.afcEmpleadorIndefinido, vigenciaInicio),
      this.afcRow('PLAZO_FIJO', true, false, 0, payload.afcEmpleadorPlazo, vigenciaInicio),
      this.afcRow('OBRA_SERVICIO', true, false, 0, payload.afcEmpleadorPlazo, vigenciaInicio),
      this.afcRow('CASA_PARTICULAR', true, false, 0, payload.afcEmpleadorCasaParticular, vigenciaInicio),
    ].filter((row) => row.tasa_trabajador !== null && row.tasa_empleador !== null);

    const { error: deleteError } = await this.supabaseUntyped
      .from('afc_parametro')
      .delete()
      .eq('vigencia_inicio', vigenciaInicio);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (rows.length === 0) {
      return;
    }

    const { error } = await this.supabaseUntyped.from('afc_parametro').insert(rows);
    if (error) {
      throw new Error(error.message);
    }
  }

  private afcRow(
    codigoTipoContrato: string,
    aplicaSeguro: boolean,
    aplicaTrabajador: boolean,
    tasaTrabajador: number | null,
    tasaEmpleador: number | null,
    vigenciaInicio: string,
  ) {
    return {
      codigo_tipo_contrato: codigoTipoContrato,
      aplica_seguro: aplicaSeguro,
      aplica_trabajador: aplicaTrabajador,
      tasa_trabajador: tasaTrabajador,
      tasa_empleador: tasaEmpleador,
      vigencia_inicio: vigenciaInicio,
      vigencia_fin: null,
      observacion: 'Configurado desde parametros',
    };
  }

  private async guardarTrabajosPesados(payload: ParametroGeneralUpsert, vigenciaInicio: string): Promise<void> {
    const rows = [
      this.trabajoPesadoRow('PESADO', 'Trabajo pesado', payload.trabajoPesadoTrabajador, payload.trabajoPesadoEmpleador, vigenciaInicio),
      this.trabajoPesadoRow(
        'MENOS_PESADO',
        'Trabajo pesado con menor desgaste relativo',
        payload.trabajoMenosPesadoTrabajador,
        payload.trabajoMenosPesadoEmpleador,
        vigenciaInicio,
      ),
    ].filter((row) => row.tasa_trabajador !== null && row.tasa_empleador !== null);

    if (rows.length === 0) {
      return;
    }

    const { error } = await this.supabaseUntyped.from('trabajo_pesado_parametro').upsert(rows, { onConflict: 'codigo' });
    if (error) {
      throw new Error(error.message);
    }
  }

  private trabajoPesadoRow(
    codigo: string,
    nombre: string,
    tasaTrabajador: number | null,
    tasaEmpleador: number | null,
    vigenciaInicio: string,
  ) {
    return {
      codigo,
      nombre,
      tasa_trabajador: tasaTrabajador,
      tasa_empleador: tasaEmpleador,
      tasa_total: tasaTrabajador !== null && tasaEmpleador !== null ? tasaTrabajador + tasaEmpleador : null,
      requiere_dictamen_cen: true,
      fuente: 'Configurado desde parametros',
      vigente: true,
      vigencia_inicio: vigenciaInicio,
      vigencia_fin: null,
    };
  }

  private async guardarReformaPrevisional(payload: ParametroGeneralUpsert, vigenciaInicio: string): Promise<void> {
    if (payload.seguroSocialExpectativaVida === null && payload.aporteEmpleadorAfp === null) {
      return;
    }

    const { error: deleteError } = await this.supabaseUntyped
      .from('reforma_previsional_parametro')
      .delete()
      .eq('vigencia_inicio', vigenciaInicio);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const row = {
      vigencia_inicio: vigenciaInicio,
      vigencia_fin: null,
      aporte_empleador_total: (payload.seguroSocialExpectativaVida ?? 0) + (payload.aporteEmpleadorAfp ?? 0),
      cuenta_capitalizacion_individual: payload.aporteEmpleadorAfp ?? 0,
      fapp_seguro_social: payload.seguroSocialExpectativaVida ?? 0,
      fuente: 'Configurado desde parametros',
    };

    const { error } = await this.supabaseUntyped.from('reforma_previsional_parametro').insert(row);
    if (error) {
      throw new Error(error.message);
    }
  }

  private async listarAfp(): Promise<AfpParametro[]> {
    const { data, error } = await this.supabase.from('afp').select('*').order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toAfp(row));
  }

  private async listarIsapres(): Promise<IsapreParametro[]> {
    const { data, error } = await this.supabase
      .from('salud')
      .select('*')
      .eq('tipo', 'ISAPRE')
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toIsapre(row));
  }

  private async listarSaludInstituciones(): Promise<IsapreParametro[]> {
    const { data, error } = await this.supabase
      .from('salud')
      .select('*')
      .order('tipo', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toIsapre(row));
  }

  private async listarTramosCarga(): Promise<TramoCargaParametro[]> {
    const { data, error } = await this.supabase
      .from('tramo_carga')
      .select('*')
      .order('periodo', { ascending: false })
      .order('desde', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toTramoCarga(row));
  }

  private async listarTramosImpuesto(): Promise<TramoImpuestoParametro[]> {
    const { data, error } = await this.supabase
      .from('tramo_impuesto')
      .select('*')
      .order('periodo', { ascending: false })
      .order('desde', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toTramoImpuesto(row));
  }

  private async listarTablaImpuestoUnico(): Promise<TablaImpuestoUnicoParametro[]> {
    const { data, error } = await this.supabase
      .from('tabla_impuesto_unico')
      .select('*')
      .order('vigencia_inicio', { ascending: false })
      .order('tramo', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toTablaImpuestoUnico(row));
  }

  private async listarParametrosLegales(): Promise<ParametroLegal[]> {
    const { data, error } = await this.supabase
      .from('parametros_legales')
      .select('*')
      .order('vigencia_inicio', { ascending: false })
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toParametroLegal(row));
  }

  private async listarTrabajosPesados(): Promise<TrabajoPesadoParametro[]> {
    const { data, error } = await this.supabaseUntyped
      .from('trabajo_pesado_parametro')
      .select('*')
      .order('vigencia_inicio', { ascending: false })
      .order('codigo', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as TrabajoPesadoRow[]).map((row) => this.toTrabajoPesado(row));
  }

  private async listarReformaPrevisional(): Promise<ReformaPrevisionalParametro[]> {
    const { data, error } = await this.supabaseUntyped
      .from('reforma_previsional_parametro')
      .select('*')
      .order('vigencia_inicio', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ReformaPrevisionalRow[]).map((row) => this.toReformaPrevisional(row));
  }

  private async listarLey16744Parametros(): Promise<Ley16744Parametro[]> {
    const { data, error } = await this.supabaseUntyped
      .from('ley_16744_parametros')
      .select('*')
      .order('vigencia_inicio', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Ley16744ParametroRow[]).map((row) => this.toLey16744Parametro(row));
  }

  private async listarOrganismosLey16744(): Promise<OrganismoLey16744[]> {
    const { data, error } = await this.supabaseUntyped
      .from('organismo_administrador_ley_16744')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as OrganismoLey16744Row[]).map((row) => this.toOrganismoLey16744(row));
  }

  private async listarCcafEntidades(): Promise<CcafEntidad[]> {
    const { data, error } = await this.supabaseUntyped
      .from('ccaf_entidad')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as CcafEntidadRow[]).map((row) => this.toCcafEntidad(row));
  }

  private async listarApvInstituciones(): Promise<ApvApvcInstitucion[]> {
    const { data, error } = await this.supabaseUntyped
      .from('institucion_apv')
      .select('id_institucion_apv,codigo,nombre,vigente')
      .order('codigo', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ApvInstitucionRow[]).map((row) => this.toApvInstitucion(row));
  }

  private async listarApvFormasPago(): Promise<ApvApvcFormaPago[]> {
    const { data, error } = await this.supabaseUntyped
      .from('forma_pago_apv')
      .select('id_forma_pago_apv,codigo,nombre,vigente')
      .order('codigo', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ApvFormaPagoRow[]).map((row) => this.toApvFormaPago(row));
  }

  private async listarAfcParametros(): Promise<AfcParametro[]> {
    const { data, error } = await this.supabase
      .from('afc_parametro')
      .select('*')
      .order('vigencia_inicio', { ascending: false })
      .order('codigo_tipo_contrato', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toAfcParametro(row));
  }

  private toModel(row: ParametroGeneralSupabaseRow): ParametroGeneral {
    return {
      periodo: row.periodo,
      uf: this.toNumber(row.uf),
      utm: this.toNumber(row.utm),
      uta: this.toNumber(row.uta),
      sueldoMinimo: this.toNumber(row.sueldo_minimo),
      sueldoMinimo18a65: this.toNumber(row.sueldo_minimo18_65),
      sueldoMinimoMenor18Mayor65: this.toNumber(row.sueldo_minimo_menor18_mayor65 ?? row.sueldo_minimo18_65),
      sueldoMinimoCasaParticular: this.toNumber(row.sueldo_minimo_casa_particular),
      ingresoMinimoNoRemuneracional: this.toNumber(row.ingreso_minimo_no_remuneracional),
      gratificacion: row.gratificacion ?? false,
      immGratificacion: this.toNumber(row.imm_gratificacion),
      topeAfpUf: this.toNumber(row.tope_afp_uf),
      topeAfp: this.toNumber(row.tope_afp),
      topeIpsUf: this.toNumber(row.tope_ips_uf),
      topeIps: this.toNumber(row.tope_ips),
      topeCesantiaUf: this.toNumber(row.tope_cesantia_uf),
      topeCesantia: this.toNumber(row.tope_cesantia),
      topeApvMensualUf: this.toNumber(row.tope_apv_mensual_uf),
      topeApvMensual: this.toNumber(row.tope_apv_mensual ?? row.tope_afpvoluntario),
      topeApvAnualUf: this.toNumber(row.tope_apv_anual_uf),
      topeApvAnual: this.toNumber(row.tope_apv_anual),
      topeDepositoConvenidoAnualUf: this.toNumber(row.tope_deposito_convenido_anual_uf),
      topeDepositoConvenidoAnual: this.toNumber(row.tope_deposito_convenido_anual),
      topeAfpVoluntario: this.toNumber(row.tope_afpvoluntario),
      sis: this.toNumber(row.sis),
      sanna: this.toNumber(row.sanna),
      seguroSocialExpectativaVida: null,
      aporteEmpleadorAfp: null,
      saludObligatoria: this.toNumber(row.salud_obligatoria),
      saludCcaf: this.toNumber(row.salud_ccaf),
      saludFonasaConCcaf: this.toNumber(row.salud_fonasa_con_ccaf),
      descuentosBasePorDia: row.dsctosbpordia ?? false,
      afcTrabajadorIndefinido: this.toNumber(row.afc_trabajador_indefinido),
      afcEmpleadorIndefinido: this.toNumber(row.afc_empleador_indefinido),
      afcEmpleadorPlazo: this.toNumber(row.afc_empleador_plazo),
      afcEmpleadorIndefinidoOnceAnosMas: null,
      afcEmpleadorCasaParticular: null,
      trabajoPesadoEmpleador: null,
      trabajoPesadoTrabajador: null,
      trabajoMenosPesadoEmpleador: null,
      trabajoMenosPesadoTrabajador: null,
      fechaActualizacion: row.fecha_actualizacion,
    };
  }

  private toRow(payload: ParametroGeneralUpsert): ParametroGeneralInsert {
    return {
      periodo: payload.periodo,
      uf: payload.uf,
      utm: payload.utm,
      uta: payload.uta,
      sueldo_minimo: payload.sueldoMinimo,
      sueldo_minimo18_65: payload.sueldoMinimo18a65,
      sueldo_minimo_menor18_mayor65: payload.sueldoMinimoMenor18Mayor65,
      sueldo_minimo_casa_particular: payload.sueldoMinimoCasaParticular,
      ingreso_minimo_no_remuneracional: payload.ingresoMinimoNoRemuneracional,
      gratificacion: payload.gratificacion,
      imm_gratificacion: payload.immGratificacion,
      tope_afp_uf: payload.topeAfpUf,
      tope_afp: payload.topeAfp,
      tope_ips_uf: payload.topeIpsUf,
      tope_ips: payload.topeIps,
      tope_cesantia_uf: payload.topeCesantiaUf,
      tope_cesantia: payload.topeCesantia,
      tope_apv_mensual_uf: payload.topeApvMensualUf,
      tope_apv_mensual: payload.topeApvMensual,
      tope_apv_anual_uf: payload.topeApvAnualUf,
      tope_apv_anual: payload.topeApvAnual,
      tope_deposito_convenido_anual_uf: payload.topeDepositoConvenidoAnualUf,
      tope_deposito_convenido_anual: payload.topeDepositoConvenidoAnual,
      tope_afpvoluntario: payload.topeAfpVoluntario,
      sis: payload.sis,
      sanna: payload.sanna,
      salud_obligatoria: payload.saludObligatoria,
      salud_ccaf: payload.saludCcaf,
      salud_fonasa_con_ccaf: payload.saludFonasaConCcaf,
      dsctosbpordia: payload.descuentosBasePorDia,
      afc_trabajador_indefinido: payload.afcTrabajadorIndefinido,
      afc_empleador_indefinido: payload.afcEmpleadorIndefinido,
      afc_empleador_plazo: payload.afcEmpleadorPlazo,
      fecha_actualizacion: payload.fechaActualizacion,
    };
  }

  private toAfp(row: AfpRow): AfpParametro {
    return {
      idAfp: row.id_afp,
      codigo: row.codigo,
      nombre: row.nombre,
      tasaObligatoria: row.tasa_obligatoria,
      comision: row.comision,
      sis: row.sis,
      tasaEmpleador: row.tasa_empleador,
      vigente: row.vigente ?? false,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
    };
  }

  private toIsapre(row: SaludRow): IsapreParametro {
    return {
      idSalud: row.id_salud,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      porcentajeCotizacion: row.porcentaje_cotizacion,
      vigente: row.vigente ?? false,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
    };
  }

  private toTramoCarga(row: TramoCargaRow): TramoCargaParametro {
    return {
      idTramo: row.id_tramo,
      periodo: row.periodo,
      tramo: row.tramo,
      desde: row.desde,
      hasta: row.hasta,
      valor: row.valor,
    };
  }

  private toTramoImpuesto(row: TramoImpuestoRow): TramoImpuestoParametro {
    return {
      idTramo: row.id_tramo,
      periodo: row.periodo,
      desde: row.desde,
      hasta: row.hasta,
      factor: row.factor,
      rebaja: row.rebaja,
    };
  }

  private toTablaImpuestoUnico(row: TablaImpuestoUnicoRow): TablaImpuestoUnicoParametro {
    return {
      id: row.id,
      tramo: row.tramo,
      desde: row.desde,
      hasta: row.hasta,
      factor: row.factor,
      rebaja: row.rebaja,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
    };
  }

  private toParametroLegal(row: ParametroLegalRow): ParametroLegal {
    return {
      idParametro: row.id_parametro,
      nombre: row.nombre,
      valorDecimal: this.toNumber(row.valor_decimal),
      valorEntero: this.toNumber(row.valor_entero),
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
    };
  }

  private toNumber(value: number | string | null): number | null {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      // PostgREST suele devolver NUMERIC como string. Aceptamos formatos comunes:
      // - "40120.2000"
      // - "69.889" (miles con punto)
      // - "40.120,20" (miles con punto + decimal con coma)
      const normalized = trimmed
        .replace(/\s+/g, '')
        .replace(/\./g, (match, offset, full) => {
          // Si hay coma en el string, asumimos que el punto es separador de miles y lo quitamos.
          return full.includes(',') ? '' : '.';
        })
        .replace(',', '.');
      const numberValue = Number(normalized);
      return Number.isFinite(numberValue) ? numberValue : null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private toTrabajoPesado(row: TrabajoPesadoRow): TrabajoPesadoParametro {
    return {
      idTrabajoPesadoParametro: row.id_trabajo_pesado_parametro,
      codigo: row.codigo,
      nombre: row.nombre,
      tasaTrabajador: row.tasa_trabajador,
      tasaEmpleador: row.tasa_empleador,
      tasaTotal: row.tasa_total,
      requiereDictamenCen: row.requiere_dictamen_cen,
      fuente: row.fuente,
      vigente: row.vigente,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
    };
  }

  private toReformaPrevisional(row: ReformaPrevisionalRow): ReformaPrevisionalParametro {
    return {
      idReformaPrevisionalParametro: row.id_reforma_previsional_parametro,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
      aporteEmpleadorTotal: row.aporte_empleador_total,
      cuentaCapitalizacionIndividual: row.cuenta_capitalizacion_individual,
      fappSeguroSocial: row.fapp_seguro_social,
      fuente: row.fuente,
    };
  }

  private toLey16744Parametro(row: Ley16744ParametroRow): Ley16744Parametro {
    return {
      idLey16744Parametro: row.id_ley_16744_parametro,
      codigo: row.codigo,
      cotizacionBasicaEmpleador: row.cotizacion_basica_empleador,
      descripcionTasaAdicional: row.descripcion_tasa_adicional,
      fuenteFinanciamiento: row.fuente_financiamiento,
      fuenteOrganismos: row.fuente_organismos,
      vigente: row.vigente,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
    };
  }

  private toOrganismoLey16744(row: OrganismoLey16744Row): OrganismoLey16744 {
    return {
      idOrganismoAdministradorLey16744: row.id_organismo_administrador_ley_16744,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      vigente: row.vigente,
    };
  }

  private toCcafEntidad(row: CcafEntidadRow): CcafEntidad {
    return {
      idCcafEntidad: row.id_ccaf_entidad,
      codigo: row.codigo,
      nombre: row.nombre,
      vigente: row.vigente,
      fuente: row.fuente,
    };
  }

  private toApvInstitucion(row: ApvInstitucionRow): ApvApvcInstitucion {
    return {
      idInstitucionApv: row.id_institucion_apv,
      codigo: row.codigo,
      nombre: row.nombre,
      vigente: row.vigente,
    };
  }

  private toApvFormaPago(row: ApvFormaPagoRow): ApvApvcFormaPago {
    return {
      idFormaPagoApv: row.id_forma_pago_apv,
      codigo: row.codigo,
      nombre: row.nombre,
      vigente: row.vigente,
    };
  }

  private toAfcParametro(row: AfcRow): AfcParametro {
    return {
      idAfcParametro: row.id_afc_parametro,
      codigoTipoContrato: row.codigo_tipo_contrato,
      aplicaSeguro: row.aplica_seguro,
      aplicaTrabajador: row.aplica_trabajador,
      tasaTrabajador: row.tasa_trabajador,
      tasaEmpleador: row.tasa_empleador,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
      observacion: row.observacion,
    };
  }
}
