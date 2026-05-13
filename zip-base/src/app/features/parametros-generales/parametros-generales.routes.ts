import { Routes } from '@angular/router';

export const parametrosGeneralesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './containers/listado-parametros-generales-container/listado-parametros-generales-container'
      ).then((m) => m.ListadoParametrosGeneralesContainer),
  },
];
