import { Injectable, signal } from '@angular/core';

import type { FichaEmpleadoOverlay } from '../models/ficha-empleado-overlay.vm';

@Injectable()
export class FichaEmpleadoOverlaysPort {
  readonly overlay = signal<FichaEmpleadoOverlay>({ kind: 'cerrado' });

  abrirEdicionBloque(blockId: string, tituloBloque: string): void {
    this.overlay.set({ kind: 'editarBloque', blockId, tituloBloque });
  }

  cerrar(): void {
    this.overlay.set({ kind: 'cerrado' });
  }

  estaEditandoBloque(blockId: string): boolean {
    const state = this.overlay();

    return state.kind === 'editarBloque' && state.blockId === blockId;
  }
}
