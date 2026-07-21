import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SUPABASE_CLIENT } from '../services/supabase.service';
import { AuthService } from './auth.service';

function createSupabaseMock() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  };
}

describe('AuthService', () => {
  afterEach(() => {
    try {
      sessionStorage.removeItem('angular-erp-password-recovery');
    } catch {
      // Sin DOM (p. ej. runner sin jsdom) no hay sessionStorage.
    }
    TestBed.resetTestingModule();
  });

  it('login exitoso llama Supabase Auth y expone usuario actual', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'rrhh@empresa.cl' } } },
      error: null,
    });

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: supabase }],
    });

    const service = TestBed.inject(AuthService);
    await service.login(' rrhh@empresa.cl ', 'secret');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'rrhh@empresa.cl',
      password: 'secret',
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentEmail()).toBe('rrhh@empresa.cl');
  });

  it('login fallido retorna error operativo sin exponer password ni tokens', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'invalid login' },
    });

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: supabase }],
    });

    const service = TestBed.inject(AuthService);
    await expect(service.login('rrhh@empresa.cl', 'super-secret')).rejects.toThrow(
      'No se pudo iniciar sesion. Revisa el correo y la contrasena.',
    );

    await expect(service.login('', '')).rejects.toThrow('Ingresa correo y contrasena para iniciar sesion.');
  });

  it('logout limpia la sesion local', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'rrhh@empresa.cl' } } },
      error: null,
    });

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: supabase }],
    });

    const service = TestBed.inject(AuthService);
    await service.login('rrhh@empresa.cl', 'secret');
    await service.logout();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('getSession devuelve la sesion actual si existe', async () => {
    const supabase = createSupabaseMock();
    const session = { user: { id: 'u1', email: 'rrhh@empresa.cl' } };
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: supabase }],
    });

    const service = TestBed.inject(AuthService);
    await expect(service.getSession()).resolves.toEqual(session);
    expect(service.currentEmail()).toBe('rrhh@empresa.cl');
  });

  it('solicita recuperacion de contrasena con redirect publico', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: supabase }],
    });

    const service = TestBed.inject(AuthService);
    await service.solicitarRecuperacionContrasena(' rrhh@empresa.cl ');

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('rrhh@empresa.cl', {
      redirectTo: `${globalThis.location.origin}/actualizar-contrasena`,
    });
  });

  it('actualiza contrasena solo con sesion PASSWORD_RECOVERY', async () => {
    const supabase = createSupabaseMock();
    const session = { user: { id: 'u1', email: 'rrhh@empresa.cl' } };
    supabase.auth.updateUser.mockResolvedValue({ data: { user: session.user }, error: null });
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });

    const authListeners: Array<(event: string, session: unknown) => void> = [];
    supabase.auth.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authListeners.push(cb);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: supabase }],
    });

    const service = TestBed.inject(AuthService);
    await expect(service.actualizarContrasena('nueva-clave')).rejects.toThrow(
      'El enlace de recuperacion no esta activo o ya expiro',
    );

    for (const listener of authListeners) {
      listener('PASSWORD_RECOVERY', session);
    }
    await service.actualizarContrasena('nueva-clave');

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'nueva-clave' });
    expect(service.currentEmail()).toBe('rrhh@empresa.cl');
    expect(service.isPasswordRecovery()).toBe(true);
  });

  it('esperarSesionRecuperacion reconoce PASSWORD_RECOVERY', async () => {
    const supabase = createSupabaseMock();
    const session = { user: { id: 'u1', email: 'rrhh@empresa.cl' } };
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });

    const authListeners: Array<(event: string, session: unknown) => void> = [];
    supabase.auth.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authListeners.push(cb);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: supabase }],
    });

    const service = TestBed.inject(AuthService);
    const pending = service.esperarSesionRecuperacion(500);
    for (const listener of authListeners) {
      listener('PASSWORD_RECOVERY', session);
    }
    await expect(pending).resolves.toBe(true);
    expect(service.tieneSesionRecuperacion()).toBe(true);
  });
});
