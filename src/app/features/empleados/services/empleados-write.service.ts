import { Injectable, inject } from '@angular/core';

import { EmpleadosRepository } from '../data-access/empleados.repository';
import { mapCreatedEmpleado } from '../mappers/empleado-write.mapper';
import { EmpleadoListado } from '../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../models/empleado-payload.model';
import { parseRut } from '../utils/empleado-rut';

@Injectable({
  providedIn: 'root',
})
export class EmpleadosWriteService {
  private readonly empleadosRepository = inject(EmpleadosRepository);

  async crear(payload: CrearEmpleadoPayload): Promise<EmpleadoListado> {
    const rut = parseRut(payload.rut);
    const empresaId = await this.empleadosRepository.obtenerEmpresaIdParaContrato();

    let personaId: number | null = null;
    let contratoId: number | null = null;

    try {
      personaId = await this.empleadosRepository.insertarPersona(payload, rut);
      contratoId = await this.empleadosRepository.insertarContrato(payload, personaId, empresaId);

      await this.empleadosRepository.insertarRemuneracion(payload, contratoId);
      await this.empleadosRepository.insertarPrevision(payload, contratoId);
      await this.empleadosRepository.insertarSaludTrabajador(payload, contratoId);
      await this.empleadosRepository.insertarCuenta2Afp(payload, contratoId);
      await this.empleadosRepository.insertarSemanaCorrida(payload, contratoId);
      await this.empleadosRepository.insertarZonaExtrema(payload, contratoId);
      await this.empleadosRepository.insertarApv(payload, contratoId);
      await this.empleadosRepository.insertarCuentaBancaria(payload, personaId);
      await this.empleadosRepository.insertarContratoCentroCosto(payload, contratoId);
      await this.empleadosRepository.activarPersonaCreada(payload, personaId);

      const departamento = await this.empleadosRepository.obtenerCentroCostoNombre(
        payload.idCentroCosto,
      );

      return mapCreatedEmpleado(payload, personaId, rut, departamento);
    } catch (error) {
      await this.empleadosRepository.rollbackCreacion(contratoId, personaId);
      throw error;
    }
  }

  async crearBasico(payload: CrearEmpleadoPayload): Promise<EmpleadoListado> {
    const rut = parseRut(payload.rut);
    const personaId = await this.empleadosRepository.insertarPersonaBasica(payload, rut);

    return mapCreatedEmpleado(payload, personaId, rut, null);
  }
}
