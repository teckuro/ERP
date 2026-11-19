import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import type { ModuloPermiso } from './erp-permisos-modulos.rules';
import { ErpPermisosRemuneracionesService } from './erp-permisos-remuneraciones.service';

/**
 * Renderiza el elemento solo si el usuario puede editar el módulo indicado.
 * Pensado para acciones de escritura (crear, guardar, calcular, cerrar...) que un
 * perfil de solo consulta no debe ver. La base de datos (RLS) y los servicios
 * siguen validando el permiso: esto es solo la capa de interfaz.
 *
 * Uso: `<button *erpPuedeEscribir="'nominas'" (click)="calcular()">Calcular</button>`
 */
@Directive({
  selector: '[erpPuedeEscribir]',
  standalone: true,
})
export class PuedeEscribirDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permisos = inject(ErpPermisosRemuneracionesService);

  readonly erpPuedeEscribir = input.required<ModuloPermiso>();

  private renderizado = false;

  constructor() {
    effect(() => {
      const puede = this.permisos.permisosModulos()[this.erpPuedeEscribir()]?.editar ?? false;
      if (puede && !this.renderizado) {
        this.viewContainer.createEmbeddedView(this.template);
        this.renderizado = true;
      } else if (!puede && this.renderizado) {
        this.viewContainer.clear();
        this.renderizado = false;
      }
    });
  }
}
