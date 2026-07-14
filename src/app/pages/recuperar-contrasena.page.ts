import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-recuperar-contrasena-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-recovery-page">
      <section class="auth-recovery-card" aria-labelledby="recovery-title">
        <a class="auth-recovery-back" routerLink="/login">Volver al inicio de sesion</a>

        <header class="auth-recovery-head">
          <p class="auth-recovery-eyebrow">Acceso al ERP</p>
          <h1 id="recovery-title">Recuperar contrasena</h1>
          <p>
            Ingresa tu correo corporativo. Si existe una cuenta activa, enviaremos un enlace
            seguro para definir una nueva contrasena.
          </p>
        </header>

        @if (mensajeExito()) {
          <div class="auth-recovery-status auth-recovery-status--success" role="status">
            <strong>Correo enviado</strong>
            <span>{{ mensajeExito() }}</span>
          </div>
        } @else {
          @if (mensajeError()) {
            <div class="auth-recovery-status auth-recovery-status--error" role="alert">
              {{ mensajeError() }}
            </div>
          }

          <form class="auth-recovery-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label class="auth-recovery-field" for="recovery-email">
              <span>Correo corporativo</span>
              <input
                id="recovery-email"
                type="email"
                autocomplete="username"
                formControlName="email"
                placeholder="usuario@empresa.com"
                [class.auth-recovery-input--invalid]="showEmailError()"
                [attr.aria-invalid]="showEmailError()"
              />
              @if (showEmailError()) {
                <small>Ingresa un correo valido.</small>
              }
            </label>

            <button class="auth-recovery-submit" type="submit" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Enviando enlace...' : 'Enviar enlace de recuperacion' }}
            </button>
          </form>
        }
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: #f8fafc;
        color: #0f172a;
      }

      .auth-recovery-page {
        display: flex;
        min-height: 100dvh;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif;
      }

      .auth-recovery-card {
        width: min(100%, 30rem);
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #ffffff;
        padding: 28px;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
      }

      .auth-recovery-back {
        display: inline-flex;
        margin-bottom: 18px;
        color: #2563eb;
        font-size: 0.82rem;
        font-weight: 650;
        text-decoration: none;
      }

      .auth-recovery-back:hover {
        text-decoration: underline;
      }

      .auth-recovery-head {
        display: grid;
        gap: 8px;
        margin-bottom: 22px;
      }

      .auth-recovery-eyebrow {
        margin: 0;
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .auth-recovery-head h1 {
        margin: 0;
        color: #0f172a;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.2;
      }

      .auth-recovery-head p,
      .auth-recovery-status span {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .auth-recovery-form {
        display: grid;
        gap: 18px;
      }

      .auth-recovery-field {
        display: grid;
        gap: 7px;
        color: #475569;
        font-size: 0.78rem;
        font-weight: 650;
      }

      .auth-recovery-field input {
        box-sizing: border-box;
        width: 100%;
        height: 42px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #ffffff;
        color: #0f172a;
        font-size: 0.92rem;
        padding: 0 12px;
      }

      .auth-recovery-field input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        outline: none;
      }

      .auth-recovery-field input.auth-recovery-input--invalid {
        border-color: #dc2626;
      }

      .auth-recovery-field small {
        color: #dc2626;
        font-size: 0.78rem;
        font-weight: 500;
      }

      .auth-recovery-submit {
        min-height: 40px;
        border: 0;
        border-radius: 8px;
        background: #2563eb;
        color: #ffffff;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 650;
        padding: 0 14px;
      }

      .auth-recovery-submit:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .auth-recovery-status {
        display: grid;
        gap: 4px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      .auth-recovery-status--success {
        border-color: #bbf7d0;
        background: #f0fdf4;
        color: #166534;
      }

      .auth-recovery-status--error {
        margin-bottom: 16px;
        border-color: #fecaca;
        background: #fef2f2;
        color: #991b1b;
      }

      @media (max-width: 560px) {
        .auth-recovery-page {
          align-items: flex-start;
          padding: 18px 14px;
        }

        .auth-recovery-card {
          padding: 22px 18px;
        }
      }
    `,
  ],
})
export class RecuperarContrasenaPage {
  private readonly auth = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  showEmailError(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (this.submitted() || control.touched);
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.mensajeError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensajeError.set('Ingresa el correo corporativo registrado.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.auth.solicitarRecuperacionContrasena(this.form.controls.email.value);
      this.mensajeExito.set(
        'Revisa tu bandeja de entrada y sigue el enlace para crear una nueva contrasena.',
      );
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No fue posible enviar el correo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
