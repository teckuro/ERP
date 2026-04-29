import { Injectable, inject } from '@angular/core';

import { Tables, TablesInsert, TablesUpdate } from '../../../core/models/database.types';
import { injectSupabase } from '../../../core/services/supabase.service';
import {
  ConceptoListado,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
} from '../models/haber-descuento-asignacion.model';

/** Conceptos que calcula el motor de liquidación o movimientos; no deben asignarse como recurrentes desde UI. */
const CODIGOS_CONCEPTO_EXCLUIDOS_ASIGNACION: readonly string[] = [
  'SUELDO_BASE',
  'GRATIFICACION',
  'AFP',
  'SALUD',
  'CESANTIA',
  'IMPUESTO_RENTA',
  'HORAS_EXTRAS',
  'INASISTENCIA',
  'ZONA_EXTREMA',
  'PRESTAMO',
  'AFP_EMPLEADOR',
  'SIS_EMPLEADOR',
  'AFC_EMPLEADOR',
];

type HaberDescuentoRow = Tables<'haberdescuento_persona'>;
type ConceptoRow = Tables<'concepto'>;

type HdWithConcept = HaberDescuentoRow & {
  concepto: ConceptoRow | ConceptoRow[] | null;
};

function unwrapConcept(concepto: HdWithConcept['concepto']): ConceptoRow | null {
  if (!concepto) {
    return null;
  }
  return Array.isArray(concepto) ? concepto[0] ?? null : concepto;
}

function mapConcepto(row: ConceptoRow): ConceptoListado {
  return {
    idConcepto: row.id_concepto,
    codigo: row.codigo,
    nombre: row.nombre,
    tipo: row.tipo,
    naturaleza: row.naturaleza,
    imponible: row.imponible,
    tributable: row.tributable,
  };
}

function mapAsignacion(row: HdWithConcept): HaberDescuentoAsignacionListado {
  const c = unwrapConcept(row.concepto);
  return {
    idAsignacion: row.id_asignacion,
    idPersona: row.id_persona,
    idConcepto: row.id_concepto,
    codigoConcepto: c?.codigo ?? '',
    nombreConcepto: c?.nombre ?? '',
    tipoConcepto: c?.tipo ?? null,
    naturalezaConcepto: c?.naturaleza ?? null,
    imponible: c?.imponible ?? false,
    tributable: c?.tributable ?? false,
    monto: row.monto,
    porcentaje: row.porcentaje,
    tipoValor: row.tipo,
    tipohaber: row.tipohaber,
    estado: row.estado ?? false,
  };
}

@Injectable({ providedIn: 'root' })
export class HaberesDescuentosRepository {
  private readonly supabase = injectSupabase();

  async listarConceptosAsignables(): Promise<ConceptoListado[]> {
    const { data, error } = await this.supabase
      .from('concepto')
      .select(
        'id_concepto, codigo, nombre, tipo, naturaleza, imponible, tributable',
      )
      .in('tipo', ['HABER', 'DESCUENTO'])
      .order('nombre');

    if (error) {
      throw new Error(error.message);
    }

    const excluded = new Set(CODIGOS_CONCEPTO_EXCLUIDOS_ASIGNACION);

    return (data ?? [])
      .filter((row) => !excluded.has(String((row as { codigo: string }).codigo)))
      .map((row) =>
        mapConcepto(row as unknown as ConceptoRow),
      );
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
        monto,
        porcentaje,
        tipo,
        tipohaber,
        estado,
        concepto (
          id_concepto,
          codigo,
          nombre,
          tipo,
          naturaleza,
          imponible,
          tributable
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

  async crearAsignacion(
    payload: HaberDescuentoAsignacionPayload,
  ): Promise<void> {
    const insert: TablesInsert<'haberdescuento_persona'> = {
      id_persona: payload.idPersona,
      id_concepto: payload.idConcepto,
      tipo: payload.tipoValor,
      monto: payload.tipoValor === 'FIJO' ? payload.monto : null,
      porcentaje: payload.tipoValor === 'PORCENTAJE' ? payload.porcentaje : null,
      tipohaber: payload.tipohaber,
      estado: payload.estado,
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
      tipo: payload.tipoValor,
      monto: payload.tipoValor === 'FIJO' ? payload.monto : null,
      porcentaje: payload.tipoValor === 'PORCENTAJE' ? payload.porcentaje : null,
      tipohaber: payload.tipohaber,
      estado: payload.estado,
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
    const { error } = await this.supabase
      .from('haberdescuento_persona')
      .update({ estado: false })
      .eq('id_asignacion', idAsignacion);

    if (error) {
      throw new Error(error.message);
    }
  }
}
