/**
 * Administrador de Plantillas de ciclos.
 *
 * Pantalla rectora de F03 (`NOM-ADMIN-OPS-F03`). Lista las plantillas de la
 * empresa activa, permite crear nuevas, editar (versionar), activar/desactivar
 * y previsualizar cortes proyectados a un año dado.
 *
 * Documento rector:
 *   `docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md` §F03.
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { DataGridCellDirective } from '../../../../shared/components/ui/data-grid/data-grid.directives';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import { NominaPlantillaCicloService } from '../../services/nomina-plantilla-ciclo.service';
import type { NominaPlantillaCiclo } from '../../models/nomina-plantilla-ciclo.models';
import {
  describirPoliticaFinSemana,
  describirReglaFechaPago,
} from '../../models/nomina-plantilla-ciclo.models';
import {
  COLUMNAS_ADMIN_PLANTILLAS,
  PERSISTENCIA_GRILLA_PLANTILLAS,
  crearFiltrosAdminPlantillas,
  estadoActivoToLabel,
  naturalezaPlantillaToLabel,
  ordenarPlantillasOperativas,
  tipoPlantillaToLabel,
} from '../../presenters/admin-plantillas.presenter';
import { AdminPlantillasModalEditorComponent } from './components/admin-plantillas-modal-editor/admin-plantillas-modal-editor.component';
import { AdminPlantillasModalPreviewComponent } from './components/admin-plantillas-modal-preview/admin-plantillas-modal-preview.component';

type AccionEliminar = { plantilla: NominaPlantillaCiclo };

@Component({
  selector: 'app-administrador-plantillas-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    AdminPlantillasModalEditorComponent,
    AdminPlantillasModalPreviewComponent,
  ],
  templateUrl: './administrador-plantillas-container.html',
  styleUrl: './administrador-plantillas-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministradorPlantillasContainer {
  private readonly servicio = inject(NominaPlantillaCicloService);
  private readonly destroyRef = inject(DestroyRef);

  readonly plantillas = this.servicio.plantillas;
  readonly cargandoServicio = this.servicio.cargando;
  readonly errorServicio = this.servicio.error;

  readonly modoEditor = signal<'crear' | 'editar' | null>(null);
  readonly plantillaEnEdicion = signal<NominaPlantillaCiclo | null>(null);
  readonly plantillaPreview = signal<NominaPlantillaCiclo | null>(null);
  readonly eliminarPendiente = signal<AccionEliminar | null>(null);
  readonly ejecutandoAccion = signal(false);
  readonly errorAccion = signal<string | null>(null);

  readonly columnas = COLUMNAS_ADMIN_PLANTILLAS;
  readonly persistenceKey = PERSISTENCIA_GRILLA_PLANTILLAS;

  readonly filtros = computed(() => crearFiltrosAdminPlantillas(this.plantillas()));
  readonly plantillasOrdenadas = computed(() => ordenarPlantillasOperativas(this.plantillas()));

  readonly subtitulo = computed(() => {
    const total = this.plantillas().length;
    if (total === 0) {
      return 'Aún no se han definido plantillas para esta empresa.';
    }
    const activas = this.plantillas().filter((p) => p.activo).length;
    const partes: string[] = [];
    partes.push(`${total} plantilla${total === 1 ? '' : 's'} registrada${total === 1 ? '' : 's'}`);
    partes.push(`${activas} activa${activas === 1 ? '' : 's'}`);
    return `${partes.join(' · ')}.`;
  });

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => this.abrirCrear(),
    });
    void this.servicio.refrescar();
  }

  private computeShellContext(): ShellPageContext {
    return {
      breadcrumbs: [
        { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
        { label: 'Plantillas de ciclos' },
      ],
      pageTitle: 'Plantillas de ciclos',
      pageSubtitle: this.subtitulo(),
      primaryAction: {
        label: 'Nueva plantilla',
        disabled: this.cargandoServicio(),
        loading: false,
        actionId: 'admin-plantillas-nueva',
      },
    };
  }

  readonly trackPlantilla = (_index: number, fila: NominaPlantillaCiclo): string => fila.id;

  tipoLabel = tipoPlantillaToLabel;
  naturalezaLabel = naturalezaPlantillaToLabel;
  estadoLabel = estadoActivoToLabel;
  reglaFechaPagoLabel = describirReglaFechaPago;
  politicaFdsLabel = describirPoliticaFinSemana;

  abrirCrear(): void {
    this.plantillaEnEdicion.set(null);
    this.modoEditor.set('crear');
  }

  abrirEditar(plantilla: NominaPlantillaCiclo): void {
    this.plantillaEnEdicion.set(plantilla);
    this.modoEditor.set('editar');
  }

  cerrarEditor(): void {
    this.modoEditor.set(null);
    this.plantillaEnEdicion.set(null);
  }

  onPlantillaGuardada(_plantilla: NominaPlantillaCiclo): void {
    this.cerrarEditor();
  }

  abrirPreview(plantilla: NominaPlantillaCiclo): void {
    this.plantillaPreview.set(plantilla);
  }

  cerrarPreview(): void {
    this.plantillaPreview.set(null);
  }

  async alternarActivo(plantilla: NominaPlantillaCiclo): Promise<void> {
    this.ejecutandoAccion.set(true);
    this.errorAccion.set(null);
    try {
      if (plantilla.activo) {
        await this.servicio.desactivar(plantilla.id);
      } else {
        await this.servicio.reactivar(plantilla.id);
      }
    } catch (err) {
      this.errorAccion.set(
        err instanceof Error ? err.message : 'No fue posible cambiar el estado de la plantilla.',
      );
    } finally {
      this.ejecutandoAccion.set(false);
    }
  }

  solicitarEliminar(plantilla: NominaPlantillaCiclo): void {
    if (plantilla.activo) {
      this.errorAccion.set('Desactiva la plantilla antes de eliminarla.');
      return;
    }
    this.eliminarPendiente.set({ plantilla });
  }

  cancelarEliminar(): void {
    this.eliminarPendiente.set(null);
    this.errorAccion.set(null);
  }

  async confirmarEliminar(): Promise<void> {
    const accion = this.eliminarPendiente();
    if (!accion) return;
    this.ejecutandoAccion.set(true);
    this.errorAccion.set(null);
    try {
      await this.servicio.eliminarInactiva(accion.plantilla.id);
      this.eliminarPendiente.set(null);
    } catch (err) {
      this.errorAccion.set(
        err instanceof Error ? err.message : 'No fue posible eliminar la plantilla.',
      );
    } finally {
      this.ejecutandoAccion.set(false);
    }
  }

  reintentar(): void {
    void this.servicio.refrescar();
  }
}
