import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  ViewEncapsulation,
  effect,
  inject,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import { tituloPasoTrazabilidad } from '../../../../mappers/nomina-trazabilidad.mapper';
import type { TipoModalDetallePasoNomina } from '../../facade/nomina-mensual-v2-orquestador.port';
import {
  etiquetaIntegridadVisible,
  formatoFechaTrazabilidad,
} from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

@Component({
  selector: 'app-nomina-mensual-v2-trazabilidad-drawer',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './nomina-mensual-v2-trazabilidad-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2TrazabilidadDrawerComponent {
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly destroyRef = inject(DestroyRef);

  readonly tituloPaso = tituloPasoTrazabilidad;
  readonly etiquetaIntegridad = etiquetaIntegridadVisible;
  readonly formatoFecha = formatoFechaTrazabilidad;

  constructor() {
    effect(() => {
      const abierto = this.orquestador.trazabilidadDrawerAbierto();
      document.body.classList.toggle('nmv2-trazabilidad-scroll-lock', abierto);
    });
    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('nmv2-trazabilidad-scroll-lock');
    });
  }

  cerrar(): void {
    this.orquestador.cerrarTrazabilidadCompleta();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    if (this.orquestador.trazabilidadDrawerAbierto()) {
      this.cerrar();
    }
  }

  abrirDetallePaso(paso: PayrollStepId, tipo: TipoModalDetallePasoNomina = 'history'): void {
    this.orquestador.cerrarTrazabilidadCompleta();
    this.orquestador.abrirTrazabilidadPaso(paso, tipo);
  }
}
