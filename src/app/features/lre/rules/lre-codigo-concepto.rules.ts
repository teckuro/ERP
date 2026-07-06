/**
 * Mapeo código concepto/motor → código LRE oficial.
 * Fuente normativa: bd/base/v11/partes/24_lre_catalogo_oficial.sql
 */
export const LRE_CODIGO_POR_CONCEPTO: Readonly<Record<string, string>> = {
  SUELDO_BASE: '2101',
  GRATIFICACION: '2106',
  GRATIFICACION_ART_50: '2106',
  HORAS_EXTRAS: '2102',
  HORA_EXTRA: '2102',
  BONO_RESPONSABILIDAD: '2111',
  BONO: '2113',
  AGUINALDO: '2110',
  COLACION: '2301',
  MOVILIZACION: '2302',
  ASIGNACION_FAMILIAR: '2311',
  AFP: '3141',
  SALUD: '3143',
  CESANTIA: '3151',
  AFC: '3151',
  IMPUESTO_RENTA: '3161',
  IMPUESTO_UNICO: '3161',
  DESCUENTO_CONVENIO: '3183',
  PENSION_ALIMENTOS: '3186',
  PRESTAMO: '3188',
  ANTICIPO: '3188',
  AFC_EMPLEADOR: '4151',
  SIS_EMPLEADOR: '4155',
};

/** Conceptos sin línea LRE directa (estrategia distinta o aporte de referencia). */
export const LRE_CONCEPTOS_SIN_CODIGO_DIRECTO: ReadonlySet<string> = new Set([
  'INASISTENCIA',
  'AUSENCIA',
  'LICENCIA',
  'ZONA_EXTREMA',
  'AFP_EMPLEADOR',
  'SIS',
  'SANNA',
  'LEY_16744',
]);

export function resolverCodigoLreConcepto(codigoConcepto: string | null | undefined): string | null {
  const codigo = codigoConcepto?.trim().toUpperCase();
  if (!codigo) return null;
  if (LRE_CONCEPTOS_SIN_CODIGO_DIRECTO.has(codigo)) return null;
  return LRE_CODIGO_POR_CONCEPTO[codigo] ?? null;
}

export function listarCodigosLreOficialesEsperados(): readonly string[] {
  return [...new Set(Object.values(LRE_CODIGO_POR_CONCEPTO))].sort();
}
