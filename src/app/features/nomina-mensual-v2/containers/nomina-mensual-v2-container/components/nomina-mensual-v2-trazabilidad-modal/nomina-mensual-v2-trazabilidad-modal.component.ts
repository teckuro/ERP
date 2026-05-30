import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../../../shared/components/ui/feedback/message-box/message-box.types';
import {
  etiquetaIntegridadVisible,
  formatoFechaTrazabilidad,
} from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

@Component({
  selector: 'app-nomina-mensual-v2-trazabilidad-modal',
  standalone: true,
  imports: [MessageBoxComponent, LucideAngularModule],
  templateUrl: './nomina-mensual-v2-trazabilidad-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2TrazabilidadModalComponent {
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  cerrar(): void {
    this.orquestador.cerrarTrazabilidadPaso();
  }

  verTrazabilidadCompleta(): void {
    this.orquestador.cerrarTrazabilidadPaso();
    this.orquestador.abrirTrazabilidadCompleta();
  }

  secciones(): MessageBoxSection[] {
    const detalle = this.orquestador.detalleTrazabilidadActivo();
    if (!detalle) return [];
    const ultimoEvento = detalle.eventosRecientes[0];
    const integridadLabel = etiquetaIntegridadVisible(
      detalle.integridad.estadoIntegridad,
      ultimoEvento?.origen,
    );
    const secciones: MessageBoxSection[] = [
      {
        title: 'Estado actual',
        text: detalle.estadoActual,
        tone: 'info',
      },
      {
        title: 'Acción principal',
        text: `${detalle.accionPrincipal}\n${detalle.usuarioNombre} · ${formatoFechaTrazabilidad(detalle.fechaAccion)}`,
        tone: 'neutral',
      },
    ];
    if (detalle.resumenFuncional.length) {
      secciones.push({
        title: 'Resumen',
        items: detalle.resumenFuncional,
        tone: 'neutral',
      });
    }
    const integridadItems = [integridadLabel];
    if (detalle.integridad.fingerprintPublico) {
      integridadItems.push(`Huella pública: ${detalle.integridad.fingerprintPublico}`);
    }
    secciones.push({
      title: 'Integridad',
      items: integridadItems,
      tone: detalle.integridad.estadoIntegridad === 'invalidado' ? 'attention' : 'success',
    });
    if (detalle.eventosRecientes.length) {
      secciones.push({
        title: 'Acciones recientes',
        items: detalle.eventosRecientes.map(
          (e) => `${e.descripcion} · ${formatoFechaTrazabilidad(e.fechaEvento)}`,
        ),
        tone: 'neutral',
      });
    }
    return secciones;
  }

  accionModal(value: string): void {
    if (value === 'completa') {
      this.verTrazabilidadCompleta();
      return;
    }
    this.cerrar();
  }
}
