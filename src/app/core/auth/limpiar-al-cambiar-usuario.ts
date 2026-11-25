import { effect, inject, untracked } from '@angular/core';

import { AuthService } from './auth.service';

/**
 * Para servicios `providedIn: 'root'` que guardan datos de la sesión (empresa,
 * permisos, cachés). Ejecuta `limpiar` cada vez que cambia el usuario: cierre de
 * sesión manual, sesión vencida o ingreso de otro usuario en la misma pestaña.
 * El refresco de token del mismo usuario no limpia.
 *
 * Llamar en un contexto de inyección (constructor o inicializador de campo).
 */
export function limpiarAlCambiarUsuario(limpiar: () => void): void {
  const auth = inject(AuthService);
  let usuarioAnterior: string | null | undefined;

  effect(() => {
    const usuario = auth.currentUser()?.id ?? null;
    if (usuarioAnterior !== undefined && usuario !== usuarioAnterior) {
      untracked(limpiar);
    }
    usuarioAnterior = usuario;
  });
}
