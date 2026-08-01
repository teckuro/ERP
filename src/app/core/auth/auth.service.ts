import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';

import { injectSupabase } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private static readonly RECOVERY_FLAG_KEY = 'angular-erp-password-recovery';
  /** SEC-06: anti-abuso UX (la capa real es Auth rate limit en Dashboard). */
  private static readonly LOGIN_FAIL_KEY = 'angular-erp-login-fail';
  private static readonly LOGIN_MAX_FAILURES = 5;
  private static readonly LOGIN_COOLDOWN_MS = 45_000;

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

    const cooldownSec = this.loginCooldownRemainingSec();
    if (cooldownSec > 0) {
      throw new Error(
        `Demasiados intentos fallidos. Espera ${cooldownSec} segundos e intenta nuevamente.`,
      );
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.session) {
      this.recordLoginFailure();
      throw new Error('No se pudo iniciar sesion. Revisa el correo y la contrasena.');
    }

    this.clearLoginFailures();
    this.markPasswordRecovery(false);
    this.sessionState.set(data.session);
    this.readyState.set(true);
  }

  /** Segundos restantes de cooldown UX tras fallos de login (0 = libre). */
  loginCooldownRemainingSec(): number {
    const state = this.readLoginFailState();
    if (!state?.lockedUntil) return 0;
    const remainingMs = state.lockedUntil - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
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

  private recordLoginFailure(): void {
    const prev = this.readLoginFailState();
    const failures = (prev?.failures ?? 0) + 1;
    const lockedUntil =
      failures >= AuthService.LOGIN_MAX_FAILURES
        ? Date.now() + AuthService.LOGIN_COOLDOWN_MS
        : prev?.lockedUntil && prev.lockedUntil > Date.now()
          ? prev.lockedUntil
          : null;
    this.writeLoginFailState({
      failures: lockedUntil ? 0 : failures,
      lockedUntil,
    });
  }

  private clearLoginFailures(): void {
    try {
      sessionStorage.removeItem(AuthService.LOGIN_FAIL_KEY);
    } catch {
      // ignore
    }
  }

  private readLoginFailState(): { failures: number; lockedUntil: number | null } | null {
    try {
      const raw = sessionStorage.getItem(AuthService.LOGIN_FAIL_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { failures?: unknown; lockedUntil?: unknown };
      const failures = typeof parsed.failures === 'number' ? parsed.failures : 0;
      const lockedUntil =
        typeof parsed.lockedUntil === 'number' && parsed.lockedUntil > Date.now()
          ? parsed.lockedUntil
          : null;
      if (lockedUntil == null && failures <= 0) {
        sessionStorage.removeItem(AuthService.LOGIN_FAIL_KEY);
        return null;
      }
      return { failures, lockedUntil };
    } catch {
      return null;
    }
  }

  private writeLoginFailState(state: { failures: number; lockedUntil: number | null }): void {
    try {
      if (!state.lockedUntil && state.failures <= 0) {
        sessionStorage.removeItem(AuthService.LOGIN_FAIL_KEY);
        return;
      }
      sessionStorage.setItem(AuthService.LOGIN_FAIL_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
