import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { BadgeComponent } from '../../../../shared/components/ui/badge.component';
import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import { CardComponent, CardContentComponent } from '../../../../shared/components/ui/card.component';
import type {
  MotorCalculoPeriodoResultado,
  NominaCalculoPeriodoSnapshot,
  ProcesoMensualEstado,
  ProcesoMensualPreNominaEstado,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../../models/proceso-mensual.model';
import { ProcesoMensualService } from '../../services/proceso-mensual.service';

export type ProcesoMensualStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-proceso-mensual-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './proceso-mensual-container.html',
  styleUrl: './proceso-mensual-container.css',
})
export class ProcesoMensualContainer {
  readonly periodoActivo = inject(PeriodoActivoService);
  readonly procesoMensual = inject(ProcesoMensualService);

  readonly currentStep = signal<ProcesoMensualStep>(1);
  readonly periodoSeleccionado = signal(this.periodoActivo.periodoYm());
  readonly resultado = signal<ProcesoMensualPrevalidacion | null>(null);
  readonly preNomina = signal<ProcesoMensualPreNominaPeriodo | null>(null);
  readonly calculo = signal<MotorCalculoPeriodoResultado | null>(null);
  readonly snapshotActivo = signal<NominaCalculoPeriodoSnapshot | null>(null);
  readonly validando = signal(false);
  readonly generandoPreNomina = signal(false);
  readonly calculandoPreliminar = signal(false);
  readonly guardandoSnapshot = signal(false);
  readonly consultandoSnapshot = signal(false);
  readonly errorEjecucion = signal<string | null>(null);

  readonly steps = [
    { number: 1 as const, title: 'Revision previa', icon: 'alert-circle', description: 'Parametros e incidencias' },
    { number: 2 as const, title: 'Calculo', icon: 'calculator', description: 'Motor futuro' },
    { number: 3 as const, title: 'Exportaciones', icon: 'file-text', description: 'Previred, banco, LRE' },
    { number: 4 as const, title: 'Cierre', icon: 'lock', description: 'Bloqueo de periodo' },
  ];

  constructor() {
    effect(() => {
      this.periodoActivo.periodoYm();
      this.currentStep.set(1);
    });
  }

  onPeriodoInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const v = el.value?.trim();
    if (v) {
      this.periodoSeleccionado.set(v);
      this.resultado.set(null);
      this.preNomina.set(null);
      this.calculo.set(null);
      this.snapshotActivo.set(null);
      this.errorEjecucion.set(null);
    }
  }

  validarPeriodo(): void {
    const p = this.periodoSeleccionado();
    this.validando.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .ejecutarPrevalidaciones(p)
      .then((r) => {
        this.resultado.set(r);
        this.preNomina.set(null);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
      })
      .catch((e: unknown) => {
        this.resultado.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.validando.set(false);
      });
  }

  generarPreNomina(): void {
    const p = this.periodoSeleccionado();
    this.generandoPreNomina.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarPreNominaPeriodo(p)
      .then((r) => {
        this.preNomina.set(r);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
      })
      .catch((e: unknown) => {
        this.preNomina.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.generandoPreNomina.set(false);
      });
  }

  calcularPreliminar(): void {
    const p = this.periodoSeleccionado();
    this.calculandoPreliminar.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarCalculoPeriodo(p)
      .then((r) => {
        this.calculo.set(r);
      })
      .catch((e: unknown) => {
        this.calculo.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.calculandoPreliminar.set(false);
      });
  }

  guardarSnapshotPreliminar(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .guardarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.codigo).join(', ') || 'No fue posible guardar snapshot preliminar.';
          throw new Error(msg);
        }
        this.snapshotActivo.set(r.snapshot);
      })
      .catch((e: unknown) => {
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  verSnapshotActivo(): void {
    const p = this.periodoSeleccionado();
    this.consultandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .obtenerSnapshotActivo(p)
      .then((snapshot) => {
        this.snapshotActivo.set(snapshot);
      })
      .catch((e: unknown) => {
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.consultandoSnapshot.set(false);
      });
  }

  recalcularYReemplazarSnapshot(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .reemplazarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.codigo).join(', ') || 'No fue posible reemplazar snapshot preliminar.';
          throw new Error(msg);
        }
        this.snapshotActivo.set(r.snapshot);
        this.calculo.set(this.procesoMensual.obtenerResultadoCalculoPeriodo(p));
      })
      .catch((e: unknown) => {
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  etiquetaEstadoGlobal(estado: ProcesoMensualEstado | null): string {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'Listo para calculo (prevalidacion)';
      case 'CON_ADVERTENCIAS':
        return 'Con advertencias';
      case 'BLOQUEADO':
        return 'Bloqueado';
      case 'SIN_EVALUAR':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantEstado(estado: ProcesoMensualEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'success';
      case 'CON_ADVERTENCIAS':
        return 'warning';
      case 'BLOQUEADO':
        return 'error';
      default:
        return 'default';
    }
  }

  etiquetaEstadoPreNomina(estado: ProcesoMensualPreNominaEstado | null): string {
    switch (estado) {
      case 'GENERADA':
        return 'Pre-nomina generada';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'Pre-nomina con advertencias';
      case 'NO_GENERABLE':
        return 'No generable';
      default:
        return 'Sin generar';
    }
  }

  badgeVariantPreNomina(estado: ProcesoMensualPreNominaEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'GENERADA':
        return 'success';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'warning';
      case 'NO_GENERABLE':
        return 'error';
      default:
        return 'default';
    }
  }

  puedeGenerarPreNomina(): boolean {
    const r = this.resultado();
    return !!r && r.estado !== 'BLOQUEADO' && !this.validando() && !this.generandoPreNomina();
  }

  puedeCalcularPreliminar(): boolean {
    const pn = this.preNomina();
    return !!pn && pn.estado !== 'NO_GENERABLE' && !this.validando() && !this.generandoPreNomina() && !this.calculandoPreliminar();
  }

  puedeGuardarSnapshot(): boolean {
    const calc = this.calculo();
    return !!calc && calc.estado !== 'con_bloqueos' && !this.guardandoSnapshot() && !calc.issues.some((i) => i.severidad === 'BLOQUEO');
  }

  prevStep(): void {
    this.currentStep.update((s) => Math.max(1, s - 1) as ProcesoMensualStep);
  }

  nextStep(): void {
    this.currentStep.update((s) => Math.min(4, s + 1) as ProcesoMensualStep);
  }
}
