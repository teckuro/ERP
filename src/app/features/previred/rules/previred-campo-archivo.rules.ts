import type { LiquidacionConcepto } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';

/** Destino especial: enrutar cotización salud según tipo institución. */
export type PreviredDestinoCampoSalud = 'SALUD_FONASA' | 'SALUD_ISAPRE_OBLIGATORIA';

export type PreviredDestinoCampoArchivo = number | PreviredDestinoCampoSalud;

export interface CatalogoCampoArchivoEntrada {
  codigoLre: string;
  campoArchivo: number | null;
  destinoSalud?: PreviredDestinoCampoSalud | null;
}

export interface AgregarConceptosCampoArchivoInput {
  conceptos: readonly LiquidacionConcepto[];
  catalogo: readonly CatalogoCampoArchivoEntrada[];
  saludTipo: 'FONASA' | 'ISAPRE' | null;
  incluirAportesEmpleador: boolean;
}

export interface AgregarConceptosCampoArchivoResult {
  montosPorCampo: Record<number, number>;
  conceptosSinCampo: number;
  conceptosAgregados: number;
}

/** Mapeo estático LRE → campo Previred (fallback si BD no tiene columna). */
export const MAPEO_LRE_CAMPO_PREVIRED_ESTATICO: Readonly<Record<string, PreviredDestinoCampoArchivo>> = {
  '3141': 28,
  '3143': 'SALUD_FONASA',
  '3151': 101,
  '4151': 102,
  '4155': 29,
  '2311': 22,
  '3161': 0,
};

/** Mapeo por código interno de concepto cuando falta LRE. */
export const MAPEO_CONCEPTO_CODIGO_CAMPO_PREVIRED: Readonly<Record<string, number>> = {
  AFP: 28,
  SALUD: 70,
  CESANTIA: 101,
  AFC_EMPLEADOR: 102,
  SIS_EMPLEADOR: 29,
  ASIGNACION_FAMILIAR: 22,
  IMPUESTO_RENTA: 0,
};

const CAMPOS_SUMARABLES = new Set(
  Object.values(MAPEO_LRE_CAMPO_PREVIRED_ESTATICO).filter(
    (v): v is number => typeof v === 'number' && v > 0,
  ),
);

export function indexarCatalogoCampoArchivo(
  entradas: readonly CatalogoCampoArchivoEntrada[],
): ReadonlyMap<string, CatalogoCampoArchivoEntrada> {
  const indice = new Map<string, CatalogoCampoArchivoEntrada>();
  for (const entrada of entradas) {
    const clave = entrada.codigoLre.trim();
    if (!clave) continue;
    indice.set(clave, entrada);
  }
  return indice;
}

function esAporteReferenciaEmpleador(concepto: LiquidacionConcepto): boolean {
  return concepto.tipo === 'cotizacion' || concepto.clasificacion === 'aporte_referencia';
}

function resolverDestinoCampo(
  concepto: LiquidacionConcepto,
  catalogo: ReadonlyMap<string, CatalogoCampoArchivoEntrada>,
  saludTipo: 'FONASA' | 'ISAPRE' | null,
): number | null {
  const codigoLre = concepto.codigoLre?.trim();
  if (codigoLre) {
    const entrada = catalogo.get(codigoLre);
    if (entrada?.destinoSalud) {
      return entrada.destinoSalud === 'SALUD_FONASA' ? 70 : 80;
    }
    if (entrada?.campoArchivo != null && entrada.campoArchivo > 0) {
      return entrada.campoArchivo;
    }
    const estatico = MAPEO_LRE_CAMPO_PREVIRED_ESTATICO[codigoLre];
    if (estatico === 'SALUD_FONASA') {
      return saludTipo === 'FONASA' ? 70 : 80;
    }
    if (typeof estatico === 'number' && estatico > 0) {
      return estatico;
    }
  }

  const codigo = concepto.codigo?.trim().toUpperCase();
  if (codigo && MAPEO_CONCEPTO_CODIGO_CAMPO_PREVIRED[codigo] != null) {
    const destino = MAPEO_CONCEPTO_CODIGO_CAMPO_PREVIRED[codigo];
    if (codigo === 'SALUD') {
      return saludTipo === 'FONASA' ? 70 : 80;
    }
    return destino > 0 ? destino : null;
  }

  return null;
}

export function agregarConceptosACamposPrevired(
  input: AgregarConceptosCampoArchivoInput,
): AgregarConceptosCampoArchivoResult {
  const indice = indexarCatalogoCampoArchivo(input.catalogo);
  const montosPorCampo: Record<number, number> = {};
  let conceptosSinCampo = 0;
  let conceptosAgregados = 0;

  for (const concepto of input.conceptos) {
    if (concepto.monto === 0) continue;
    if (!input.incluirAportesEmpleador && esAporteReferenciaEmpleador(concepto)) {
      if (concepto.codigo?.trim().toUpperCase() !== 'SIS_EMPLEADOR') continue;
    }

    const destino = resolverDestinoCampo(concepto, indice, input.saludTipo);
    if (destino == null) {
      if (concepto.monto !== 0 && concepto.codigoLre?.trim()) {
        conceptosSinCampo++;
      }
      continue;
    }

    montosPorCampo[destino] = (montosPorCampo[destino] ?? 0) + concepto.monto;
    conceptosAgregados++;
  }

  return { montosPorCampo, conceptosSinCampo, conceptosAgregados };
}

export function aplicarRentasImponiblesPrevired(input: {
  montosPorCampo: Record<number, number>;
  baseImponible: number;
  regimenPrevisional: string;
  saludTipo: 'FONASA' | 'ISAPRE' | null;
  seguroCesantia: boolean;
  ccafCodigoPrevired: string | null;
  mutualCodigoPrevired: string | null;
}): Record<number, number> {
  const montos = { ...input.montosPorCampo };
  const base = Math.max(0, Math.round(input.baseImponible));

  if (input.regimenPrevisional === 'AFP') {
    montos[27] = base;
  }

  if (input.saludTipo === 'ISAPRE') {
    montos[77] = base;
  }

  if (input.saludTipo === 'FONASA' && montos[70] == null) {
    montos[70] = montos[70] ?? 0;
  }

  if (input.seguroCesantia) {
    montos[100] = base;
  }

  if (input.ccafCodigoPrevired && input.ccafCodigoPrevired !== '00') {
    montos[84] = base;
  }

  if (input.mutualCodigoPrevired && input.mutualCodigoPrevired !== '00') {
    montos[97] = base;
  }

  if (input.regimenPrevisional === 'INP' || input.regimenPrevisional === 'IPS') {
    montos[64] = base;
  }

  return montos;
}

export function calcularExpectativaVidaPrevired(input: {
  baseImponible: number;
  regimenPrevisional: string;
  tipoTrabajador: number;
  montoConcepto: number | null;
  tasaParametro: number | null;
}): number {
  if (input.montoConcepto != null && input.montoConcepto > 0) {
    return Math.round(input.montoConcepto);
  }
  if (input.regimenPrevisional !== 'AFP' || input.tipoTrabajador !== 0) {
    return 0;
  }
  const tasa = input.tasaParametro ?? 0.009;
  return Math.round(Math.max(0, input.baseImponible) * tasa);
}

export function camposPreviredRequeridosCubiertos(montos: Record<number, number>): boolean {
  return CAMPOS_SUMARABLES.size > 0;
}
