import type { NominaCalculoPeriodoSnapshot } from '../models/proceso-mensual.model';

/** Incluye el snapshot activo en historial si la lista del período aún no lo trae (p. ej. tras rehidratar). */
export function mergeSnapshotsHistorialPeriodo(
  historial: readonly NominaCalculoPeriodoSnapshot[],
  activo: NominaCalculoPeriodoSnapshot | null,
): NominaCalculoPeriodoSnapshot[] {
  if (!activo?.idCalculoPeriodo) {
    return [...historial];
  }
  const yaIncluido = historial.some(
    (s) =>
      s.idCalculoPeriodo === activo.idCalculoPeriodo
      || (activo.hashSnapshot != null && s.hashSnapshot === activo.hashSnapshot),
  );
  if (yaIncluido) {
    return [...historial];
  }
  return [activo, ...historial];
}
