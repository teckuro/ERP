import { Injectable, inject } from '@angular/core';

import {
  EmpleadoReferenciaInvalidaError,
  EmpleadoRutDuplicadoError,
  EmpleadosRepository,
} from '../data-access/empleados.repository';
import { EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import {
  EmpleadoEstado,
  EmpleadoFichaDetalle,
  EmpleadoListado,
} from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
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

  obtenerPorId(id: number): Promise<EmpleadoFichaDetalle | null> {
    return this.empleadosRepository.obtenerPorId(id);
  }

  guardarSeccionFicha(
    personaId: number,
    seccion: 'general' | 'laboral' | 'remuneracion' | 'prevision' | 'pago',
    payload: CrearEmpleadoPayload,
  ): Promise<EmpleadoFichaDetalle | null> {
    return this.empleadosRepository.guardarSeccionFicha(personaId, seccion, payload);
  }

  actualizarEstadoPersonas(ids: number[], estado: EmpleadoEstado): Promise<number[]> {
    return this.empleadosRepository.actualizarEstadoPersonas(ids, estado);
  }

  crear(payload: CrearEmpleadoPayload): Promise<EmpleadoListado> {
    return this.writeService.crear(payload);
  }

  crearBasico(payload: CrearEmpleadoPayload): Promise<EmpleadoListado> {
    return this.writeService.crearBasico(payload);
  }
}
