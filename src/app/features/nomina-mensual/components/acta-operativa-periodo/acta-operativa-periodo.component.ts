import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BadgeComponent } from '../../../../shared/components/ui/badge.component';
import type {
  ActaOperativaEvidenciaEstado,
  ActaOperativaPeriodoViewModel,
  ActaOperativaTone,
} from '../../models/acta-operativa-periodo.model';

@Component({
  selector: 'app-acta-operativa-periodo',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent],
  templateUrl: './acta-operativa-periodo.component.html',
  styleUrl: './acta-operativa-periodo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActaOperativaPeriodoComponent {
  @Input({ required: true }) vm!: ActaOperativaPeriodoViewModel;
  @Output() prepararActa = new EventEmitter<void>();
  @Output() verEvidencia = new EventEmitter<void>();

  onPrepararActa(): void {
    if (!this.vm.accionDisponible) return;
    this.prepararActa.emit();
  }

  etiquetaEvidencia(estado: ActaOperativaEvidenciaEstado): string {
    switch (estado) {
      case 'revision':
        return 'Revisión';
      case 'pendiente':
        return 'Pendiente';
      case 'incluida':
      default:
        return 'Incluida';
    }
  }

  badgeVariant(tone: ActaOperativaTone): 'success' | 'warning' | 'error' | 'default' | 'info' {
    switch (tone) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'neutral':
      default:
        return 'default';
    }
  }
}
