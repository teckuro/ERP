import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { BancarioComponent } from '../../../../components/secciones/bancario/bancario';
import { ContactoComponent } from '../../../../components/secciones/contacto/contacto';
import { ContratoComponent } from '../../../../components/secciones/contrato/contrato';
import { DatosPersonalesComponent } from '../../../../components/secciones/datos-personales/datos-personales';
import { PerfilLaboralComponent } from '../../../../components/secciones/perfil-laboral/perfil-laboral';
import { PrevisionSaludComponent } from '../../../../components/secciones/prevision-salud/prevision-salud';
import { FichaEmpleadoPresentacionFacade } from '../../facade/ficha-empleado-presentacion.facade';

@Component({
  selector: 'app-ficha-empleado-edit-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatosPersonalesComponent,
    ContactoComponent,
    ContratoComponent,
    PrevisionSaludComponent,
    BancarioComponent,
    PerfilLaboralComponent,
  ],
  templateUrl: './ficha-empleado-edit-form.component.html',
})
export class FichaEmpleadoEditFormComponent {
  readonly blockId = input.required<string>();
  readonly facade = inject(FichaEmpleadoPresentacionFacade);

  componenteEdicion(): ReturnType<FichaEmpleadoPresentacionFacade['editComponentForBlock']> {
    return this.facade.editComponentForBlock(this.blockId());
  }

  bloquesVisibles(): string[] {
    return this.facade.editVisibleBlocks(this.blockId());
  }
}
