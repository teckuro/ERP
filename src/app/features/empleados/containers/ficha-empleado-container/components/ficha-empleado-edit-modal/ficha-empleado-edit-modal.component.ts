import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewEncapsulation,
  inject,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FichaEmpleadoEditFormComponent } from '../ficha-empleado-edit-form/ficha-empleado-edit-form.component';
import { FichaEmpleadoPresentacionFacade } from '../../facade/ficha-empleado-presentacion.facade';

@Component({
  selector: 'app-ficha-empleado-edit-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FichaEmpleadoEditFormComponent],
  templateUrl: './ficha-empleado-edit-modal.component.html',
  styleUrls: [
    '../../../../styles/empleado-expediente-tokens.css',
    './ficha-empleado-edit-modal.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ficha-edit-modal-host',
  },
})
export class FichaEmpleadoEditModalComponent {
  readonly blockId = input.required<string>();
  readonly tituloBloque = input.required<string>();
  readonly facade = inject(FichaEmpleadoPresentacionFacade);

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.facade.requestCerrarEdicion();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.facade.requestCerrarEdicion();
  }

  enviarFormulario(): void {
    void this.facade.saveSection();
  }
}
