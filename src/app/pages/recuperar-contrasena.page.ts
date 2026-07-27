import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { AuthAccessShellComponent } from './auth-access-shell.component';

@Component({
  selector: 'app-recuperar-contrasena-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AuthAccessShellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-access.shared.css',
  template: `
    <app-auth-access-shell
      brandEyebrow="Recupera el"
      brandTitle="Acceso al ERP"
      brandLead="Te enviaremos un enlace seguro a tu correo corporativo para definir una nueva contraseña."
      featurePrimaryIcon="mail"
      featurePrimaryTitle="Enlace seguro"
      featurePrimaryLead="El correo solo se envía si la cuenta está activa"
      featureSecondaryIcon="lock"
      featureSecondaryTitle="Sesión temporal"
      featureSecondaryLead="El enlace caduca y no reutiliza tu clave anterior"
      supportTitle="¿Necesitas ayuda?"
      [showSupport]="!mensajeExito()"
    >
      <div class="login-card">
        @if (mensajeExito()) {
          <div class="login-result" role="status">
            <p class="login-result__status">Correo enviado</p>
            <h2 id="recovery-title" class="login-card__title">Revisa tu bandeja</h2>

            <p class="login-card__lead">Si hay una cuenta activa, el enlace llegó a:</p>
            <p class="login-result__email" [attr.title]="emailEnviado()">{{ emailEnviado() }}</p>

            <p class="login-result__hint">
              Abre el mensaje, pulsa <strong>Elegir nueva contraseña</strong> y define la clave en el
              ERP. Revisa spam si no aparece en unos minutos.
            </p>

            <p class="login-result__note">Por seguridad no confirmamos si el correo existe.</p>

            <div class="login-result__actions">
              <a class="login-submit login-submit--link" routerLink="/login">
                Ir al inicio de sesión
              </a>
              <button class="login-result__secondary" type="button" (click)="reintentar()">
                Usar otro correo
              </button>
            </div>
          </div>
        } @else {
          <a class="login-card__back" routerLink="/login">
            <lucide-icon name="arrow-left" aria-hidden="true"></lucide-icon>
            Volver al inicio de sesión
          </a>

          <div class="login-card__header">
            <h2 id="recovery-title" class="login-card__title">Recuperar contraseña</h2>
            <p class="login-card__lead">
              Indica el correo corporativo. Si la cuenta está activa, enviaremos un enlace seguro.
            </p>
          </div>

          <div class="login-card__divider" aria-hidden="true"></div>

          @if (mensajeError()) {
            <p class="login-error" role="alert">{{ mensajeError() }}</p>
          }

          <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label class="login-field" for="recovery-email">
              <span>Correo corporativo</span>
              <input
                id="recovery-email"
                type="email"
                autocomplete="username"
                formControlName="email"
                placeholder="usuario@empresa.com"
                [class.login-input--invalid]="showEmailError()"
                [attr.aria-invalid]="showEmailError()"
              />
              @if (showEmailError()) {
                <small>Ingresa un correo válido.</small>
              }
            </label>

            <button
              class="login-submit"
              type="submit"
              [disabled]="isSubmitting()"
              [attr.aria-busy]="isSubmitting()"
            >
              @if (isSubmitting()) {
                <span class="login-submit__spinner" aria-hidden="true"></span>
              }
              Enviar enlace
            </button>
          </form>
        }
      </div>
    </app-auth-access-shell>
  `,
})
export class RecuperarContrasenaPage {
  private readonly auth = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly emailEnviado = signal('');

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

  reintentar(): void {
    this.mensajeExito.set(null);
    this.emailEnviado.set('');
    this.mensajeError.set(null);
    this.submitted.set(false);
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
      const email = this.form.controls.email.value.trim();
      await this.auth.solicitarRecuperacionContrasena(email);
      this.emailEnviado.set(email);
      this.mensajeExito.set('ok');
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No fue posible enviar el correo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
