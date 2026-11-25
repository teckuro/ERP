import { Injectable, inject, signal } from '@angular/core';

import { limpiarAlCambiarUsuario } from '../../../core/auth/limpiar-al-cambiar-usuario';

import { NominaFeatureGatesRepository } from '../data-access/nomina-feature-gates.repository';
import {
  NOMINA_FEATURE_GATES_APAGADOS,
  type NominaFeatureGates,
} from '../models/nomina-feature-gates.models';
import type { TipoNomina } from '../models/nomina-periodo.models';
import { tipoNominaPermitido } from '../rules/nomina-tipos-creacion.rules';

@Injectable({ providedIn: 'root' })
export class NominaFeatureGatesService {
  private readonly repo = inject(NominaFeatureGatesRepository);

  private readonly _gates = signal<NominaFeatureGates>(NOMINA_FEATURE_GATES_APAGADOS);
  readonly gates = this._gates.asReadonly();

  // Los tipos de nómina habilitados dependen de la empresa de la sesión.
  private readonly generacionSesion = limpiarAlCambiarUsuario(() =>
    this._gates.set(NOMINA_FEATURE_GATES_APAGADOS),
  );

  async cargar(): Promise<NominaFeatureGates> {
    const generacion = this.generacionSesion();
    try {
      const gates = await this.repo.obtener();
      if (generacion === this.generacionSesion()) {
        this._gates.set(gates);
      }
      return gates;
    } catch {
      // Un fallo tardío de la sesión anterior no debe apagar los tipos del usuario actual.
      if (generacion === this.generacionSesion()) {
        this._gates.set(NOMINA_FEATURE_GATES_APAGADOS);
      }
      return NOMINA_FEATURE_GATES_APAGADOS;
    }
  }

  exigirTipoPermitido(tipo: TipoNomina): void {
    if (!tipoNominaPermitido(tipo, this._gates())) {
      throw new Error('Este tipo de nómina no está habilitado para su empresa.');
    }
  }
}
