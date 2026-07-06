import { Routes } from '@angular/router';

export const empresasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/listado-empresas-container/listado-empresas-container').then(
        (m) => m.ListadoEmpresasContainer,
      ),
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./containers/ficha-empresa-container/ficha-empresa-container').then((m) => m.FichaEmpresaContainer),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./containers/ficha-empresa-container/ficha-empresa-container').then((m) => m.FichaEmpresaContainer),
  },
];
