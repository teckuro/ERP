import { Injectable, inject, signal } from '@angular/core';

import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import type { CcafMutualSubId } from '../components/tabs/parametros-ccaf-mutuales-tab.component';
import type { ParametrosTabId } from '../models/parametro-general.model';
import type {
  ConfigClienteDraftSource,
  ParametrosDialogState,
} from '../models/parametros-workspace.vm';

@Injectable({ providedIn: 'root' })
export class ParametrosPresentacionFacade {
  private readonly periodoGlobal = inject(PeriodoActivoService);

  readonly activeTab = signal<ParametrosTabId>('configCliente');
  readonly ccafMutualSubTab = signal<CcafMutualSubId>('listaCcaf');
  readonly selectedPeriodo = signal(this.periodoGlobal.periodoYm());
  readonly selectedCcafId = signal<number | null>(null);
  readonly selectedMutualId = signal<number | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingPlantilla = signal(false);
  readonly guardando = signal(false);
  readonly generalesEditando = signal(false);
  readonly datosFormularioListos = signal(false);
  readonly isPreparingEdit = signal(false);
  readonly isPreparandoDialogoCrear = signal(false);
  readonly cargaBloqueadaPorError = signal(false);
  readonly dialogState = signal<ParametrosDialogState | null>(null);
  readonly configDraftSource = signal<ConfigClienteDraftSource>('existente');
  readonly configDraftSourcePeriodo = signal<string | null>(null);

  cerrarDialogo(): void {
    this.dialogState.set(null);
  }

  mostrarDialogo(dialog: ParametrosDialogState): void {
    this.dialogState.set(dialog);
  }

  seleccionarTab(tabId: ParametrosTabId): void {
    this.activeTab.set(tabId);
  }

  seleccionarPeriodo(periodo: string): void {
    this.selectedPeriodo.set(periodo);
  }
}
