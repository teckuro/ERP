import { effect, inject, untracked } from '@angular/core';

import { AuthService } from './auth.service';

/**
 * Para servicios `providedIn: 'root'` que guardan datos de la sesión (empresa,
 * permisos, cachés). Ejecuta `limpiar` cada vez que cambia el usuario: cierre de
 * sesión manual, sesión vencida o ingreso de otro usuario en la misma pestaña.
 * El refresco de token del mismo usuario no limpia.
 *
 * Devuelve la **generación de sesión**: sube cada vez que se limpia. Una carga
 * asíncrona anota la generación al empezar y, si al terminar ya cambió, descarta
 * su resultado en vez de publicarlo (evita que la respuesta tardía de la sesión
 * anterior repueble la caché del usuario nuevo).
 *
 * Llamar en un contexto de inyección (constructor o inicializador de campo).
 */
export function limpiarAlCambiarUsuario(limpiar: () => void): () => number {
  const auth = inject(AuthService);
  let usuarioAnterior: string | null | undefined;
  let generacion = 0;

  effect(() => {
    const usuario = auth.currentUser()?.id ?? null;
    if (usuarioAnterior !== undefined && usuario !== usuarioAnterior) {
      generacion++;
      untracked(limpiar);
    }
    usuarioAnterior = usuario;
  });

  return () => generacion;
}
