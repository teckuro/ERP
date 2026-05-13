import { Injectable, inject } from '@angular/core';

import { EmpleadosRepository } from '../data-access/empleados.repository';
import { EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';

@Injectable({
  providedIn: 'root',
})
export class EmpleadosCatalogosService {
  private readonly empleadosRepository = inject(EmpleadosRepository);

  obtenerFormulario(): Promise<EmpleadoFormCatalogos> {
    return this.empleadosRepository.obtenerCatalogosFormulario();
  }
}
