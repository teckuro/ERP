import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import type { ResumenAuditoriaPasoNomina } from '../../../../models/nomina-trazabilidad.models';
import {
  etiquetaIntegridadVisible,
  formatoHoraCorta,
} from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

@Component({
  selector: 'app-nomina-mensual-v2-trazabilidad-paso',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './nomina-mensual-v2-trazabilidad-paso.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2TrazabilidadPasoComponent {
  readonly paso = input.required<PayrollStepId>();
  readonly resumen = input<ResumenAuditoriaPasoNomina | null>(null);
  readonly compacto = input(false);

  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  resumenVisible(): ResumenAuditoriaPasoNomina | null {
    return this.resumen() ?? this.orquestador.auditoriaPorPaso()[this.paso()] ?? null;
  }

  etiquetaIntegridad(): string {
    const r = this.resumenVisible();
    if (!r) return 'No disponible';
    const ultimoEvento = this.orquestador
      .eventosTrazabilidad()
      .find((e) => e.paso === this.paso());
    return etiquetaIntegridadVisible(r.integridad.estadoIntegridad, ultimoEvento?.origen);
  }

  lineaResumen(): string {
    const r = this.resumenVisible();
    if (!r || r.estado === 'pendiente') return 'Pendiente de registro';
    const hora = formatoHoraCorta(r.fechaAccion);
    return `${r.accionPrincipal.split('.')[0]} · ${r.usuarioNombre} · ${hora}`;
  }

  abrirDetalle(): void {
    this.orquestador.abrirTrazabilidadPaso(this.paso());
  }
}
