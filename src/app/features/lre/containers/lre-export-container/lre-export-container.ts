import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { etiquetaPeriodoDesdeYm } from '../../../../core/services/periodo-activo.service';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import type { LreBorradorExport } from '../../models/lre-export.model';
import {
  COLUMNAS_LRE_EXPORT,
  PERSISTENCIA_GRILLA_LRE_EXPORT,
} from '../../presenters/lre-export.presenter';
import { descargarCsvLre, puedeDescargarLre } from '../../rules/lre-export.rules';
import { LreExportService } from '../../services/lre-export.service';
import { SeleccionNominaExportableModalComponent } from '../../../remuneraciones-salidas/components/seleccion-nomina-exportable-modal/seleccion-nomina-exportable-modal.component';
import {
  PERSISTENCIA_SELECCION_NOMINA_LRE,
  construirContextoOrigenSalidaExterna,
  etiquetaNominaActivaSalidaExport,
  rutaLiquidacionesNomina,
} from '../../../remuneraciones-salidas/presenters/salida-externa-layout.presenter';
import { construirEmptySalidaExterna } from '../../../remuneraciones-salidas/rules/salida-externa-vacio.rules';

@Component({
  selector: 'app-lre-export-container',
  standalone: true,
  host: { class: 'sal-ext-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    DataGridComponent,
    SeleccionNominaExportableModalComponent,
  ],
  templateUrl: './lre-export-container.html',
  styleUrls: [
    './lre-export-container.css',
    '../../../remuneraciones-salidas/remuneraciones-salida-layout.css',
  ],
})
export class LreExportContainer {
  private readonly service = inject(LreExportService);

  readonly nominas = signal<readonly NominaPeriodoResumen[]>([]);
  readonly nominaId = signal<string | null>(null);
  readonly borrador = signal<LreBorradorExport | null>(null);
  readonly cargandoNominas = signal(false);
  readonly cargandoBorrador = signal(false);
  readonly error = signal<string | null>(null);
  readonly modalNominaAbierto = signal(false);

  readonly columnas = COLUMNAS_LRE_EXPORT;
  readonly persistenciaGrilla = PERSISTENCIA_GRILLA_LRE_EXPORT;
  readonly persistenciaSeleccionNomina = PERSISTENCIA_SELECCION_NOMINA_LRE;
  readonly etiquetaPeriodoDesdeYm = etiquetaPeriodoDesdeYm;

  readonly etiquetaNominaActiva = computed(() =>
    etiquetaNominaActivaSalidaExport(this.nominas(), this.nominaId()),
  );

  readonly nominasParaModal = computed(() => [...this.nominas()]);

  readonly nominaActiva = computed(() => {
    const id = this.nominaId();
    if (!id) return null;
    return this.nominas().find((n) => n.id === id) ?? null;
  });

  readonly contextoOrigen = computed(() => {
    const borrador = this.borrador();
    if (!borrador) return null;
    return construirContextoOrigenSalidaExterna({
      borrador: {
        periodo: borrador.periodo,
        empresaNombre: borrador.empresaNombre,
        versionLiquidacion: borrador.versionLiquidacion,
        totalTrabajadores: borrador.totalTrabajadores,
        lineasCount: borrador.lineas.length,
      },
      nomina: this.nominaActiva(),
    });
  });

  readonly rutaLiquidaciones = computed(() => rutaLiquidacionesNomina(this.nominaId()));

  readonly puedeDescargar = computed(() => puedeDescargarLre(this.borrador()));

  readonly cargaInicial = computed(
    () => this.cargandoNominas() || (this.cargandoBorrador() && !this.borrador()),
  );
  readonly cargaBorradorOverlay = computed(
    () => this.cargandoBorrador() && !!this.borrador(),
  );

  readonly emptyVm = computed(() => construirEmptySalidaExterna('lre'));

  readonly mostrarToolbar = computed(
    () => !this.cargaInicial() && !this.error() && this.nominas().length > 0,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    bindShellPageContext(
      destroyRef,
      () => {
        const borrador = this.borrador();
        return {
          breadcrumbs: [
            { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
            { label: 'Libro de remuneraciones' },
          ],
          statusChip: this.cargandoBorrador()
            ? { label: 'Cargando…', tone: 'neutral' }
            : borrador
              ? {
                  label: borrador.listoParaEnvio
                    ? 'Listo para envío'
                    : `${borrador.lineas.length} línea(s)`,
                  tone: borrador.listoParaEnvio ? 'success' : 'warning',
                }
              : this.nominas().length === 0
                ? { label: this.emptyVm().chipLabel, tone: 'neutral' }
                : { label: 'Sin nómina', tone: 'neutral' },
          primaryAction: this.puedeDescargar()
            ? {
                label: 'Descargar CSV LRE',
                actionId: 'lre:descargar-csv',
                disabled: this.cargandoBorrador(),
              }
            : undefined,
        };
      },
      { onPrimaryAction: () => this.descargar() },
    );

    void this.cargarNominas();
  }

  abrirModalNomina(): void {
    this.modalNominaAbierto.set(true);
  }

  cerrarModalNomina(): void {
    this.modalNominaAbierto.set(false);
  }

  onNominaSeleccionadaEnModal(nomina: NominaPeriodoResumen): void {
    this.modalNominaAbierto.set(false);
    if (nomina.id !== this.nominaId()) {
      void this.onNominaChange(nomina.id);
    }
  }

  async cargarNominas(): Promise<void> {
    this.cargandoNominas.set(true);
    this.error.set(null);
    try {
      const nominas = await this.service.listarNominasExportables();
      this.nominas.set(nominas);
      if (nominas.length > 0 && !this.nominaId()) {
        this.nominaId.set(nominas[0].id);
        await this.cargarBorrador(nominas[0].id);
      }
    } catch (err) {
      this.error.set(
        mensajeErrorSupabaseParaUsuario(err, 'cargar las nóminas exportables'),
      );
    } finally {
      this.cargandoNominas.set(false);
    }
  }

  async onNominaChange(id: string): Promise<void> {
    this.nominaId.set(id);
    await this.cargarBorrador(id);
  }

  reintentarCarga(): void {
    const id = this.nominaId();
    if (id && this.nominas().length > 0) {
      void this.cargarBorrador(id);
      return;
    }
    void this.cargarNominas();
  }

  async recargarBorrador(): Promise<void> {
    const id = this.nominaId();
    if (!id) return;
    await this.cargarBorrador(id, { preserveBorrador: true });
  }

  descargar(): void {
    const borrador = this.borrador();
    if (borrador && this.puedeDescargar()) {
      descargarCsvLre(borrador);
    }
  }

  private async cargarBorrador(
    id: string,
    opts?: { preserveBorrador?: boolean },
  ): Promise<void> {
    this.cargandoBorrador.set(true);
    this.error.set(null);
    if (!opts?.preserveBorrador) {
      this.borrador.set(null);
    }
    try {
      const borrador = await this.service.construirBorradorDesdeNomina(id);
      if (!borrador) {
        this.error.set(
          'No hay liquidación oficial disponible para la nómina seleccionada. Genere liquidaciones antes de exportar.',
        );
        return;
      }
      this.borrador.set(borrador);
    } catch (err) {
      this.error.set(
        mensajeErrorSupabaseParaUsuario(err, 'preparar el borrador del libro de remuneraciones'),
      );
    } finally {
      this.cargandoBorrador.set(false);
    }
  }
}
