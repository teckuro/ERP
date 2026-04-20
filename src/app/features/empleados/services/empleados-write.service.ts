import { Injectable, inject } from '@angular/core';

import { EmpleadosRepository } from '../data-access/empleados.repository';
import { EmpleadoListado } from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';

@Injectable({
  providedIn: 'root',
})
export class EmpleadosWriteService {
  private readonly empleadosRepository = inject(EmpleadosRepository);

  crear(payload: CrearEmpleadoPayload): Promise<EmpleadoListado> {
    return this.empleadosRepository.crear(payload);
  }
}
