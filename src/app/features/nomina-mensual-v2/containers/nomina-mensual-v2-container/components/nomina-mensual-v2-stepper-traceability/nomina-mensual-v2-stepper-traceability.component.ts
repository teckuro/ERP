import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  construirResumenTrazabilidadPasoActual,
  tooltipFechaPaso,
  tooltipIntegridadPaso,
} from '../../../../presenters/nomina-stepper-trazabilidad.presenter';
import { obtenerInicialesResponsable } from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

@Component({
  selector: 'app-nomina-mensual-v2-stepper-traceability',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './nomina-mensual-v2-stepper-traceability.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2StepperTraceabilityComponent {
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  readonly resumen = computed(() =>
    construirResumenTrazabilidadPasoActual(
      this.orquestador.pasoActual(),
      this.orquestador.auditoriaPorPaso(),
      this.orquestador.eventosTrazabilidad(),
    ),
  );

  readonly inicialesResponsable = computed(() => {
    const nombre = this.resumen().responsableNombre;
    if (nombre === 'Sin responsable registrado') return undefined;
    return obtenerInicialesResponsable(nombre) ?? 'UA';
  });

  readonly muestraAlerta = computed(() => {
    const tono = this.orquestador.tonoAyudaAvance();
    return tono === 'bloqueo' || tono === 'revision';
  });

  readonly tooltipAlerta = computed(() => this.orquestador.ayudaAvance() ?? 'Revisar advertencias del paso');

  tooltipFecha(): string {
    return tooltipFechaPaso(this.resumen());
  }

  tooltipIntegridad(): string {
    return tooltipIntegridadPaso(this.resumen());
  }

  abrirDetallePasoActual(): void {
    this.orquestador.abrirTrazabilidadPaso(this.orquestador.pasoActual());
  }

  abrirDrawerCompleto(): void {
    this.orquestador.abrirTrazabilidadCompleta();
  }
}
