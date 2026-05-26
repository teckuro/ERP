import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, RefreshCw } from 'lucide-angular/src/icons';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import { EmpresasService } from '../../services/empresas.service';
import type { EmpresaListadoFila } from '../../models/empresa.model';
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
    ButtonComponent,
  ],
  templateUrl: './listado-empresas-container.html',
  styleUrl: './listado-empresas-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoEmpresasContainer implements OnInit {
  private readonly empresasService = inject(EmpresasService);
  private readonly router = inject(Router);

  readonly refreshIcon = RefreshCw;
  readonly plusIcon = Plus;

  readonly filas = signal<EmpresaListadoFila[]>([]);
  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly columns = EMPRESA_GRID_COLUMNS;
  readonly filters = EMPRESA_GRID_FILTERS;
  readonly persistenceKey = EMPRESA_GRID_PERSISTENCE_KEY;

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError.set(null);
    try {
      this.filas.set(await this.empresasService.listar());
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No se pudo cargar el listado de empresas.');
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
