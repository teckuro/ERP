/**
 * Modal "Resumen de nómina" del Administrador (F2).
 *
 * Read-only. Recibe `ResumenValidacionNomina` y un `NominaPeriodoResumen` para
 * contexto. Muestra totales, badges de `puedeCalcular` / `puedeCerrar` y
 * listas separadas de incidencias críticas / advertencias.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type {
  IncidenciaNomina,
  NominaPeriodoResumen,
  ResumenValidacionNomina,
} from '../../../../models/nomina-periodo.models';
import { estadoNominaToBadge, tipoNominaToLabel } from '../../utils/admin-nominas-presentacion.util';

interface MetricaResumenView {
  id: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-nominas-modal-resumen-nomina',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './admin-nominas-modal-resumen-nomina.component.html',
  styleUrl: './admin-nominas-modal-resumen-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalResumenNominaComponent {
  readonly resumen = input.required<ResumenValidacionNomina>();
  readonly nomina = input<NominaPeriodoResumen | null>(null);
  readonly cerrar = output<void>();

  readonly metricas = computed<MetricaResumenView[]>(() => {
    const r = this.resumen();
    return [
      { id: 'total', label: 'Trabajadores', value: r.totalTrabajadores },
      { id: 'listos', label: 'Listos para cálculo', value: r.listosParaCalculo },
      { id: 'criticas', label: 'Con críticas', value: r.conIncidenciasCriticas },
      { id: 'advertencias', label: 'Con advertencias', value: r.conAdvertencias },
      { id: 'movimientos', label: 'Con movimientos especiales', value: r.conMovimientosEspeciales },
    ];
  });

  readonly contextoVista = computed(() => {
    const n = this.nomina();
    if (!n) return null;
    return {
      empresa: n.empresaNombre,
      periodo: n.periodo,
      tipo: tipoNominaToLabel(n.tipo),
      badge: estadoNominaToBadge(n.estado),
    };
  });

  readonly mensajeGuardia = computed(() => {
    const r = this.resumen();
    if (r.puedeCalcular && r.puedeCerrar) {
      return 'La nómina está habilitada para avanzar al cálculo y al cierre.';
    }
    if (!r.puedeCalcular) {
      return 'Hay incidencias críticas bloqueantes. Resuélvelas antes de calcular.';
    }
    return 'Hay incidencias críticas bloqueantes pendientes de revisión.';
  });

  cerrarModal(): void {
    this.cerrar.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrar.emit();
    }
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrar.emit();
    }
  }

  trackIncidencia(_index: number, incidencia: IncidenciaNomina): string {
    return incidencia.id;
  }
}
