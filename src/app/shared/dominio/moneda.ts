/** Se crea una vez: construir `Intl.NumberFormat` en cada celda de una grilla es costoso. */
const FORMATO_CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

/**
 * Formato estándar de montos en pantalla: pesos chilenos sin decimales, símbolo pegado.
 * `$1.234.567`, `-$500`. No usar para archivos de exportación (Previred, LRE).
 */
export function formatearClp(valor: number): string {
  return FORMATO_CLP.format(valor);
}

const FORMATOS_CLP_DECIMAL = new Map<number, Intl.NumberFormat>();

/** Igual que `formatearClp` pero con decimales fijos: `$38.123,45`. Para parámetros con fracción. */
export function formatearClpDecimal(valor: number, digitos = 2): string {
  let formato = FORMATOS_CLP_DECIMAL.get(digitos);
  if (!formato) {
    formato = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: digitos,
      maximumFractionDigits: digitos,
    });
    FORMATOS_CLP_DECIMAL.set(digitos, formato);
  }
  return formato.format(valor);
}
