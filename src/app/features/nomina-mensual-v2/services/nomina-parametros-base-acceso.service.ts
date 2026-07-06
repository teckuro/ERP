import { Injectable, inject } from '@angular/core';

import { NominaMensualCapabilitiesService } from '../../nomina-mensual/services/nomina-mensual-capabilities.service';
import { etiquetaPeriodoDesdeYm } from '../../../core/services/periodo-activo.service';
import type {
  AccionPrincipalShellParametros,
  EvaluacionIntentoRecargaBase,
  ModalAccesoBaseParametrosPort,
  PermisosRecargaBaseParametros,
} from '../models/nomina-parametros-base-acceso.models';
import {
  evaluarIntentoRecargaBase,
  resolverAccionPrincipalShellParametros,
  resolverPermisosRecargaBase,
} from '../rules/nomina-parametros-base-acceso.rules';

@Injectable({ providedIn: 'root' })
export class NominaParametrosBaseAccesoService {
  private readonly nominaCapabilities = inject(NominaMensualCapabilitiesService);

  esAdmin(): boolean {
    return this.nominaCapabilities.esAdmin();
  }

  resolverPermisos(): PermisosRecargaBaseParametros {
    return resolverPermisosRecargaBase(this.esAdmin());
  }

  resolverAccionShellParametros(input: {
    hayBaseGuardada: boolean;
    validando: boolean;
    loading: boolean;
  }): AccionPrincipalShellParametros {
    return resolverAccionPrincipalShellParametros(input);
  }

  evaluarIntentoRecarga(
    hayBaseGuardada: boolean,
    periodoYm: string,
  ): EvaluacionIntentoRecargaBase {
    return evaluarIntentoRecargaBase({
      hayBaseGuardada,
      esAdmin: this.esAdmin(),
      periodoEtiqueta: etiquetaPeriodoDesdeYm(periodoYm),
    });
  }

  modalParaEvaluacion(
    evaluacion: EvaluacionIntentoRecargaBase,
  ): ModalAccesoBaseParametrosPort | null {
    if (evaluacion.accion === 'permitir') return null;
    return evaluacion.modal;
  }

  debeInterceptarRecarga(evaluacion: EvaluacionIntentoRecargaBase): boolean {
    return evaluacion.accion !== 'permitir';
  }
}
