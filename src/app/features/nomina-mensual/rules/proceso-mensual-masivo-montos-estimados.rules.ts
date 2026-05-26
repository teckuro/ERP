import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { puedeEntrarAPreNomina } from '../entradas/rules/entradas-mensuales-periodo.rules';

export interface MontosEstimadosTrabajador {
  haberes: number;
  descuentos: number;
  liquidoEstimado: number;
}

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function clavePersona(idPersona: number | string | null | undefined): string {
  if (idPersona == null) return '';
  return String(idPersona).trim();
}

function montoAbsoluto(entrada: EntradaMensualPeriodo): number {
  return Math.abs(entrada.monto ?? 0);
}

export function entradaEsDescuentoOperativo(entrada: EntradaMensualPeriodo): boolean {
  switch (entrada.tipoEntrada) {
    case 'descuento':
    case 'anticipo':
      return true;
    case 'haber':
    case 'reintegro':
    case 'retroactivo':
    case 'ajuste':
      return false;
    default: {
      const tipoMovimiento = (entrada.tipoMovimiento ?? '').toLowerCase();
      if (tipoMovimiento.includes('descuento')) return true;
      if (tipoMovimiento.includes('haber')) return false;
      const categoria = (entrada.categoria ?? '').toLowerCase();
      if (categoria.includes('descuento')) return true;
      return (entrada.monto ?? 0) < 0;
    }
  }
}

export function estimarMontosTrabajadorDesdeEntradas(
  idPersona: number | string,
  entradas: readonly EntradaMensualPeriodo[] | null | undefined,
): MontosEstimadosTrabajador | null {
  const clave = clavePersona(idPersona);
  if (!clave) return null;

  let haberes = 0;
  let descuentos = 0;
  let entradasConsideradas = 0;

  for (const entrada of asArray(entradas)) {
    if (clavePersona(entrada.idPersona) !== clave) continue;
    if (!puedeEntrarAPreNomina(entrada)) continue;
    const monto = montoAbsoluto(entrada);
    if (monto <= 0) continue;
    entradasConsideradas += 1;
    if (entradaEsDescuentoOperativo(entrada)) {
      descuentos += monto;
    } else {
      haberes += monto;
    }
  }

  if (entradasConsideradas === 0) {
    return null;
  }

  return {
    haberes,
    descuentos,
    liquidoEstimado: haberes - descuentos,
  };
}

export interface FilaMontosEstimables {
  idPersona: number | string;
  haberes: number | null;
  descuentos: number | null;
  liquidoEstimado: number | null;
  montosEstimadosDesdeEntradas?: boolean;
}

export function aplicarMontosEstimadosDesdeEntradas<T extends FilaMontosEstimables>(
  fila: T,
  entradas: readonly EntradaMensualPeriodo[] | null | undefined,
): T {
  if (fila.montosEstimadosDesdeEntradas) {
    return fila;
  }
  const tieneMontosReferenciales = [fila.haberes, fila.descuentos, fila.liquidoEstimado].some(
    (monto) => monto != null && monto !== 0,
  );
  if (tieneMontosReferenciales) {
    return fila;
  }

  const estimado = estimarMontosTrabajadorDesdeEntradas(fila.idPersona, entradas);
  if (!estimado) {
    return fila;
  }

  return {
    ...fila,
    haberes: estimado.haberes,
    descuentos: estimado.descuentos,
    liquidoEstimado: estimado.liquidoEstimado,
    montosEstimadosDesdeEntradas: true,
  };
}
