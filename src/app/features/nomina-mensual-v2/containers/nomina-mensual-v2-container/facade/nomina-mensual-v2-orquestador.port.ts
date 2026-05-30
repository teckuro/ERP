import { Injectable, computed, signal } from '@angular/core';

import type { PayrollStepId, ResultadoAlcanceNomina } from '../../../models/nomina-mensual-v2.models';
import type {
  ContextoTrazabilidadPasoNomina,
  EventoTrazabilidadNomina,
  ResumenAuditoriaPasoNomina,
} from '../../../models/nomina-trazabilidad.models';
import { buildDetalleModal } from '../../../mappers/nomina-trazabilidad.mapper';
import {
  NominaMensualV2TrazabilidadService,
  type RecomputarTrazabilidadResult,
} from '../../../services/nomina-mensual-v2-trazabilidad.service';
import type { AyudaAvanceTono } from './nomina-mensual-v2-navegacion';

export type ModalAvanceParametrosPort =
  | { tipo: 'bloqueo' }
  | { tipo: 'revision'; destinoPaso: PayrollStepId };

import type {
  ResultadoValidacionEmpleados,
  SeccionResumenPendientesEmpleados,
} from '../../../presenters/nomina-empleados-validacion.presenter';

export type ModalResumenPendientesEmpleadosPort = {
  resultado: ResultadoValidacionEmpleados;
  secciones: SeccionResumenPendientesEmpleados[];
  origen: 'checklist' | 'validacion';
};

export type ModalAvanceAlcancePort =
  | { tipo: 'bloqueo'; titulo: string; mensaje: string }
  | { tipo: 'revision'; titulo: string; mensaje: string };

export type ModalAvanceEmpleadosPort = ModalResumenPendientesEmpleadosPort;

@Injectable()
export class NominaMensualV2OrquestadorPort {
  readonly pasoActual = signal<PayrollStepId>('parameters');
  readonly ayudaAvance = signal<string | null>(null);
  readonly tonoAyudaAvance = signal<AyudaAvanceTono>(null);
  readonly modalAvanceParametros = signal<ModalAvanceParametrosPort | null>(null);
  readonly modalAvanceAlcance = signal<ModalAvanceAlcancePort | null>(null);
  readonly modalAvanceEmpleados = signal<ModalAvanceEmpleadosPort | null>(null);
  readonly resultadoAlcance = signal<ResultadoAlcanceNomina | null>(null);

  readonly auditoriaPorPaso = signal<Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>>>({});
  readonly eventosTrazabilidad = signal<EventoTrazabilidadNomina[]>([]);
  readonly trazabilidadDrawerAbierto = signal(false);
  readonly trazabilidadPasoActivo = signal<PayrollStepId | null>(null);
  readonly contextoTrazabilidad = signal<ContextoTrazabilidadPasoNomina | null>(null);

  private readonly eventosLocales = signal<EventoTrazabilidadNomina[]>([]);
  private trazabilidadService: NominaMensualV2TrazabilidadService | null = null;

  readonly alcanceValidado = computed(() => {
    const resultado = this.resultadoAlcance();
    return !!resultado && resultado.estado !== 'sinConfigurar' && resultado.resumen.trabajadoresIncluidos > 0;
  });

  readonly detalleTrazabilidadActivo = computed(() => {
    const paso = this.trazabilidadPasoActivo();
    if (!paso) return null;
    return buildDetalleModal(
      paso,
      this.auditoriaPorPaso()[paso],
      this.eventosTrazabilidad(),
      this.contextoTrazabilidad() ?? undefined,
    );
  });

  private manejadorAccionPrincipal: (() => void) | null = null;

  vincularTrazabilidadService(service: NominaMensualV2TrazabilidadService): void {
    this.trazabilidadService = service;
  }

  registrarAccionPrincipal(manejador: () => void): void {
    this.manejadorAccionPrincipal = manejador;
  }

  limpiarAccionPrincipal(): void {
    this.manejadorAccionPrincipal = null;
  }

  ejecutarAccionPrincipal(): void {
    this.manejadorAccionPrincipal?.();
  }

  establecerAyudaAvance(texto: string | null, tono: AyudaAvanceTono = null): void {
    this.ayudaAvance.set(texto);
    this.tonoAyudaAvance.set(tono);
  }

  limpiarModalesAvance(): void {
    this.modalAvanceParametros.set(null);
    this.modalAvanceAlcance.set(null);
    this.modalAvanceEmpleados.set(null);
  }

  abrirTrazabilidadPaso(paso: PayrollStepId): void {
    this.trazabilidadPasoActivo.set(paso);
  }

  cerrarTrazabilidadPaso(): void {
    this.trazabilidadPasoActivo.set(null);
  }

  abrirTrazabilidadCompleta(): void {
    this.trazabilidadDrawerAbierto.set(true);
  }

  cerrarTrazabilidadCompleta(): void {
    this.trazabilidadDrawerAbierto.set(false);
  }

  registrarEventoTrazabilidad(evento: EventoTrazabilidadNomina): void {
    this.eventosLocales.update((prev) => [evento, ...prev]);
    void this.recomputarTrazabilidad();
  }

  actualizarContextoTrazabilidad(contexto: ContextoTrazabilidadPasoNomina): void {
    this.contextoTrazabilidad.set(contexto);
  }

  async recomputarTrazabilidad(): Promise<RecomputarTrazabilidadResult | null> {
    if (!this.trazabilidadService) return null;
    const result = await this.trazabilidadService.recomputar({
      eventosLocales: this.eventosLocales(),
      contexto: this.contextoTrazabilidad() ?? undefined,
    });
    this.eventosTrazabilidad.set(result.eventos);
    this.auditoriaPorPaso.set(result.auditoriaPorPaso);
    return result;
  }
}
