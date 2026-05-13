import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Contenedor mínimo para rutas hijas bajo `/remuneraciones/*`. */
@Component({
  selector: 'app-remuneraciones-outlet',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class RemuneracionesOutletComponent {}
