import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Building2, Check, Eye, Lock, Mail, Unlock } from 'lucide-angular/src/icons';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../core/auth/auth.service';
import { LoginPage } from './login.page';

function createAuthMock() {
  return {
    getSession: vi.fn().mockResolvedValue(null),
    login: vi.fn().mockResolvedValue(undefined),
  };
}

async function setup(auth = createAuthMock()): Promise<{
  fixture: ComponentFixture<LoginPage>;
  auth: ReturnType<typeof createAuthMock>;
  router: Router;
}> {
  await TestBed.configureTestingModule({
    imports: [LoginPage],
    providers: [
      { provide: AuthService, useValue: auth },
      provideRouter([]),
      importProvidersFrom(LucideAngularModule.pick({ Building2, Check, Eye, Lock, Mail, Unlock })),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginPage);
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, auth, router };
}

describe('LoginPage', () => {
  it('renderiza email, password y boton de inicio', async () => {
    const { fixture } = await setup();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Iniciar sesion');
    expect(fixture.nativeElement.querySelector('#login-email')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#login-password')).not.toBeNull();
  });

  it('expone enlace publico para recuperar contrasena', async () => {
    const { fixture } = await setup();
    const link = fixture.nativeElement.querySelector('a[aria-label="Recuperar contrasena"]') as HTMLAnchorElement;

    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/recuperar-contrasena');
  });

  it('valida campos requeridos sin llamar login', async () => {
    const { fixture, auth } = await setup();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ingresa correo y contrasena para iniciar sesion.');
  });

  it('muestra error operativo en login fallido', async () => {
    const auth = createAuthMock();
    auth.login.mockRejectedValue(new Error('raw auth error'));
    const { fixture } = await setup(auth);
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'rrhh@empresa.cl', password: 'secret' });
    await component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudo iniciar sesion. Revisa el correo y la contrasena.');
    expect(fixture.nativeElement.textContent).not.toContain('raw auth error');
  });

  it('redirige despues de login correcto', async () => {
    const { fixture, auth, router } = await setup();
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'rrhh@empresa.cl', password: 'secret' });
    await component.submit();

    expect(auth.login).toHaveBeenCalledWith('rrhh@empresa.cl', 'secret');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
