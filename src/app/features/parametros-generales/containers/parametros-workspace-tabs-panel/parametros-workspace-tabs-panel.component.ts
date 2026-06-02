import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import type { ParametrosTabId } from '../../models/parametro-general.model';
import type { ParametrosAreaId } from '../../models/parametros-workspace.vm';

import { ParametrosAfpTabComponent } from '../../components/tabs/parametros-afp-tab.component';
import { ParametrosCcafMutualesTabComponent } from '../../components/tabs/parametros-ccaf-mutuales-tab.component';
import { ParametrosConfigClienteTabComponent } from '../../components/tabs/parametros-config-cliente-tab.component';
import { ParametrosReformaTabComponent } from '../../components/tabs/parametros-reforma-tab.component';
import { ParametrosRemuneracionesTabComponent } from '../../components/tabs/parametros-remuneraciones-tab.component';
import { ParametrosSaludTabComponent } from '../../components/tabs/parametros-salud-tab.component';
import { ParametrosTramosCargaTabComponent } from '../../components/tabs/parametros-tramos-carga-tab.component';
import { ParametrosTramosRentaTabComponent } from '../../components/tabs/parametros-tramos-renta-tab.component';
import { ParametrosValoresTabComponent } from '../../components/tabs/parametros-valores-tab.component';
import { TooltipComponent } from '../../../../shared/components/ui/tooltip/tooltip.component';
import { etiquetaTabParametros } from '../../utils/parametros-workspace-tabs.presenter';
import { ParametrosWorkspaceOrquestador } from '../../facade/parametros-workspace.orquestador';

@Component({
  selector: 'app-parametros-workspace-tabs-panel',
  standalone: true,
  imports: [
    CommonModule,
    ParametrosValoresTabComponent,
    ParametrosConfigClienteTabComponent,
    ParametrosRemuneracionesTabComponent,
    ParametrosCcafMutualesTabComponent,
    ParametrosTramosCargaTabComponent,
    ParametrosTramosRentaTabComponent,
    ParametrosSaludTabComponent,
    ParametrosAfpTabComponent,
    ParametrosReformaTabComponent,
    TooltipComponent,
  ],
  templateUrl: './parametros-workspace-tabs-panel.component.html',
  styleUrls: ['./parametros-workspace-tabs-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ParametrosWorkspaceTabsPanelComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly ws = inject(ParametrosWorkspaceOrquestador);
  readonly etiquetaTab = etiquetaTabParametros;
  private scrollRafId: number | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.scrollRafId !== null) {
        window.cancelAnimationFrame(this.scrollRafId);
        this.scrollRafId = null;
      }
    });
  }

  seleccionarArea(areaId: ParametrosAreaId): void {
    this.ws.seleccionarArea(areaId);
    this.scrollActive('nav.parametros-area-tabs button.parametros-area-tab--active');
  }

  seleccionarTab(tabId: ParametrosTabId): void {
    this.ws.seleccionarTab(tabId);
    this.scrollActive('nav.parametros-subtabs button.parametros-subtab--active');
  }

  private scrollActive(selector: string): void {
    if (this.scrollRafId !== null) {
      window.cancelAnimationFrame(this.scrollRafId);
    }
    this.scrollRafId = window.requestAnimationFrame(() => {
      this.scrollRafId = null;
      const root = this.hostElement.nativeElement;
      const active = root.querySelector<HTMLElement>(selector);
      active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  }
}
