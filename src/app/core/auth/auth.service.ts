import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';

import { injectSupabase } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly supabase = injectSupabase();
  private readonly sessionState = signal<Session | null>(null);
  private readonly readyState = signal(false);
  private readonly subscription: Subscription | null;

  readonly currentUser = computed<User | null>(() => this.sessionState()?.user ?? null);
  readonly currentEmail = computed(() => this.currentUser()?.email ?? null);
  readonly isAuthenticated = computed(() => this.currentUser() != null);
  readonly isReady = computed(() => this.readyState());

  constructor() {
    void this.refreshSession();

    const { data } = this.supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      this.sessionState.set(session);
      this.readyState.set(true);
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

    this.sessionState.set(data.session);
    this.readyState.set(true);
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
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

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private async refreshSession(): Promise<void> {
    await this.getSession();
  }
}
