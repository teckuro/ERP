import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  construirResumenTrazabilidadPasoActual,
  tooltipFechaPaso,
  tooltipIntegridadPaso,
} from '../../../../presenters/nomina-stepper-trazabilidad.presenter';
import { obtenerInicialesResponsable } from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';

@Component({
  selector: 'app-nomina-mensual-v2-stepper-traceability',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './nomina-mensual-v2-stepper-traceability.component.html',
  styleUrl: './nomina-mensual-v2-stepper-traceability.component.css',
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

  readonly pasoDetalleIntegridad = computed<PayrollStepId>(() =>
    this.tieneBaseParametrosGuardada() ? 'parameters' : this.orquestador.pasoActual(),
  );

  readonly tieneDetalleParametrosGuardados = computed(() =>
    this.orquestador.eventosTrazabilidad().some(
      (evento) =>
        evento.paso === 'parameters'
        && evento.tipoEvento === 'PARAMETROS_CONGELADOS'
        && Array.isArray(evento.metadataPublica?.['valoresParametrosBase'])
        && evento.metadataPublica['valoresParametrosBase'].length > 0,
    ),
  );

  readonly tieneBaseParametrosGuardada = computed(() =>
    this.tieneDetalleParametrosGuardados()
    || !!this.orquestador.idCalculoPeriodoBase()
    || !!this.orquestador.estadoParametrosBase()?.idCalculoPeriodoBase
    || this.orquestador.eventosTrazabilidad().some(
      (evento) =>
        evento.paso === 'parameters'
        && evento.tipoEvento === 'PARAMETROS_CONGELADOS'
        && !!evento.idSnapshotRelacionado,
    ),
  );

  tooltipFecha(): string {
    return tooltipFechaPaso(this.resumen());
  }

  tooltipIntegridad(): string {
    return tooltipIntegridadPaso(this.resumen());
  }

  tooltipModalIntegridad(): string {
    if (this.tieneBaseParametrosGuardada()) {
      return 'Abrir datos guardados de parámetros';
    }
    return `${tooltipIntegridadPaso(this.resumen())}\nAbrir detalle del snapshot`;
  }

  abrirResponsable(): void {
    this.orquestador.abrirTrazabilidadPaso(this.orquestador.pasoActual(), 'owner');
  }

  abrirHistorial(): void {
    this.orquestador.abrirTrazabilidadPaso(this.orquestador.pasoActual(), 'history');
  }

  abrirModalIntegridad(): void {
    this.orquestador.abrirTrazabilidadPaso(this.pasoDetalleIntegridad(), 'integrity');
  }

  abrirDrawerCompleto(): void {
    this.orquestador.abrirTrazabilidadCompleta();
  }
}
