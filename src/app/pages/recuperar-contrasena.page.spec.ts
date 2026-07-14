import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../core/auth/auth.service';
import { RecuperarContrasenaPage } from './recuperar-contrasena.page';

function createAuthMock() {
  return {
    solicitarRecuperacionContrasena: vi.fn().mockResolvedValue(undefined),
  };
}

async function setup(auth = createAuthMock()): Promise<{
  fixture: ComponentFixture<RecuperarContrasenaPage>;
  auth: ReturnType<typeof createAuthMock>;
}> {
  await TestBed.configureTestingModule({
    imports: [RecuperarContrasenaPage],
    providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(RecuperarContrasenaPage);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, auth };
}

describe('RecuperarContrasenaPage', () => {
  it('valida correo antes de solicitar recuperacion', async () => {
    const { fixture, auth } = await setup();

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(auth.solicitarRecuperacionContrasena).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ingresa el correo corporativo registrado.');
  });

  it('solicita correo de recuperacion y muestra estado seguro', async () => {
    const { fixture, auth } = await setup();

    fixture.componentInstance.form.setValue({ email: 'rrhh@empresa.cl' });
    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(auth.solicitarRecuperacionContrasena).toHaveBeenCalledWith('rrhh@empresa.cl');
    expect(fixture.nativeElement.textContent).toContain('Correo enviado');
  });
});
