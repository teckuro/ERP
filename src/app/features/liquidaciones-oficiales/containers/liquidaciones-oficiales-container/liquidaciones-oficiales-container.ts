import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { BadgeComponent } from '../../../../shared/components/ui/primitives/badge.component';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import { CardComponent, CardContentComponent } from '../../../../shared/components/ui/primitives/card.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';
import { LiquidacionDetallePanelComponent } from '../../components/liquidacion-detalle-panel/liquidacion-detalle-panel';
import { LiquidacionResumenCardComponent } from '../../components/liquidacion-resumen-card/liquidacion-resumen-card';
import { LiquidacionesTrabajadoresGridComponent } from '../../components/liquidaciones-trabajadores-grid/liquidaciones-trabajadores-grid';
import type {
  LiquidacionConcepto,
  LiquidacionesEstadoPeriodo,
  LiquidacionTrabajador,
} from '../../models/liquidacion-oficial.model';
import { LiquidacionesOficialesService } from '../../services/liquidaciones-oficiales.service';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellStatusChipTone } from '../../../../layout/shell-page-context.service';

@Component({
  selector: 'app-liquidaciones-oficiales-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    MessageBoxComponent,
    LiquidacionResumenCardComponent,
    LiquidacionesTrabajadoresGridComponent,
    LiquidacionDetallePanelComponent,
  ],
  templateUrl: './liquidaciones-oficiales-container.html',
  styleUrl: './liquidaciones-oficiales-container.css',
})
export class LiquidacionesOficialesContainer {
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly service = inject(LiquidacionesOficialesService);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  readonly periodoSeleccionado = computed(() => this.periodoActivo.getPeriodo());
  readonly volverNominaQuery = computed(() => ({ periodo: this.periodoSeleccionado() }));
  readonly estadoPeriodo = signal<LiquidacionesEstadoPeriodo | null>(null);
  readonly cargando = signal(false);
  readonly generando = signal(false);
  readonly error = signal<string | null>(null);
  readonly trabajadorSeleccionado = signal<LiquidacionTrabajador | null>(null);
  readonly conceptosDetalle = signal<LiquidacionConcepto[]>([]);
  readonly cargandoDetalle = signal(false);
  readonly confirmacionGeneracionVisible = signal(false);

  readonly estadoUi = computed(() => {
    if (this.generando()) return 'generando';
    if (this.error()) return 'error';
    return this.estadoPeriodo()?.estado ?? 'no_disponible';
  });

  readonly estadoLabel = computed(() => {
    switch (this.estadoUi()) {
      case 'lista_para_generar':
        return 'Lista para generar';
      case 'generando':
        return 'Generando';
      case 'generadas':
        return 'Generadas';
      case 'generadas_con_advertencias':
        return 'Generadas con advertencias';
      case 'error':
        return 'Error de generacion';
      default:
        return 'No disponible';
    }
  });

  readonly puedeGenerar = computed(() =>
    this.estadoPeriodo()?.estado === 'lista_para_generar' && !this.cargando() && !this.generando(),
  );

  readonly siguienteAccion = computed(() => {
    const estado = this.estadoPeriodo();
    if (this.generando()) {
      return {
        titulo: 'Generando liquidaciones oficiales',
        descripcion: 'Se esta materializando la salida interna desde la nómina mensual confirmada.',
      };
    }
    if (estado?.liquidacion) {
      return {
        titulo: 'Revisar liquidaciones',
        descripcion: 'Las liquidaciones del periodo ya estan disponibles para revisar por trabajador.',
      };
    }
    if (estado?.estado === 'lista_para_generar') {
      return {
        titulo: 'Generar liquidaciones oficiales',
        descripcion: 'La nómina mensual está confirmada. Puedes generar la salida interna del periodo.',
      };
    }
    return {
      titulo: 'Volver a Nómina mensual',
      descripcion: estado?.motivoNoPuedeGenerar ?? 'Primero debe existir una nómina mensual confirmada.',
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    bindShellPageContext(destroyRef, () => ({
      breadcrumbs: [
        { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
        { label: 'Liquidaciones' },
      ],
      statusChip: {
        label: this.estadoLabel(),
        tone: this.tonoEstadoLiquidaciones(),
      },
    }));

    effect(() => {
      const params = this.queryParams() as Record<string, unknown>;
      const periodo = params['periodo'];
      if (typeof periodo !== 'string' || !/^\d{4}-\d{2}$/.test(periodo)) return;
      untracked(() => this.periodoActivo.setPeriodoYm(periodo));
    });

    effect(() => {
      this.periodoSeleccionado();
      untracked(() => {
        this.resetearEstadoPeriodo();
        void this.consultar();
      });
    });
  }

  consultar(): Promise<void> {
    const periodo = this.periodoSeleccionado().trim();
    this.cargando.set(true);
    this.error.set(null);
    this.trabajadorSeleccionado.set(null);
    this.conceptosDetalle.set([]);
    return this.service.consultarEstadoPeriodo(periodo)
      .then((estado) => {
        if (this.periodoSeleccionado().trim() !== periodo) {
          return;
        }
        this.estadoPeriodo.set(estado);
      })
      .catch((error: unknown) => {
        if (this.periodoSeleccionado().trim() !== periodo) {
          return;
        }
        this.estadoPeriodo.set(null);
        this.error.set(error instanceof Error ? error.message : 'No se pudo consultar liquidaciones oficiales.');
      })
      .finally(() => this.cargando.set(false));
  }

  private resetearEstadoPeriodo(): void {
    this.estadoPeriodo.set(null);
    this.error.set(null);
    this.trabajadorSeleccionado.set(null);
    this.conceptosDetalle.set([]);
    this.confirmacionGeneracionVisible.set(false);
  }

  generarLiquidaciones(): void {
    if (!this.puedeGenerar()) return;
    this.confirmacionGeneracionVisible.set(true);
  }

  seccionesConfirmacionGeneracion(): MessageBoxSection[] {
    return [
      {
        title: 'Principal',
        text: `Se usará la nómina mensual confirmada del período ${this.periodoSeleccionado()}.`,
      },
      {
        title: 'Acción',
        text: 'Generar la salida interna por trabajador. Las salidas legales y archivos externos siguen fuera de alcance.',
        tone: 'info',
      },
    ];
  }

  cancelarGeneracion(): void {
    this.confirmacionGeneracionVisible.set(false);
  }

  confirmarGeneracionLiquidaciones(): void {
    const estado = this.estadoPeriodo();
    if (!estado?.snapshot?.idCalculoPeriodo || !this.puedeGenerar()) return;

    this.confirmacionGeneracionVisible.set(false);
    this.generando.set(true);
    this.error.set(null);
    void this.service.generarLiquidaciones(estado.periodo)
      .then((nuevoEstado) => {
        this.estadoPeriodo.set(nuevoEstado);
        const primero = nuevoEstado.trabajadores[0] ?? null;
        if (primero) void this.verDetalleTrabajador(primero);
      })
      .catch((error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'No se pudieron generar las liquidaciones oficiales.');
      })
      .finally(() => this.generando.set(false));
  }

  verDetalleTrabajador(trabajador: LiquidacionTrabajador): Promise<void> {
    this.trabajadorSeleccionado.set(trabajador);
    this.cargandoDetalle.set(true);
    this.conceptosDetalle.set([]);
    return this.service.obtenerDetalleTrabajador(trabajador.idLiquidacionTrabajador)
      .then((conceptos) => this.conceptosDetalle.set(conceptos))
      .catch(() => this.error.set('No se pudo consultar el detalle del trabajador.'))
      .finally(() => this.cargandoDetalle.set(false));
  }

  badgeVariant(): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (this.estadoUi()) {
      case 'generadas':
        return 'success';
      case 'generadas_con_advertencias':
      case 'lista_para_generar':
        return 'warning';
      case 'generando':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  }

  tonoEstadoLiquidaciones(): ShellStatusChipTone {
    switch (this.estadoUi()) {
      case 'generadas':
      case 'generadas_con_advertencias':
        return 'success';
      case 'lista_para_generar':
      case 'generando':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
