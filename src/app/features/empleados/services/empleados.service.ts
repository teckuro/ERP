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
import type { PerfilLaboralPersona } from '../models/empleado-perfil-laboral-rpc.model';
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

  obtenerPerfilLaboralPersona(
    idPersona: number,
    periodoYm: string,
  ): Promise<PerfilLaboralPersona | null> {
    return this.empleadosRepository.obtenerPerfilLaboralPersona(idPersona, periodoYm);
  }

  guardarSeccionFicha(
    personaId: number,
    seccion: 'general' | 'laboral' | 'remuneracion' | 'prevision' | 'pago',
    payload: CrearEmpleadoPayload,
  ): Promise<EmpleadoFichaDetalle | null> {
    return this.empleadosRepository.guardarSeccionFicha(personaId, seccion, payload);
  }

  validarFichaParaRemuneraciones(
    personaId: number,
    payload: CrearEmpleadoPayload,
  ): Promise<EmpleadoFichaDetalle | null> {
    return this.empleadosRepository.validarFichaParaRemuneraciones(personaId, payload);
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

  guardarBorradorAvanzado(
    personaIdExistente: number | null,
    payload: CrearEmpleadoPayload,
    pasoWizard: number,
  ): Promise<EmpleadoListado> {
    return this.writeService.guardarBorradorAvanzado(personaIdExistente, payload, pasoWizard);
  }

  finalizarAltaAvanzadaExistente(personaId: number, payload: CrearEmpleadoPayload): Promise<void> {
    return this.writeService.finalizarAltaAvanzadaExistente(personaId, payload);
  }
}
