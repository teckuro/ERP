/**
 * Resuelve código LRE para una línea del motor/snapshot.
 * Prioridad: catálogo BD (codigoLre) > codigo_motor > código concepto > mapa estático.
 */
import { resolverCodigoLreConcepto } from './lre-codigo-concepto.rules';

export interface ResolverCodigoLreLineaInput {
  codigoLre?: string | null;
  codigo?: string | null;
  codigoMotor?: string | null;
}

export function resolverCodigoLreLinea(input: ResolverCodigoLreLineaInput): string | null {
  const desdeCatalogo = input.codigoLre?.trim();
  if (desdeCatalogo) return desdeCatalogo;

  const desdeMotor = resolverCodigoLreConcepto(input.codigoMotor);
  if (desdeMotor) return desdeMotor;

  return resolverCodigoLreConcepto(input.codigo);
}
