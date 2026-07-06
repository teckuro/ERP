import type { ConceptoListado } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { MovimientoCategoria } from '../../nomina-mensual/models/movimiento-nomina.models';

export type FiltroCategoriaConceptoManual = 'todos' | MovimientoCategoria;

export type ItemPickerConceptoManual =
  | {
      itemId: string;
      origen: 'catalogo';
      conceptoId: number;
      nombre: string;
      codigo: string;
      categoria: 'haber' | 'descuento';
      imponible: boolean;
      tributable: boolean;
      busqueda: string;
    }
  | {
      itemId: string;
      origen: 'operativo';
      categoria: 'ausencia' | 'informativo';
      nombre: string;
      tipo: string;
      busqueda: string;
    };

const ETIQUETAS_CATEGORIA: Record<MovimientoCategoria, string> = {
  haber: 'Haber',
  descuento: 'Descuento',
  ausencia: 'Ausencia',
  informativo: 'Informativo',
};

export function etiquetaCategoriaMovimientoManual(categoria: MovimientoCategoria): string {
  return ETIQUETAS_CATEGORIA[categoria] ?? categoria;
}

export function construirItemsPickerConceptoManual(
  conceptos: readonly ConceptoListado[],
): ItemPickerConceptoManual[] {
  const catalogo: ItemPickerConceptoManual[] = conceptos.map((concepto) => {
    const tipoUpper = (concepto.tipo ?? '').toUpperCase();
    const categoria: 'haber' | 'descuento' = tipoUpper === 'DESCUENTO' ? 'descuento' : 'haber';
    const busqueda = [concepto.nombre, concepto.codigo, categoria, concepto.tipo, concepto.naturaleza]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return {
      itemId: `cat:${concepto.idConcepto}`,
      origen: 'catalogo',
      conceptoId: concepto.idConcepto,
      nombre: concepto.nombre,
      codigo: concepto.codigo,
      categoria,
      imponible: concepto.imponible,
      tributable: concepto.tributable,
      busqueda,
    };
  });

  const operativos: ItemPickerConceptoManual[] = [
    {
      itemId: 'op:AUSENCIA',
      origen: 'operativo',
      categoria: 'ausencia',
      nombre: 'Ausencia del período',
      tipo: 'AUSENCIA',
      busqueda: 'ausencia del periodo ausencia',
    },
    {
      itemId: 'op:INFORMATIVO',
      origen: 'operativo',
      categoria: 'informativo',
      nombre: 'Informativo del período',
      tipo: 'INFORMATIVO',
      busqueda: 'informativo del periodo informativo',
    },
  ];

  return [...catalogo, ...operativos].sort((a, b) => {
    const cat = a.categoria.localeCompare(b.categoria, 'es');
    if (cat !== 0) return cat;
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

export function filtrarItemsPickerConceptoManual(
  items: readonly ItemPickerConceptoManual[],
  busqueda: string,
  filtroCategoria: FiltroCategoriaConceptoManual,
): ItemPickerConceptoManual[] {
  const termino = busqueda.trim().toLowerCase();
  return items.filter((item) => {
    if (filtroCategoria !== 'todos' && item.categoria !== filtroCategoria) {
      return false;
    }
    if (!termino) {
      return true;
    }
    return item.busqueda.includes(termino);
  });
}

export const FILTROS_CATEGORIA_CONCEPTO_MANUAL: ReadonlyArray<{
  id: FiltroCategoriaConceptoManual;
  label: string;
}> = [
  { id: 'todos', label: 'Todos' },
  { id: 'haber', label: 'Haberes' },
  { id: 'descuento', label: 'Descuentos' },
  { id: 'ausencia', label: 'Ausencias' },
  { id: 'informativo', label: 'Informativos' },
];
