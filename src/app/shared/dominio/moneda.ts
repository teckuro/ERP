/** Se crea una vez: construir `Intl.NumberFormat` en cada celda de una grilla es costoso. */
const FORMATO_CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

/** Monto en pesos chilenos sin decimales, con símbolo: `$1.234.567`, `-$500`. */
export function formatearClp(valor: number): string {
  return FORMATO_CLP.format(valor);
}
