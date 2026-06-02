import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  effect,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { ParametrosTabId } from '../../models/parametro-general.model';
import type { ParametrosAreaId } from '../../models/parametros-workspace.vm';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CardComponent, CardContentComponent } from '../../../../shared/components/ui/primitives/card.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { ParametrosWorkspacePeriodoBandaComponent } from '../../components/parametros-workspace-periodo-banda/parametros-workspace-periodo-banda.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { ParametrosWorkspaceTabsPanelComponent } from '../parametros-workspace-tabs-panel/parametros-workspace-tabs-panel.component';
import { ParametrosWorkspaceOrquestador } from '../../facade/parametros-workspace.orquestador';

@Component({
  selector: 'app-parametros-workspace-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ParametrosWorkspaceOrquestador],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MessageBoxComponent,
    CardComponent,
    CardContentComponent,
    ParametrosWorkspacePeriodoBandaComponent,
    ParametrosWorkspaceTabsPanelComponent,
  ],
  templateUrl: './parametros-workspace-container.html',
  styleUrls: ['./parametros-workspace-container.css', './parametros-workspace-container.responsive.css'],
})
export class ParametrosWorkspaceContainer implements OnInit {
  readonly orq = inject(ParametrosWorkspaceOrquestador);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.orq.mostrarCargaInicial();

    bindShellPageContext(inject(DestroyRef), () => ({
      breadcrumbs: [{ label: 'Parámetros' }],
    }));

    effect(() => {
      const g = this.orq.periodoGlobal.periodoYm();
      if (g === this.orq.selectedPeriodo()) {
        return;
      }
      void this.orq.seleccionarPeriodo(g, { fromGlobal: true });
    });
  }

  async ngOnInit(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const periodoQuery = query.get('periodo');
    await this.orq.inicializar(periodoQuery);

    const tabQuery = query.get('tab');
    const areaQuery = query.get('area');

    if (tabQuery && this.orq.tabs.some((tab) => tab.id === tabQuery)) {
      this.orq.seleccionarTab(tabQuery as ParametrosTabId);
      return;
    }

    if (areaQuery && this.orq.areas.some((area) => area.id === areaQuery)) {
      this.orq.seleccionarArea(areaQuery as ParametrosAreaId);
    }
  }
}
