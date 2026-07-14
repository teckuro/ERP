import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="login-page">
      <section class="login-brand" aria-label="Sistema ERP">
        <div class="login-brand__grid" aria-hidden="true"></div>
        <div class="login-brand__glow login-brand__glow--top" aria-hidden="true"></div>
        <div class="login-brand__glow login-brand__glow--bottom" aria-hidden="true"></div>

        <div class="login-brand__content">
          <div class="login-brand__logo">
            <div class="login-brand__mark" aria-hidden="true">
              <lucide-icon name="building-2"></lucide-icon>
            </div>
            <div>
              <p class="login-brand__name">ERP System</p>
              <p class="login-brand__caption">Enterprise Portal</p>
            </div>
          </div>

          <div class="login-brand__message">
            <p>Bienvenido al</p>
            <h1>Sistema ERP</h1>
            <span>
              Acceso seguro a la plataforma de gestion empresarial. Inicia sesion con tus credenciales corporativas.
            </span>
          </div>

          <div class="login-brand__features" aria-label="Caracteristicas de seguridad">
            <div class="login-feature">
              <span class="login-feature__icon" aria-hidden="true">
                <lucide-icon name="lock"></lucide-icon>
              </span>
              <span>
                <strong>Conexion Segura</strong>
                <small>Cifrado SSL/TLS de extremo a extremo</small>
              </span>
            </div>
            <div class="login-feature">
              <span class="login-feature__icon" aria-hidden="true">
                <lucide-icon name="check"></lucide-icon>
              </span>
              <span>
                <strong>Proteccion de Datos</strong>
                <small>Cumplimiento con estandares de seguridad</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="login-access" aria-labelledby="login-title">
        <div class="login-access__inner">
          <div class="login-access__mobile-brand">
            <div class="login-access__mobile-mark" aria-hidden="true">
              <lucide-icon name="building-2"></lucide-icon>
            </div>
            <span>ERP System</span>
          </div>

          <div class="login-card">
            <div class="login-card__header">
              <h2 id="login-title" class="login-card__title">Iniciar sesion</h2>
              <p class="login-card__lead">Accede al sistema con tus credenciales corporativas</p>
            </div>

            <div class="login-card__divider" aria-hidden="true"></div>

            @if (mensajeError()) {
              <p class="login-error" role="alert">{{ mensajeError() }}</p>
            }

            <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <label class="login-field" for="login-email">
                <span>Correo corporativo</span>
                <input
                  id="login-email"
                  type="email"
                  autocomplete="username"
                  formControlName="email"
                  placeholder="usuario@empresa.com"
                  [class.login-input--invalid]="showEmailError()"
                  [attr.aria-invalid]="showEmailError()"
                />
                @if (showEmailError()) {
                  <small>Ingresa un correo valido.</small>
                }
              </label>

              <label class="login-field" for="login-password">
                <span>Contrasena</span>
                <span class="login-password">
                  <input
                    id="login-password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="current-password"
                    formControlName="password"
                    placeholder="Ingresa tu contrasena"
                    [class.login-input--invalid]="showPasswordError()"
                    [attr.aria-invalid]="showPasswordError()"
                  />
                  <button
                    class="login-password__toggle"
                    type="button"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword() ? 'Ocultar contrasena' : 'Mostrar contrasena'"
                  >
                    <lucide-icon [name]="showPassword() ? 'unlock' : 'eye'"></lucide-icon>
                  </button>
                </span>
                @if (showPasswordError()) {
                  <small>Ingresa la contrasena.</small>
                }
              </label>

              <div class="login-options">
                <label class="login-remember" for="login-remember">
                  <input id="login-remember" type="checkbox" [checked]="rememberMe()" (change)="toggleRememberMe()" />
                  <span aria-hidden="true">
                    @if (rememberMe()) {
                      <lucide-icon name="check"></lucide-icon>
                    }
                  </span>
                  Mantener sesion iniciada
                </label>
                <a routerLink="/recuperar-contrasena" aria-label="Recuperar contrasena">Olvidaste tu contrasena?</a>
              </div>

              <button class="login-submit" type="submit" [disabled]="isSubmitting()">
                @if (isSubmitting()) {
                  <span class="login-submit__spinner" aria-hidden="true"></span>
                }
                {{ isSubmitting() ? 'Verificando credenciales...' : 'Iniciar sesion' }}
              </button>
            </form>
          </div>

          <div class="login-support">
            <lucide-icon name="mail" aria-hidden="true"></lucide-icon>
            <p>
              <strong>Necesitas acceso o tienes problemas?</strong>
              <span>Contacta al <a href="#">administrador del sistema</a></span>
            </p>
          </div>

          <p class="login-version">v2.5.4 | Build 20260414</p>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: #f9fafb;
        color: #0f172a;
      }

      .login-page {
        display: flex;
        min-height: 100dvh;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif;
      }

      .login-brand {
        position: relative;
        display: none;
        width: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, #0f2a44 0%, #1b3a5b 40%, #2563eb 100%);
        color: #ffffff;
      }

      .login-brand__grid {
        position: absolute;
        inset: 0;
        opacity: 0.06;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.8) 1px, transparent 1px);
        background-size: 40px 40px;
      }

      .login-brand__glow {
        position: absolute;
        width: 18rem;
        height: 18rem;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.32) 0%, transparent 70%);
        filter: blur(44px);
        opacity: 0;
        animation: login-glow 1.1s ease-out forwards;
      }

      .login-brand__glow--top {
        top: 5rem;
        right: 5rem;
      }

      .login-brand__glow--bottom {
        bottom: 8rem;
        left: 4rem;
        width: 20rem;
        height: 20rem;
        animation-delay: 0.18s;
      }

      .login-brand__content {
        position: relative;
        z-index: 1;
        display: flex;
        width: 100%;
        flex-direction: column;
        justify-content: space-between;
        padding: 48px;
      }

      .login-brand__logo {
        display: flex;
        align-items: center;
        gap: 12px;
        animation: login-enter-top 0.7s ease-out both;
      }

      .login-brand__mark,
      .login-access__mobile-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }

      .login-brand__mark {
        height: 48px;
        width: 48px;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
      }

      .login-brand__mark lucide-icon,
      .login-access__mobile-mark lucide-icon {
        width: 28px;
        height: 28px;
      }

      .login-brand__name {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.1;
      }

      .login-brand__caption {
        margin: 4px 0 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.8125rem;
        font-weight: 500;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .login-brand__message {
        animation: login-enter-up 0.8s 0.16s ease-out both;
      }

      .login-brand__message p {
        margin: 0 0 8px;
        color: rgba(255, 255, 255, 0.9);
        font-size: clamp(1.25rem, 2.5vw, 1.5rem);
        font-weight: 400;
        line-height: 1.3;
      }

      .login-brand__message h1 {
        margin: 0 0 24px;
        color: #ffffff;
        font-size: clamp(2.25rem, 4.5vw, 3.5rem);
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.1;
      }

      .login-brand__message span {
        display: block;
        max-width: 26rem;
        color: rgba(255, 255, 255, 0.85);
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.6;
      }

      .login-brand__features {
        display: grid;
        gap: 16px;
        animation: login-fade 0.8s 0.36s ease-out both;
      }

      .login-feature {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .login-feature__icon {
        display: inline-flex;
        width: 40px;
        height: 40px;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(10px);
      }

      .login-feature__icon lucide-icon {
        width: 20px;
        height: 20px;
      }

      .login-feature strong,
      .login-feature small {
        display: block;
      }

      .login-feature strong {
        color: #ffffff;
        font-size: 0.9375rem;
        font-weight: 600;
      }

      .login-feature small {
        margin-top: 2px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.8125rem;
        font-weight: 400;
      }

      .login-access {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
        padding: 32px;
      }

      .login-access__inner {
        width: min(100%, 28rem);
        animation: login-enter-up 0.7s 0.08s ease-out both;
      }

      .login-access__mobile-brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 32px;
        color: #0f172a;
        font-size: 1.375rem;
        font-weight: 700;
      }

      .login-access__mobile-mark {
        height: 40px;
        width: 40px;
        background: linear-gradient(135deg, #0f2a44 0%, #2563eb 100%);
        color: #ffffff;
      }

      .login-card {
        border-radius: 12px;
        background: #ffffff;
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
        padding: 40px;
      }

      .login-card__header {
        margin-bottom: 28px;
      }

      .login-card__title {
        margin: 0 0 8px;
        color: #0f172a;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.2;
      }

      .login-card__lead {
        margin: 0;
        color: #64748b;
        font-size: 0.9375rem;
        font-weight: 400;
        line-height: 1.5;
      }

      .login-card__divider {
        height: 1px;
        margin-bottom: 32px;
        background: #e2e8f0;
      }

      .login-error {
        margin: -12px 0 20px;
        border: 1px solid #fecaca;
        border-radius: 8px;
        background: #fef2f2;
        color: #991b1b;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1.4;
        padding: 10px 12px;
      }

      .login-form {
        display: grid;
        gap: 24px;
      }

      .login-field {
        display: grid;
        gap: 8px;
        color: #475569;
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .login-field input {
        box-sizing: border-box;
        height: 48px;
        width: 100%;
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        color: #0f172a;
        font-size: 0.9375rem;
        font-weight: 400;
        letter-spacing: 0;
        padding: 0 16px;
        text-transform: none;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .login-field input::placeholder {
        color: #94a3b8;
      }

      .login-field input:focus {
        border-color: #2563eb;
        box-shadow:
          0 0 0 3px rgba(37, 99, 235, 0.12),
          0 1px 2px 0 rgba(0, 0, 0, 0.05);
        outline: none;
      }

      .login-field input.login-input--invalid {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      }

      .login-field small {
        color: #dc2626;
        font-size: 0.8125rem;
        font-weight: 500;
        letter-spacing: 0;
        text-transform: none;
      }

      .login-password {
        position: relative;
        display: block;
      }

      .login-password input {
        padding-right: 48px;
      }

      .login-password__toggle {
        position: absolute;
        top: 50%;
        right: 8px;
        display: inline-flex;
        width: 36px;
        height: 36px;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        transform: translateY(-50%);
        transition: background-color 0.2s ease;
      }

      .login-password__toggle:hover {
        background: #f1f5f9;
      }

      .login-password__toggle lucide-icon {
        width: 18px;
        height: 18px;
      }

      .login-options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-top: 2px;
      }

      .login-options a,
      .login-support a {
        color: #2563eb;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
      }

      .login-options a:hover,
      .login-support a:hover {
        text-decoration: underline;
      }

      .login-remember {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: #475569;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.2;
      }

      .login-remember input {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
      }

      .login-remember span {
        display: inline-flex;
        width: 20px;
        height: 20px;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border: 1.5px solid #d1d5db;
        border-radius: 4px;
        background: #ffffff;
        color: #ffffff;
        transition:
          background-color 0.2s ease,
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .login-remember input:checked + span {
        border-color: #2563eb;
        background: #2563eb;
      }

      .login-remember input:focus-visible + span {
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      .login-remember lucide-icon {
        width: 14px;
        height: 14px;
      }

      .login-submit {
        display: inline-flex;
        min-height: 48px;
        width: 100%;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 0;
        border-radius: 8px;
        background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow:
          0 2px 8px rgba(37, 99, 235, 0.25),
          0 1px 3px rgba(0, 0, 0, 0.1);
        color: #ffffff;
        cursor: pointer;
        font-size: 0.9375rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        padding: 0 16px;
        transition:
          box-shadow 0.2s ease,
          transform 0.2s ease,
          opacity 0.2s ease;
      }

      .login-submit:hover:not(:disabled) {
        box-shadow:
          0 4px 12px rgba(37, 99, 235, 0.35),
          0 2px 4px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
      }

      .login-submit:active:not(:disabled) {
        transform: scale(0.98);
      }

      .login-submit:disabled {
        cursor: not-allowed;
        opacity: 0.6;
        transform: none;
      }

      .login-submit__spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.45);
        border-top-color: #ffffff;
        border-radius: 999px;
        animation: login-spin 0.8s linear infinite;
      }

      .login-support {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-top: 24px;
        border: 1px solid #bfdbfe;
        border-radius: 10px;
        background: #eff6ff;
        padding: 16px;
      }

      .login-support lucide-icon {
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
        margin-top: 2px;
        color: #1e40af;
      }

      .login-support p {
        margin: 0;
        color: #1e40af;
        font-size: 0.8125rem;
        line-height: 1.5;
      }

      .login-support strong,
      .login-support span {
        display: block;
      }

      .login-support strong {
        margin-bottom: 4px;
        color: #1e3a8a;
        font-weight: 600;
      }

      .login-version {
        margin: 24px 0 0;
        color: #94a3b8;
        font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
        font-size: 0.75rem;
        font-weight: 400;
        text-align: center;
      }

      @keyframes login-enter-up {
        from {
          opacity: 0;
          transform: translateY(28px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes login-enter-top {
        from {
          opacity: 0;
          transform: translateY(-18px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes login-fade {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      @keyframes login-glow {
        from {
          opacity: 0;
          transform: scale(0.8);
        }

        to {
          opacity: 0.12;
          transform: scale(1);
        }
      }

      @keyframes login-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (min-width: 1024px) {
        .login-brand {
          display: flex;
        }

        .login-access {
          width: 50%;
        }

        .login-access__mobile-brand {
          display: none;
        }
      }

      @media (min-width: 1280px) {
        .login-brand__content {
          padding: 64px;
        }
      }

      @media (max-width: 560px) {
        .login-access {
          align-items: flex-start;
          padding: 24px 16px;
        }

        .login-card {
          padding: 28px 20px;
        }

        .login-options {
          align-items: flex-start;
          flex-direction: column;
          gap: 12px;
        }
      }
    `,
  ],
})
export class LoginPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly rememberMe = signal(false);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async ngOnInit(): Promise<void> {
    const session = await this.auth.getSession();
    if (session?.user) {
      await this.router.navigateByUrl(this.safeReturnUrl());
    }
  }

  showEmailError(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (this.submitted() || control.touched);
  }

  showPasswordError(): boolean {
    const control = this.form.controls.password;
    return control.invalid && (this.submitted() || control.touched);
  }

  toggleRememberMe(): void {
    this.rememberMe.update((value) => !value);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.mensajeError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensajeError.set('Ingresa correo y contrasena para iniciar sesion.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch {
      this.mensajeError.set('No se pudo iniciar sesion. Revisa el correo y la contrasena.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private safeReturnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return '/';
    return value;
  }
}
