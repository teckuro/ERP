import { computed, signal, type Provider } from '@angular/core';

import { MODULOS_PERMISO, type PermisosPorModulo } from '../erp-permisos-modulos.rules';
import { ErpPermisosRemuneracionesService } from '../erp-permisos-remuneraciones.service';

/**
 * Stub de permisos para tests de componentes que no deben depender de Supabase.
 * Por defecto concede ver/editar en todos los módulos; `soloConsulta: true` simula
 * el perfil de solo lectura (ver sí, editar no).
 */
export function provideErpPermisosStub(opciones: { soloConsulta?: boolean } = {}): Provider {
  const editar = !opciones.soloConsulta;
  const modulos = Object.fromEntries(
    MODULOS_PERMISO.map((m) => [m, { ver: true, editar }]),
  ) as PermisosPorModulo;
  const permisosModulos = signal(modulos);

  return {
    provide: ErpPermisosRemuneracionesService,
    useValue: {
      rol: signal(editar ? 'admin_remuneraciones' : 'consulta_remuneraciones'),
      permisosModulos,
      puedeEscribirNomina: computed(() => editar),
      esSoloConsulta: computed(() => !editar),
      esAdministradorRemuneraciones: computed(() => editar),
      asegurarPermisosPerfil: () => Promise.resolve(),
    } satisfies Partial<Record<keyof ErpPermisosRemuneracionesService, unknown>>,
  };
}
