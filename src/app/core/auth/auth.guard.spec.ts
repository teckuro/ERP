import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { authChildGuard, authGuard } from './auth.guard';

function runGuard(url: string, authenticated: boolean) {
  const auth = {
    getSession: vi.fn().mockResolvedValue(authenticated ? { user: { id: 'u1' } } : null),
  };

  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
  });

  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
}

describe('authGuard', () => {
  it('permite ruta con sesion', async () => {
    await expect(runGuard('/remuneraciones/proceso-mensual', true)).resolves.toBe(true);
  });

  it('redirige a login sin sesion y conserva destino', async () => {
    const result = await runGuard('/remuneraciones/proceso-mensual', false);
    const router = TestBed.inject(Router);

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/login?returnUrl=%2Fremuneraciones%2Fproceso-mensual',
    );
  });

  it('authChildGuard reutiliza la misma regla', async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
    });

    const result = await TestBed.runInInjectionContext(() =>
      authChildGuard({} as ActivatedRouteSnapshot, { url: '/parametros' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });
});
