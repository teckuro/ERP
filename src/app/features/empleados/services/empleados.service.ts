import { Injectable, inject } from '@angular/core';

import {
  EmpleadoReferenciaInvalidaError,
  EmpleadoRutDuplicadoError,
  EmpleadosRepository,
} from '../data-access/empleados.repository';
import { EmpleadoCreacion, EmpleadoFormCatalogos } from '../models/empleado-form.model';
import { EmpleadoEstado, EmpleadoListado } from '../models/empleado-listado.model';
import { EmpleadosCatalogosService } from './empleados-catalogos.service';
import { EmpleadosWriteService } from './empleados-write.service';

export { EmpleadoReferenciaInvalidaError, EmpleadoRutDuplicadoError };

@Injectable({
  providedIn: 'root',
})
export class EmpleadosService {
  private readonly catalogosService = inject(EmpleadosCatalogosService);
  private readonly writeService = inject(EmpleadosWriteService);
  private readonly empleadosRepository = inject(EmpleadosRepository);

  obtenerCatalogosFormulario(): Promise<EmpleadoFormCatalogos> {
    return this.catalogosService.obtenerFormulario();
  }

  listar(): Promise<EmpleadoListado[]> {
    return this.empleadosRepository.listar();
  }

  obtenerPorId(id: number): Promise<EmpleadoListado | null> {
    return this.empleadosRepository.obtenerPorId(id);
  }

  actualizarEstadoPersonas(ids: number[], estado: EmpleadoEstado): Promise<number[]> {
    return this.empleadosRepository.actualizarEstadoPersonas(ids, estado);
  }

  crear(payload: EmpleadoCreacion): Promise<EmpleadoListado> {
    return this.writeService.crear(payload);
  }
}
