import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AsistentePreguntorError,
  AsistentePreguntorService,
} from '../../../../core/services/asistente-preguntor.service';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';

@Component({
  selector: 'app-preguntor-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent, WorkspaceLoadingComponent],
  templateUrl: './preguntor-container.component.html',
  styleUrl: './preguntor-container.component.css',
})
export class PreguntorContainerComponent {
  private readonly asistente = inject(AsistentePreguntorService);

  preguntaTexto = '';
  readonly respuesta = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly cargando = signal(false);

  constructor() {
    bindShellPageContext(inject(DestroyRef), () => ({
      breadcrumbs: [{ label: 'Preguntor' }],
      primaryAction: {
        label: 'Preguntar',
        actionId: 'preguntor:enviar',
        disabled: this.cargando() || !this.preguntaTexto.trim(),
      },
    }), {
      onPrimaryAction: () => {
        void this.enviar();
      },
    });
  }

  async enviar(): Promise<void> {
    if (this.cargando()) return;

    this.cargando.set(true);
    this.error.set(null);
    this.respuesta.set(null);

    try {
      const texto = await this.asistente.consultar(this.preguntaTexto);
      this.respuesta.set(texto);
    } catch (err) {
      const mensaje =
        err instanceof AsistentePreguntorError
          ? err.message
          : 'No se pudo completar la consulta.';
      this.error.set(mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  limpiar(): void {
    this.preguntaTexto = '';
    this.respuesta.set(null);
    this.error.set(null);
  }
}
