import { computed, inject, Injectable, signal } from '@angular/core';
import type { User } from '@supabase/supabase-js';

import { injectSupabase } from '../services/supabase.service';
import { AuthService } from './auth.service';
import {
  combinarPermisosPerfil,
  normalizarPermisosFinos,
  permisosPorDefectoDesdeRol,
  type PermisosFinosPerfil,
  type PermisosPorModulo,
} from './erp-permisos-modulos.rules';
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
  private readonly supabase = injectSupabase();

  /** Ajustes finos del perfil asignado (`perfil_acceso.permisos`); null = solo rol base. */
  private readonly permisosFinosState = signal<PermisosFinosPerfil | null>(null);
  private cargaPermisosFinosPromise: Promise<void> | null = null;

  readonly rol = computed<RolRemuneracionesLogico>(() =>
    resolverRolRemuneracionesDesdeUser(this.auth.currentUser()),
  );

  /**
   * Permisos por módulo: por defecto derivan del rol base; si el usuario tiene
   * un perfil de acceso asignado (ADMIN-01), sus ajustes finos se aplican encima.
   */
  readonly permisosModulos = computed<PermisosPorModulo>(() =>
    combinarPermisosPerfil(permisosPorDefectoDesdeRol(this.rol()), this.permisosFinosState()),
  );

  /**
   * Carga perezosa de los ajustes finos del perfil. Silenciosa ante errores:
   * sin perfil (o sin RPC desplegada) se mantiene el comportamiento por rol base.
   */
  async asegurarPermisosPerfil(): Promise<void> {
    if (this.permisosFinosState() !== null) return;
    if (this.cargaPermisosFinosPromise) return this.cargaPermisosFinosPromise;

    this.cargaPermisosFinosPromise = (async () => {
      try {
        const { data, error } = await this.supabase.rpc('obtener_perfil_acceso_actual');
        if (error) return;
        const perfil = (data ?? [])[0];
        if (perfil) {
          this.permisosFinosState.set(normalizarPermisosFinos(perfil.permisos));
        }
      } catch {
        /* fallback silencioso al rol base */
      } finally {
        this.cargaPermisosFinosPromise = null;
      }
    })();
    return this.cargaPermisosFinosPromise;
  }

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
