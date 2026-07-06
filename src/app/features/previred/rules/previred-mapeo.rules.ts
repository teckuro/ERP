export interface CatalogoPreviredEntrada {
  codigoLre: string;
  codigoPrevired: string;
  glosaPrevired: string | null;
}

export type PreviredOrigenMapeo = 'catalogo_previred' | 'fallback_lre';

export interface ResolucionCodigoPrevired {
  codigoMovimiento: string;
  glosa: string | null;
  origenMapeo: PreviredOrigenMapeo;
}

export function indexarCatalogoPrevired(
  entradas: readonly CatalogoPreviredEntrada[],
): ReadonlyMap<string, CatalogoPreviredEntrada> {
  const indice = new Map<string, CatalogoPreviredEntrada>();
  for (const entrada of entradas) {
    const clave = entrada.codigoLre.trim();
    if (!clave) continue;
    indice.set(clave, entrada);
  }
  return indice;
}

export function resolverCodigoPrevired(
  codigoLre: string,
  catalogo: ReadonlyMap<string, CatalogoPreviredEntrada>,
  glosaConcepto: string,
): ResolucionCodigoPrevired | null {
  const clave = codigoLre.trim();
  if (!clave) return null;

  const entrada = catalogo.get(clave);
  if (entrada) {
    return {
      codigoMovimiento: entrada.codigoPrevired.trim() || clave,
      glosa: entrada.glosaPrevired?.trim() || glosaConcepto,
      origenMapeo: 'catalogo_previred',
    };
  }

  return {
    codigoMovimiento: clave,
    glosa: glosaConcepto,
    origenMapeo: 'fallback_lre',
  };
}

export function listoParaEnvioPrevired(input: {
  lineas: number;
  conceptosSinCodigo: number;
  conceptosSinMapeoCatalogo: number;
  tieneBloqueo: boolean;
}): boolean {
  if (input.tieneBloqueo) return false;
  if (input.lineas === 0) return false;
  if (input.conceptosSinCodigo > 0) return false;
  if (input.conceptosSinMapeoCatalogo > 0) return false;
  return true;
}
