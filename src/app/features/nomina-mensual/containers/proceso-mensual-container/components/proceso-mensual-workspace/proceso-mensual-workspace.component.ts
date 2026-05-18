import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './proceso-mensual-workspace.component.html',
  styleUrl: '../../proceso-mensual-container.css',
})
export class ProcesoMensualWorkspaceComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
}
