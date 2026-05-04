import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { BadgeComponent } from '../../../../shared/components/ui/badge.component';
import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import { CardComponent, CardContentComponent } from '../../../../shared/components/ui/card.component';
import type { ProcesoMensualEstado, ProcesoMensualPrevalidacion } from '../../models/proceso-mensual.model';
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
  readonly validando = signal(false);
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
      })
      .catch((e: unknown) => {
        this.resultado.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.validando.set(false);
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

  prevStep(): void {
    this.currentStep.update((s) => Math.max(1, s - 1) as ProcesoMensualStep);
  }

  nextStep(): void {
    this.currentStep.update((s) => Math.min(4, s + 1) as ProcesoMensualStep);
  }
}
