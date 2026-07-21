import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { AuthAccessShellComponent } from './auth-access-shell.component';

@Component({
  selector: 'app-actualizar-contrasena-page',
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
      brandEyebrow="Define tu"
      brandTitle="Nueva contraseña"
      brandLead="Usa el enlace del correo para crear una clave nueva. Al guardar, cerramos la sesión temporal de recuperación."
      featurePrimaryIcon="lock"
      featurePrimaryTitle="Clave nueva"
      featurePrimaryLead="Mínimo 8 caracteres, distinta a la anterior"
      featureSecondaryIcon="check"
      featureSecondaryTitle="Acceso controlado"
      featureSecondaryLead="Solo el enlace vigente permite el cambio"
      supportTitle="¿El enlace no funciona?"
      supportLead="Solicita uno nuevo desde recuperar contraseña"
    >
      <div class="login-card">
        <a class="login-card__back" routerLink="/login">
          <lucide-icon name="arrow-left" aria-hidden="true"></lucide-icon>
          Volver al inicio de sesión
        </a>

        <div class="login-card__header">
          <h2 id="update-password-title" class="login-card__title">Crear nueva contraseña</h2>
          <p class="login-card__lead">
            Define una clave nueva para tu cuenta. Al guardar, cerraremos la sesión temporal del enlace.
          </p>
        </div>

        <div class="login-card__divider" aria-hidden="true"></div>

        @if (mensajeExito()) {
          <div class="login-success" role="status">
            <strong>Contraseña actualizada</strong>
            <span>{{ mensajeExito() }}</span>
            <a routerLink="/login">Iniciar sesión</a>
          </div>
        } @else {
          @if (mensajeError()) {
            <p class="login-error" role="alert">{{ mensajeError() }}</p>
          }

          <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label class="login-field" for="new-password">
              <span>Nueva contraseña</span>
              <span class="login-password">
                <input
                  id="new-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  formControlName="password"
                  placeholder="Mínimo 8 caracteres"
                  [class.login-input--invalid]="showPasswordError()"
                  [attr.aria-invalid]="showPasswordError()"
                />
                <button
                  class="login-password__toggle"
                  type="button"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <lucide-icon [name]="showPassword() ? 'unlock' : 'eye'"></lucide-icon>
                </button>
              </span>
              @if (showPasswordError()) {
                <small>Usa al menos 8 caracteres.</small>
              }
            </label>

            <label class="login-field" for="confirm-password">
              <span>Confirmar contraseña</span>
              <input
                id="confirm-password"
                type="password"
                autocomplete="new-password"
                formControlName="confirmPassword"
                placeholder="Repite la nueva contraseña"
                [class.login-input--invalid]="showConfirmPasswordError()"
                [attr.aria-invalid]="showConfirmPasswordError()"
              />
              @if (showConfirmPasswordError()) {
                <small>Las contraseñas deben coincidir.</small>
              }
            </label>

            <button
              class="login-submit"
              type="submit"
              [disabled]="isSubmitting() || !recoverySessionReady()"
            >
              @if (isSubmitting()) {
                <span class="login-submit__spinner" aria-hidden="true"></span>
              }
              {{ isSubmitting() ? 'Guardando contraseña…' : 'Guardar nueva contraseña' }}
            </button>
          </form>
        }
      </div>
    </app-auth-access-shell>
  `,
})
export class ActualizarContrasenaPage implements OnInit {
  private readonly auth = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly recoverySessionReady = signal(false);
  readonly showPassword = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  async ngOnInit(): Promise<void> {
    const recoveryReady = await this.auth.esperarSesionRecuperacion();
    this.recoverySessionReady.set(recoveryReady);
    if (!recoveryReady) {
      this.mensajeError.set('El enlace de recuperacion no esta activo o ya expiro. Solicita uno nuevo.');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  showPasswordError(): boolean {
    const control = this.form.controls.password;
    return control.invalid && (this.submitted() || control.touched);
  }

  showConfirmPasswordError(): boolean {
    const control = this.form.controls.confirmPassword;
    return (
      (control.invalid || this.passwordsDoNotMatch()) &&
      (this.submitted() || control.touched || this.form.controls.password.touched)
    );
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.mensajeError.set(null);

    if (!this.recoverySessionReady()) {
      this.mensajeError.set('Solicita un nuevo enlace de recuperación antes de cambiar la contraseña.');
      return;
    }

    if (this.form.invalid || this.passwordsDoNotMatch()) {
      this.form.markAllAsTouched();
      this.mensajeError.set('Revisa la nueva contraseña antes de guardar.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.auth.actualizarContrasena(this.form.controls.password.value);
      await this.auth.logout();
      this.form.reset();
      this.mensajeExito.set('Ya puedes iniciar sesión con tu nueva contraseña.');
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No fue posible actualizar la contraseña.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private passwordsDoNotMatch(): boolean {
    const { password, confirmPassword } = this.form.getRawValue();
    return Boolean(password || confirmPassword) && password !== confirmPassword;
  }
}
