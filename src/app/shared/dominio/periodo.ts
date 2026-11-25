/** Rango de años aceptado para un periodo de remuneración. */
const ANIO_MIN = 2000;
const ANIO_MAX = 2100;

/**
 * Periodo de remuneración `YYYY-MM` válido: mes 01–12 y año entre 2000 y 2100.
 * Tolera espacios alrededor; no acepta `YYYY-M` ni fechas completas.
 */
export function esPeriodoRemuneracionValido(periodo: string | null | undefined): boolean {
  if (typeof periodo !== 'string') return false;
  const valor = periodo.trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(valor)) return false;
  const anio = Number(valor.slice(0, 4));
  return anio >= ANIO_MIN && anio <= ANIO_MAX;
}
