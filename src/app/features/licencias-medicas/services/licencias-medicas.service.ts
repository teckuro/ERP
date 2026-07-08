import { Injectable, inject } from '@angular/core';

import { LicenciasMedicasRepository } from '../data-access/licencias-medicas.repository';
import type { GuardarLicenciaMedicaInput, LicenciaMedica } from '../models/licencia-medica.model';

@Injectable({ providedIn: 'root' })
export class LicenciasMedicasService {
  private readonly repository = inject(LicenciasMedicasRepository);

  listar(filtros?: {
    estado?: string | null;
    desde?: string | null;
    hasta?: string | null;
  }): Promise<LicenciaMedica[]> {
    return this.repository.listar(filtros);
  }

  obtener(idLicencia: number): Promise<LicenciaMedica | null> {
    return this.repository.obtener(idLicencia);
  }

  guardar(input: GuardarLicenciaMedicaInput): Promise<LicenciaMedica> {
    return this.repository.guardar(input);
  }

  confirmar(idLicencia: number): Promise<LicenciaMedica> {
    return this.repository.confirmar(idLicencia);
  }

  rechazar(idLicencia: number, observacion?: string | null): Promise<LicenciaMedica> {
    return this.repository.rechazar(idLicencia, observacion);
  }

  marcarVinculadaNomina(idLicencia: number): Promise<LicenciaMedica> {
    return this.repository.marcarVinculadaNomina(idLicencia);
  }
}
