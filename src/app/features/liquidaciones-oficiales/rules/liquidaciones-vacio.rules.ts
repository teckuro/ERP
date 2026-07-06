import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { nominasConLiquidacionesDisponibles } from '../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';
import { tieneLiquidaciones } from '../../nomina-mensual/rules/admin-nominas.rules';

export type LiquidacionesVacioEscenario =
  | 'sin_nominas'
  | 'nominas_en_preparacion'
  | 'sin_comprobantes';

export interface LiquidacionesActaVaciaVm {
  escenario: LiquidacionesVacioEscenario;
  chipLabel: string;
  kicker: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryFilled: boolean;
}

export function resolverEscenarioVacioLiquidaciones(
  resumenes: readonly NominaPeriodoResumen[],
  elegibles: readonly NominaPeriodoResumen[],
): LiquidacionesVacioEscenario {
  if (resumenes.length === 0) return 'sin_nominas';
  if (elegibles.length > 0) return 'sin_comprobantes';

  const hayCerradaOLiquidada = resumenes.some((fila) => tieneLiquidaciones(fila.estado));
  if (hayCerradaOLiquidada) return 'sin_comprobantes';

  return 'nominas_en_preparacion';
}

export function periodosEjemploResumenes(
  resumenes: readonly NominaPeriodoResumen[],
  maximo = 2,
): string {
  const periodos = [...new Set(resumenes.map((fila) => fila.periodo))]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, maximo);
  return periodos.join(' · ');
}

export function construirActaVaciaLiquidaciones(
  resumenes: readonly NominaPeriodoResumen[],
  elegibles: readonly NominaPeriodoResumen[] = nominasConLiquidacionesDisponibles(resumenes),
): LiquidacionesActaVaciaVm {
  const escenario = resolverEscenarioVacioLiquidaciones(resumenes, elegibles);

  if (escenario === 'sin_nominas') {
    return {
      escenario,
      chipLabel: 'Sin nóminas',
      kicker: 'Siguiente paso',
      title: 'Aún no hay liquidaciones materializadas',
      description:
        'Cree y cierre una nómina mensual en el administrador. Aquí aparecerán los comprobantes cuando esté lista. No recalcula montos.',
      primaryLabel: 'Crear nómina en administrador',
      primaryFilled: true,
    };
  }

  if (escenario === 'nominas_en_preparacion') {
    const periodos = periodosEjemploResumenes(resumenes);
    const detallePeriodos = periodos ? ` (ej. ${periodos})` : '';
    return {
      escenario,
      chipLabel: 'Nóminas en preparación',
      kicker: 'Nóminas en preparación',
      title: 'Aún no hay comprobantes listos',
      description: `Hay ${resumenes.length} nómina(s) en curso${detallePeriodos}. Complete el cierre en el administrador para materializar liquidaciones.`,
      primaryLabel: 'Ir al administrador de nóminas',
      primaryFilled: false,
    };
  }

  return {
    escenario,
    chipLabel: 'Sin liquidaciones',
    kicker: 'Sin comprobantes',
    title: 'Sin comprobantes materializados',
    description:
      'No hay nóminas cerradas o liquidadas con cálculo vigente. Revise el administrador y genere comprobantes desde la nómina.',
    primaryLabel: 'Ir al administrador de nóminas',
    primaryFilled: false,
  };
}
