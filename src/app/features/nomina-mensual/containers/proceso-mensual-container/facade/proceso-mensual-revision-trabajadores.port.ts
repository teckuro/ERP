import { Injectable, signal } from '@angular/core';

import type { NominaMasivaFiltro } from '../../../rules/proceso-mensual-masivo-layout.rules';

export type RevisionTrabajadoresPanelModo = 'trabajadores' | 'situacion_periodo';

@Injectable()
export class ProcesoMensualRevisionTrabajadoresPort {
  readonly revisionTrabajadoresPanel = signal<RevisionTrabajadoresPanelModo>('trabajadores');
  readonly nominaMasivaFiltro = signal<NominaMasivaFiltro>('todos');
  readonly nominaMasivaBusqueda = signal('');
  readonly nominaMasivaTrabajadorSeleccionadoId = signal<number | string | null>(null);

  seleccionarPanel(modo: RevisionTrabajadoresPanelModo): void {
    this.revisionTrabajadoresPanel.set(modo);
    if (modo === 'situacion_periodo') {
      this.nominaMasivaTrabajadorSeleccionadoId.set(null);
    }
  }

  seleccionarFiltro(filtro: NominaMasivaFiltro): void {
    this.nominaMasivaFiltro.set(filtro);
    this.revisionTrabajadoresPanel.set('trabajadores');
  }

  actualizarBusqueda(valor: string): void {
    this.nominaMasivaBusqueda.set(valor);
  }

  seleccionarTrabajador(idPersona: number | string): void {
    this.nominaMasivaTrabajadorSeleccionadoId.set(idPersona);
  }

  limpiarTrabajadorSeleccionado(): void {
    this.nominaMasivaTrabajadorSeleccionadoId.set(null);
  }

  clavePersona(idPersona: number | string | null | undefined): string {
    if (idPersona == null) return '';
    const raw = String(idPersona).trim();
    return raw.startsWith('omitido-') ? raw.slice('omitido-'.length) : raw;
  }

  mismaPersona(a: number | string | null | undefined, b: number | string | null | undefined): boolean {
    const claveA = this.clavePersona(a);
    const claveB = this.clavePersona(b);
    return !!claveA && claveA === claveB;
  }
}
