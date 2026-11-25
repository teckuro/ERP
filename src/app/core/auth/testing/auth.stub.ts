import { computed, signal, type Provider } from '@angular/core';
import type { User } from '@supabase/supabase-js';

import { AuthService } from '../auth.service';

/**
 * Stub de AuthService para tests de servicios que no deben depender de Supabase
 * (p. ej. los que usan `limpiarAlCambiarUsuario`). Devuelve también la señal del
 * usuario para simular cierre de sesión o cambio de usuario en el test.
 */
export function provideAuthStub(usuarioInicial: Partial<User> | null = { id: 'usuario-test' }): {
  provider: Provider;
  usuario: ReturnType<typeof signal<Partial<User> | null>>;
} {
  const usuario = signal<Partial<User> | null>(usuarioInicial);
  return {
    usuario,
    provider: {
      provide: AuthService,
      useValue: {
        currentUser: usuario,
        isAuthenticated: computed(() => usuario() != null),
      },
    },
  };
}
