import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DataGridComponent } from '../../../../../../shared/components/ui/data-grid';
import { ProcesoMensualRevisionTrabajadoresComponent } from '../proceso-mensual-revision-trabajadores/proceso-mensual-revision-trabajadores.component';
import { claseDetalleRevisionTab } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import type { DetalleRevisionTabSeveridad } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import {
  resolveBitacoraRailIcon,
  resolveFocusPresentacion,
} from '../../../../rules/proceso-mensual-workspace-presentacion.rules';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, DataGridComponent, ProcesoMensualRevisionTrabajadoresComponent],
  templateUrl: './proceso-mensual-workspace.component.html',
  styleUrls: [
    '../../proceso-mensual-container.css',
    '../proceso-mensual-detalle-modal/proceso-mensual-detalle-modal.component.css',
    './proceso-mensual-workspace.component.css',
  ],
})
export class ProcesoMensualWorkspaceComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);

  readonly modalAccionesPeriodoAbierto = signal(false);

  readonly mostrarAccesoAccionesPeriodo = computed(
    () => this.facade.mostrarAccionesPeriodoNomina() || this.facade.puedeGuardarBaseNominaRevisada(),
  );

  readonly focusPresentacion = computed(() => resolveFocusPresentacion(this.facade.nominaFrame().frame));
  readonly resolveBitacoraRailIcon = resolveBitacoraRailIcon;

  abrirModalAccionesPeriodo(): void {
    this.modalAccionesPeriodoAbierto.set(true);
  }

  cerrarModalAccionesPeriodo(): void {
    this.modalAccionesPeriodoAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  cerrarModalAccionesPeriodoConEscape(): void {
    if (this.modalAccionesPeriodoAbierto()) {
      this.cerrarModalAccionesPeriodo();
    }
  }

  claseWorkspaceTab(severidad: DetalleRevisionTabSeveridad, activo: boolean): string {
    return claseDetalleRevisionTab(severidad, activo);
  }
}
