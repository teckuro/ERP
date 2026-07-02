import { computed, inject, Injectable } from '@angular/core';
import type { User } from '@supabase/supabase-js';

import { AuthService } from './auth.service';
import {
  MENSAJE_SIN_PERMISO_ADMIN_NOMINA,
  MENSAJE_SOLO_LECTURA_NOMINA,
  type PermisosNominaMensual,
  type RolRemuneracionesLogico,
} from './erp-rol-remuneraciones.models';
import {
  resolverPermisosNominaMensual,
  resolverRolRemuneracionesDesdeClaims,
} from './erp-permisos-remuneraciones.rules';

export function resolverRolRemuneracionesDesdeUser(user: User | null): RolRemuneracionesLogico {
  if (!user) return 'sin_sesion';
  const appMeta = user.app_metadata as Record<string, unknown> | undefined;
  const userMeta = user.user_metadata as Record<string, unknown> | undefined;
  return resolverRolRemuneracionesDesdeClaims({
    autenticado: true,
    appMetadataRole: appMeta?.['role'] ?? appMeta?.['rol'],
    userMetadataRole: userMeta?.['role'] ?? userMeta?.['rol'],
  });
}

@Injectable({ providedIn: 'root' })
export class ErpPermisosRemuneracionesService {
  private readonly auth = inject(AuthService);

  readonly rol = computed<RolRemuneracionesLogico>(() =>
    resolverRolRemuneracionesDesdeUser(this.auth.currentUser()),
  );

  readonly permisosNomina = computed<PermisosNominaMensual>(() =>
    resolverPermisosNominaMensual(this.rol()),
  );

  readonly esAdministradorRemuneraciones = computed(
    () => this.permisosNomina().puedeEliminarNomina,
  );

  readonly esSoloConsulta = computed(() => this.rol() === 'consulta_remuneraciones');

  readonly puedeEscribirNomina = computed(() => this.permisosNomina().puedeEditarNomina);

  exigirPermisoAdminNomina(): void {
    if (!this.permisosNomina().puedeEliminarNomina) {
      throw new Error(MENSAJE_SIN_PERMISO_ADMIN_NOMINA);
    }
  }

  exigirPermisoEscrituraNomina(): void {
    if (!this.permisosNomina().puedeEditarNomina) {
      throw new Error(MENSAJE_SOLO_LECTURA_NOMINA);
    }
  }

  exigirPermisoRecargaParametrosBase(): void {
    if (!this.permisosNomina().puedeRecargarParametrosBase) {
      throw new Error(MENSAJE_SIN_PERMISO_ADMIN_NOMINA);
    }
  }
}
