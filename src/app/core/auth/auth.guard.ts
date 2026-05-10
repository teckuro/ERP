import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';

async function canUsePrivateRoute(url: string): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = await auth.getSession();

  if (session?.user) return true;

  return router.createUrlTree(['/login'], {
    queryParams: url && url !== '/' ? { returnUrl: url } : undefined,
  });
}

export const authGuard: CanActivateFn = (_route, state) => canUsePrivateRoute(state.url);

export const authChildGuard: CanActivateChildFn = (_route, state) => canUsePrivateRoute(state.url);
