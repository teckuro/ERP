import { Injectable, computed, signal } from '@angular/core';

import type { PayrollStepId, ResultadoAlcanceNomina } from '../../../models/nomina-mensual-v2.models';
import type {
  DiferenciaParametroBase,
  EstadoBaseParametrosPeriodoView,
  OrigenBaseParametrosAlAvanzar,
  VistaPreviaParametrosBase,
} from '../../../models/nomina-parametros-base.models';
import type { NominaParametrosResumen } from '../../../models/nomina-parametros-resumen.models';
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
  | { tipo: 'bloqueo'; pendientes?: readonly string[] }
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

export type ModalPrepararNominaPort = {
  preview: VistaPreviaParametrosBase;
  resumen: NominaParametrosResumen;
};

export type ModalDiferenciasParametrosBasePort = {
  resumen: NominaParametrosResumen;
  idCalculoPeriodoBase: number;
  diferencias: DiferenciaParametroBase[];
};

export type ModalActualizarParametrosBasePort = {
  resumen: NominaParametrosResumen;
};

export type ModalTablaDiferenciasParametrosBasePort = {
  diferencias: DiferenciaParametroBase[];
};

export type ModalRevisarParametrosPort = {
  periodo: string;
  periodoEtiqueta: string;
};

export type TipoModalDetallePasoNomina = 'owner' | 'history' | 'integrity';

@Injectable()
export class NominaMensualV2OrquestadorPort {
  readonly pasoActual = signal<PayrollStepId>('parameters');
  readonly ayudaAvance = signal<string | null>(null);
  readonly tonoAyudaAvance = signal<AyudaAvanceTono>(null);
  readonly modalAvanceParametros = signal<ModalAvanceParametrosPort | null>(null);
  readonly modalAvanceAlcance = signal<ModalAvanceAlcancePort | null>(null);
  readonly modalAvanceEmpleados = signal<ModalAvanceEmpleadosPort | null>(null);
  readonly modalPrepararNomina = signal<ModalPrepararNominaPort | null>(null);
  readonly modalDiferenciasParametrosBase = signal<ModalDiferenciasParametrosBasePort | null>(null);
  readonly modalActualizarParametrosBase = signal<ModalActualizarParametrosBasePort | null>(null);
  readonly modalTablaDiferenciasParametrosBase = signal<ModalTablaDiferenciasParametrosBasePort | null>(null);
  readonly modalRevisarParametros = signal<ModalRevisarParametrosPort | null>(null);
  readonly resultadoAlcance = signal<ResultadoAlcanceNomina | null>(null);

  readonly estadoParametrosBase = signal<EstadoBaseParametrosPeriodoView | null>(null);
  readonly origenBaseParametrosAlAvanzar = signal<OrigenBaseParametrosAlAvanzar | null>(null);
  readonly idCalculoPeriodoBase = signal<number | null>(null);

  readonly auditoriaPorPaso = signal<Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>>>({});
  readonly eventosTrazabilidad = signal<EventoTrazabilidadNomina[]>([]);
  readonly trazabilidadDrawerAbierto = signal(false);
  readonly trazabilidadPasoActivo = signal<PayrollStepId | null>(null);
  readonly tipoModalDetalleActivo = signal<TipoModalDetallePasoNomina | null>(null);
  readonly contextoTrazabilidad = signal<ContextoTrazabilidadPasoNomina | null>(null);

  private readonly eventosLocales = signal<EventoTrazabilidadNomina[]>([]);
  private trazabilidadService: NominaMensualV2TrazabilidadService | null = null;

  readonly alcanceValidado = computed(() => {
    const resultado = this.resultadoAlcance();
    return !!resultado && resultado.estado !== 'sinConfigurar' && resultado.resumen.trabajadoresIncluidos > 0;
  });

  readonly parametrosPreparados = computed(
    () => !!this.estadoParametrosBase()?.idCalculoPeriodoBase,
  );

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
  private tokenAccionPrincipal = 0;

  vincularTrazabilidadService(service: NominaMensualV2TrazabilidadService): void {
    this.trazabilidadService = service;
  }

  registrarAccionPrincipal(manejador: () => void): () => void {
    const token = ++this.tokenAccionPrincipal;
    this.manejadorAccionPrincipal = manejador;
    return () => {
      if (this.tokenAccionPrincipal !== token) return;
      this.manejadorAccionPrincipal = null;
    };
  }

  limpiarAccionPrincipal(): void {
    this.tokenAccionPrincipal += 1;
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
    this.modalPrepararNomina.set(null);
    this.modalDiferenciasParametrosBase.set(null);
    this.modalActualizarParametrosBase.set(null);
    this.modalTablaDiferenciasParametrosBase.set(null);
    this.modalRevisarParametros.set(null);
  }

  registrarOrigenBaseAlAvanzar(
    origen: OrigenBaseParametrosAlAvanzar,
    idCalculoPeriodoBase: number,
  ): void {
    this.origenBaseParametrosAlAvanzar.set(origen);
    this.idCalculoPeriodoBase.set(idCalculoPeriodoBase);
    const estado = this.estadoParametrosBase();
    this.actualizarContextoTrazabilidad({
      ...(this.contextoTrazabilidad() ?? { periodo: '' }),
      parametrosBase: {
        origen,
        idCalculoPeriodoBase,
        fechaBaseGuardada: estado?.fechaBaseGuardada ?? null,
      },
    });
  }

  abrirTrazabilidadPaso(paso: PayrollStepId, tipo: TipoModalDetallePasoNomina = 'history'): void {
    this.trazabilidadPasoActivo.set(paso);
    this.tipoModalDetalleActivo.set(tipo);
  }

  cerrarTrazabilidadPaso(): void {
    this.trazabilidadPasoActivo.set(null);
    this.tipoModalDetalleActivo.set(null);
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

  reiniciarPorCambioPeriodo(periodo: string): void {
    this.limpiarModalesAvance();
    this.resultadoAlcance.set(null);
    this.estadoParametrosBase.set(null);
    this.origenBaseParametrosAlAvanzar.set(null);
    this.idCalculoPeriodoBase.set(null);
    this.auditoriaPorPaso.set({});
    this.eventosTrazabilidad.set([]);
    this.eventosLocales.set([]);
    this.trazabilidadDrawerAbierto.set(false);
    this.trazabilidadPasoActivo.set(null);
    this.tipoModalDetalleActivo.set(null);
    this.contextoTrazabilidad.set({ periodo });
    this.establecerAyudaAvance(null);
  }

  async recomputarTrazabilidad(incluirMockSiVacio = false): Promise<RecomputarTrazabilidadResult | null> {
    if (!this.trazabilidadService) return null;
    const result = await this.trazabilidadService.recomputar({
      eventosLocales: this.eventosLocales(),
      contexto: this.contextoTrazabilidad() ?? undefined,
      incluirMockSiVacio,
    });
    this.eventosTrazabilidad.set(result.eventos);
    this.auditoriaPorPaso.set(result.auditoriaPorPaso);
    return result;
  }
}
