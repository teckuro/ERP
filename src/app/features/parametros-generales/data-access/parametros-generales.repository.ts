import { Injectable } from '@angular/core';

import { Tables, TablesInsert } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
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
type AfpRow = Tables<'afp'>;
type SaludRow = Tables<'salud'>;
type TramoCargaRow = Tables<'tramo_carga'>;
type TramoImpuestoRow = Tables<'tramo_impuesto'>;
type TablaImpuestoUnicoRow = Tables<'tabla_impuesto_unico'>;
type ParametroLegalRow = Tables<'parametros_legales'>;

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

  async listar(filtro?: ParametrosGeneralesFiltro): Promise<ParametroGeneral[]> {
    let query = this.supabase
      .from('parametros_generales')
      .select('*')
      .order('periodo', { ascending: false });

    if (filtro?.periodo) {
      query = query.eq('periodo', filtro.periodo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      ...this.toModel(row),
    }));
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

    return this.toModel(data);
  }

  async listarCatalogos(): Promise<ParametrosGeneralesCatalogos> {
    const [
      afp,
      isapres,
      saludInstituciones,
      tramosCarga,
      tramosImpuesto,
      tablaImpuestoUnico,
      reformaPensiones,
      trabajosPesados,
      reformaPrevisional,
      ley16744Parametros,
      organismosLey16744,
      ccafEntidades,
      apvInstituciones,
      apvFormasPago,
    ] = await Promise.all([
      this.listarAfp(),
      this.listarIsapres(),
      this.listarSaludInstituciones(),
      this.listarTramosCarga(),
      this.listarTramosImpuesto(),
      this.listarTablaImpuestoUnico(),
      this.listarParametrosLegales(),
      this.listarTrabajosPesados(),
      this.listarReformaPrevisional(),
      this.listarLey16744Parametros(),
      this.listarOrganismosLey16744(),
      this.listarCcafEntidades(),
      this.listarApvInstituciones(),
      this.listarApvFormasPago(),
    ]);

    return {
      afp,
      isapres,
      saludInstituciones,
      tramosCarga,
      tramosImpuesto,
      tablaImpuestoUnico,
      reformaPensiones,
      trabajosPesados,
      reformaPrevisional,
      ley16744Parametros,
      organismosLey16744,
      ccafEntidades,
      apvInstituciones,
      apvFormasPago,
    };
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

  private toModel(row: ParametroGeneralRow): ParametroGeneral {
    return {
      periodo: row.periodo,
      uf: row.uf,
      utm: row.utm,
      sueldoMinimo: row.sueldo_minimo,
      sueldoMinimo18a65: row.sueldo_minimo18_65,
      gratificacion: row.gratificacion ?? false,
      immGratificacion: row.imm_gratificacion,
      topeAfp: row.tope_afp,
      topeIps: row.tope_ips,
      topeCesantia: row.tope_cesantia,
      topeAfpVoluntario: row.tope_afpvoluntario,
      sis: row.sis,
      descuentosBasePorDia: row.dsctosbpordia ?? false,
      afcTrabajadorIndefinido: row.afc_trabajador_indefinido,
      afcEmpleadorIndefinido: row.afc_empleador_indefinido,
      afcEmpleadorPlazo: row.afc_empleador_plazo,
      fechaActualizacion: row.fecha_actualizacion,
    };
  }

  private toRow(payload: ParametroGeneralUpsert): ParametroGeneralInsert {
    return {
      periodo: payload.periodo,
      uf: payload.uf,
      utm: payload.utm,
      sueldo_minimo: payload.sueldoMinimo,
      sueldo_minimo18_65: payload.sueldoMinimo18a65,
      gratificacion: payload.gratificacion,
      imm_gratificacion: payload.immGratificacion,
      tope_afp: payload.topeAfp,
      tope_ips: payload.topeIps,
      tope_cesantia: payload.topeCesantia,
      tope_afpvoluntario: payload.topeAfpVoluntario,
      sis: payload.sis,
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
      valorDecimal: row.valor_decimal,
      valorEntero: row.valor_entero,
      vigenciaInicio: row.vigencia_inicio,
      vigenciaFin: row.vigencia_fin,
    };
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
}
