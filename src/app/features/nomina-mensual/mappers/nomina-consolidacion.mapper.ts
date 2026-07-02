import type { Database, Json } from '../../../core/models/database.types';
import type {
  NominaConsolidacion,
  ResultadoAplicarConsolidaciones,
  NominaLiquidacionResumen,
} from '../models/nomina-consolidacion.models';

type ConsolidacionRow = Database['public']['Tables']['nomina_consolidacion']['Row'];
type LiquidacionRow = Database['public']['Tables']['nomina_liquidacion_periodo']['Row'];

function asRecord(value: Json | null): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function rowToNominaConsolidacion(row: ConsolidacionRow): NominaConsolidacion {
  return {
    id: row.id,
    empresaId: String(row.id_empresa),
    nominaOrigenId: row.id_nomina_origen,
    nominaDestinoId: row.id_nomina_destino,
    tipo: row.tipo as NominaConsolidacion['tipo'],
    estado: row.estado as NominaConsolidacion['estado'],
    montoPagado: Number(row.monto_pagado),
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function parseResultadoAplicarConsolidaciones(value: Json | null): ResultadoAplicarConsolidaciones {
  const rec = asRecord(value);
  return {
    aplicadas: Number(rec['aplicadas'] ?? 0),
    totalAnticipos: Number(rec['total_anticipos'] ?? 0),
    totalExtraordinarias: Number(rec['total_extraordinarias'] ?? 0),
  };
}

export function rowToNominaLiquidacionResumen(row: LiquidacionRow): NominaLiquidacionResumen {
  return {
    idLiquidacionPeriodo: row.id_liquidacion_periodo,
    nominaPeriodoId: row.id_nomina_periodo ?? '',
    periodo: row.periodo,
    version: row.version,
    estado: row.estado,
    activo: row.activo,
    idLiquidacionReemplazada: row.id_liquidacion_reemplazada,
    fechaGeneracion: row.fecha_generacion,
    totalTrabajadores: row.total_trabajadores,
    totalHaberes: row.total_haberes,
    totalDescuentos: row.total_descuentos,
    totalLiquido: row.total_liquido,
    createdAt: row.created_at,
  };
}
