/**
 * Mappers BD ↔ modelos TS para Plantillas de ciclos.
 *
 * Creados en `NOM-ADMIN-OPS-F03` (2026-06-11).
 *
 * Convención: `id_empresa` es `integer` en BD y `string` en TS (consistente
 * con el resto del módulo, ver `nomina-periodo.mapper.ts`).
 */

import type { Database, Json } from '../../../core/models/database.types';
import type { NaturalezaNomina, TipoNomina } from '../models/nomina-periodo.models';
import {
  esReglaAnticipoValida,
  esReglaFechaPagoValida,
  type NominaPlantillaCiclo,
  type NominaPlantillaCicloNueva,
  type PoliticaFinSemana,
  type PreviewCorte,
  type ReglaAnticipo,
  type ReglaFechaPago,
} from '../models/nomina-plantilla-ciclo.models';

type Tables = Database['public']['Tables'];
export type NominaPlantillaCicloRow = Tables['nomina_plantilla_ciclo']['Row'];
export type NominaPlantillaCicloInsert = Tables['nomina_plantilla_ciclo']['Insert'];
export type NominaPlantillaCicloUpdate = Tables['nomina_plantilla_ciclo']['Update'];

type PreviewCorteRpcRow =
  Database['public']['Functions']['previsualizar_cortes_plantilla']['Returns'][number];

const POLITICAS_VALIDAS = new Set<PoliticaFinSemana>(['adelantar', 'atrasar', 'mantener']);

function parsearPolitica(valor: string): PoliticaFinSemana {
  return POLITICAS_VALIDAS.has(valor as PoliticaFinSemana)
    ? (valor as PoliticaFinSemana)
    : 'adelantar';
}

function parsearReglaFechaPago(valor: Json): ReglaFechaPago {
  if (!esReglaFechaPagoValida(valor)) {
    throw new Error(
      `rowToNominaPlantillaCiclo: regla_fecha_pago inválida (${JSON.stringify(valor)})`,
    );
  }
  return valor;
}

function parsearReglaAnticipo(valor: Json | null): ReglaAnticipo | null {
  if (valor === null) return null;
  if (!esReglaAnticipoValida(valor)) {
    throw new Error(
      `rowToNominaPlantillaCiclo: regla_anticipo inválida (${JSON.stringify(valor)})`,
    );
  }
  return valor;
}

export function rowToNominaPlantillaCiclo(row: NominaPlantillaCicloRow): NominaPlantillaCiclo {
  return {
    id: row.id,
    empresaId: String(row.id_empresa),
    codigo: row.codigo,
    nombre: row.nombre,
    tipo: row.tipo as TipoNomina,
    naturaleza: row.naturaleza as NaturalezaNomina,
    reglaFechaPago: parsearReglaFechaPago(row.regla_fecha_pago),
    politicaFinSemana: parsearPolitica(row.politica_fin_semana),
    reglaAnticipo: parsearReglaAnticipo(row.regla_anticipo),
    descripcion: row.descripcion,
    activo: row.activo,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function plantillaNuevaToInsert(
  plantilla: NominaPlantillaCicloNueva,
): NominaPlantillaCicloInsert {
  const reglaAnticipo =
    plantilla.naturaleza === 'anticipo' && plantilla.reglaAnticipo
      ? (plantilla.reglaAnticipo as unknown as Json)
      : null;

  return {
    id_empresa: Number(plantilla.empresaId),
    codigo: plantilla.codigo,
    nombre: plantilla.nombre,
    tipo: plantilla.tipo,
    naturaleza: plantilla.naturaleza,
    regla_fecha_pago: plantilla.reglaFechaPago as unknown as Json,
    politica_fin_semana: plantilla.politicaFinSemana,
    regla_anticipo: reglaAnticipo,
    descripcion: plantilla.descripcion ?? null,
    activo: true,
    version: 1,
  };
}

export function rowToPreviewCorte(row: PreviewCorteRpcRow): PreviewCorte {
  // Los TABLE-returning RPC se tipan como `string` no-nullable, pero en
  // runtime PG devuelve null si la regla no aplica. Tratamos defensivamente.
  const ajusteRaw = row.ajuste_fds as string | null;
  const notasRaw = row.notas as string | null;

  return {
    numeroCorte: row.numero_corte,
    codigoCiclo: row.codigo_ciclo,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    fechaPagoPropuesta: row.fecha_pago_propuesta,
    fechaPagoCalendario: row.fecha_pago_calendario,
    ajusteFds:
      ajusteRaw && POLITICAS_VALIDAS.has(ajusteRaw as PoliticaFinSemana)
        ? (ajusteRaw as PoliticaFinSemana)
        : null,
    notas: notasRaw,
  };
}
