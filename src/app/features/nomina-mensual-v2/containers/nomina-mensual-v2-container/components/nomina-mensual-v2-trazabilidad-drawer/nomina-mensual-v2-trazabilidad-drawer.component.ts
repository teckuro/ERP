import { ChangeDetectionStrategy, Component, HostListener, ViewEncapsulation, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { tituloPasoTrazabilidad } from '../../../../mappers/nomina-trazabilidad.mapper';
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

  readonly tituloPaso = tituloPasoTrazabilidad;
  readonly etiquetaIntegridad = etiquetaIntegridadVisible;
  readonly formatoFecha = formatoFechaTrazabilidad;

  cerrar(): void {
    this.orquestador.cerrarTrazabilidadCompleta();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    if (this.orquestador.trazabilidadDrawerAbierto()) {
      this.cerrar();
    }
  }

  abrirDetallePaso(paso: Parameters<typeof tituloPasoTrazabilidad>[0]): void {
    this.orquestador.cerrarTrazabilidadCompleta();
    this.orquestador.abrirTrazabilidadPaso(paso);
  }
}
