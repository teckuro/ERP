import { ChangeDetectionStrategy, Component, effect, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../../../shared/components/ui/data-grid.component';
import type { NominaMasivaFila } from '../../../../rules/proceso-mensual-masivo-layout.rules';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-revision-trabajadores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DataGridComponent, DataGridCellDirective],
  templateUrl: './proceso-mensual-revision-trabajadores.component.html',
  styleUrls: ['../../payroll-segment-nav.css', './proceso-mensual-revision-trabajadores.component.css'],
})
export class ProcesoMensualRevisionTrabajadoresComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
  readonly modalMovimientosAbierto = signal(false);

  constructor() {
    effect(() => {
      if (!this.modalMovimientosAbierto()) return;
      if (
        !this.facade.nominaMasivaDetalleSeleccionado()
        || this.facade.nominaMasivaMovimientosPanelRows().length === 0
      ) {
        this.modalMovimientosAbierto.set(false);
      }
    });
  }

  activarFila(row: NominaMasivaFila, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.facade.seleccionarTrabajadorNominaMasiva(row.idPersona);
  }

  onFilaKeydown(row: NominaMasivaFila, event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    this.activarFila(row, event);
  }

  abrirModalMovimientos(row?: NominaMasivaFila, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (row) {
      this.facade.seleccionarTrabajadorNominaMasiva(row.idPersona);
    }
    if (this.facade.nominaMasivaMovimientosPanelRows().length === 0) return;
    this.modalMovimientosAbierto.set(true);
  }

  cerrarModalMovimientos(): void {
    this.modalMovimientosAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  cerrarModalMovimientosConEscape(): void {
    if (this.modalMovimientosAbierto()) {
      this.cerrarModalMovimientos();
    }
  }
}
