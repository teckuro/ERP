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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';
import type {
  LiquidacionConcepto,
  LiquidacionesEstadoPeriodo,
  LiquidacionTrabajador,
} from '../../models/liquidacion-oficial.model';
import {
  inicializarEstadosLiquidacionUi,
  resumirEstadosLiquidacionUi,
  siguienteEstadoLiquidacionUi,
  type LiquidacionAccionUiEstado,
  type LiquidacionAccionUiEvent,
} from '../../rules/liquidaciones-acciones-ui.rules';
import { LiquidacionesOficialesService } from '../../services/liquidaciones-oficiales.service';
import { NominaPeriodoService } from '../../../nomina-mensual/services/nomina-periodo.service';
import type { NominaPeriodo } from '../../../nomina-mensual/models/nomina-periodo.models';
import type { NominaLiquidacionResumen } from '../../../nomina-mensual/models/nomina-consolidacion.models';
import {
  formatearFechaLiquidacion,
  prepararFilasLiquidacionesInternas,
} from '../../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';
import {
  calcularTrabajadoresSinLiquidacion,
  esLiquidacionesSoloLectura,
  puedeRegenerarLiquidacionesInternas,
} from '../../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';
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
    ButtonComponent,
    MessageBoxComponent,
  ],
  templateUrl: './liquidaciones-oficiales-container.html',
  styleUrl: './liquidaciones-oficiales-container.css',
})
export class LiquidacionesOficialesContainer {
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly service = inject(LiquidacionesOficialesService);
  private readonly nominaService = inject(NominaPeriodoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  readonly nominaPeriodoId = computed(() => {
    const params = this.queryParams() as Record<string, unknown>;
    const id = params['nominaPeriodoId'];
    return typeof id === 'string' && id.trim() ? id.trim() : null;
  });
  readonly modoNominaInterna = computed(() => !!this.nominaPeriodoId());
  readonly nominaInterna = signal<NominaPeriodo | null>(null);
  readonly liquidacionesInternas = signal<readonly NominaLiquidacionResumen[]>([]);
  readonly cargandoNominaInterna = signal(false);
  readonly regenerandoInterna = signal(false);
  readonly confirmacionRegeneracionInternaVisible = signal(false);
  readonly formatearFechaLiquidacion = formatearFechaLiquidacion;

  readonly filasLiquidacionesInternas = computed(() =>
    prepararFilasLiquidacionesInternas(
      this.liquidacionesInternas(),
      this.nominaInterna()?.estado ?? 'borrador',
    ),
  );
  readonly soloLecturaInterna = computed(() =>
    esLiquidacionesSoloLectura(this.nominaInterna()?.estado ?? 'borrador'),
  );
  readonly puedeRegenerarInterna = computed(() =>
    puedeRegenerarLiquidacionesInternas(
      this.nominaInterna()?.estado ?? 'borrador',
      this.nominaInterna()?.evidenciaCalculo?.calculoVigente ?? false,
    ),
  );
  readonly trabajadoresSinLiquidacionInterna = computed(() => {
    const vigente = this.filasLiquidacionesInternas().find((f) => f.clasificacion === 'vigente');
    return calcularTrabajadoresSinLiquidacion(
      this.nominaInterna()?.trabajadorIds.length ?? 0,
      vigente?.totalTrabajadores,
    );
  });

  readonly periodoSeleccionado = computed(() => this.periodoActivo.getPeriodo());
  readonly volverNominaQuery = computed(() => ({ periodo: this.periodoSeleccionado() }));
  readonly rutaAdministradorNominas = '/remuneraciones/nominas';
  readonly estadoPeriodo = signal<LiquidacionesEstadoPeriodo | null>(null);
  readonly cargando = signal(false);
  readonly generando = signal(false);
  readonly error = signal<string | null>(null);
  readonly trabajadorSeleccionado = signal<LiquidacionTrabajador | null>(null);
  readonly conceptosDetalle = signal<LiquidacionConcepto[]>([]);
  readonly cargandoDetalle = signal(false);
  readonly confirmacionGeneracionVisible = signal(false);
  readonly estadosAccionTrabajador = signal<Record<number, LiquidacionAccionUiEstado>>({});
  readonly feedbackAccionTrabajador = signal<string | null>(null);

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

  readonly resumenFinanciero = computed(() => {
    const estado = this.estadoPeriodo();
    const fuente = estado?.liquidacion ?? estado?.snapshot ?? null;
    if (!fuente) return null;
    return {
      origen: estado?.liquidacion ? 'Liquidaciones emitidas' : 'Nómina aprobada',
      trabajadores: fuente.totalTrabajadores,
      haberes: fuente.totalHaberes,
      descuentos: fuente.totalDescuentos,
      liquido: fuente.totalLiquido,
    };
  });

  readonly resumenFlujoTrabajadores = computed(() => resumirEstadosLiquidacionUi(this.estadosAccionTrabajador()));

  readonly siguienteAccion = computed(() => {
    const estado = this.estadoPeriodo();
    if (this.generando()) {
      return {
        titulo: 'Generando liquidaciones oficiales',
        descripcion: 'Se está materializando la salida interna desde la nómina mensual aprobada.',
      };
    }
    if (estado?.liquidacion) {
      return {
        titulo: 'Liquidaciones emitidas',
        descripcion:
          'Las liquidaciones del período ya están emitidas. Vuelve a Nómina mensual para cerrar el proceso si aún no lo hizo.',
      };
    }
    if (estado?.estado === 'lista_para_generar') {
      return {
        titulo: 'Generar liquidaciones oficiales',
        descripcion: 'La nómina mensual está aprobada. Puedes generar la salida interna del período.',
      };
    }
    return {
      titulo: 'Volver a Nómina mensual',
      descripcion: estado?.motivoNoPuedeGenerar ?? 'Primero debe existir una nómina mensual aprobada.',
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    bindShellPageContext(
      destroyRef,
      () => ({
        breadcrumbs: [
          { label: 'Remuneraciones', path: this.rutaAdministradorNominas },
          { label: 'Liquidaciones' },
        ],
        statusChip: this.modoNominaInterna()
          ? {
              label: this.nominaInterna()?.estado === 'cerrada' ? 'Congelada' : 'Por nómina',
              tone: this.nominaInterna()?.estado === 'cerrada' ? 'success' : 'warning',
            }
          : {
              label: this.estadoLabel(),
              tone: this.tonoEstadoLiquidaciones(),
            },
        primaryAction: this.modoNominaInterna()
          ? undefined
          : this.estadoPeriodo()?.liquidacion
            ? {
                label: 'Volver al administrador de nóminas',
                actionId: 'volver_nomina_cerrar',
              }
            : undefined,
      }),
      {
        onPrimaryAction: () => {
          void this.router.navigate([this.rutaAdministradorNominas], {
            queryParams: this.volverNominaQuery(),
          });
        },
      },
    );

    effect(() => {
      const params = this.queryParams() as Record<string, unknown>;
      const periodo = params['periodo'];
      if (typeof periodo !== 'string' || !/^\d{4}-\d{2}$/.test(periodo)) return;
      untracked(() => this.periodoActivo.setPeriodoYm(periodo));
    });

    effect(() => {
      this.periodoSeleccionado();
      const id = this.nominaPeriodoId();
      untracked(() => {
        this.resetearEstadoPeriodo();
        if (id) {
          void this.cargarNominaInterna();
        } else {
          this.nominaInterna.set(null);
          this.liquidacionesInternas.set([]);
        }
      });
    });
  }

  private async cargarNominaInterna(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) {
      this.nominaInterna.set(null);
      this.liquidacionesInternas.set([]);
      return;
    }
    this.cargandoNominaInterna.set(true);
    try {
      const [nomina, liquidaciones] = await Promise.all([
        this.nominaService.obtenerNomina(id),
        this.nominaService.listarLiquidacionesNomina(id),
      ]);
      if (this.nominaPeriodoId() !== id) return;
      this.nominaInterna.set(nomina);
      this.liquidacionesInternas.set(liquidaciones);
    } catch (error) {
      if (this.nominaPeriodoId() !== id) return;
      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar liquidaciones de la nómina.');
    } finally {
      if (this.nominaPeriodoId() === id) {
        this.cargandoNominaInterna.set(false);
      }
    }
  }

  solicitarRegeneracionInterna(): void {
    if (!this.puedeRegenerarInterna()) return;
    this.confirmacionRegeneracionInternaVisible.set(true);
  }

  cancelarRegeneracionInterna(): void {
    this.confirmacionRegeneracionInternaVisible.set(false);
  }

  async confirmarRegeneracionInterna(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || !this.puedeRegenerarInterna()) return;
    this.confirmacionRegeneracionInternaVisible.set(false);
    this.regenerandoInterna.set(true);
    this.error.set(null);
    try {
      await this.nominaService.generarLiquidacionesNomina(id);
      await this.cargarNominaInterna();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible regenerar liquidaciones.');
    } finally {
      this.regenerandoInterna.set(false);
    }
  }

  volverAdministradorNomina(): void {
    void this.router.navigate([this.rutaAdministradorNominas], {
      queryParams: this.volverNominaQuery(),
    });
  }

  consultar(): Promise<void> {
    const periodo = this.periodoSeleccionado().trim();
    this.cargando.set(true);
    this.error.set(null);
    this.trabajadorSeleccionado.set(null);
    this.conceptosDetalle.set([]);
    this.estadosAccionTrabajador.set({});
    this.feedbackAccionTrabajador.set(null);
    return this.service.consultarEstadoPeriodo(periodo)
      .then((estado) => {
        if (this.periodoSeleccionado().trim() !== periodo) {
          return;
        }
        this.aplicarEstadoPeriodo(estado);
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
    this.estadosAccionTrabajador.set({});
    this.feedbackAccionTrabajador.set(null);
  }

  generarLiquidaciones(): void {
    if (!this.puedeGenerar()) return;
    this.confirmacionGeneracionVisible.set(true);
  }

  seccionesConfirmacionGeneracion(): MessageBoxSection[] {
    return [
      {
        title: 'Principal',
        text: `Se usará la nómina mensual aprobada del período ${this.periodoSeleccionado()}.`,
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
        this.aplicarEstadoPeriodo(nuevoEstado);
        const primero = nuevoEstado.trabajadores[0] ?? null;
        if (primero) void this.verDetalleTrabajador(primero);
      })
      .catch((error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'No se pudieron generar las liquidaciones oficiales.');
      })
      .finally(() => this.generando.set(false));
  }

  ejecutarAccionTrabajador(event: LiquidacionAccionUiEvent): void {
    const estadoActual = this.estadosAccionTrabajador()[event.idLiquidacionTrabajador] ?? 'pendiente_autorizar';
    const estadoSiguiente = siguienteEstadoLiquidacionUi(estadoActual, event.tipo);
    if (estadoSiguiente === estadoActual) return;
    this.estadosAccionTrabajador.update((actual) => ({
      ...actual,
      [event.idLiquidacionTrabajador]: estadoSiguiente,
    }));
    this.feedbackAccionTrabajador.set(this.mensajeAccionTrabajador(estadoSiguiente));
  }

  private aplicarEstadoPeriodo(estado: LiquidacionesEstadoPeriodo): void {
    this.estadoPeriodo.set(estado);
    this.estadosAccionTrabajador.set(inicializarEstadosLiquidacionUi(estado.trabajadores));
    this.feedbackAccionTrabajador.set(null);
  }

  private mensajeAccionTrabajador(estado: LiquidacionAccionUiEstado): string {
    switch (estado) {
      case 'autorizada':
        return 'Liquidación autorizada en esta revisión visual.';
      case 'pago_registrado':
        return 'Pago registrado en el flujo visual de la grilla.';
      case 'documento_enviado':
        return 'Documento marcado como enviado en esta revisión visual.';
      case 'rectificacion_solicitada':
        return 'Rectificación solicitada: corrige desde Nómina mensual o una futura reliquidación antes de emitir una nueva versión.';
      default:
        return 'Flujo visual actualizado.';
    }
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
