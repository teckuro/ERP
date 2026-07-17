import type { LiquidacionConcepto } from '../models/liquidacion-oficial.model';

export function esAporteReferenciaEmpleador(concepto: LiquidacionConcepto): boolean {
  return concepto.tipo === 'cotizacion' || concepto.clasificacion === 'aporte_referencia';
}

export function clasificarAporteEmpleador(
  concepto: LiquidacionConcepto,
): 'sis' | 'sanna' | 'mutual' | null {
  const texto = `${concepto.codigo ?? ''} ${concepto.codigoLre ?? ''} ${concepto.nombre}`.toLowerCase();
  if (/\bsis\b/.test(texto)) return 'sis';
  if (/sanna/.test(texto)) return 'sanna';
  if (/ley\s*16|mutual/.test(texto)) return 'mutual';
  return null;
}

export interface AportesEmpleadorResumen {
  sis: number;
  sanna: number;
  mutual: number;
  total: number;
}

export function resumirAportesEmpleador(
  conceptos: readonly LiquidacionConcepto[],
): AportesEmpleadorResumen {
  let sis = 0;
  let sanna = 0;
  let mutual = 0;

  for (const concepto of conceptos) {
    if (!esAporteReferenciaEmpleador(concepto) || concepto.monto === 0) continue;
    const tipo = clasificarAporteEmpleador(concepto);
    if (tipo === 'sis') sis += concepto.monto;
    else if (tipo === 'sanna') sanna += concepto.monto;
    else if (tipo === 'mutual') mutual += concepto.monto;
  }

  const total = conceptos
    .filter((c) => esAporteReferenciaEmpleador(c))
    .reduce((sum, c) => sum + c.monto, 0);

  return { sis, sanna, mutual, total };
}

export function etiquetaConceptoDetalle(concepto: LiquidacionConcepto): string | null {
  const partes: string[] = [];
  if (concepto.cantidad != null && concepto.cantidad !== 0) {
    partes.push(`Cant. ${concepto.cantidad}`);
  }
  if (concepto.base != null && concepto.base !== 0) {
    partes.push(
      `Base ${new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(concepto.base)}`,
    );
  }
  if (concepto.tasa != null && concepto.tasa !== 0) {
    partes.push(
      `Tasa ${concepto.tasa.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%`,
    );
  }
  return partes.length > 0 ? partes.join(' · ') : null;
}
