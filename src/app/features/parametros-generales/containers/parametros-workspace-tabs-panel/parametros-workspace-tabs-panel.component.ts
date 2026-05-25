import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ParametrosAfpTabComponent } from '../../components/tabs/parametros-afp-tab.component';
import { ParametrosCcafMutualesTabComponent } from '../../components/tabs/parametros-ccaf-mutuales-tab.component';
import { ParametrosConfigClienteTabComponent } from '../../components/tabs/parametros-config-cliente-tab.component';
import { ParametrosReformaTabComponent } from '../../components/tabs/parametros-reforma-tab.component';
import { ParametrosRemuneracionesTabComponent } from '../../components/tabs/parametros-remuneraciones-tab.component';
import { ParametrosSaludTabComponent } from '../../components/tabs/parametros-salud-tab.component';
import { ParametrosTramosCargaTabComponent } from '../../components/tabs/parametros-tramos-carga-tab.component';
import { ParametrosTramosRentaTabComponent } from '../../components/tabs/parametros-tramos-renta-tab.component';
import { ParametrosValoresTabComponent } from '../../components/tabs/parametros-valores-tab.component';
import { etiquetaTabParametros } from '../../utils/parametros-workspace-tabs.presenter';
import { ParametrosWorkspaceContainer } from '../parametros-workspace-container/parametros-workspace-container';

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
  ],
  templateUrl: './parametros-workspace-tabs-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametrosWorkspaceTabsPanelComponent {
  readonly ws = inject(ParametrosWorkspaceContainer);
  readonly etiquetaTab = etiquetaTabParametros;
}
