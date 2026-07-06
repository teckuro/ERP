/**
 * Formato Previred oficial: largo fijo por posición, 105 campos (861 caracteres).
 * Especificación: docs/codex/modulos/previred/formato-archivo-105-posicion-reforma.md
 */

export const PREVIRED_FORMATO_ARCHIVO_105_POSICION = 'PREVIRED-105-POSICION-v83' as const;
export const PREVIRED_105_LONGITUD_LINEA = 861 as const;
export const PREVIRED_105_TOTAL_CAMPOS = 105 as const;

export type Previred105TipoCampo = 'numerico' | 'alfanumerico' | 'tasa';

export interface Previred105DefinicionCampo {
  numero: number;
  inicio: number;
  fin: number;
  largo: number;
  tipo: Previred105TipoCampo;
}

/** Tabla de posiciones según PDF Previred Reforma 2025 (versión 83). */
export const PREVIRED_105_DEFINICION_CAMPOS: readonly Previred105DefinicionCampo[] = [
  { numero: 1, inicio: 1, fin: 11, largo: 11, tipo: 'numerico' },
  { numero: 2, inicio: 12, fin: 12, largo: 1, tipo: 'alfanumerico' },
  { numero: 3, inicio: 13, fin: 42, largo: 30, tipo: 'alfanumerico' },
  { numero: 4, inicio: 43, fin: 72, largo: 30, tipo: 'alfanumerico' },
  { numero: 5, inicio: 73, fin: 102, largo: 30, tipo: 'alfanumerico' },
  { numero: 6, inicio: 103, fin: 103, largo: 1, tipo: 'alfanumerico' },
  { numero: 7, inicio: 104, fin: 104, largo: 1, tipo: 'numerico' },
  { numero: 8, inicio: 105, fin: 106, largo: 2, tipo: 'numerico' },
  { numero: 9, inicio: 107, fin: 112, largo: 6, tipo: 'numerico' },
  { numero: 10, inicio: 113, fin: 118, largo: 6, tipo: 'numerico' },
  { numero: 11, inicio: 119, fin: 121, largo: 3, tipo: 'alfanumerico' },
  { numero: 12, inicio: 122, fin: 122, largo: 1, tipo: 'numerico' },
  { numero: 13, inicio: 123, fin: 124, largo: 2, tipo: 'numerico' },
  { numero: 14, inicio: 125, fin: 126, largo: 2, tipo: 'alfanumerico' },
  { numero: 15, inicio: 127, fin: 128, largo: 2, tipo: 'numerico' },
  { numero: 16, inicio: 129, fin: 138, largo: 10, tipo: 'alfanumerico' },
  { numero: 17, inicio: 139, fin: 148, largo: 10, tipo: 'alfanumerico' },
  { numero: 18, inicio: 149, fin: 149, largo: 1, tipo: 'alfanumerico' },
  { numero: 19, inicio: 150, fin: 151, largo: 2, tipo: 'numerico' },
  { numero: 20, inicio: 152, fin: 152, largo: 1, tipo: 'numerico' },
  { numero: 21, inicio: 153, fin: 153, largo: 1, tipo: 'numerico' },
  { numero: 22, inicio: 154, fin: 159, largo: 6, tipo: 'numerico' },
  { numero: 23, inicio: 160, fin: 165, largo: 6, tipo: 'numerico' },
  { numero: 24, inicio: 166, fin: 171, largo: 6, tipo: 'numerico' },
  { numero: 25, inicio: 172, fin: 172, largo: 1, tipo: 'alfanumerico' },
  { numero: 26, inicio: 173, fin: 174, largo: 2, tipo: 'numerico' },
  { numero: 27, inicio: 175, fin: 182, largo: 8, tipo: 'numerico' },
  { numero: 28, inicio: 183, fin: 190, largo: 8, tipo: 'numerico' },
  { numero: 29, inicio: 191, fin: 198, largo: 8, tipo: 'numerico' },
  { numero: 30, inicio: 199, fin: 206, largo: 8, tipo: 'numerico' },
  { numero: 31, inicio: 207, fin: 214, largo: 8, tipo: 'numerico' },
  { numero: 32, inicio: 215, fin: 219, largo: 5, tipo: 'tasa' },
  { numero: 33, inicio: 220, fin: 228, largo: 9, tipo: 'numerico' },
  { numero: 34, inicio: 229, fin: 230, largo: 2, tipo: 'numerico' },
  { numero: 35, inicio: 231, fin: 240, largo: 10, tipo: 'alfanumerico' },
  { numero: 36, inicio: 241, fin: 250, largo: 10, tipo: 'alfanumerico' },
  { numero: 37, inicio: 251, fin: 290, largo: 40, tipo: 'alfanumerico' },
  { numero: 38, inicio: 291, fin: 295, largo: 5, tipo: 'tasa' },
  { numero: 39, inicio: 296, fin: 301, largo: 6, tipo: 'numerico' },
  { numero: 40, inicio: 302, fin: 304, largo: 3, tipo: 'numerico' },
  { numero: 41, inicio: 305, fin: 324, largo: 20, tipo: 'alfanumerico' },
  { numero: 42, inicio: 325, fin: 325, largo: 1, tipo: 'numerico' },
  { numero: 43, inicio: 326, fin: 333, largo: 8, tipo: 'numerico' },
  { numero: 44, inicio: 334, fin: 341, largo: 8, tipo: 'numerico' },
  { numero: 45, inicio: 342, fin: 344, largo: 3, tipo: 'numerico' },
  { numero: 46, inicio: 345, fin: 364, largo: 20, tipo: 'alfanumerico' },
  { numero: 47, inicio: 365, fin: 365, largo: 1, tipo: 'numerico' },
  { numero: 48, inicio: 366, fin: 373, largo: 8, tipo: 'numerico' },
  { numero: 49, inicio: 374, fin: 381, largo: 8, tipo: 'numerico' },
  { numero: 50, inicio: 382, fin: 392, largo: 11, tipo: 'numerico' },
  { numero: 51, inicio: 393, fin: 393, largo: 1, tipo: 'alfanumerico' },
  { numero: 52, inicio: 394, fin: 423, largo: 30, tipo: 'alfanumerico' },
  { numero: 53, inicio: 424, fin: 453, largo: 30, tipo: 'alfanumerico' },
  { numero: 54, inicio: 454, fin: 483, largo: 30, tipo: 'alfanumerico' },
  { numero: 55, inicio: 484, fin: 485, largo: 2, tipo: 'numerico' },
  { numero: 56, inicio: 486, fin: 495, largo: 10, tipo: 'alfanumerico' },
  { numero: 57, inicio: 496, fin: 505, largo: 10, tipo: 'alfanumerico' },
  { numero: 58, inicio: 506, fin: 507, largo: 2, tipo: 'numerico' },
  { numero: 59, inicio: 508, fin: 515, largo: 8, tipo: 'numerico' },
  { numero: 60, inicio: 516, fin: 523, largo: 8, tipo: 'numerico' },
  { numero: 61, inicio: 524, fin: 525, largo: 2, tipo: 'numerico' },
  { numero: 62, inicio: 526, fin: 529, largo: 4, tipo: 'numerico' },
  { numero: 63, inicio: 530, fin: 534, largo: 5, tipo: 'tasa' },
  { numero: 64, inicio: 535, fin: 542, largo: 8, tipo: 'numerico' },
  { numero: 65, inicio: 543, fin: 550, largo: 8, tipo: 'numerico' },
  { numero: 66, inicio: 551, fin: 558, largo: 8, tipo: 'numerico' },
  { numero: 67, inicio: 559, fin: 562, largo: 4, tipo: 'numerico' },
  { numero: 68, inicio: 563, fin: 567, largo: 5, tipo: 'tasa' },
  { numero: 69, inicio: 568, fin: 575, largo: 8, tipo: 'numerico' },
  { numero: 70, inicio: 576, fin: 583, largo: 8, tipo: 'numerico' },
  { numero: 71, inicio: 584, fin: 591, largo: 8, tipo: 'numerico' },
  { numero: 72, inicio: 592, fin: 599, largo: 8, tipo: 'numerico' },
  { numero: 73, inicio: 600, fin: 607, largo: 8, tipo: 'numerico' },
  { numero: 74, inicio: 608, fin: 615, largo: 8, tipo: 'numerico' },
  { numero: 75, inicio: 616, fin: 617, largo: 2, tipo: 'numerico' },
  { numero: 76, inicio: 618, fin: 633, largo: 16, tipo: 'alfanumerico' },
  { numero: 77, inicio: 634, fin: 641, largo: 8, tipo: 'numerico' },
  { numero: 78, inicio: 642, fin: 642, largo: 1, tipo: 'numerico' },
  { numero: 79, inicio: 643, fin: 650, largo: 8, tipo: 'numerico' },
  { numero: 80, inicio: 651, fin: 658, largo: 8, tipo: 'numerico' },
  { numero: 81, inicio: 659, fin: 666, largo: 8, tipo: 'numerico' },
  { numero: 82, inicio: 667, fin: 674, largo: 8, tipo: 'numerico' },
  { numero: 83, inicio: 675, fin: 676, largo: 2, tipo: 'numerico' },
  { numero: 84, inicio: 677, fin: 684, largo: 8, tipo: 'numerico' },
  { numero: 85, inicio: 685, fin: 692, largo: 8, tipo: 'numerico' },
  { numero: 86, inicio: 693, fin: 700, largo: 8, tipo: 'numerico' },
  { numero: 87, inicio: 701, fin: 708, largo: 8, tipo: 'numerico' },
  { numero: 88, inicio: 709, fin: 716, largo: 8, tipo: 'numerico' },
  { numero: 89, inicio: 717, fin: 724, largo: 8, tipo: 'numerico' },
  { numero: 90, inicio: 725, fin: 732, largo: 8, tipo: 'numerico' },
  { numero: 91, inicio: 733, fin: 740, largo: 8, tipo: 'numerico' },
  { numero: 92, inicio: 741, fin: 748, largo: 8, tipo: 'numerico' },
  { numero: 93, inicio: 749, fin: 756, largo: 8, tipo: 'numerico' },
  { numero: 94, inicio: 757, fin: 764, largo: 8, tipo: 'numerico' },
  { numero: 95, inicio: 765, fin: 784, largo: 20, tipo: 'alfanumerico' },
  { numero: 96, inicio: 785, fin: 786, largo: 2, tipo: 'numerico' },
  { numero: 97, inicio: 787, fin: 794, largo: 8, tipo: 'numerico' },
  { numero: 98, inicio: 795, fin: 802, largo: 8, tipo: 'numerico' },
  { numero: 99, inicio: 803, fin: 805, largo: 3, tipo: 'numerico' },
  { numero: 100, inicio: 806, fin: 813, largo: 8, tipo: 'numerico' },
  { numero: 101, inicio: 814, fin: 821, largo: 8, tipo: 'numerico' },
  { numero: 102, inicio: 822, fin: 829, largo: 8, tipo: 'numerico' },
  { numero: 103, inicio: 830, fin: 840, largo: 11, tipo: 'numerico' },
  { numero: 104, inicio: 841, fin: 841, largo: 1, tipo: 'alfanumerico' },
  { numero: 105, inicio: 842, fin: 861, largo: 20, tipo: 'alfanumerico' },
];

export type Previred105ValoresCampo = Readonly<Partial<Record<number, string | number>>>;

export interface Previred105LineaGenerada {
  formato: typeof PREVIRED_FORMATO_ARCHIVO_105_POSICION;
  contenido: string;
  longitud: number;
}

export interface Previred105ArchivoGenerado {
  formato: typeof PREVIRED_FORMATO_ARCHIVO_105_POSICION;
  periodo: string;
  lineas: Previred105LineaGenerada[];
  contenido: string;
}

export interface RutPreviredDescompuesto {
  rut: string;
  dv: string;
}

export function descomponerRutPrevired(rutCompleto: string): RutPreviredDescompuesto | null {
  const normalizado = rutCompleto.replace(/\./g, '').trim().toUpperCase();
  const match = /^(\d{7,8})-([\dK])$/.exec(normalizado);
  if (!match) return null;
  return { rut: match[1], dv: match[2] };
}

/** Convierte período ERP `YYYY-MM` a `mmaaaa` Previred. */
export function periodoErpAPrevired105(periodo: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(periodo.trim());
  if (!match) return null;
  return `${match[2]}${match[1]}`;
}

export function formatearCampoNumericoPrevired105(valor: number | string, largo: number): string {
  const entero = Math.max(0, Math.round(Number(valor) || 0));
  return String(entero).padStart(largo, '0').slice(-largo);
}

export function formatearCampoAlfanumericoPrevired105(valor: string, largo: number): string {
  const limpio = valor.replace(/\r?\n/g, ' ').trim().slice(0, largo);
  return limpio.padEnd(largo, ' ');
}

export function formatearCampoTasaPrevired105(valor: number | string, largo: number): string {
  const numero = Number(String(valor).replace(',', '.'));
  const seguro = Number.isFinite(numero) ? numero : 0;
  const [entero, decimal = '00'] = seguro.toFixed(2).split('.');
  const texto = `${entero},${decimal}`.slice(0, largo);
  return texto.padStart(largo, '0');
}

export function formatearValorCampoPrevired105(
  definicion: Previred105DefinicionCampo,
  valor: string | number | null | undefined,
): string {
  if (valor == null || valor === '') {
    return definicion.tipo === 'alfanumerico'
      ? ' '.repeat(definicion.largo)
      : '0'.repeat(definicion.largo);
  }

  if (definicion.tipo === 'numerico') {
    return formatearCampoNumericoPrevired105(valor, definicion.largo);
  }
  if (definicion.tipo === 'tasa') {
    return formatearCampoTasaPrevired105(valor, definicion.largo);
  }
  return formatearCampoAlfanumericoPrevired105(String(valor), definicion.largo);
}

export function generarLineaPrevired105(valores: Previred105ValoresCampo): Previred105LineaGenerada {
  const segmentos = PREVIRED_105_DEFINICION_CAMPOS.map((def) =>
    formatearValorCampoPrevired105(def, valores[def.numero]),
  );
  const contenido = segmentos.join('');

  if (contenido.length !== PREVIRED_105_LONGITUD_LINEA) {
    const desajuste = PREVIRED_105_DEFINICION_CAMPOS.find(
      (def, index) => segmentos[index].length !== def.largo,
    );
    throw new Error(
      desajuste
        ? `Campo ${desajuste.numero} generó ${segmentos[PREVIRED_105_DEFINICION_CAMPOS.indexOf(desajuste)].length} caracteres; se esperaban ${desajuste.largo}.`
        : `Línea Previred inválida: ${contenido.length} caracteres; se esperaban ${PREVIRED_105_LONGITUD_LINEA}.`,
    );
  }

  return {
    formato: PREVIRED_FORMATO_ARCHIVO_105_POSICION,
    contenido,
    longitud: contenido.length,
  };
}

export function generarArchivoPrevired105(input: {
  periodo: string;
  registros: readonly Previred105ValoresCampo[];
}): Previred105ArchivoGenerado {
  const lineas = input.registros.map((registro) => generarLineaPrevired105(registro));
  const contenido = `${lineas.map((l) => l.contenido).join('\r\n')}\r\n`;

  return {
    formato: PREVIRED_FORMATO_ARCHIVO_105_POSICION,
    periodo: input.periodo,
    lineas,
    contenido,
  };
}

/** Valores mínimos obligatorios para línea principal tipo nómina 01 (remuneraciones mes). */
export function construirRegistro105Minimo(input: {
  rut: string;
  dv: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  nombres: string;
  sexo: 'M' | 'F';
  nacionalidad?: 0 | 1;
  periodo: string;
  regimenPrevisional?: string;
  tipoTrabajador?: number;
  diasTrabajados: number;
  tipoJornada?: 1 | 2;
  codigoAfp?: string;
  rentaImponibleAfp?: number;
  cotizacionObligatoriaAfp?: number;
  cotizacionSis?: number;
  cotizacionExpectativaVida?: number;
  montosPorCampo?: Previred105ValoresCampo;
}): Previred105ValoresCampo {
  const periodoPrevired = periodoErpAPrevired105(input.periodo);
  const base: Previred105ValoresCampo = {
    1: input.rut.replace(/\D/g, ''),
    2: input.dv,
    3: input.apellidoPaterno,
    4: input.apellidoMaterno ?? '',
    5: input.nombres,
    6: input.sexo,
    7: input.nacionalidad ?? 0,
    8: '01',
    9: periodoPrevired ?? '',
    10: periodoPrevired ?? '',
    11: input.regimenPrevisional ?? 'AFP',
    12: input.tipoTrabajador ?? 0,
    13: input.diasTrabajados,
    14: '00',
    15: 0,
    26: input.codigoAfp ?? '00',
    27: input.rentaImponibleAfp ?? 0,
    28: input.cotizacionObligatoriaAfp ?? 0,
    29: input.cotizacionSis ?? 0,
    93: input.tipoJornada ?? 1,
    94: input.cotizacionExpectativaVida ?? 0,
  };

  return { ...base, ...input.montosPorCampo };
}

export function nombreArchivoPrevired105(periodo: string): string {
  const safe = periodo.replace(/[^0-9-]/g, '');
  return `previred-nomina-${safe || 'periodo'}.txt`;
}

export function validarLongitudLineaPrevired105(linea: string): boolean {
  return linea.length === PREVIRED_105_LONGITUD_LINEA;
}

export function validarDefinicionCamposPrevired105(): boolean {
  if (PREVIRED_105_DEFINICION_CAMPOS.length !== PREVIRED_105_TOTAL_CAMPOS) return false;
  const ultimo = PREVIRED_105_DEFINICION_CAMPOS[PREVIRED_105_DEFINICION_CAMPOS.length - 1];
  return ultimo.fin === PREVIRED_105_LONGITUD_LINEA;
}
