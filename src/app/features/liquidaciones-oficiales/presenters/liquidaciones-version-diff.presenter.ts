import type { DiffCalculoVersionResultado } from '../../nomina-mensual/rules/nomina-calculo-version-diff.rules';
import {
  presentarDiffRecalculo,
  type DiffRecalculoView,
} from '../../nomina-mensual-v2/presenters/nomina-calculo-version-diff.presenter';

export function presentarDiffVersionLiquidacion(
  diff: DiffCalculoVersionResultado | null,
): DiffRecalculoView | null {
  if (!diff) return null;
  const base = presentarDiffRecalculo(diff);
  if (!base) return null;
  return {
    ...base,
    titulo: `Cambios entre liquidación v${diff.versionAnterior} y v${diff.versionActual}`,
  };
}
