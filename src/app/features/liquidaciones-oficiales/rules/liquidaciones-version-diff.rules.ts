/**
 * LIQ-01c: resumen comparable entre versiones de liquidación de una misma nómina.
 */
import type {
  DiffCalculoVersionResultado,
  ResumenCalculoVersionComparable,
} from '../../nomina-mensual/rules/nomina-calculo-version-diff.rules';
import { compararResumenesCalculoVersion } from '../../nomina-mensual/rules/nomina-calculo-version-diff.rules';
import type { FilaLiquidacionInterna } from '../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';

export function filaLiquidacionAResumenComparable(
  fila: FilaLiquidacionInterna,
): ResumenCalculoVersionComparable {
  return {
    idCalculoPeriodo: fila.idLiquidacionPeriodo,
    versionCalculo: fila.version,
    totalTrabajadores: fila.totalTrabajadores,
    totalHaberes: fila.totalHaberes,
    totalDescuentos: fila.totalDescuentos,
    totalLiquido: fila.totalLiquido,
  };
}

export function diffVersionLiquidacionConAnterior(
  filas: readonly FilaLiquidacionInterna[],
  versionActiva: FilaLiquidacionInterna | null,
): DiffCalculoVersionResultado | null {
  if (!versionActiva || filas.length < 2) return null;
  const anterior = filas.find((fila) => fila.version === versionActiva.version - 1);
  if (!anterior) return null;
  return compararResumenesCalculoVersion(
    filaLiquidacionAResumenComparable(anterior),
    filaLiquidacionAResumenComparable(versionActiva),
  );
}
