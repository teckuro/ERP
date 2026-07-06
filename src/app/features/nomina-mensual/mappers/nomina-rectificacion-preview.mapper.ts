import type {
  ConfirmarRectificacionResultado,
  RectificacionConflictoPreview,
  RectificacionPreview,
  RectificacionTrabajadorPreview,
} from '../models/nomina-rectificacion-preview.models';

function mapTrabajador(raw: unknown): RectificacionTrabajadorPreview | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const idPersona = Number(row['idPersona']);
  if (!Number.isFinite(idPersona)) return null;
  return {
    idPersona,
    rut: String(row['rut'] ?? ''),
    nombre: String(row['nombre'] ?? ''),
    cargo: row['cargo'] ? String(row['cargo']) : undefined,
  };
}

function mapConflicto(raw: unknown): RectificacionConflictoPreview | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  return {
    motivo: String(row['motivo'] ?? ''),
    motivoHumano: String(row['motivoHumano'] ?? ''),
    detalle: row['detalle'] && typeof row['detalle'] === 'object' && !Array.isArray(row['detalle'])
      ? (row['detalle'] as Record<string, unknown>)
      : undefined,
  };
}

export function mapRectificacionPreview(raw: unknown): RectificacionPreview {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Preview de rectificación inválido.');
  }
  const row = raw as Record<string, unknown>;
  const trabajadores = Array.isArray(row['trabajadoresDisponibles'])
    ? row['trabajadoresDisponibles'].map(mapTrabajador).filter((t): t is RectificacionTrabajadorPreview => t !== null)
    : [];
  const conflictos = Array.isArray(row['conflictos'])
    ? row['conflictos'].map(mapConflicto).filter((c): c is RectificacionConflictoPreview => c !== null)
    : [];
  const idsRaw = row['trabajadorIdsSeleccionados'];
  const trabajadorIdsSeleccionados = Array.isArray(idsRaw)
    ? idsRaw.map((id) => Number(id)).filter(Number.isFinite)
    : [];
  const totalesRaw = row['totales'];
  const totales = totalesRaw && typeof totalesRaw === 'object' && !Array.isArray(totalesRaw)
    ? totalesRaw as Record<string, unknown>
    : {};

  return {
    nominaOrigenId: String(row['nominaOrigenId'] ?? ''),
    nominaReferenciaId: String(row['nominaReferenciaId'] ?? row['nominaOrigenId'] ?? ''),
    periodo: String(row['periodo'] ?? ''),
    tipo: String(row['tipo'] ?? ''),
    empresaNombre: String(row['empresaNombre'] ?? ''),
    versionCalculoOrigen: Number(row['versionCalculoOrigen'] ?? 0),
    fingerprint: String(row['fingerprint'] ?? ''),
    motivo: row['motivo'] ? String(row['motivo']) : undefined,
    trabajadoresDisponibles: trabajadores,
    trabajadorIdsSeleccionados,
    conflictos,
    totales: {
      disponibles: Number(totales['disponibles'] ?? 0),
      seleccionados: Number(totales['seleccionados'] ?? 0),
      conflictos: Number(totales['conflictos'] ?? 0),
    },
    puedeCrear: row['puedeCrear'] === true,
  };
}

export function mapConfirmarRectificacionResultado(raw: unknown): ConfirmarRectificacionResultado {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Resultado de rectificación inválido.');
  }
  const row = raw as Record<string, unknown>;
  const paso = row['siguientePaso'] === 'dotacion' ? 'dotacion' : 'parameters';
  return {
    idNominaPeriodo: String(row['idNominaPeriodo'] ?? ''),
    nominaOrigenId: String(row['nominaOrigenId'] ?? ''),
    estado: String(row['estado'] ?? 'borrador'),
    versionEstado: Number(row['versionEstado'] ?? 0),
    codigoCiclo: String(row['codigoCiclo'] ?? ''),
    fechaInicio: String(row['fechaInicio'] ?? ''),
    fechaFin: String(row['fechaFin'] ?? ''),
    tipo: String(row['tipo'] ?? ''),
    naturaleza: String(row['naturaleza'] ?? 'rectificacion'),
    totalTrabajadores: Number(row['totalTrabajadores'] ?? 0),
    siguientePaso: paso,
    motivo: String(row['motivo'] ?? ''),
  };
}
