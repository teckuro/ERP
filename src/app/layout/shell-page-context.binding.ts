import { DestroyRef, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';

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
 * Publica contexto de topbar mientras el host vive y restaura fallback de ruta al destruirse.
 */
export function bindShellPageContext(
  destroyRef: DestroyRef,
  source: () => ShellPageContext,
  options?: BindShellPageContextOptions,
): void {
  const shellContext = inject(ShellPageContextService);
  const router = inject(Router);

  if (options?.onPrimaryAction) {
    shellContext.registerPrimaryActionHandler(options.onPrimaryAction);
  }

  shellContext.setBindingActive(true);

  effect(() => {
    const ctx = source();
    untracked(() => shellContext.setContext(ctx));
  });

  destroyRef.onDestroy(() => {
    shellContext.setBindingActive(false);
    shellContext.registerPrimaryActionHandler(null);
    shellContext.clearContext();
    shellContext.applyRouteFallback(router.url ?? '/');
  });
}

export function shellBreadcrumbsForRoute(url: string): ShellPageContext['breadcrumbs'] {
  return resolveShellRouteBreadcrumbs(url);
}
