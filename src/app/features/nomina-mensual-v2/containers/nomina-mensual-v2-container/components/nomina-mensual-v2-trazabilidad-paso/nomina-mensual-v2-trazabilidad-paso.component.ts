import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import type { ResumenAuditoriaPasoNomina } from '../../../../models/nomina-trazabilidad.models';
import {
  etiquetaIntegridadVisible,
  obtenerCopyAuditoriaPaso,
  obtenerTituloAccionPaso,
  verboResponsablePaso,
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
  readonly variant = input<'inline' | 'panel'>('inline');

  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  resumenVisible(): ResumenAuditoriaPasoNomina | null {
    return this.resumen() ?? this.orquestador.auditoriaPorPaso()[this.paso()] ?? null;
  }

  etiquetaIntegridad(): string {
    const r = this.resumenVisible();
    if (!r) return 'Integridad no disponible';
    const ultimoEvento = this.orquestador.eventosTrazabilidad().find((e) => e.paso === this.paso());
    return etiquetaIntegridadVisible(r.integridad.estadoIntegridad, ultimoEvento?.origen);
  }

  tituloRegistro(): string {
    return obtenerTituloAccionPaso(this.resumenVisible() ?? undefined);
  }

  lineaResponsable(): string {
    const r = this.resumenVisible();
    if (!r || r.estado === 'pendiente') return 'Sin responsable registrado';
    const verbo = verboResponsablePaso(this.paso(), r.estado);
    const nombre =
      r.usuarioNombre && r.usuarioNombre !== '—' ? r.usuarioNombre : 'Usuario actual';
    return `${verbo} ${nombre}`;
  }

  lineaResumen(): string {
    const r = this.resumenVisible();
    if (!r || r.estado === 'pendiente') return 'Sin eventos todavía';
    return obtenerCopyAuditoriaPaso(r ?? undefined);
  }

  abrirDetalle(): void {
    this.orquestador.abrirTrazabilidadPaso(this.paso());
  }
}
