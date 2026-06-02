import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import { PageActionsComponent } from '../../../../shared/components/ui/layout/page-actions.component';
import { ParametrosWorkspaceOrquestador } from '../../facade/parametros-workspace.orquestador';

@Component({
  selector: 'app-parametros-workspace-periodo-banda',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent, PageActionsComponent],
  templateUrl: './parametros-workspace-periodo-banda.component.html',
  styleUrls: ['./parametros-workspace-periodo-banda.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ParametrosWorkspacePeriodoBandaComponent {
  readonly ws = inject(ParametrosWorkspaceOrquestador);
}
