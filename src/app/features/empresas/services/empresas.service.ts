import { Injectable, inject } from '@angular/core';

import { parseRut } from '../../empleados/utils/empleado-rut';
import { EmpresasRepository } from '../data-access/empresas.repository';
import type { EmpresaDetalle, EmpresaFormPayload, EmpresaListadoFila, OrganismoMutualCatalogo } from '../models/empresa.model';
import { validarEmpresaForm } from '../rules/empresa-form.rules';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private readonly repository = inject(EmpresasRepository);

  listar(): Promise<EmpresaListadoFila[]> {
    return this.repository.listar();
  }

  obtenerPorId(idEmpresa: number): Promise<EmpresaDetalle | null> {
    return this.repository.obtenerPorId(idEmpresa);
  }

  listarOrganismosMutual(): Promise<OrganismoMutualCatalogo[]> {
    return this.repository.listarOrganismosMutual();
  }

  async guardar(idEmpresa: number | null, payload: EmpresaFormPayload, rutCompleto: string): Promise<EmpresaDetalle> {
    const normalizado = this.normalizarPayload(payload, rutCompleto);
    const validacion = validarEmpresaForm(normalizado, rutCompleto);
    if (!validacion.valido) {
      throw new Error(validacion.errores[0] ?? 'Revisa los datos de la empresa.');
    }

    if (idEmpresa == null) {
      return this.repository.crear(normalizado);
    }
    return this.repository.actualizar(idEmpresa, normalizado);
  }

  private normalizarPayload(payload: EmpresaFormPayload, rutCompleto: string): EmpresaFormPayload {
    const parsed = parseRut(rutCompleto);
    return {
      ...payload,
      rut: parsed.rut,
      dv: parsed.dv,
      razonSocial: payload.razonSocial.trim(),
    };
  }
}
