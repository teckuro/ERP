import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
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

  readonly tooltipAlerta = computed(
    () => this.orquestador.ayudaAvance() ?? 'Revisar advertencias del paso',
  );

  /** Una sola fuente derivada evita parpadeo entre señales que llegan en distinto orden. */
  readonly soporteIntegridadParametros = computed(() => {
    const eventoCongelado = this.orquestador
      .eventosTrazabilidad()
      .find(
        (evento) =>
          evento.paso === 'parameters' && evento.tipoEvento === 'PARAMETROS_CONGELADOS',
      );
    const valoresBase = eventoCongelado?.metadataPublica?.['valoresParametrosBase'];
    const tieneValoresDetalle = Array.isArray(valoresBase) && valoresBase.length > 0;
    const idBase =
      this.orquestador.idCalculoPeriodoBase()
      ?? this.orquestador.estadoParametrosBase()?.idCalculoPeriodoBase
      ?? null;
    const tieneBaseGuardada =
      tieneValoresDetalle || idBase != null || !!eventoCongelado?.idSnapshotRelacionado;

    return {
      tieneBaseGuardada,
      pasoDetalleIntegridad: (tieneBaseGuardada ? 'parameters' : this.orquestador.pasoActual()) as PayrollStepId,
    };
  });

  readonly tooltipModalIntegridad = computed(() => {
    if (this.soporteIntegridadParametros().tieneBaseGuardada) {
      return 'Abrir datos guardados de parámetros';
    }
    return `${tooltipIntegridadPaso(this.resumen())}\nAbrir detalle del snapshot`;
  });

  tooltipFecha(): string {
    return tooltipFechaPaso(this.resumen());
  }

  tooltipIntegridad(): string {
    return tooltipIntegridadPaso(this.resumen());
  }

  abrirResponsable(): void {
    this.orquestador.abrirTrazabilidadPaso(this.orquestador.pasoActual(), 'owner');
  }

  abrirHistorial(): void {
    this.orquestador.abrirTrazabilidadPaso(this.orquestador.pasoActual(), 'history');
  }

  abrirModalIntegridad(): void {
    this.orquestador.abrirTrazabilidadPaso(
      this.soporteIntegridadParametros().pasoDetalleIntegridad,
      'integrity',
    );
  }

  abrirDrawerCompleto(): void {
    this.orquestador.abrirTrazabilidadCompleta();
  }
}
