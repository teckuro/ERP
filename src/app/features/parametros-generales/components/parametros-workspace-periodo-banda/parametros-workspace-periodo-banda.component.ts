import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import { PageActionsComponent } from '../../../../shared/components/ui/page-actions.component';
import { ParametrosWorkspaceOrquestador } from '../../facade/parametros-workspace.orquestador';

@Component({
  selector: 'app-parametros-workspace-periodo-banda',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent, PageActionsComponent],
  templateUrl: './parametros-workspace-periodo-banda.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametrosWorkspacePeriodoBandaComponent {
  readonly ws = inject(ParametrosWorkspaceOrquestador);
}
