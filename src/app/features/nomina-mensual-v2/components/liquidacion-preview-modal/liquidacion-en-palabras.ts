/**
 * Convierte un monto entero en CLP a su expresión en palabras en español
 * (sin decimales). Pensado para el footer de la liquidación tipo PDF.
 *
 * Soporta hasta 9.999.999.999 pesos, suficiente para nóminas reales.
 * Devuelve cadena vacía si el input no es entero válido positivo.
 */

const UNIDADES = [
  '',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
];

const DECENAS = [
  '',
  '',
  'veinti',
  'treinta',
  'cuarenta',
  'cincuenta',
  'sesenta',
  'setenta',
  'ochenta',
  'noventa',
];

const CENTENAS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
];

function menorMil(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const centenas = CENTENAS[c];
  const restoPal = menorCien(resto);
  if (!centenas) return restoPal;
  if (!restoPal) return centenas;
  return `${centenas} ${restoPal}`;
}

function menorCien(n: number): string {
  if (n <= 20) return UNIDADES[n];
  if (n < 30) {
    const u = n - 20;
    return u === 0 ? 'veinte' : `veinti${UNIDADES[u]}`;
  }
  const d = Math.floor(n / 10);
  const u = n % 10;
  const decenas = DECENAS[d];
  if (u === 0) return decenas;
  return `${decenas} y ${UNIDADES[u]}`;
}

function bloqueMiles(n: number): string {
  if (n === 0) return '';
  if (n === 1) return 'mil';
  const palabras = menorMil(n);
  return `${palabras} mil`.replace(/uno mil$/, 'un mil');
}

export function liquidoEnPalabras(monto: number): string {
  if (!Number.isFinite(monto) || monto < 0) return '';
  const entero = Math.floor(monto);
  if (entero === 0) return 'cero pesos';

  const millones = Math.floor(entero / 1000000);
  const resto = entero - millones * 1000000;
  const miles = Math.floor(resto / 1000);
  const unidades = resto - miles * 1000;

  const partes: string[] = [];
  if (millones > 0) {
    const palabrasMillon = millones === 1 ? 'un millón' : `${menorMil(millones)} millones`;
    partes.push(palabrasMillon.replace(/uno millones$/, 'un millón'));
  }
  if (miles > 0) {
    partes.push(bloqueMiles(miles));
  }
  if (unidades > 0) {
    partes.push(menorMil(unidades));
  }
  const palabras = partes.join(' ').replace(/\s+/g, ' ').trim();
  return `${palabras} pesos`;
}
