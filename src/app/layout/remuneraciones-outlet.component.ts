import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Contenedor mínimo para rutas hijas bajo `/remuneraciones/*`. */
@Component({
  selector: 'app-remuneraciones-outlet',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [
    `
      :host,
      :host > :not(router-outlet) {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 100%;
      }
    `,
  ],
})
export class RemuneracionesOutletComponent {}
