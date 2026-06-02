import { Injectable, inject } from '@angular/core';

import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { NominaEmpleadosPersonalRepository } from '../data-access/nomina-empleados-personal.repository';
import { USAR_DATOS_DEMO_EMPLEADOS_NOMINA, employeeRows } from '../data/nomina-mensual-v2.mock';
import {
  filtrarTrabajadoresElegiblesPeriodo,
  mapearTrabajadoresAFilasNomina,
} from '../mappers/nomina-empleados-personal.mapper';
import { mapearFilasEmpleadosNomina, type FilaEmpleadoNomina } from '../presenters/nomina-empleados-grid.presenter';

@Injectable({ providedIn: 'root' })
export class NominaEmpleadosCargaService {
  private readonly personalRepository = inject(NominaEmpleadosPersonalRepository);
  private readonly periodoActivo = inject(PeriodoActivoService);

  async cargarFilasEmpleadosNomina(
    usarDatosDemo = USAR_DATOS_DEMO_EMPLEADOS_NOMINA,
    periodo = this.periodoActivo.periodoYm(),
  ): Promise<FilaEmpleadoNomina[]> {
    if (usarDatosDemo) {
      return mapearFilasEmpleadosNomina(employeeRows);
    }

    const trabajadores = await this.personalRepository.listarTrabajadoresNomina();
    const elegibles = filtrarTrabajadoresElegiblesPeriodo(trabajadores, periodo);
    return mapearTrabajadoresAFilasNomina(elegibles);
  }
}
