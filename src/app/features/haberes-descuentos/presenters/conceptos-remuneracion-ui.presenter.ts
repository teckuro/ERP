import type {
  CatalogoLreOpcion,
  ConceptoMantenimientoFila,
  ReglaConceptoCalculoFila,
} from '../models/haber-descuento-asignacion.model';
import type { ConceptoAccionesPermitidas } from '../rules/concepto-acciones.rules';
import {
  derivarFlagsLiquidacionConcepto,
  type TipoConceptoLiquidacion,
} from '../rules/concepto-liquidacion-flags.rules';
import {
  etiquetaNaturalezaConcepto,
  etiquetaTipoConceptoHd,
} from '../utils/haber-descuento-asignacion-listado.presenter';

export { etiquetaNaturalezaConcepto, etiquetaTipoConceptoHd };

export interface EmptyStateCatalogo {
  emptyTitle: string;
  emptyDescription: string;
}

export interface ResumenLreCompacto {
  principal: string;
  secundario: string | null;
}

export interface ContextoResumenPieConcepto {
  tipo: 'HABER' | 'DESCUENTO' | 'APORTE_EMPLEADOR';
  naturaleza: string | null;
  lre: CatalogoLreOpcion | null;
  vigenciaInicio: string;
  vigente: boolean;
}

export function emptyStateCatalogo(puedeCrear: boolean): EmptyStateCatalogo {
  if (puedeCrear) {
    return {
      emptyTitle: 'No hay conceptos de remuneración registrados.',
      emptyDescription:
        'Puede crear el primer concepto con «Nuevo concepto». Asigne código LRE si debe exportarse al libro de remuneraciones.',
    };
  }
  return {
    emptyTitle: 'No hay conceptos de remuneración registrados.',
    emptyDescription:
      'El catálogo se carga desde parámetros del sistema. Solicite al administrador de remuneraciones el alta de conceptos nuevos.',
  };
}

export function resumenLreCompacto(lre: CatalogoLreOpcion): ResumenLreCompacto {
  const principal = `${lre.codigoLre} · ${lre.nombreLre} — ${lre.moduloLre}`;
  const extras = [lre.grupoLre?.trim(), lre.clasificacionLre?.trim()].filter(Boolean);
  return {
    principal,
    secundario: extras.length ? extras.join(' · ') : null,
  };
}

export function resumenImpactoLiquidacionUi(
  tipo: TipoConceptoLiquidacion,
  naturaleza: string | null,
): string {
  const flags = derivarFlagsLiquidacionConcepto(tipo, naturaleza);
  if (tipo === 'APORTE_EMPLEADOR') {
    return 'Sin impacto en la liquidación del trabajador.';
  }
  if (flags.imponible) {
    return 'Afecta base previsional y líquido a pagar.';
  }
  if (flags.afectaLiquido) {
    return 'Solo afecta el líquido a pagar.';
  }
  return 'Sin impacto en liquidación.';
}

export function chipsImpactoLiquidacionUi(
  tipo: TipoConceptoLiquidacion,
  naturaleza: string | null,
): string[] {
  const flags = derivarFlagsLiquidacionConcepto(tipo, naturaleza);
  const chips: string[] = [];
  if (flags.imponible) {
    chips.push('Imponible');
  }
  if (flags.tributable) {
    chips.push('Tributable');
  }
  if (flags.afectaAfp || flags.afectaSalud || flags.afectaAfc) {
    chips.push('Afecta previsional');
  }
  if (flags.afectaLiquido) {
    chips.push('Afecta líquido');
  }
  if (chips.length === 0) {
    chips.push('Sin impacto en liquidación');
  }
  return chips;
}

export function resumenPieConcepto(ctx: ContextoResumenPieConcepto): string {
  const partes: string[] = [];
  partes.push(etiquetaTipoConceptoHd(ctx.tipo));
  partes.push(etiquetaNaturalezaConcepto(ctx.naturaleza));
  partes.push(resumenImpactoLiquidacionUi(ctx.tipo, ctx.naturaleza));
  if (ctx.lre) {
    partes.push(`LRE ${ctx.lre.codigoLre}`);
  }
  const vigencia = formatearFechaResumenPie(ctx.vigenciaInicio);
  if (vigencia) {
    partes.push(`Vigente desde ${vigencia}`);
  } else if (ctx.vigente) {
    partes.push('Vigente');
  } else {
    partes.push('No vigente');
  }
  return partes.join(' · ');
}

export function subtituloDetalleConcepto(
  row: Pick<ConceptoMantenimientoFila, 'codigo' | 'tipo'>,
  etiquetaVigencia: string,
): string {
  return `${row.codigo} · ${etiquetaTipoConceptoHd(row.tipo)} · ${etiquetaVigencia}`;
}

export function etiquetaReglaCalculoUi(regla: ReglaConceptoCalculoFila): string {
  const modo = regla.calculoAutomatico ? 'automática' : 'manual';
  const estado = regla.activo ? 'activa' : 'inactiva';
  const base = regla.baseCalculo?.trim() || 'base no definida';
  return `Regla ${modo} (${estado}) sobre ${base}.`;
}

export function limitacionesConceptoUi(acciones: ConceptoAccionesPermitidas): string[] {
  const items: string[] = [];
  if (acciones.puedeEditar) {
    items.push('Puede editarse desde el catálogo.');
  } else {
    items.push('La edición está restringida para este concepto.');
  }
  if (acciones.puedeAsignar) {
    items.push('Admite asignación manual en haberes o movimientos del mes.');
  } else {
    items.push('No admite asignación manual según las reglas vigentes.');
  }
  items.push('No se elimina desde el listado; cierre vigencia o desactive el concepto si corresponde.');
  for (const motivo of acciones.motivosBloqueo) {
    if (!items.includes(motivo)) {
      items.push(motivo);
    }
  }
  return items;
}

export function etiquetaFlagSiNo(valor: boolean): string {
  return valor ? 'Sí' : 'No';
}

function formatearFechaResumenPie(value: string): string {
  const raw = value.trim().slice(0, 10);
  if (!raw) {
    return '';
  }
  const date = new Date(`${raw}T00:00:00`);
  if (!Number.isFinite(date.getTime())) {
    return raw;
  }
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replaceAll('/', '-');
}
