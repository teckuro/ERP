import { Injectable, inject } from '@angular/core';

import { EmpleadosRepository } from '../data-access/empleados.repository';
import { EmpleadoCreacion } from '../models/empleado-form.model';
import { EmpleadoListado } from '../models/empleado-listado.model';

@Injectable({
  providedIn: 'root',
})
export class EmpleadosWriteService {
  private readonly empleadosRepository = inject(EmpleadosRepository);

  crear(payload: EmpleadoCreacion): Promise<EmpleadoListado> {
    return this.empleadosRepository.crear(payload);
  }
}
