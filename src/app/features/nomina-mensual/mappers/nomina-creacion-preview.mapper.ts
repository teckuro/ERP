/**
 * Defensa runtime: convierte el JSON crudo de la RPC `previsualizar_creacion_nomina`
 * en el viewmodel tipado `NominaCreatePreview`. No asume nada del input: campos
 * faltantes se completan con valores seguros (arrays vacíos, totales en cero).
 */

import type {
  ConflictoCreacionNomina,
  ConfirmarCreacionResultado,
  NominaCreatePreview,
  SiguientePasoCreacion,
  TrabajadorExcluidoPreview,
  TrabajadorIncluidoPreview,
} from '../models/nomina-creacion-preview.models';
import type { TipoNomina } from '../models/nomina-periodo.models';

function asArray<T>(value: unknown, mapper: (raw: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const raw of value) {
    const item = mapper(raw);
    if (item) out.push(item);
  }
  return out;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapIncluido(raw: unknown): TrabajadorIncluidoPreview | null {
  const obj = asObject(raw);
  if (!obj) return null;
  const idPersona = asNumber(obj['idPersona']);
  if (idPersona === 0) return null;
  return {
    idPersona,
    rut: asString(obj['rut']),
    nombre: asString(obj['nombre']),
    cargo: typeof obj['cargo'] === 'string' ? (obj['cargo'] as string) : null,
  };
}

function mapExcluido(raw: unknown): TrabajadorExcluidoPreview | null {
  const obj = asObject(raw);
  if (!obj) return null;
  const idPersona = asNumber(obj['idPersona']);
  if (idPersona === 0) return null;
  return {
    idPersona,
    rut: asString(obj['rut']),
    nombre: asString(obj['nombre']),
    motivo: asString(obj['motivo']),
    motivoHumano: asString(obj['motivoHumano']),
  };
}

function mapConflicto(raw: unknown): ConflictoCreacionNomina | null {
  const obj = asObject(raw);
  if (!obj) return null;
  const motivo = asString(obj['motivo']);
  if (!motivo) return null;
  return {
    motivo,
    motivoHumano: asString(obj['motivoHumano']),
    detalle: asObject(obj['detalle']),
  };
}

function asSiguientePaso(value: unknown): SiguientePasoCreacion {
  return value === 'dotacion' ? 'dotacion' : 'parameters';
}

export function mapConfirmarCreacionResultado(raw: unknown): ConfirmarCreacionResultado {
  const obj = asObject(raw) ?? {};
  return {
    idNominaPeriodo: asString(obj['idNominaPeriodo']),
    estado: asString(obj['estado'], 'borrador'),
    versionEstado: asNumber(obj['versionEstado']),
    codigoCiclo: asString(obj['codigoCiclo']),
    fechaInicio: asString(obj['fechaInicio']),
    fechaFin: asString(obj['fechaFin']),
    totalTrabajadores: asNumber(obj['totalTrabajadores']),
    siguientePaso: asSiguientePaso(obj['siguientePaso']),
    reutilizada: asBoolean(obj['reutilizada']),
  };
}

export function mapNominaCreatePreview(raw: unknown): NominaCreatePreview {
  const obj = asObject(raw) ?? {};
  const totales = asObject(obj['totales']) ?? {};
  const tipo = asString(obj['tipo'], 'mensual') as TipoNomina;
  const incluidos = asArray(obj['incluidos'], mapIncluido);
  const excluidos = asArray(obj['excluidos'], mapExcluido);
  const conflictos = asArray(obj['conflictos'], mapConflicto);

  return {
    periodo: asString(obj['periodo']),
    tipo,
    naturaleza: asString(obj['naturaleza'], 'liquidacion_legal'),
    idEmpresa: asNumber(obj['idEmpresa']),
    empresaNombre: typeof obj['empresaNombre'] === 'string'
      ? (obj['empresaNombre'] as string)
      : null,
    codigoCiclo: asString(obj['codigoCiclo']),
    fechaInicio: asString(obj['fechaInicio']),
    fechaFin: asString(obj['fechaFin']),
    plantillaCicloId: typeof obj['plantillaCicloId'] === 'string'
      ? (obj['plantillaCicloId'] as string)
      : null,
    incluidos,
    excluidos,
    conflictos,
    totales: {
      incluidos: asNumber(totales['incluidos'], incluidos.length),
      excluidos: asNumber(totales['excluidos'], excluidos.length),
      conflictos: asNumber(totales['conflictos'], conflictos.length),
    },
    puedeCrear: asBoolean(obj['puedeCrear']),
    fingerprint: asString(obj['fingerprint']),
    generadoEn: asString(obj['generadoEn']),
  };
}
