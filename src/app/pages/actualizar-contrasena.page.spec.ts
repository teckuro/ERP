import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../core/auth/auth.service';
import { ActualizarContrasenaPage } from './actualizar-contrasena.page';

function createAuthMock() {
  return {
    getSession: vi.fn().mockResolvedValue({ user: { id: 'u1', email: 'rrhh@empresa.cl' } }),
    actualizarContrasena: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

async function setup(auth = createAuthMock()): Promise<{
  fixture: ComponentFixture<ActualizarContrasenaPage>;
  auth: ReturnType<typeof createAuthMock>;
}> {
  await TestBed.configureTestingModule({
    imports: [ActualizarContrasenaPage],
    providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(ActualizarContrasenaPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, auth };
}

describe('ActualizarContrasenaPage', () => {
  it('bloquea guardado si no hay sesion de recuperacion', async () => {
    const auth = createAuthMock();
    auth.getSession.mockResolvedValue(null);
    const { fixture } = await setup(auth);

    fixture.componentInstance.form.setValue({
      password: 'nueva-clave',
      confirmPassword: 'nueva-clave',
    });
    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(auth.actualizarContrasena).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Solicita un nuevo enlace');
  });

  it('valida coincidencia de contrasenas', async () => {
    const { fixture, auth } = await setup();

    fixture.componentInstance.form.setValue({
      password: 'nueva-clave',
      confirmPassword: 'otra-clave',
    });
    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(auth.actualizarContrasena).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Revisa la nueva contrasena antes de guardar.');
  });

  it('actualiza contrasena y cierra sesion temporal', async () => {
    const { fixture, auth } = await setup();

    fixture.componentInstance.form.setValue({
      password: 'nueva-clave',
      confirmPassword: 'nueva-clave',
    });
    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(auth.actualizarContrasena).toHaveBeenCalledWith('nueva-clave');
    expect(auth.logout).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Contrasena actualizada');
  });
});
