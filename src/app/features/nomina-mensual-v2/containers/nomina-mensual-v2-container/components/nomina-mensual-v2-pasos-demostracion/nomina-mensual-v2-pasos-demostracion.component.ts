import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { PayrollStepId, SummaryMetric } from '../../../../models/nomina-mensual-v2.models';

const METRICAS_MOVIMIENTOS_VACIAS: SummaryMetric[] = [
  { id: 'earnings', label: 'Haberes variables', value: 0, helperText: 'Sin entradas en el período', tone: 'gray' },
  { id: 'deductions', label: 'Descuentos', value: 0, helperText: 'Sin entradas en el período', tone: 'gray' },
  { id: 'licenses', label: 'Licencias', value: 0, helperText: 'Sin entradas en el período', tone: 'gray' },
  { id: 'recurring', label: 'Entradas cargadas', value: 0, helperText: 'Consulta en Movimientos', tone: 'gray' },
];
import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import {
  NominaMensualV2FlujoService,
  type NominaMensualV2FlujoRealView,
} from '../../../../services/nomina-mensual-v2-flujo.service';
import {
  etiquetaIntegridadVisible,
  formatoFechaTrazabilidad,
} from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import {
  claseChecklist,
  claseTono,
  iconoChecklist,
  iconoEstado,
  iconoMetrica,
  inicialesNombre,
} from '../../utils/nomina-mensual-v2-presentacion.util';
import { NominaMensualV2TrazabilidadPasoComponent } from '../nomina-mensual-v2-trazabilidad-paso/nomina-mensual-v2-trazabilidad-paso.component';

@Component({
  selector: 'app-nomina-mensual-v2-pasos-demostracion',
  standalone: true,
  imports: [LucideAngularModule, NominaMensualV2TrazabilidadPasoComponent],
  templateUrl: './nomina-mensual-v2-pasos-demostracion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasosDemostracionComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) paso!: PayrollStepId;

  readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly flujoService = inject(NominaMensualV2FlujoService);
  private limpiarAccionPrincipal: (() => void) | null = null;

  readonly cargando = signal(false);
  readonly ejecutando = signal(false);
  readonly errorAccion = signal<string | null>(null);
  readonly flujoReal = signal<NominaMensualV2FlujoRealView | null>(null);

  readonly movementMetrics = computed(() => {
    const filas = this.flujoReal()?.movimientos ?? [];
    if (!filas.length) return METRICAS_MOVIMIENTOS_VACIAS;
    const descuentos = filas.filter((row) => row.type.tone === 'red').length;
    const licencias = filas.filter((row) => row.type.tone === 'purple').length;
    return [
      { id: 'earnings', label: 'Haberes variables', value: filas.length - descuentos - licencias, helperText: 'Período en BD', tone: 'green' as const },
      { id: 'deductions', label: 'Descuentos', value: descuentos, helperText: 'Período en BD', tone: 'red' as const },
      { id: 'licenses', label: 'Licencias', value: licencias, helperText: 'Período en BD', tone: 'purple' as const },
      { id: 'recurring', label: 'Entradas cargadas', value: filas.length, helperText: 'Total leído', tone: 'blue' as const },
    ];
  });
  readonly movementRows = computed(() => this.flujoReal()?.movimientos ?? []);
  readonly calculationMetrics = computed(() => this.flujoReal()?.calculoMetricas ?? []);
  readonly calculationRows = computed(() => this.flujoReal()?.calculoFilas ?? []);
  readonly validationMetrics = computed(() => this.flujoReal()?.validacionMetricas ?? []);
  readonly validationRows = computed(() => this.flujoReal()?.validacionFilas ?? []);
  readonly approvalMetrics = computed(() => this.flujoReal()?.aprobacionMetricas ?? []);
  readonly payslipMetrics = computed(() => this.flujoReal()?.liquidacionMetricas ?? []);
  readonly payslipRows = computed(() => this.flujoReal()?.liquidacionFilas ?? []);

  readonly approvalTimeline = computed(() =>
    this.orquestador
      .eventosTrazabilidad()
      .filter((e) => e.paso === 'approval' || e.paso === 'validation' || e.paso === 'calculation')
      .slice(0, 5)
      .map((e) => ({
        time: formatoFechaTrazabilidad(e.fechaEvento),
        title: e.descripcion,
        description: etiquetaIntegridadVisible(e.integridad.estadoIntegridad, e.origen),
        status: e.integridad.estadoIntegridad === 'invalidado' ? ('warning' as const) : ('success' as const),
      })),
  );

  readonly toneClass = claseTono;
  readonly metricIcon = iconoMetrica;
  readonly statusIcon = iconoEstado;
  readonly initials = inicialesNombre;
  readonly checklistClass = claseChecklist;
  readonly checklistIcon = iconoChecklist;
  readonly etiquetaIntegridad = etiquetaIntegridadVisible;
  readonly formatoFecha = formatoFechaTrazabilidad;

  ngOnChanges(): void {
    if (this.paso === 'movements' || this.paso === 'calculation' || this.paso === 'validation' || this.paso === 'approval' || this.paso === 'payslips') {
      void this.cargarFlujoReal();
      this.limpiarAccionPrincipal?.();
      this.limpiarAccionPrincipal = this.orquestador.registrarAccionPrincipal(() => void this.ejecutarAccionPrincipal());
    }
  }

  ngOnDestroy(): void {
    this.limpiarAccionPrincipal?.();
  }

  async ejecutarAccionPrincipal(): Promise<void> {
    if (this.ejecutando()) return;
    const periodo = this.periodoActivo.periodoYm();
    this.ejecutando.set(true);
    this.errorAccion.set(null);
    try {
      if (this.paso === 'calculation') {
        this.flujoReal.set(await this.flujoService.procesarCalculo(periodo));
        await this.orquestador.recomputarTrazabilidad(false);
        return;
      }
      if (this.paso === 'validation') {
        await this.flujoService.validarPrenomina(periodo);
        await this.cargarFlujoReal();
        await this.orquestador.recomputarTrazabilidad(false);
        return;
      }
      if (this.paso === 'approval') {
        this.flujoReal.set(await this.flujoService.aprobarNomina(periodo));
        await this.orquestador.recomputarTrazabilidad(false);
        return;
      }
      if (this.paso === 'payslips') {
        this.flujoReal.set(await this.flujoService.generarLiquidaciones(periodo));
        await this.orquestador.recomputarTrazabilidad(false);
        return;
      }
    } catch (error) {
      this.errorAccion.set(error instanceof Error ? error.message : 'No fue posible completar la accion.');
    } finally {
      this.ejecutando.set(false);
    }
  }

  private async cargarFlujoReal(): Promise<void> {
    this.cargando.set(true);
    try {
      this.flujoReal.set(await this.flujoService.cargar(this.periodoActivo.periodoYm()));
    } finally {
      this.cargando.set(false);
    }
  }

}
