import { ChangeDetectionStrategy, Component, effect, HostListener, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronRight, Search, X } from 'lucide-angular';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../../../shared/components/ui/data-grid';
import type { NominaDetalleMensualMovimientoRow } from '../../models/proceso-mensual-container.vm';
import type { NominaMasivaFila } from '../../../../rules/proceso-mensual-masivo-layout.rules';
import type { IncidenciaPeriodo } from '../../../../rules/proceso-mensual-incidencias-periodo.rules';
import { claseSegmentNavActivo } from '../../../../rules/proceso-mensual-segment-nav.rules';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

export type DetalleTrabajadorTab = 'resumen' | 'que_hacer';

@Component({
  selector: 'app-proceso-mensual-revision-trabajadores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, DataGridComponent, DataGridCellDirective],
  templateUrl: './proceso-mensual-revision-trabajadores.component.html',
  styleUrls: [
    '../../payroll-segment-nav.css',
    '../../payroll-operativa-empty.css',
    './proceso-mensual-revision-trabajadores.component.css',
  ],
})
export class ProcesoMensualRevisionTrabajadoresComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
  readonly cerrarDetalleIcon = X;
  readonly abrirDetalleIcon = ChevronRight;
  readonly buscarTrabajadorIcon = Search;
  readonly modalMovimientosAbierto = signal(false);
  readonly detalleTrabajadorTab = signal<DetalleTrabajadorTab>('que_hacer');

  private ultimaPersonaDetalleTab = '';

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

    effect(() => {
      const detalle = this.facade.nominaMasivaDetalleSeleccionado();
      const accion = this.facade.nominaMasivaAccionRecomendadaPanel();
      if (!detalle) {
        untracked(() => {
          this.ultimaPersonaDetalleTab = '';
        });
        return;
      }
      const id = String(detalle.idPersona);
      if (id === this.ultimaPersonaDetalleTab) return;
      this.ultimaPersonaDetalleTab = id;
      untracked(() => {
        if (this.facade.revisionSoloFichasPrevalidacion()) {
          this.detalleTrabajadorTab.set('que_hacer');
          return;
        }
        const irQueHacer =
          detalle.incidencias.length > 0
          || accion?.tono === 'bloqueo'
          || accion?.tono === 'atencion';
        this.detalleTrabajadorTab.set(irQueHacer ? 'que_hacer' : 'resumen');
      });
    });
  }

  detalleTrabajadorTabsVisibles(): ReadonlyArray<{ id: DetalleTrabajadorTab; label: string }> {
    if (this.facade.revisionSoloFichasPrevalidacion()) {
      return [{ id: 'que_hacer', label: 'Qué corregir' }];
    }
    return [
      { id: 'que_hacer', label: 'Atención' },
      { id: 'resumen', label: 'Resumen' },
    ];
  }

  mostrarBloqueAccionRecomendadaSeparada(): boolean {
    const accion = this.facade.nominaMasivaAccionRecomendadaPanel();
    const detalle = this.facade.nominaMasivaDetalleSeleccionado();
    if (!accion || accion.tono === 'listo') return false;
    if (!detalle?.incidencias.length) return true;
    const primera = detalle.incidencias[0];
    if (primera?.accion?.label && accion.accion?.label === primera.accion.label) {
      return false;
    }
    return accion.titulo !== primera.titulo || !primera.accion;
  }

  claseDetalleTrabajadorTab(tab: DetalleTrabajadorTab): string {
    return claseSegmentNavActivo(this.detalleTrabajadorTab() === tab);
  }

  seleccionarDetalleTrabajadorTab(tab: DetalleTrabajadorTab): void {
    if (!this.detalleTrabajadorTabsVisibles().some((t) => t.id === tab)) return;
    this.detalleTrabajadorTab.set(tab);
  }

  claseSeveridadIncidencia(severidad: IncidenciaPeriodo['severidad']): string {
    switch (severidad) {
      case 'bloqueo':
        return 'payroll-state-chip payroll-state-chip--danger';
      case 'advertencia':
        return 'payroll-state-chip payroll-state-chip--warning';
      case 'info':
      default:
        return 'payroll-state-chip payroll-state-chip--info';
    }
  }

  etiquetaSeveridadIncidencia(severidad: IncidenciaPeriodo['severidad']): string {
    switch (severidad) {
      case 'bloqueo':
        return 'Bloqueo';
      case 'advertencia':
        return 'Observación';
      case 'info':
      default:
        return 'Información';
    }
  }

  activarFila(row: NominaMasivaFila, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.facade.esFilaMasivaSeleccionada(row.idPersona)) {
      this.facade.limpiarSeleccionTrabajadorNominaMasiva();
      return;
    }
    this.facade.seleccionarTrabajadorNominaMasiva(row.idPersona);
  }

  onFilaKeydown(row: NominaMasivaFila, event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    this.activarFila(row, event);
  }

  cerrarDetalleTrabajador(): void {
    this.facade.limpiarSeleccionTrabajadorNominaMasiva();
  }

  esAccionPanelTrabajador(row: NominaMasivaFila): boolean {
    return this.facade.accionCorreccionFilaMasiva(row).kind === 'panel_trabajador';
  }

  ejecutarAccionFila(row: NominaMasivaFila, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.facade.esFilaMasivaSeleccionada(row.idPersona) && this.esAccionPanelTrabajador(row)) {
      this.cerrarDetalleTrabajador();
      return;
    }
    this.detalleTrabajadorTab.set('que_hacer');
    this.facade.ejecutarAccionCorreccionFilaMasiva(row, event);
  }

  ejecutarAccionMovimientoPanel(row: NominaDetalleMensualMovimientoRow, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.cerrarModalMovimientos();
    this.facade.ejecutarAccionCorreccionMovimientoPanel(row);
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
  cerrarConEscape(): void {
    if (this.modalMovimientosAbierto()) {
      this.cerrarModalMovimientos();
      return;
    }
    if (this.facade.nominaMasivaDetalleSeleccionado()) {
      this.cerrarDetalleTrabajador();
    }
  }
}
