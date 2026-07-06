/**
 * Modal de búsqueda de nómina origen para Liquidaciones (F18c).
 * Delega en el componente compartido de salidas exportables.
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import { SeleccionNominaExportableModalComponent } from '../../../remuneraciones-salidas/components/seleccion-nomina-exportable-modal/seleccion-nomina-exportable-modal.component';
import { PERSISTENCIA_GRILLA_SELECCION_NOMINA_LIQ } from '../../presenters/liquidaciones-oficiales.presenter';

@Component({
  selector: 'app-liquidaciones-modal-seleccion-nomina',
  standalone: true,
  imports: [SeleccionNominaExportableModalComponent],
  templateUrl: './liquidaciones-modal-seleccion-nomina.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiquidacionesModalSeleccionNominaComponent {
  readonly abierto = input(false);
  readonly nominas = input<NominaPeriodoResumen[]>([]);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly nominaSeleccionadaId = input<string | null>(null);

  readonly cerrar = output<void>();
  readonly seleccionar = output<NominaPeriodoResumen>();

  readonly persistenciaKey = PERSISTENCIA_GRILLA_SELECCION_NOMINA_LIQ;

  cerrarModal(): void {
    this.cerrar.emit();
  }

  seleccionarNomina(fila: NominaPeriodoResumen): void {
    this.seleccionar.emit(fila);
  }

  esNominaActiva(fila: NominaPeriodoResumen): boolean {
    const activa = this.nominaSeleccionadaId();
    return !!activa && fila.id === activa;
  }
}
