import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X as XIcon } from 'lucide-angular/src/icons';

import type { ConceptoListado } from '../../../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { MovimientoCategoria } from '../../../../../nomina-mensual/models/movimiento-nomina.models';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import {
  FILTROS_CATEGORIA_CONCEPTO_MANUAL,
  construirItemsPickerConceptoManual,
  etiquetaCategoriaMovimientoManual,
  filtrarItemsPickerConceptoManual,
  type FiltroCategoriaConceptoManual,
  type ItemPickerConceptoManual,
} from '../../../../presenters/nomina-seleccion-concepto-manual.presenter';

export type SeleccionConceptoManualEvento =
  | {
      origen: 'catalogo';
      conceptoId: number;
      categoria: 'haber' | 'descuento';
      tipo: string;
    }
  | {
      origen: 'operativo';
      categoria: 'ausencia' | 'informativo';
      tipo: string;
    };

@Component({
  selector: 'app-nomina-mensual-v2-modal-seleccion-concepto',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, WorkspaceLoadingComponent],
  templateUrl: './nomina-mensual-v2-modal-seleccion-concepto.component.html',
  styleUrl: './nomina-mensual-v2-modal-seleccion-concepto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2ModalSeleccionConceptoComponent {
  readonly closeIcon = XIcon;

  readonly conceptos = input<ConceptoListado[]>([]);
  readonly cargando = input(false);
  readonly seleccionActualId = input<number | null>(null);
  readonly categoriaActual = input<MovimientoCategoria>('haber');

  readonly seleccionar = output<SeleccionConceptoManualEvento>();
  readonly cerrar = output<void>();

  readonly busqueda = signal('');
  readonly filtroCategoria = signal<FiltroCategoriaConceptoManual>('todos');

  readonly filtrosCategoria = FILTROS_CATEGORIA_CONCEPTO_MANUAL;
  readonly etiquetaCategoria = etiquetaCategoriaMovimientoManual;

  private readonly itemsBase = computed(() => construirItemsPickerConceptoManual(this.conceptos()));

  readonly itemsVisibles = computed(() =>
    filtrarItemsPickerConceptoManual(
      this.itemsBase(),
      this.busqueda(),
      this.filtroCategoria(),
    ),
  );

  readonly totalCatalogo = computed(
    () => this.itemsBase().filter((item) => item.origen === 'catalogo').length,
  );

  cerrarModal(): void {
    this.cerrar.emit();
  }

  actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  actualizarFiltroCategoria(valor: FiltroCategoriaConceptoManual): void {
    this.filtroCategoria.set(valor);
  }

  seleccionarItem(item: ItemPickerConceptoManual): void {
    if (item.origen === 'catalogo') {
      this.seleccionar.emit({
        origen: 'catalogo',
        conceptoId: item.conceptoId,
        categoria: item.categoria,
        tipo: item.codigo,
      });
      return;
    }
    this.seleccionar.emit({
      origen: 'operativo',
      categoria: item.categoria,
      tipo: item.tipo,
    });
  }

  itemSeleccionado(item: ItemPickerConceptoManual): boolean {
    if (item.origen === 'catalogo') {
      return this.seleccionActualId() === item.conceptoId;
    }
    return this.categoriaActual() === item.categoria && this.seleccionActualId() == null;
  }

  trackItem(_index: number, item: ItemPickerConceptoManual): string {
    return item.itemId;
  }
}
