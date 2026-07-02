export type TipoConsolidacionNomina = 'anticipo' | 'extraordinaria';

export type EstadoConsolidacionNomina = 'pendiente' | 'aplicada' | 'anulada';

export interface NominaConsolidacion {
  readonly id: string;
  readonly empresaId: string;
  readonly nominaOrigenId: string;
  readonly nominaDestinoId: string;
  readonly tipo: TipoConsolidacionNomina;
  readonly estado: EstadoConsolidacionNomina;
  readonly montoPagado: number;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ResultadoAplicarConsolidaciones {
  readonly aplicadas: number;
  readonly totalAnticipos: number;
  readonly totalExtraordinarias: number;
}

export interface NominaLiquidacionResumen {
  readonly idLiquidacionPeriodo: number;
  readonly nominaPeriodoId: string;
  readonly periodo: string;
  readonly version: number;
  readonly estado: string;
  readonly totalTrabajadores: number;
  readonly totalHaberes: number;
  readonly totalDescuentos: number;
  readonly totalLiquido: number;
  readonly createdAt: string;
}
