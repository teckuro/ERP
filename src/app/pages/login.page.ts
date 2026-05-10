import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="login-page">
      <section class="login-card" aria-labelledby="login-title">
        <div class="login-card__header">
          <div class="login-card__icon" aria-hidden="true">
            <lucide-icon name="lock" class="h-5 w-5"></lucide-icon>
          </div>
          <div>
            <p class="login-card__eyebrow">ERP remuneraciones</p>
            <h1 id="login-title" class="login-card__title">Iniciar sesion</h1>
          </div>
        </div>

        <p class="login-card__lead">
          Ingresa con tu usuario de desarrollo para acceder al ERP de remuneraciones.
        </p>

        @if (errorMessage()) {
          <p class="login-error" role="alert">{{ errorMessage() }}</p>
        }

        <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label class="login-field" for="login-email">
            <span>Correo</span>
            <input
              id="login-email"
              type="email"
              autocomplete="username"
              formControlName="email"
              [class.login-input--invalid]="showEmailError()"
            />
            @if (showEmailError()) {
              <small>Ingresa un correo valido.</small>
            }
          </label>

          <label class="login-field" for="login-password">
            <span>Contrasena</span>
            <input
              id="login-password"
              type="password"
              autocomplete="current-password"
              formControlName="password"
              [class.login-input--invalid]="showPasswordError()"
            />
            @if (showPasswordError()) {
              <small>Ingresa la contrasena.</small>
            }
          </label>

          <button class="login-submit" type="submit" [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Iniciando...' : 'Iniciar sesion' }}
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: #f8fafc;
      }

      .login-page {
        display: grid;
        min-height: 100dvh;
        place-items: center;
        padding: 24px;
      }

      .login-card {
        width: min(100%, 26rem);
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
        padding: 24px;
      }

      .login-card__header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .login-card__icon {
        display: inline-flex;
        height: 36px;
        width: 36px;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: #eff6ff;
        color: #2563eb;
      }

      .login-card__eyebrow {
        margin: 0;
        color: #6b7280;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .login-card__title {
        margin: 2px 0 0;
        color: #111827;
        font-size: 1.25rem;
        font-weight: 650;
        line-height: 1.2;
      }

      .login-card__lead {
        margin: 16px 0 0;
        color: #4b5563;
        font-size: 0.875rem;
        line-height: 1.45;
      }

      .login-error {
        margin: 16px 0 0;
        border: 1px solid #fecaca;
        border-radius: 6px;
        background: #fef2f2;
        color: #991b1b;
        font-size: 0.82rem;
        line-height: 1.4;
        padding: 8px 12px;
      }

      .login-form {
        display: grid;
        gap: 12px;
        margin-top: 16px;
      }

      .login-field {
        display: grid;
        gap: 4px;
        color: #374151;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .login-field input {
        box-sizing: border-box;
        height: 38px;
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0 10px;
        color: #111827;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .login-field input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.16);
        outline: none;
      }

      .login-field input.login-input--invalid {
        border-color: #dc2626;
      }

      .login-field small {
        color: #dc2626;
        font-size: 0.72rem;
        font-weight: 500;
      }

      .login-submit {
        display: inline-flex;
        min-height: 38px;
        align-items: center;
        justify-content: center;
        border: 1px solid #2563eb;
        border-radius: 6px;
        background: #2563eb;
        color: #ffffff;
        font-size: 0.875rem;
        font-weight: 650;
        padding: 0 16px;
      }

      .login-submit:hover:not(:disabled) {
        background: #1d4ed8;
      }

      .login-submit:disabled {
        cursor: not-allowed;
        opacity: 0.68;
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
  readonly errorMessage = signal<string | null>(null);

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

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Ingresa correo y contrasena para iniciar sesion.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch {
      this.errorMessage.set('No se pudo iniciar sesion. Revisa el correo y la contrasena.');
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
