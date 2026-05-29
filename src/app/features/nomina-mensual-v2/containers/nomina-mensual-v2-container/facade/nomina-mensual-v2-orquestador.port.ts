import { Injectable, signal } from '@angular/core';

import type { PayrollStepId } from '../../../models/nomina-mensual-v2.models';
import type { AyudaAvanceTono } from './nomina-mensual-v2-navegacion';

export type ModalAvanceParametrosPort =
  | { tipo: 'bloqueo' }
  | { tipo: 'revision'; destinoPaso: PayrollStepId };

export type ModalAvanceEmpleadosPort = { tipo: 'bloqueo' } | { tipo: 'advertencia' };

@Injectable()
export class NominaMensualV2OrquestadorPort {
  readonly pasoActual = signal<PayrollStepId>('parameters');
  readonly ayudaAvance = signal<string | null>(null);
  readonly tonoAyudaAvance = signal<AyudaAvanceTono>(null);
  readonly modalAvanceParametros = signal<ModalAvanceParametrosPort | null>(null);
  readonly modalAvanceEmpleados = signal<ModalAvanceEmpleadosPort | null>(null);

  private manejadorAccionPrincipal: (() => void) | null = null;

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
    this.modalAvanceEmpleados.set(null);
  }
}
