import { computed, inject, Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { ErpPermisosRemuneracionesService } from '../../../core/auth/erp-permisos-remuneraciones.service';

/**
 * Capacidades de nómina mensual para UI y servicios auxiliares (Generador V2).
 * Delega la matriz SEG-01b en {@link ErpPermisosRemuneracionesService}.
 */
@Injectable({ providedIn: 'root' })
export class NominaMensualCapabilitiesService {
  private readonly permisos = inject(ErpPermisosRemuneracionesService);

  readonly modoPruebas = computed(() => !environment.production);

  readonly esAdmin = this.permisos.esAdministradorRemuneraciones;

  readonly puedeAccionesAdminNomina = this.permisos.esAdministradorRemuneraciones;

  readonly esSoloLectura = this.permisos.esSoloConsulta;

  readonly puedeEscribirNomina = this.permisos.puedeEscribirNomina;

  readonly puedeValidarNomina = computed(() => this.permisos.permisosNomina().puedeValidarNomina);
  readonly puedeAprobarNomina = computed(() => this.permisos.permisosNomina().puedeAprobarNomina);
  readonly puedeConsolidarNomina = computed(() => this.permisos.permisosNomina().puedeConsolidarNomina);
  readonly puedeGenerarLiquidaciones = computed(
    () => this.permisos.permisosNomina().puedeGenerarLiquidaciones,
  );
  readonly puedeCerrarNomina = computed(() => this.permisos.permisosNomina().puedeCerrarNomina);
}
