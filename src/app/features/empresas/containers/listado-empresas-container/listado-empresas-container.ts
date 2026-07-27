/**
 * Listado de empresas.
 *
 * Pantalla operativa (uso interno: configuración del producto, no de cara al
 * cliente final). El shell publica título + breadcrumb; el CTA principal vive
 * en la toolbar de la grilla (`primaryActionLabel`).
 *
 * Alineada con `administrador-nominas`.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import type { EmpresaListadoFila } from '../../models/empresa.model';
import { EmpresasService } from '../../services/empresas.service';
import {
  EMPRESA_GRID_COLUMNS,
  EMPRESA_GRID_FILTERS,
  EMPRESA_GRID_PERSISTENCE_KEY,
} from '../../utils/empresa-grid.config';

@Component({
  selector: 'app-listado-empresas-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
  ],
  templateUrl: './listado-empresas-container.html',
  styleUrl: './listado-empresas-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoEmpresasContainer implements OnInit {
  private readonly empresasService = inject(EmpresasService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly filas = signal<EmpresaListadoFila[]>([]);
  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly columns = EMPRESA_GRID_COLUMNS;
  readonly filters = EMPRESA_GRID_FILTERS;
  readonly persistenceKey = EMPRESA_GRID_PERSISTENCE_KEY;

  readonly subtitulo = computed(() => {
    const total = this.filas().length;
    if (total === 0) {
      return 'Aún no hay empresas registradas en el sistema.';
    }
    return `${total} empresa${total === 1 ? '' : 's'} registrada${total === 1 ? '' : 's'}.`;
  });

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext());
  }

  ngOnInit(): void {
    void this.cargar();
  }

  private computeShellContext(): ShellPageContext {
    return {
      breadcrumbs: [{ label: 'Empresas' }],
      pageTitle: 'Empresas',
      pageSubtitle: this.subtitulo(),
    };
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError.set(null);
    try {
      this.filas.set(await this.empresasService.listar());
    } catch (error) {
      this.mensajeError.set(
        mensajeErrorSupabaseParaUsuario(error, 'cargar el listado de empresas'),
      );
    } finally {
      this.cargando.set(false);
    }
  }

  irNuevaEmpresa(): void {
    void this.router.navigate(['/empresas/nueva']);
  }

  revisarEmpresa(row: EmpresaListadoFila): void {
    void this.router.navigate(['/empresas', row.idEmpresa]);
  }

  trackEmpresa(_index: number, row: EmpresaListadoFila): number {
    return row.idEmpresa;
  }
}
