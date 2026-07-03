import { Injectable, inject } from '@angular/core';

import { Tables, TablesInsert, TablesUpdate } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  CatalogoLreOpcion,
  ConceptoMantenimientoFila,
  ConceptoMantenimientoPayload,
  ContratoResumenPersona,
  ReglaConceptoCalculoFila,
  HaberDescuentoAsignacionCierrePayload,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
  HaberDescuentoAsignacionVigencia,
} from '../models/haber-descuento-asignacion.model';

type HaberDescuentoRow = Tables<'haberdescuento_persona'>;
type ConceptoRow = Tables<'concepto'>;
type CatalogoLreRow = Tables<'catalogo_lre'>;

type CatalogoLreNest = Pick<
  CatalogoLreRow,
  | 'id_catalogo_lre'
  | 'codigo_lre'
  | 'nombre_lre'
  | 'modulo_lre'
  | 'grupo_lre'
  | 'clasificacion_lre'
>;

type ConceptoWithLre = ConceptoRow & {
  catalogo_lre?: CatalogoLreNest | CatalogoLreNest[] | null;
};

type HdWithConcept = HaberDescuentoRow & {
  catalogo_lre?: never;
  concepto: ConceptoWithLre | ConceptoWithLre[] | null;
};

function unwrapConcept(concepto: HdWithConcept['concepto']): ConceptoWithLre | null {
  if (!concepto) {
    return null;
  }
  return Array.isArray(concepto) ? concepto[0] ?? null : concepto;
}

function unwrapCatalogoLre(
  cl: ConceptoWithLre['catalogo_lre'],
): CatalogoLreNest | null {
  if (!cl) {
    return null;
  }
  return Array.isArray(cl) ? cl[0] ?? null : cl;
}

function mapConceptoMantenimiento(row: ConceptoWithLre): ConceptoMantenimientoFila {
  const lre = unwrapCatalogoLre(row.catalogo_lre);
  return {
    idConcepto: row.id_concepto,
    codigo: row.codigo,
    codigoMotor: row.codigo_motor,
    nombre: row.nombre,
    tipo: row.tipo,
    naturaleza: row.naturaleza,
    idCatalogoLre: row.id_catalogo_lre ?? null,
    codigoLre: lre?.codigo_lre ?? null,
    nombreLre: lre?.nombre_lre ?? null,
    moduloLre: lre?.modulo_lre ?? null,
    grupoLre: lre?.grupo_lre ?? null,
    clasificacionLre: lre?.clasificacion_lre ?? null,
    imponible: row.imponible,
    tributable: row.tributable,
    afectaAfp: row.afecta_afp,
    afectaSalud: row.afecta_salud,
    afectaAfc: row.afecta_afc,
    afectaSis: row.afecta_sis,
    afectaLiquido: row.afecta_liquido,
    esSistema: row.es_sistema,
    vigente: row.vigente,
    vigenciaInicio: row.vigencia_inicio,
    vigenciaFin: row.vigencia_fin,
    ordenImpresion: row.orden_impresion,
    calculoAutomatico: row.calculo_automatico,
  };
}

function mapAsignacion(row: HdWithConcept): HaberDescuentoAsignacionListado {
  const c = unwrapConcept(row.concepto);
  const lre = c ? unwrapCatalogoLre(c.catalogo_lre) : null;
  return {
    idAsignacion: row.id_asignacion,
    idPersona: row.id_persona,
    idConcepto: row.id_concepto,
    idContrato: row.id_contrato ?? null,
    codigoConcepto: c?.codigo ?? '',
    nombreConcepto: c?.nombre ?? '',
    tipoConcepto: c?.tipo ?? null,
    naturalezaConcepto: c?.naturaleza ?? null,
    codigoLre: lre?.codigo_lre ?? null,
    esSistemaConcepto: c?.es_sistema ?? false,
    calculoAutomaticoConcepto: c?.calculo_automatico ?? false,
    imponible: c?.imponible ?? false,
    tributable: c?.tributable ?? false,
    monto: row.monto,
    porcentaje: row.porcentaje,
    tipoValor: row.tipo,
    tipohaber: row.tipohaber,
    periodicidad: row.periodicidad ?? null,
    vigenciaInicio: row.vigencia_inicio ?? null,
    vigenciaFin: row.vigencia_fin ?? null,
    observacion: row.observacion ?? null,
    estado: row.estado ?? false,
  };
}

@Injectable({ providedIn: 'root' })
export class HaberesDescuentosRepository {
  private readonly supabase = injectSupabase();

  async listarCatalogoLreVigentes(): Promise<CatalogoLreOpcion[]> {
    const { data, error } = await this.supabase
      .from('catalogo_lre')
      .select(
        'id_catalogo_lre, codigo_lre, nombre_lre, modulo_lre, grupo_lre, clasificacion_lre',
      )
      .eq('vigente', true)
      .order('codigo_lre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((r) => ({
      idCatalogoLre: r.id_catalogo_lre as number,
      codigoLre: r.codigo_lre as string,
      nombreLre: r.nombre_lre as string,
      moduloLre: r.modulo_lre as string,
      grupoLre: (r.grupo_lre as string | null) ?? null,
      clasificacionLre: (r.clasificacion_lre as string | null) ?? null,
    }));
  }

  async listarContratosPorPersona(idPersona: number): Promise<ContratoResumenPersona[]> {
    const { data, error } = await this.supabase
      .from('contrato')
      .select('id_contrato, cargo, fecha_inicio, estado')
      .eq('id_persona', idPersona)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((r) => {
      const id = r.id_contrato as number;
      const cargo = (r.cargo as string | null)?.trim() || 'Sin cargo';
      const fi = (r.fecha_inicio as string)?.slice(0, 10) ?? '';
      const est = (r.estado as string | null)?.trim() || '';
      return {
        idContrato: id,
        etiqueta: `#${id} · ${cargo}${fi ? ` · desde ${fi}` : ''}${est ? ` · ${est}` : ''}`,
      };
    });
  }

  async contratoPerteneceAPersona(
    idPersona: number,
    idContrato: number,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('contrato')
      .select('id_contrato')
      .eq('id_contrato', idContrato)
      .eq('id_persona', idPersona)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data != null;
  }

  /**
   * Metadatos de `concepto` para validar asignación manual con la regla central
   * `esConceptoAsignable` (servicio).
   */
  async obtenerConceptoParaAsignacion(idConcepto: number): Promise<{
    codigo: string | null;
    nombre: string | null;
    tipo: string | null;
    esSistema: boolean;
    calculoAutomatico: boolean;
    vigente: boolean;
    vigenciaInicio: string | null;
    vigenciaFin: string | null;
  } | null> {
    const { data, error } = await this.supabase
      .from('concepto')
      .select('codigo, nombre, tipo, es_sistema, calculo_automatico, vigente, vigencia_inicio, vigencia_fin')
      .eq('id_concepto', idConcepto)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      codigo: data.codigo ?? null,
      nombre: data.nombre ?? null,
      tipo: data.tipo ?? null,
      esSistema: Boolean(data.es_sistema),
      calculoAutomatico: Boolean(data.calculo_automatico),
      vigente: Boolean(data.vigente),
      vigenciaInicio: data.vigencia_inicio,
      vigenciaFin: data.vigencia_fin,
    };
  }

  async obtenerConceptoFlags(
    idConcepto: number,
  ): Promise<{ esSistema: boolean; calculoAutomatico: boolean } | null> {
    const { data, error } = await this.supabase
      .from('concepto')
      .select('es_sistema, calculo_automatico')
      .eq('id_concepto', idConcepto)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      esSistema: Boolean(data.es_sistema),
      calculoAutomatico: Boolean(data.calculo_automatico),
    };
  }

  /** Catálogo completo para mantenedor (HABER, DESCUENTO, APORTE_EMPLEADOR). */
  async listarConceptosMantenimiento(): Promise<ConceptoMantenimientoFila[]> {
    const { data, error } = await this.supabase
      .from('concepto')
      .select(
        `
        id_concepto,
        codigo,
        codigo_motor,
        nombre,
        tipo,
        naturaleza,
        imponible,
        tributable,
        afecta_afp,
        afecta_salud,
        afecta_afc,
        afecta_sis,
        afecta_liquido,
        es_sistema,
        vigente,
        vigencia_inicio,
        vigencia_fin,
        orden_impresion,
        calculo_automatico,
        id_catalogo_lre,
        catalogo_lre (
          id_catalogo_lre,
          codigo_lre,
          nombre_lre,
          modulo_lre,
          grupo_lre,
          clasificacion_lre
        )
      `,
      )
      .order('orden_impresion', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapConceptoMantenimiento(row as unknown as ConceptoWithLre));
  }

  async crearConcepto(payload: ConceptoMantenimientoPayload): Promise<number> {
    const insert: TablesInsert<'concepto'> = {
      codigo: payload.codigo.trim(),
      codigo_motor: payload.codigoMotor?.trim() || null,
      nombre: payload.nombre.trim(),
      tipo: payload.tipo,
      naturaleza: payload.naturaleza,
      imponible: payload.imponible,
      tributable: payload.tributable,
      afecta_afp: payload.afectaAfp,
      afecta_salud: payload.afectaSalud,
      afecta_afc: payload.afectaAfc,
      afecta_sis: payload.afectaSis,
      afecta_liquido: payload.afectaLiquido,
      es_sistema: false,
      vigente: payload.vigente,
      vigencia_inicio: payload.vigenciaInicio,
      vigencia_fin: payload.vigenciaFin,
      orden_impresion: payload.ordenImpresion,
      calculo_automatico: payload.calculoAutomatico,
      id_catalogo_lre: payload.idCatalogoLre,
    };

    const { data, error } = await this.supabase.from('concepto').insert(insert).select('id_concepto').single();

    if (error) {
      throw new Error(error.message);
    }

    return data.id_concepto as number;
  }

  async actualizarConcepto(idConcepto: number, payload: ConceptoMantenimientoPayload): Promise<void> {
    const patch: TablesUpdate<'concepto'> = {
      codigo_motor: payload.codigoMotor?.trim() || null,
      nombre: payload.nombre.trim(),
      tipo: payload.tipo,
      naturaleza: payload.naturaleza,
      imponible: payload.imponible,
      tributable: payload.tributable,
      afecta_afp: payload.afectaAfp,
      afecta_salud: payload.afectaSalud,
      afecta_afc: payload.afectaAfc,
      afecta_sis: payload.afectaSis,
      afecta_liquido: payload.afectaLiquido,
      vigente: payload.vigente,
      vigencia_inicio: payload.vigenciaInicio,
      vigencia_fin: payload.vigenciaFin,
      orden_impresion: payload.ordenImpresion,
      calculo_automatico: payload.calculoAutomatico,
      id_catalogo_lre: payload.idCatalogoLre,
    };

    const { error } = await this.supabase.from('concepto').update(patch).eq('id_concepto', idConcepto);

    if (error) {
      throw new Error(error.message);
    }
  }

  async eliminarConcepto(idConcepto: number): Promise<void> {
    const { error } = await this.supabase.from('concepto').delete().eq('id_concepto', idConcepto);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Cuenta referencias al concepto antes de borrarlo.
   * `liquidacionDetalle` consulta la tabla legacy `liquidacion_detalle` (salida de fn_generar_liquidacion);
   * no es la liquidación oficial del periodo (nomina_liquidacion_concepto). Solo lectura COUNT; no alterar sin fase de migración del guard.
   */
  async contarUsoConcepto(idConcepto: number): Promise<{ liquidacionDetalle: number; asignaciones: number }> {
    const [liq, asig] = await Promise.all([
      this.supabase
        .from('liquidacion_detalle')
        .select('id_detalle', { count: 'exact', head: true })
        .eq('id_concepto', idConcepto),
      this.supabase
        .from('haberdescuento_persona')
        .select('id_asignacion', { count: 'exact', head: true })
        .eq('id_concepto', idConcepto),
    ]);

    if (liq.error) {
      throw new Error(liq.error.message);
    }
    if (asig.error) {
      throw new Error(asig.error.message);
    }

    return {
      liquidacionDetalle: liq.count ?? 0,
      asignaciones: asig.count ?? 0,
    };
  }

  async listarAsignacionesPorPersona(
    idPersona: number,
  ): Promise<HaberDescuentoAsignacionListado[]> {
    const { data, error } = await this.supabase
      .from('haberdescuento_persona')
      .select(
        `
        id_asignacion,
        id_persona,
        id_concepto,
        id_contrato,
        monto,
        porcentaje,
        tipo,
        tipohaber,
        estado,
        periodicidad,
        vigencia_inicio,
        vigencia_fin,
        observacion,
        concepto (
          id_concepto,
          codigo,
          nombre,
          tipo,
          naturaleza,
          imponible,
          tributable,
          es_sistema,
          calculo_automatico,
          catalogo_lre (
            codigo_lre
          )
        )
      `,
      )
      .eq('id_persona', idPersona)
      .order('id_asignacion');

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapAsignacion(row as HdWithConcept));
  }

  /** Listado global de asignaciones recurrentes (join concepto) para prevalidacion por periodo. */
  async listarTodasAsignacionesConConcepto(): Promise<HaberDescuentoAsignacionListado[]> {
    const { data, error } = await this.supabase
      .from('haberdescuento_persona')
      .select(
        `
        id_asignacion,
        id_persona,
        id_concepto,
        id_contrato,
        monto,
        porcentaje,
        tipo,
        tipohaber,
        estado,
        periodicidad,
        vigencia_inicio,
        vigencia_fin,
        observacion,
        concepto (
          id_concepto,
          codigo,
          nombre,
          tipo,
          naturaleza,
          imponible,
          tributable,
          es_sistema,
          calculo_automatico,
          catalogo_lre (
            codigo_lre
          )
        )
      `,
      )
      .order('id_persona', { ascending: true })
      .order('id_asignacion', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapAsignacion(row as HdWithConcept));
  }

  async existeActivaMismoConcepto(
    idPersona: number,
    idConcepto: number,
    excludeIdAsignacion?: number,
  ): Promise<boolean> {
    let query = this.supabase
      .from('haberdescuento_persona')
      .select('id_asignacion')
      .eq('id_persona', idPersona)
      .eq('id_concepto', idConcepto)
      .eq('estado', true);

    if (excludeIdAsignacion != null) {
      query = query.neq('id_asignacion', excludeIdAsignacion);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return (data?.length ?? 0) > 0;
  }

  async listarAsignacionesPorPersonaYConcepto(
    idPersona: number,
    idConcepto: number,
  ): Promise<HaberDescuentoAsignacionVigencia[]> {
    const { data, error } = await this.supabase
      .from('haberdescuento_persona')
      .select('id_asignacion, id_persona, id_concepto, estado, vigencia_inicio, vigencia_fin')
      .eq('id_persona', idPersona)
      .eq('id_concepto', idConcepto)
      .order('vigencia_inicio', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      idAsignacion: row.id_asignacion as number,
      idPersona: row.id_persona as number,
      idConcepto: row.id_concepto as number,
      vigenciaInicio: (row.vigencia_inicio as string | null) ?? null,
      vigenciaFin: (row.vigencia_fin as string | null) ?? null,
      estado: Boolean(row.estado),
    }));
  }

  async obtenerAsignacionPorId(
    idAsignacion: number,
  ): Promise<HaberDescuentoAsignacionVigencia | null> {
    const { data, error } = await this.supabase
      .from('haberdescuento_persona')
      .select('id_asignacion, id_persona, id_concepto, estado, vigencia_inicio, vigencia_fin')
      .eq('id_asignacion', idAsignacion)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      idAsignacion: data.id_asignacion as number,
      idPersona: data.id_persona as number,
      idConcepto: data.id_concepto as number,
      vigenciaInicio: (data.vigencia_inicio as string | null) ?? null,
      vigenciaFin: (data.vigencia_fin as string | null) ?? null,
      estado: Boolean(data.estado),
    };
  }

  async cerrarAsignacion(
    idAsignacion: number,
    payload: HaberDescuentoAsignacionCierrePayload,
  ): Promise<void> {
    const patch: TablesUpdate<'haberdescuento_persona'> = {
      estado: payload.estado,
      vigencia_fin: payload.vigenciaFin,
    };

    const { error } = await this.supabase
      .from('haberdescuento_persona')
      .update(patch)
      .eq('id_asignacion', idAsignacion);

    if (error) {
      throw new Error(error.message);
    }
  }

  async crearAsignacion(
    payload: HaberDescuentoAsignacionPayload,
  ): Promise<void> {
    const insert: TablesInsert<'haberdescuento_persona'> = {
      id_persona: payload.idPersona,
      id_concepto: payload.idConcepto,
      id_contrato: payload.idContrato,
      tipo: payload.tipoValor,
      monto: payload.tipoValor === 'FIJO' ? payload.monto : null,
      porcentaje: payload.tipoValor === 'PORCENTAJE' ? payload.porcentaje : null,
      tipohaber: payload.tipohaber,
      estado: payload.estado,
      periodicidad: payload.periodicidad,
      vigencia_inicio: payload.vigenciaInicio,
      vigencia_fin: payload.vigenciaFin,
      observacion: payload.observacion?.trim() || null,
    };

    const { error } = await this.supabase.from('haberdescuento_persona').insert(insert);

    if (error) {
      throw new Error(error.message);
    }
  }

  async actualizarAsignacion(
    idAsignacion: number,
    payload: HaberDescuentoAsignacionPayload,
  ): Promise<void> {
    const patch: TablesUpdate<'haberdescuento_persona'> = {
      id_concepto: payload.idConcepto,
      id_contrato: payload.idContrato,
      tipo: payload.tipoValor,
      monto: payload.tipoValor === 'FIJO' ? payload.monto : null,
      porcentaje: payload.tipoValor === 'PORCENTAJE' ? payload.porcentaje : null,
      tipohaber: payload.tipohaber,
      estado: payload.estado,
      periodicidad: payload.periodicidad,
      vigencia_inicio: payload.vigenciaInicio,
      vigencia_fin: payload.vigenciaFin,
      observacion: payload.observacion?.trim() || null,
    };

    const { error } = await this.supabase
      .from('haberdescuento_persona')
      .update(patch)
      .eq('id_asignacion', idAsignacion);

    if (error) {
      throw new Error(error.message);
    }
  }

  async desactivarAsignacion(idAsignacion: number): Promise<void> {
    await this.cerrarAsignacion(idAsignacion, { estado: false, vigenciaFin: null });
  }

  async listarReglasCalculoConcepto(idConcepto: number): Promise<ReglaConceptoCalculoFila[]> {
    const { data, error } = await this.supabase
      .from('regla_concepto_calculo')
      .select('id_regla_concepto_calculo, codigo_regla, base_calculo, calculo_automatico, activo')
      .eq('id_concepto', idConcepto)
      .order('codigo_regla', { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => ({
      idReglaConceptoCalculo: Number(row.id_regla_concepto_calculo),
      codigoRegla: row.codigo_regla,
      baseCalculo: row.base_calculo ?? null,
      calculoAutomatico: Boolean(row.calculo_automatico),
      activo: Boolean(row.activo),
    }));
  }
}
