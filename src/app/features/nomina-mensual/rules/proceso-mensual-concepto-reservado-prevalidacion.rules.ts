import type { ConceptoMantenimientoFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import {
  esConceptoReservadoContrato,
  motivoConceptoReservadoContrato,
} from '../../haberes-descuentos/rules/concepto-contrato-reservado.rules';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import type { ProcesoMensualMensaje } from '../models/proceso-mensual.model';

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

export function advertenciasEntradasConceptoReservadoContrato(
  entradas: readonly EntradaMensualPeriodo[],
  conceptosCatalogo: readonly ConceptoMantenimientoFila[],
): ProcesoMensualMensaje[] {
  if (conceptosCatalogo.length === 0) {
    return [];
  }

  const conceptoPorId = new Map(conceptosCatalogo.map((concepto) => [concepto.idConcepto, concepto]));
  const advertencias: ProcesoMensualMensaje[] = [];
  const conceptosVistos = new Set<number>();

  for (const entrada of asArray(entradas)) {
    if (entrada.idConcepto == null || entrada.idConcepto <= 0) {
      continue;
    }
    if (conceptosVistos.has(entrada.idConcepto)) {
      continue;
    }
    const concepto = conceptoPorId.get(entrada.idConcepto);
    if (!concepto || !esConceptoReservadoContrato(concepto)) {
      continue;
    }
    conceptosVistos.add(entrada.idConcepto);
    advertencias.push({
      codigo: 'ENTRADAS_CONCEPTO_SUELDO_BASE',
      area: 'ENTRADAS_MENSUALES',
      severidad: 'ADVERTENCIA',
      texto: `Hay movimientos del mes con concepto «${concepto.nombre}». ${motivoConceptoReservadoContrato(concepto)} Revise novedades o movimientos históricos antes del cálculo.`,
    });
  }

  return advertencias;
}
