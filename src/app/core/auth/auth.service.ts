import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';

import { injectSupabase } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private static readonly RECOVERY_FLAG_KEY = 'angular-erp-password-recovery';

  private readonly supabase = injectSupabase();
  private readonly sessionState = signal<Session | null>(null);
  private readonly readyState = signal(false);
  private readonly passwordRecoveryState = signal(this.readRecoveryFlag());
  private readonly subscription: Subscription | null;

  readonly currentUser = computed<User | null>(() => this.sessionState()?.user ?? null);
  readonly currentEmail = computed(() => this.currentUser()?.email ?? null);
  readonly isAuthenticated = computed(() => this.currentUser() != null);
  readonly isReady = computed(() => this.readyState());
  readonly isPasswordRecovery = computed(() => this.passwordRecoveryState());

  constructor() {
    void this.refreshSession();

    const { data } = this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.sessionState.set(session);
      this.readyState.set(true);

      // Flujo oficial Supabase: el enlace de correo emite PASSWORD_RECOVERY.
      if (event === 'PASSWORD_RECOVERY') {
        this.markPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        this.markPasswordRecovery(false);
      }
    });
    this.subscription = data.subscription;
  }

  async login(email: string, password: string): Promise<void> {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      throw new Error('Ingresa correo y contrasena para iniciar sesion.');
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.session) {
      throw new Error('No se pudo iniciar sesion. Revisa el correo y la contrasena.');
    }

    this.markPasswordRecovery(false);
    this.sessionState.set(data.session);
    this.readyState.set(true);
  }

  async solicitarRecuperacionContrasena(email: string): Promise<void> {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      throw new Error('Ingresa el correo registrado para recuperar la contrasena.');
    }

    const { error } = await this.supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: this.passwordRecoveryRedirectUrl(),
    });

    if (error) {
      throw new Error('No fue posible enviar el correo de recuperacion. Intenta nuevamente.');
    }
  }

  async actualizarContrasena(password: string): Promise<void> {
    const normalizedPassword = password.trim();
    if (normalizedPassword.length < 8) {
      throw new Error('La nueva contrasena debe tener al menos 8 caracteres.');
    }

    if (!this.tieneSesionRecuperacion()) {
      throw new Error('El enlace de recuperacion no esta activo o ya expiro. Solicita uno nuevo.');
    }

    const { data, error } = await this.supabase.auth.updateUser({
      password: normalizedPassword,
    });

    if (error || !data.user) {
      throw new Error('No fue posible actualizar la contrasena. Solicita un nuevo enlace.');
    }

    const session = await this.getSession();
    this.sessionState.set(session);
    this.readyState.set(true);
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    this.markPasswordRecovery(false);
    this.sessionState.set(null);
    this.readyState.set(true);

    if (error) {
      throw new Error('No se pudo cerrar la sesion. Intenta nuevamente.');
    }
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) return null;
    this.sessionState.set(data.session ?? null);
    this.readyState.set(true);
    return data.session ?? null;
  }

  /**
   * Espera a que el cliente Auth termine de hidratar la sesion
   * (incluido detectSessionInUrl del enlace de recuperacion).
   */
  async esperarSesionRecuperacion(timeoutMs = 8000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (this.tieneSesionRecuperacion()) {
        return true;
      }

      if (!this.readyState()) {
        await this.delay(50);
        continue;
      }

      // Auth listo pero el evento PASSWORD_RECOVERY puede llegar justo despues
      // de getSession inicial (tokens en URL / PKCE).
      if (this.sessionState()?.user && this.passwordRecoveryState()) {
        return true;
      }

      await this.delay(50);
    }

    if (!this.readyState()) {
      await this.getSession();
    }

    return this.tieneSesionRecuperacion();
  }

  tieneSesionRecuperacion(): boolean {
    return this.passwordRecoveryState() && this.sessionState()?.user != null;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private async refreshSession(): Promise<void> {
    await this.getSession();
  }

  private passwordRecoveryRedirectUrl(): string {
    return `${globalThis.location.origin}/actualizar-contrasena`;
  }

  private markPasswordRecovery(active: boolean): void {
    this.passwordRecoveryState.set(active);
    try {
      if (active) {
        sessionStorage.setItem(AuthService.RECOVERY_FLAG_KEY, '1');
      } else {
        sessionStorage.removeItem(AuthService.RECOVERY_FLAG_KEY);
      }
    } catch {
      // sessionStorage puede fallar en modo privado; el signal en memoria sigue activo.
    }
  }

  private readRecoveryFlag(): boolean {
    try {
      return sessionStorage.getItem(AuthService.RECOVERY_FLAG_KEY) === '1';
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
