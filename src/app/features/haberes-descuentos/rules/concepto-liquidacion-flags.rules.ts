export interface FlagsLiquidacionConcepto {
  imponible: boolean;
  tributable: boolean;
  afectaAfp: boolean;
  afectaSalud: boolean;
  afectaAfc: boolean;
  afectaSis: boolean;
  afectaLiquido: boolean;
}

export type TipoConceptoLiquidacion = 'HABER' | 'DESCUENTO' | 'APORTE_EMPLEADOR';

const SIN_IMPACTO: FlagsLiquidacionConcepto = {
  imponible: false,
  tributable: false,
  afectaAfp: false,
  afectaSalud: false,
  afectaAfc: false,
  afectaSis: false,
  afectaLiquido: false,
};

const IMPONIBLE_HABER_DESCUENTO: FlagsLiquidacionConcepto = {
  imponible: true,
  tributable: true,
  afectaAfp: true,
  afectaSalud: true,
  afectaAfc: true,
  afectaSis: false,
  afectaLiquido: true,
};

const NO_IMPONIBLE_HABER_DESCUENTO: FlagsLiquidacionConcepto = {
  imponible: false,
  tributable: false,
  afectaAfp: false,
  afectaSalud: false,
  afectaAfc: false,
  afectaSis: false,
  afectaLiquido: true,
};

export function derivarFlagsLiquidacionConcepto(
  tipo: TipoConceptoLiquidacion,
  naturaleza: string | null,
): FlagsLiquidacionConcepto {
  if (tipo === 'APORTE_EMPLEADOR') {
    return { ...SIN_IMPACTO };
  }

  const esImponible = (naturaleza ?? '').trim().toUpperCase() === 'IMPONIBLE';
  return esImponible
    ? { ...IMPONIBLE_HABER_DESCUENTO }
    : { ...NO_IMPONIBLE_HABER_DESCUENTO };
}
