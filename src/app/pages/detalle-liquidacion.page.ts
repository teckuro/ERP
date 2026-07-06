import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { mensajeErrorSupabaseParaUsuario } from '../core/errors/erp-supabase-user-message';
import { WorkspaceLoadingComponent } from '../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { MessageBoxComponent } from '../shared/components/ui/feedback/message-box/message-box.component';
import { LiquidacionDetallePanelComponent } from '../features/liquidaciones-oficiales/components/liquidacion-detalle-panel/liquidacion-detalle-panel';
import { LiquidacionPreviewModalComponent } from '../features/nomina-mensual-v2/components/liquidacion-preview-modal/liquidacion-preview-modal.component';
import { LiquidacionesOficialesService } from '../features/liquidaciones-oficiales/services/liquidaciones-oficiales.service';
import { NominaPeriodoService } from '../features/nomina-mensual/services/nomina-periodo.service';
import type { EstadoNomina } from '../features/nomina-mensual/models/nomina-periodo.models';
import type { LiquidacionConcepto, LiquidacionEmision, LiquidacionTrabajador } from '../features/liquidaciones-oficiales/models/liquidacion-oficial.model';
import type { LiquidacionCalculada } from '../features/nomina-mensual/models/proceso-mensual.model';
import {
  buildLiquidacionAccionUiView,
  estadoInicialLiquidacionUi,
  siguienteEstadoLiquidacionUi,
  type LiquidacionAccionUiAction,
  type LiquidacionAccionUiEstado,
} from '../features/liquidaciones-oficiales/rules/liquidaciones-acciones-ui.rules';
import { mapLiquidacionOficialAPreview } from '../features/liquidaciones-oficiales/rules/liquidaciones-preview.mapper';
import { esLiquidacionesSoloLectura } from '../features/nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';
import { bindShellPageContext } from '../layout/shell-page-context.binding';

function etiquetaCanalEmision(canal: LiquidacionEmision['canal']): string {
  return canal === 'impresion_navegador' ? 'Impresión' : 'Vista oficial';
}

@Component({
  selector: 'app-detalle-liquidacion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    WorkspaceLoadingComponent,
    MessageBoxComponent,
    LiquidacionDetallePanelComponent,
    LiquidacionPreviewModalComponent,
  ],
  template: `
    <section class="liq-det-page" aria-label="Detalle de liquidación">
      <header class="liq-det-page__head">
        <div>
          <p class="liq-det-page__eyebrow">Liquidación por trabajador</p>
          <h1>{{ trabajador()?.nombreTrabajador || 'Detalle de liquidación' }}</h1>
          @if (periodoLabel(); as periodo) {
            <p class="liq-det-page__meta">{{ periodo }}</p>
          }
        </div>
        <a class="liq-det-page__back" [routerLink]="rutaListado()" [queryParams]="queryListado()">
          <lucide-icon name="arrow-left" aria-hidden="true"></lucide-icon>
          Volver a liquidaciones
        </a>
      </header>

      @if (cargando()) {
        <app-workspace-loading
          [fill]="true"
          title="Cargando liquidación"
          message="Estamos consultando el comprobante del trabajador."
        />
      } @else if (error(); as mensaje) {
        <app-message-box
          variant="danger"
          title="No se pudo cargar"
          [message]="mensaje"
          primaryLabel="Volver a liquidaciones"
          (action)="volverListado()"
        />
      } @else if (trabajador(); as fila) {
        @if (soloLectura()) {
          <app-message-box
            variant="info"
            title="Solo consulta"
            message="La nómina está cerrada o anulada. Puede revisar e imprimir, pero no modificar estados."
          />
        }

        @if (ultimaEmision(); as emision) {
          <p class="liq-det-page__emision" role="status">
            Última visualización: {{ etiquetaCanalEmision(emision.canal) }} ·
            {{ formatearFecha(emision.emitidoEn) }}
          </p>
        }

        <div class="liq-det-page__actions">
          @if (accionView().primaryAction; as primary) {
            <button type="button" class="liq-det-page__btn is-primary" (click)="ejecutarAccion(primary)">
              {{ primary.label }}
            </button>
          }
          <button type="button" class="liq-det-page__btn" (click)="abrirPreview()">
            Ver e imprimir
          </button>
        </div>

        <app-liquidacion-detalle-panel
          [trabajador]="fila"
          [conceptos]="conceptos()"
          [estadoTrabajador]="estadoTrabajadorUi()"
        />
      }

      @if (previewLiquidacion(); as liqPdf) {
        <app-liquidacion-preview-modal
          modoEmision="oficial"
          [liquidacion]="liqPdf"
          [empresa]="{
            razonSocial: empresaNombre() || 'Empleador',
            rut: null,
            direccion: null,
          }"
          [nomina]="{
            periodo: periodoLabel() || liqPdf.periodo,
            fechaPago: null,
          }"
          [trabajadorMeta]="{
            cargo: trabajador()?.cargo,
            diasTrabajados: trabajador()?.diasTrabajados,
          }"
          (cerrar)="cerrarPreview()"
          (imprimirSolicitado)="imprimirPreview()"
        ></app-liquidacion-preview-modal>
      }
    </section>
  `,
  styles: [
    `
      .liq-det-page {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 12px;
        min-height: 0;
        padding: 12px 16px;
        overflow: auto;
      }
      .liq-det-page__head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .liq-det-page__eyebrow {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #64748b;
      }
      .liq-det-page__head h1 {
        margin: 4px 0 0;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
      }
      .liq-det-page__meta {
        margin: 4px 0 0;
        font-size: 13px;
        color: #64748b;
      }
      .liq-det-page__back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #1e3a8a;
        text-decoration: none;
      }
      .liq-det-page__emision {
        margin: 0;
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #f8fafc;
        font-size: 12px;
        color: #475569;
      }
      .liq-det-page__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .liq-det-page__btn {
        padding: 7px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        background: #fff;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .liq-det-page__btn.is-primary {
        border-color: #1e3a8a;
        background: #1e3a8a;
        color: #fff;
      }
    `,
  ],
})
export class DetalleLiquidacionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(LiquidacionesOficialesService);
  private readonly nominaService = inject(NominaPeriodoService);

  readonly etiquetaCanalEmision = etiquetaCanalEmision;

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly trabajador = signal<LiquidacionTrabajador | null>(null);
  readonly conceptos = signal<LiquidacionConcepto[]>([]);
  readonly ultimaEmision = signal<LiquidacionEmision | null>(null);
  readonly estadoRevision = signal<LiquidacionAccionUiEstado>('pendiente_autorizar');
  readonly empresaNombre = signal<string | null>(null);
  readonly periodoNomina = signal<string | null>(null);
  readonly previewLiquidacion = signal<LiquidacionCalculada | null>(null);

  readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });
  readonly idTrabajador = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly soloLectura = computed(() => {
    const estado = this.nominaEstado();
    return estado != null && esLiquidacionesSoloLectura(estado);
  });

  readonly nominaEstado = signal<EstadoNomina | null>(null);

  readonly accionView = computed(() =>
    buildLiquidacionAccionUiView(this.estadoRevision(), { soloLectura: this.soloLectura() }),
  );

  readonly estadoTrabajadorUi = computed(() => {
    const view = this.accionView();
    return { label: view.estadoLabel, tono: view.estadoTone };
  });

  readonly periodoLabel = computed(() => {
    const periodo = this.periodoNomina();
    const empresa = this.empresaNombre();
    if (periodo && empresa) return `${empresa} · ${periodo}`;
    return periodo;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    bindShellPageContext(
      destroyRef,
      () => ({
        breadcrumbs: [
          { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
          { label: 'Liquidaciones', path: '/remuneraciones/liquidaciones' },
          { label: this.trabajador()?.nombreTrabajador ?? 'Detalle' },
        ],
      }),
    );

    void this.cargar();
  }

  rutaListado(): string {
    return '/remuneraciones/liquidaciones';
  }

  queryListado(): Record<string, string> {
    const params = this.queryParams() as Record<string, unknown>;
    const nominaPeriodoId = params['nominaPeriodoId'];
    return typeof nominaPeriodoId === 'string' && nominaPeriodoId.trim()
      ? { nominaPeriodoId: nominaPeriodoId.trim() }
      : {};
  }

  volverListado(): void {
    void this.router.navigate([this.rutaListado()], { queryParams: this.queryListado() });
  }

  formatearFecha(value: string): string {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  private async cargar(): Promise<void> {
    const raw = this.idTrabajador().get('id');
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('La liquidación solicitada no es válida.');
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    try {
      const [trabajador, conceptos, emision] = await Promise.all([
        this.service.obtenerTrabajadorLiquidacion(id),
        this.service.obtenerDetalleTrabajador(id),
        this.service.obtenerUltimaEmisionTrabajador(id).catch(() => null),
      ]);
      if (!trabajador) {
        this.error.set('No encontramos la liquidación del trabajador.');
        return;
      }
      this.trabajador.set(trabajador);
      this.conceptos.set(conceptos);
      this.ultimaEmision.set(emision);
      this.estadoRevision.set(estadoInicialLiquidacionUi(trabajador));

      const params = this.queryParams() as Record<string, unknown>;
      const nominaId = typeof params['nominaPeriodoId'] === 'string' ? params['nominaPeriodoId'] : null;
      if (nominaId) {
        const nomina = await this.nominaService.obtenerNomina(nominaId);
        this.empresaNombre.set(nomina?.empresaNombre ?? null);
        this.periodoNomina.set(nomina?.periodo ?? null);
        this.nominaEstado.set(nomina?.estado ?? null);
      }
    } catch (err) {
      this.error.set(mensajeErrorSupabaseParaUsuario(err, 'cargar el detalle de la liquidación'));
    } finally {
      this.cargando.set(false);
    }
  }

  ejecutarAccion(action: LiquidacionAccionUiAction): void {
    if (this.soloLectura()) return;
    const trabajador = this.trabajador();
    if (!trabajador) return;
    const siguiente = siguienteEstadoLiquidacionUi(this.estadoRevision(), action.tipo);
    if (siguiente === this.estadoRevision()) return;
    this.estadoRevision.set(siguiente);
    void this.service.guardarEstadoRevisionTrabajador(trabajador.idLiquidacionTrabajador, siguiente).catch(() => {
      this.error.set('No se pudo guardar el estado. Intente nuevamente.');
    });
  }

  async abrirPreview(): Promise<void> {
    const trabajador = this.trabajador();
    if (!trabajador) return;
    let conceptos = this.conceptos();
    if (!conceptos.length) {
      conceptos = await this.service.obtenerDetalleTrabajador(trabajador.idLiquidacionTrabajador);
      this.conceptos.set(conceptos);
    }
    if (!conceptos.length) {
      this.error.set('No hay conceptos materializados para mostrar la liquidación.');
      return;
    }
    const periodo = this.periodoNomina() ?? '—';
    this.previewLiquidacion.set(mapLiquidacionOficialAPreview({ trabajador, conceptos, periodo }));
    void this.service.registrarEmisionLiquidacionTrabajador(trabajador.idLiquidacionTrabajador, 'vista_oficial')
      .then((emision) => this.ultimaEmision.set(emision))
      .catch(() => undefined);
  }

  cerrarPreview(): void {
    this.previewLiquidacion.set(null);
  }

  imprimirPreview(): void {
    const trabajador = this.trabajador();
    if (trabajador) {
      void this.service.registrarEmisionLiquidacionTrabajador(trabajador.idLiquidacionTrabajador, 'impresion_navegador')
        .then((emision) => this.ultimaEmision.set(emision))
        .catch(() => undefined);
    }
    if (typeof window !== 'undefined') window.print();
  }
}
