import { DestroyRef, effect, inject, untracked } from '@angular/core';

import { resolveShellRouteBreadcrumbs } from './shell-route-context.config';
import {
  ShellPageContextService,
  type ShellPageContext,
  type ShellPrimaryActionHandler,
} from './shell-page-context.service';

export type BindShellPageContextOptions = {
  onPrimaryAction?: ShellPrimaryActionHandler;
};

/**
 * Publica el contexto del topbar mientras el host vive. La sincronización con
 * el router se centraliza en `LayoutShellComponent`, que recibe los eventos
 * `NavigationStart`/`NavigationEnd` y gestiona el fallback de ruta. Aquí solo
 * reclamamos un token de propiedad, escribimos contexto con ese token y lo
 * liberamos al destruirse el host. El servicio ignora escrituras y
 * liberaciones de tokens obsoletos, evitando la race entre destroy del
 * container anterior e init del nuevo bajo `<router-outlet>`.
 */
export function bindShellPageContext(
  destroyRef: DestroyRef,
  source: () => ShellPageContext,
  options?: BindShellPageContextOptions,
): void {
  const shellContext = inject(ShellPageContextService);

  const token = shellContext.claimOwnership();

  if (options?.onPrimaryAction) {
    shellContext.registerPrimaryActionHandlerWithToken(token, options.onPrimaryAction);
  }

  effect(() => {
    const ctx = source();
    untracked(() => shellContext.setContextWithToken(token, ctx));
  });

  destroyRef.onDestroy(() => {
    // `releaseOwnership` es no-op si otro container ya tomó la propiedad.
    // El `LayoutShellComponent` se encarga del fallback de ruta cuando
    // termina la navegación.
    shellContext.releaseOwnership(token);
  });
}

export function shellBreadcrumbsForRoute(url: string): ShellPageContext['breadcrumbs'] {
  return resolveShellRouteBreadcrumbs(url);
}
